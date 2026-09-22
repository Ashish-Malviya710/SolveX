const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "NEW_DEVELOPER_REQUEST",
        "NEW_INVITATION",
        "REQUEST_ACCEPTED",
        "PROPOSAL_SUBMITTED",
        "PROPOSAL_APPROVED",
        "PROPOSAL_CHANGES_REQUESTED",
        "SOLUTION_REVIEWED",
        "NEW_CHAT_MESSAGE",
      ],
      required: true,
    },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
