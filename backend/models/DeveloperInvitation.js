const mongoose = require("mongoose");

const DeveloperInvitationSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    // Backup Developer Matching — tracks which vacant slot this invitation fills
    replacingUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vacantRole: { type: String, trim: true },
    vacantCustomRole: { type: String, trim: true },
  },
  { timestamps: true }
);

DeveloperInvitationSchema.index({ developer: 1, project: 1 });

module.exports = mongoose.model("DeveloperInvitation", DeveloperInvitationSchema);
