const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    chatType: {
      type: String,
      enum: ["PROVIDER_LEADER", "LEADER_MEMBER", "TEAM_GROUP"],
      default: "TEAM_GROUP",
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

MessageSchema.index({ project: 1, chatType: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);
