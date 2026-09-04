import mongoose from "mongoose";

const aiToolAuditSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    toolCallId: {
      type: String,
      default: null,
    },
    toolName: {
      type: String,
      required: true,
      index: true,
    },
    outcome: {
      type: String,
      required: true,
      enum: ["success", "error", "rejected"],
    },
    arguments: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    argumentKeys: {
      type: [String],
      default: [],
    },
    errorMessage: {
      type: String,
      default: null,
    },
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  },
);

aiToolAuditSchema.index({ userId: 1, createdAt: -1 });
aiToolAuditSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AIToolAudit = mongoose.model("AIToolAudit", aiToolAuditSchema);

export default AIToolAudit;
