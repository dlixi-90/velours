import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    windowType: {
      type: String,
      required: true,
      enum: ["minute", "day"],
    },
    windowStart: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

aiUsageSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

const AIUsage = mongoose.model("AIUsage", aiUsageSchema);

export default AIUsage;
