import test from "node:test";
import assert from "node:assert/strict";
import {
  FREE_SHIPPING_THRESHOLD,
  getOrderTotal,
  getShippingCharge,
} from "../../utils/orderPricing.js";
import { hasAnyEnabledSize } from "../../utils/productStock.js";

test("shipping is free only from the one-million-VND threshold", () => {
  assert.equal(FREE_SHIPPING_THRESHOLD, 1000);
  assert.equal(getShippingCharge(999.99), 30);
  assert.equal(getShippingCharge(1000), 0);
  assert.equal(getOrderTotal(1000), 1000);
});

test("master stock follows whether at least one stocked size is enabled", () => {
  const product = {
    sizes: ["S", "M"],
    stockBySize: { S: 2, M: 3 },
    inStockBySize: { S: false, M: false },
  };

  assert.equal(hasAnyEnabledSize(product), false);
  product.inStockBySize.M = true;
  assert.equal(hasAnyEnabledSize(product), true);
  product.stockBySize.M = 0;
  assert.equal(hasAnyEnabledSize(product), false);
});
