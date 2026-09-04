import assert from "node:assert/strict";
import test from "node:test";
import { runAgent } from "../../controllers/aiController.js";
import AIToolAudit from "../../models/AIToolAudit.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";

const PRODUCT_A_ID = "507f1f77bcf86cd799439011";
const PRODUCT_B_ID = "507f1f77bcf86cd799439012";
const CLERK_USER_ID = "user_clerk_current";

const PRODUCTS = [
  {
    _id: PRODUCT_A_ID,
    title: "Serum A",
    description: "Description A",
    price: { M: 20 },
    sizes: ["M"],
    stockBySize: { M: 4 },
    inStockBySize: { M: true },
    images: ["a.jpg"],
    category: "Face Care",
    type: "Serum",
    popular: true,
    inStock: true,
    isDeleted: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    _id: PRODUCT_B_ID,
    title: "Serum B",
    description: "Description B",
    price: { M: 15 },
    sizes: ["M"],
    stockBySize: { M: 3 },
    inStockBySize: { M: true },
    images: ["b.jpg"],
    category: "Face Care",
    type: "Serum",
    popular: false,
    inStock: true,
    isDeleted: false,
    createdAt: new Date("2026-01-02T00:00:00Z"),
  },
];

const createProductQuery = (result) => ({
  select() {
    return this;
  },
  limit() {
    return this;
  },
  lean() {
    return Promise.resolve(result);
  },
});

test("agent chạy chuỗi searchProducts → compareProducts → trả product cards", async () => {
  const originalProductFind = Product.find;
  const originalAuditCreate = AIToolAudit.create;
  const originalFetch = globalThis.fetch;
  const auditDocuments = [];
  const groqRequests = [];
  let requestCount = 0;

  Product.find = () => createProductQuery(PRODUCTS);
  AIToolAudit.create = async (document) => {
    auditDocuments.push(document);
    return document;
  };
  globalThis.fetch = async (url, options) => {
    requestCount += 1;
    groqRequests.push(JSON.parse(options.body));
    let message;

    if (requestCount === 1) {
      message = {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "search_call",
            type: "function",
            function: {
              name: "searchProducts",
              arguments: JSON.stringify({ query: "serum", limit: 2 }),
            },
          },
        ],
      };
    } else if (requestCount === 2) {
      message = {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "compare_call",
            type: "function",
            function: {
              name: "compareProducts",
              arguments: JSON.stringify({
                productIds: [PRODUCT_A_ID, PRODUCT_B_ID],
              }),
            },
          },
        ],
      };
    } else {
      message = {
        role: "assistant",
        content: "Serum B có giá khởi điểm thấp hơn.",
      };
    }

    return {
      ok: true,
      json: async () => ({ choices: [{ message }] }),
    };
  };

  try {
    const result = await runAgent(
      [{ role: "user", content: "So sánh hai serum" }],
      { userId: CLERK_USER_ID, requestId: "compare_request" },
    );

    assert.deepEqual(result.toolsUsed, ["searchProducts", "compareProducts"]);
    assert.equal(result.products.length, 2);
    assert.equal(result.products[0].image, "a.jpg");
    assert.equal(result.answer, "Serum B có giá khởi điểm thấp hơn.");
    assert.equal(auditDocuments.length, 2);
    assert.deepEqual(
      auditDocuments.map((document) => document.outcome),
      ["success", "success"],
    );

    const searchToolResult = JSON.parse(
      groqRequests[1].messages.at(-1).content,
    );
    const compareToolResult = JSON.parse(
      groqRequests[2].messages.at(-1).content,
    );
    assert.equal(
      searchToolResult.products.some((product) => "image" in product),
      false,
    );
    assert.equal(
      compareToolResult.products.some((product) => "image" in product),
      false,
    );
  } finally {
    Product.find = originalProductFind;
    AIToolAudit.create = originalAuditCreate;
    globalThis.fetch = originalFetch;
  }
});

test("agent giới hạn tối đa bốn tool calls và audit lần bị chặn", async () => {
  const originalUserFind = User.findById;
  const originalAuditCreate = AIToolAudit.create;
  const originalFetch = globalThis.fetch;
  const auditDocuments = [];
  let userReads = 0;
  let requestCount = 0;

  User.findById = () => {
    userReads += 1;
    return createProductQuery({ cartData: {} });
  };
  AIToolAudit.create = async (document) => {
    auditDocuments.push(document);
    return document;
  };
  globalThis.fetch = async () => {
    requestCount += 1;
    const message =
      requestCount === 1
        ? {
            role: "assistant",
            content: null,
            tool_calls: Array.from({ length: 5 }, (_, index) => ({
              id: `cart_call_${index}`,
              type: "function",
              function: { name: "getMyCart", arguments: "{}" },
            })),
          }
        : { role: "assistant", content: "Đã dừng gọi tool." };

    return {
      ok: true,
      json: async () => ({ choices: [{ message }] }),
    };
  };

  try {
    const result = await runAgent(
      [{ role: "user", content: "Kiểm tra giới hạn tool" }],
      { userId: CLERK_USER_ID, requestId: "tool_limit_request" },
    );

    assert.equal(userReads, 4);
    assert.equal(auditDocuments.length, 5);
    assert.equal(
      auditDocuments.filter((document) => document.outcome === "success")
        .length,
      4,
    );
    assert.equal(auditDocuments.at(-1).outcome, "rejected");
    assert.deepEqual(result.toolsUsed, ["getMyCart"]);
  } finally {
    User.findById = originalUserFind;
    AIToolAudit.create = originalAuditCreate;
    globalThis.fetch = originalFetch;
  }
});
