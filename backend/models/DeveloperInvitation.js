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
  },
  { timestamps: true }
);

DeveloperInvitationSchema.index({ developer: 1, project: 1 });

module.exports = mongoose.model("DeveloperInvitation", DeveloperInvitationSchema);
