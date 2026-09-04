import assert from "node:assert/strict";
import test from "node:test";
import { aiRateLimit } from "../../middleware/aiRateLimit.js";
import AIUsage from "../../models/AIUsage.js";

const CLERK_USER_ID = "user_clerk_current";

const createResponse = () => {
  const state = { status: 200, payload: null, headers: {} };

  return {
    state,
    response: {
      set(nameOrHeaders, value) {
        if (typeof nameOrHeaders === "object") {
          Object.assign(state.headers, nameOrHeaders);
        } else {
          state.headers[nameOrHeaders] = value;
        }
        return this;
      },
      status(statusCode) {
        state.status = statusCode;
        return this;
      },
      json(payload) {
        state.payload = payload;
        return payload;
      },
    },
  };
};

test("rate limiter từ chối request không có Clerk user", async () => {
  const { state, response } = createResponse();
  let nextCalls = 0;

  await aiRateLimit(
    { auth: () => ({ userId: null }) },
    response,
    () => {
      nextCalls += 1;
    },
  );

  assert.equal(state.status, 401);
  assert.equal(nextCalls, 0);
});

test("rate limiter dùng Clerk user làm key và đặt quota headers", async () => {
  const originalFindOneAndUpdate = AIUsage.findOneAndUpdate;
  const originalMinuteLimit = process.env.AI_RATE_LIMIT_PER_MINUTE;
  const originalDayLimit = process.env.AI_RATE_LIMIT_PER_DAY;
  const capturedKeys = [];

  process.env.AI_RATE_LIMIT_PER_MINUTE = "5";
  process.env.AI_RATE_LIMIT_PER_DAY = "20";
  AIUsage.findOneAndUpdate = (filter) => {
    capturedKeys.push(filter.key);
    return { lean: async () => ({ count: 1 }) };
  };

  try {
    const { state, response } = createResponse();
    let nextCalls = 0;

    await aiRateLimit(
      {
        body: { userId: "user_clerk_other" },
        auth: () => ({ userId: CLERK_USER_ID }),
      },
      response,
      () => {
        nextCalls += 1;
      },
    );

    assert.equal(nextCalls, 1);
    assert.equal(capturedKeys.length, 2);
    assert.equal(
      capturedKeys.every((key) => key.startsWith(`user:${CLERK_USER_ID}:`)),
      true,
    );
    assert.equal(state.headers["X-AI-RateLimit-Minute-Limit"], "5");
    assert.equal(state.headers["X-AI-RateLimit-Day-Limit"], "20");
  } finally {
    AIUsage.findOneAndUpdate = originalFindOneAndUpdate;
    if (originalMinuteLimit === undefined) {
      delete process.env.AI_RATE_LIMIT_PER_MINUTE;
    } else {
      process.env.AI_RATE_LIMIT_PER_MINUTE = originalMinuteLimit;
    }
    if (originalDayLimit === undefined) {
      delete process.env.AI_RATE_LIMIT_PER_DAY;
    } else {
      process.env.AI_RATE_LIMIT_PER_DAY = originalDayLimit;
    }
  }
});

test("rate limiter trả 429 khi quota phút đã hết", async () => {
  const originalFindOneAndUpdate = AIUsage.findOneAndUpdate;
  const originalCreate = AIUsage.create;
  let nextCalls = 0;

  AIUsage.findOneAndUpdate = () => ({ lean: async () => null });
  AIUsage.create = async () => {
    const duplicateError = new Error("duplicate");
    duplicateError.code = 11000;
    throw duplicateError;
  };

  try {
    const { state, response } = createResponse();

    await aiRateLimit(
      { auth: () => ({ userId: CLERK_USER_ID }) },
      response,
      () => {
        nextCalls += 1;
      },
    );

    assert.equal(state.status, 429);
    assert.equal(state.payload.code, "AI_RATE_LIMITED");
    assert.equal(Number(state.headers["Retry-After"]) > 0, true);
    assert.equal(nextCalls, 0);
  } finally {
    AIUsage.findOneAndUpdate = originalFindOneAndUpdate;
    AIUsage.create = originalCreate;
  }
});

test("rate limiter fail closed khi MongoDB gặp lỗi", async () => {
  const originalFindOneAndUpdate = AIUsage.findOneAndUpdate;
  const originalConsoleError = console.error;

  AIUsage.findOneAndUpdate = () => ({
    lean: async () => {
      throw new Error("database unavailable");
    },
  });
  console.error = () => {};

  try {
    const { state, response } = createResponse();
    let nextCalls = 0;

    await aiRateLimit(
      { auth: () => ({ userId: CLERK_USER_ID }) },
      response,
      () => {
        nextCalls += 1;
      },
    );

    assert.equal(state.status, 503);
    assert.equal(state.payload.code, "AI_RATE_LIMIT_UNAVAILABLE");
    assert.equal(nextCalls, 0);
  } finally {
    AIUsage.findOneAndUpdate = originalFindOneAndUpdate;
    console.error = originalConsoleError;
  }
});
