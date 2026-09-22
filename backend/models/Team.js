const mongoose = require("mongoose");

/**
 * Team Model — Section 12. Roles: Leader / Contributor / Reviewer, plus an optional
 * custom free-text role the Leader can set after team discussion.
 */
const TeamSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Leader", "Contributor", "Reviewer"], default: "Contributor" },
        customRole: String, // optional, set by Leader after team discussion
        status: { type: String, enum: ["ACTIVE", "REMOVED"], default: "ACTIVE" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
