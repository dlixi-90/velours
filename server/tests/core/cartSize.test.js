import test from "node:test";
import assert from "node:assert/strict";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import { changeCartSize } from "../../controllers/cartController.js";
import cartRouter from "../../routes/cartRoute.js";
import authUser from "../../middleware/authMiddleware.js";
import { changeSizeSelection, getCartItemKey } from "../../../client/src/utils/cartSelection.js";

const id = "507f1f77bcf86cd799439011";
const request = (overrides = {}) => ({
  auth: () => ({ userId: "current_user" }),
  body: { itemId: id, fromSize: "S", toSize: "M", fromQuantity: 2, toQuantity: 0, ...overrides },
});
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const product = () => ({
  sizes: ["S", "M"],
  inStock: true,
  stockBySize: { S: 0, M: 5 },
  inStockBySize: { S: false, M: true },
});

test("size changes require authentication", () => {
  const route = cartRouter.stack.find((layer) => layer.route?.path === "/change-size").route;
  assert.equal(route.stack[0].handle, authUser);
  assert.equal(route.stack[1].handle, changeCartSize);
});

test("changing size moves all units, merging at the stock limit in one authenticated write", async (t) => {
  t.mock.method(Product, "findOne", async () => product());
  const write = t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter._id, "current_user");
    assert.equal(filter[`cartData.${id}.S`], 2);
    assert.equal(filter[`cartData.${id}.M`], 3);
    assert.equal(update.$unset[`cartData.${id}.S`], "");
    assert.equal(update.$set[`cartData.${id}.M`], 5);
    assert.equal(Object.keys(update.$set).length, 1);
    assert.equal(Object.keys(update.$unset).length, 1);
    return { cartData: { [id]: { M: 5 } } };
  });
  const res = response();
  await changeCartSize(request({ toQuantity: 3, userId: "another_user" }), res);
  assert.equal(res.body.success, true);
  assert.equal(res.body.quantity, 5);
  assert.equal(write.mock.callCount(), 1);
});

test("a stale source or destination causes a conflict rather than a partial move", async (t) => {
  t.mock.method(Product, "findOne", async () => product());
  t.mock.method(User, "findOneAndUpdate", async () => null);
  const res = response();
  await changeCartSize(request(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.success, false);
});

test("a sold-out source can move to a new size, with protection against a concurrent destination add", async (t) => {
  t.mock.method(Product, "findOne", async () => product());
  t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter.$or, [
      { [`cartData.${id}.M`]: { $exists: false } },
      { [`cartData.${id}.M`]: 0 },
    ]);
    assert.equal(update.$set[`cartData.${id}.M`], 2);
    return {};
  });
  const res = response();
  await changeCartSize(request(), res);
  assert.equal(res.body.quantity, 2);
});

test("unavailable, missing and insufficient-stock variants never mutate the cart", async (t) => {
  const write = t.mock.method(User, "findOneAndUpdate", async () => { throw new Error("Unexpected write"); });
  let currentProduct = product();
  t.mock.method(Product, "findOne", async () => currentProduct);
  for (const overrides of [{ toQuantity: 4 }, { toSize: "XL" }]) {
    const res = response();
    await changeCartSize(request(overrides), res);
    assert.equal(res.statusCode, 400);
  }
  for (const nextProduct of [
    { ...product(), inStock: false },
    { ...product(), inStockBySize: { M: false } },
    { ...product(), stockBySize: { M: 0 } },
    null,
  ]) {
    currentProduct = nextProduct;
    const res = response();
    await changeCartSize(request(), res);
    assert.equal(res.body.success, false);
  }
  assert.equal(write.mock.callCount(), 0);
});

test("invalid quantities and unsafe size paths are rejected before database access", async (t) => {
  const read = t.mock.method(Product, "findOne", async () => { throw new Error("Unexpected query"); });
  for (const overrides of [
    { fromQuantity: 0 }, { fromQuantity: 1.5 }, { toQuantity: -1 },
    { fromQuantity: "2" }, { toSize: "S" }, { itemId: "bad" },
    { toSize: "$size" }, { fromSize: "a.b" }, { toSize: "__proto__" },
  ]) {
    const res = response();
    await changeCartSize(request(overrides), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(read.mock.callCount(), 0);
});

test("database failure reports failure without a second cart write", async (t) => {
  t.mock.method(Product, "findOne", async () => product());
  const write = t.mock.method(User, "findOneAndUpdate", async () => { throw new Error("offline"); });
  t.mock.method(console, "error", () => {});
  const res = response();
  await changeCartSize(request(), res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(write.mock.callCount(), 1);
});

test("size changes preserve selection, without selecting unselected units during merges", () => {
  const source = getCartItemKey(id, "S");
  const target = getCartItemKey(id, "M");
  const other = getCartItemKey("other_product", "L");
  for (const sourceDeselected of [false, true]) {
    for (const targetDeselected of [false, true]) {
      for (const targetExists of [false, true]) {
        const initial = new Set([other]);
        if (sourceDeselected) initial.add(source);
        if (targetDeselected) initial.add(target);
        const next = changeSizeSelection(initial, id, "S", "M", targetExists);
        assert.equal(next.has(target), sourceDeselected || (targetExists && targetDeselected));
        assert.equal(next.has(source), false);
        assert.equal(next.has(other), true);
        assert.equal(initial.has(source), sourceDeselected);
      }
    }
  }
});
