import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import { restoreProductDraft } from "../../../client/src/utils/productDraft.js";

const categories = [{ _id: "cat", name: "Skin Care", types: [{ _id: "type", name: "Cream" }] }];
const makeDraft = () => ({
  inputs: { title: "Unfinished product", description: "Description", ingredients: "Aloe", category: "Old category", type: "Old type" },
  images: { 1: new File(["image bytes"], "photo.png", { type: "image/png" }), 2: "saved-image.png" },
  sizePrices: [{ id: "row", originalSize: "M", size: "Large", price: 125, quantity: 6 }],
  newSize: "XL", newPrice: "150", newQuantity: "3",
  loadedProductId: "product", loadedUpdatedAt: "2026-09-01",
  categoryId: "cat", typeId: "type",
});

test("returning from categories retains text, actual image files, variant edits and unfinished variant inputs", async () => {
  const draft = makeDraft();
  const restored = restoreProductDraft(draft, categories);
  assert.equal(restored.inputs.title, "Unfinished product");
  assert.equal(restored.inputs.description, "Description");
  assert.equal(restored.inputs.ingredients, "Aloe");
  assert.equal(restored.images[1], draft.images[1]);
  assert.equal(await restored.images[1].text(), "image bytes");
  assert.equal(restored.images[2], "saved-image.png");
  assert.deepEqual(restored.sizePrices, draft.sizePrices);
  assert.equal(restored.newSize, "XL");
  assert.equal(restored.newPrice, "150");
  assert.equal(restored.newQuantity, "3");
  assert.equal(restored.loadedUpdatedAt, "2026-09-01");
});

test("renamed categories and types restore by ID without changing the original draft", () => {
  const draft = makeDraft();
  const restored = restoreProductDraft(draft, categories);
  assert.equal(restored.inputs.category, "Skin Care");
  assert.equal(restored.inputs.type, "Cream");
  assert.equal(draft.inputs.category, "Old category");
});

test("the newly added type is selected on return while the remaining product inputs are kept", () => {
  const draft = makeDraft();
  const nextCategories = [...categories, { _id: "new", name: "Hair", types: [{ _id: "shampoo", name: "Shampoo" }] }];
  const restored = restoreProductDraft(draft, nextCategories, { categoryId: "new", typeId: "shampoo" });
  assert.equal(restored.inputs.category, "Hair");
  assert.equal(restored.inputs.type, "Shampoo");
  assert.equal(restored.inputs.title, draft.inputs.title);
  assert.equal(restored.images, draft.images);
});

test("removed types are cleared; absent drafts do not produce a phantom product", () => {
  const restored = restoreProductDraft(makeDraft(), [{ ...categories[0], types: [] }]);
  assert.equal(restored.inputs.type, "");
  assert.equal(restoreProductDraft(undefined, categories), undefined);
});
