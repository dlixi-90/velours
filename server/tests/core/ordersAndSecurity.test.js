import test from "node:test";
import assert from "node:assert/strict";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import authUser, { requireOwner } from "../../middleware/authMiddleware.js";
import {
  sepayWebhook,
  updateStatus,
} from "../../controllers/orderController.js";
import { createProduct } from "../../controllers/productController.js";

const ORDER_ID = "507f1f77bcf86cd799439011";

const createResponse = () => {
  const state = { statusCode: 200, payload: null };
  const response = {
    status(statusCode) {
      state.statusCode = statusCode;
      return response;
    },
    json(payload) {
      state.payload = payload;
      return response;
    },
  };

  return { state, response };
};

test("requireOwner blocks a normal authenticated user", () => {
  const { state, response } = createResponse();
  let calledNext = false;

  requireOwner({ user: { role: "user" } }, response, () => {
    calledNext = true;
  });

  assert.equal(state.statusCode, 403);
  assert.equal(state.payload.success, false);
  assert.equal(calledNext, false);
});

test("requireOwner allows an owner", () => {
  const { response } = createResponse();
  let calledNext = false;

  requireOwner({ user: { role: "owner" } }, response, () => {
    calledNext = true;
  });

  assert.equal(calledNext, true);
});

test("authUser promotes every email configured in ADMIN_EMAILS", async () => {
  const previousAdminEmails = process.env.ADMIN_EMAILS;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const originalFindById = User.findById;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  const promotedEmails = [];
  let currentEmail;

  process.env.ADMIN_EMAILS =
    " first.admin@example.com, SECOND.ADMIN@example.com, first.admin@example.com ";
  delete process.env.ADMIN_EMAIL;

  User.findById = async () => ({ email: currentEmail, role: "user" });
  User.findByIdAndUpdate = async (_userId, update) => {
    promotedEmails.push(currentEmail);
    return { email: currentEmail, role: update.role };
  };

  try {
    for (const email of [
      "FIRST.ADMIN@example.com",
      "second.admin@example.com",
    ]) {
      currentEmail = email;
      let calledNext = false;

      await authUser(
        { auth: () => ({ userId: "user_test" }) },
        createResponse().response,
        () => {
          calledNext = true;
        },
      );

      assert.equal(calledNext, true);
    }

    assert.deepEqual(promotedEmails, [
      "FIRST.ADMIN@example.com",
      "second.admin@example.com",
    ]);
  } finally {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;

    if (previousAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = previousAdminEmails;
    }

    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = previousAdminEmail;
    }
  }
});

test("authUser still accepts the legacy ADMIN_EMAIL variable", async () => {
  const previousAdminEmails = process.env.ADMIN_EMAILS;
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  const originalFindById = User.findById;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let updatedRole;

  delete process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAIL = "legacy.admin@example.com";
  User.findById = async () => ({
    email: "legacy.admin@example.com",
    role: "user",
  });
  User.findByIdAndUpdate = async (_userId, update) => {
    updatedRole = update.role;
    return { email: "legacy.admin@example.com", role: update.role };
  };

  try {
    await authUser(
      { auth: () => ({ userId: "user_test" }) },
      createResponse().response,
      () => {},
    );

    assert.equal(updatedRole, "owner");
  } finally {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;

    if (previousAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = previousAdminEmails;
    }

    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = previousAdminEmail;
    }
  }
});

test("SePay webhook rejects a non-numeric amount before querying orders", async () => {
  const previousKey = process.env.SEPAY_WEBHOOK_API_KEY;
  const originalFindOne = Order.findOne;
  let queriedOrder = false;
  process.env.SEPAY_WEBHOOK_API_KEY = "webhook-test-key";
  Order.findOne = async () => {
    queriedOrder = true;
    return null;
  };

  try {
    const { state, response } = createResponse();

    await sepayWebhook(
      {
        get: () => "Apikey webhook-test-key",
        body: {
          id: "transaction-1",
          transferType: "in",
          transferAmount: "not-a-number",
        },
      },
      response,
    );

    assert.equal(state.statusCode, 400);
    assert.equal(state.payload.success, false);
    assert.equal(queriedOrder, false);
  } finally {
    Order.findOne = originalFindOne;
    if (previousKey === undefined) {
      delete process.env.SEPAY_WEBHOOK_API_KEY;
    } else {
      process.env.SEPAY_WEBHOOK_API_KEY = previousKey;
    }
  }
});

test("delivered COD orders are marked paid", async () => {
  const originalFindById = Order.findById;
  let saved = false;
  const order = {
    paymentMethod: "COD",
    isPaid: false,
    status: "Shipping",
    async save() {
      saved = true;
    },
  };
  Order.findById = async () => order;

  try {
    const { state, response } = createResponse();

    await updateStatus(
      { body: { orderId: ORDER_ID, status: "Delivery" } },
      response,
    );

    assert.equal(state.payload.success, true);
    assert.equal(saved, true);
    assert.equal(order.status, "Delivery");
    assert.equal(order.isPaid, true);
    assert.equal(order.paidAt instanceof Date, true);
  } finally {
    Order.findById = originalFindById;
  }
});

test("product validation rejects duplicate sizes before uploading", async () => {
  const { state, response } = createResponse();

  await createProduct(
    {
      body: {
        productData: JSON.stringify({
          title: "Test product",
          description: "Description",
          category: "Body Care",
          type: "Lotion",
          sizes: ["M", "M"],
          price: { M: 10 },
          stockBySize: { M: 1 },
        }),
      },
      files: [],
    },
    response,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(state.payload.success, false);
});
