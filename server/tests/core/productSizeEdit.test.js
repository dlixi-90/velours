import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { updateProduct } from "../../controllers/productController.js";
import { getSizeRenames } from "../../utils/productVariants.js";

const id = "507f1f77bcf86cd799439011";
const updatedAt = new Date("2026-09-01T00:00:00Z");
const makeRequest = (overrides = {}) => ({
  params: { productId: id },
  files: [],
  body: { productData: JSON.stringify({
    title: "Product", description: "Description", category: "Care", type: "Lotion",
    sizes: ["Large"], price: { Large: 100 }, stockBySize: { Large: 6 },
    existingImages: ["image.png"], sizeRenames: [{ from: "M", to: "Large" }],
    expectedUpdatedAt: updatedAt.toISOString(), ...overrides,
  }) },
});
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const setup = (t, { pendingQr = false, stale = false } = {}) => {
  const session = {};
  t.mock.method(Product, "findOne", async () => ({
    _id: id, updatedAt, sizes: ["M"], images: ["image.png"],
    inStock: true, inStockBySize: { M: false },
  }));
  t.mock.method(Category, "findOne", async () => ({
    name: "Care", types: [{ name: "Lotion", nameKey: "lotion" }],
  }));
  t.mock.method(mongoose.connection, "transaction", async (callback) => callback(session));
  const reservation = t.mock.method(Order, "exists", (filter) => {
    assert.equal(filter.items.$elemMatch.product, id);
    assert.ok(filter.items.$elemMatch.size.$in.includes("M"));
    return { session: async () => pendingQr ? { _id: "reserved_order" } : null };
  });
  const save = t.mock.method(Product, "findOneAndUpdate", async (_filter, data, options) => {
    assert.equal(options.session, session);
    return stale ? null : { _id: id, ...data };
  });
  const carts = t.mock.method(User, "updateMany", async (_filter, _data, options) => {
    assert.equal(options.session, session);
    assert.equal(options.updatePipeline, true);
  });
  const orders = t.mock.method(Order, "updateMany", async () => { throw new Error("Order history must not change"); });
  return { save, carts, orders, reservation };
};

test("admin rename keeps price, stock and disabled availability under the new size", async (t) => {
  const { carts, orders } = setup(t);
  const res = response();
  await updateProduct(makeRequest(), res);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.product.sizes, ["Large"]);
  assert.deepEqual(res.body.product.price, { Large: 100 });
  assert.deepEqual(res.body.product.stockBySize, { Large: 6 });
  assert.deepEqual(res.body.product.inStockBySize, { Large: false });
  assert.equal(carts.mock.callCount(), 1);
  assert.equal(orders.mock.callCount(), 0);
});

test("product edit accepts only a type ID and stores the category resolved by the server", async (t) => {
  setup(t);
  const typeId = "507f1f77bcf86cd799439012";
  t.mock.method(Category, "findOne", async () => ({
    name: "Hair Care", types: [{ _id: typeId, name: "Shampoo", nameKey: "shampoo" }],
  }));
  const res = response();
  await updateProduct(makeRequest({ typeId, category: undefined, type: undefined }), res);
  assert.equal(res.body.success, true);
  assert.equal(res.body.product.category, "Hair Care");
  assert.equal(res.body.product.type, "Shampoo");
  assert.equal(Object.hasOwn(res.body.product, "typeId"), false);
});

test("rename is blocked while QR holds the old size, before any writes", async (t) => {
  const { save, carts } = setup(t, { pendingQr: true });
  const res = response();
  await updateProduct(makeRequest(), res);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /QR/);
  assert.equal(save.mock.callCount(), 0);
  assert.equal(carts.mock.callCount(), 0);
});

test("concurrent product changes prevent stale inventory overwrites and cart migration", async (t) => {
  const { carts } = setup(t, { stale: true });
  const res = response();
  await updateProduct(makeRequest(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(carts.mock.callCount(), 0);
});

test("a form loaded before another inventory change is rejected before saving", async (t) => {
  const { save, carts } = setup(t);
  const res = response();
  await updateProduct(makeRequest({ expectedUpdatedAt: "2026-08-01T00:00:00Z" }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(save.mock.callCount(), 0);
  assert.equal(carts.mock.callCount(), 0);
});

test("blank, duplicate and unsafe size names cannot be saved", async (t) => {
  const { save, carts } = setup(t);
  for (const sizes of [[""], ["Large", "large"], ["a.b"], ["$M"], ["__proto__"]]) {
    const res = response();
    await updateProduct(makeRequest({ sizes }), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(save.mock.callCount(), 0);
  assert.equal(carts.mock.callCount(), 0);
});

test("normal price and stock edits do not migrate cart size keys", async (t) => {
  const { carts, reservation } = setup(t);
  const res = response();
  await updateProduct(makeRequest({ sizes: ["M"], price: { M: 80 }, stockBySize: { M: 4 }, sizeRenames: [] }), res);
  assert.equal(res.body.success, true);
  assert.equal(carts.mock.callCount(), 0);
  assert.equal(reservation.mock.callCount(), 0);
});

test("rename mapping rejects copied and unknown source rows, and supports swapping names", () => {
  const current = { sizes: ["S", "M"] };
  for (const sizeRenames of [
    [{ from: "XL", to: "L" }],
    [{ from: "S", to: "L" }, { from: "M", to: "L" }],
    [{ from: "S", to: "L" }],
  ]) {
    assert.throws(() => getSizeRenames({ sizeRenames }, current, ["S", "M", "L"]));
  }
  const swap = [{ from: "S", to: "M" }, { from: "M", to: "S" }];
  assert.deepEqual(getSizeRenames({ sizeRenames: swap }, current, ["S", "M"]), swap);
});
