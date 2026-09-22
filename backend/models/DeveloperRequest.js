const mongoose = require("mongoose");

const DeveloperRequestSchema = new mongoose.Schema(
  {
    developer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate requests
DeveloperRequestSchema.index({ developer: 1, project: 1 });

module.exports = mongoose.model("DeveloperRequest", DeveloperRequestSchema);
