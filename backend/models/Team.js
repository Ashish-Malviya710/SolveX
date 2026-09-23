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
        status: { type: String, enum: ["ACTIVE", "REMOVED", "VACANT"], default: "ACTIVE" },
        vacatedAt: Date,
      },
    ],
    // Preserve contribution history when a member leaves
    previousMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: String,
        customRole: String,
        joinedAt: Date,
        leftAt: { type: Date, default: Date.now },
        contributionSnapshot: {
          commits: { type: Number, default: 0 },
          prs: { type: Number, default: 0 },
          mergedPrs: { type: Number, default: 0 },
          issues: { type: Number, default: 0 },
          reviews: { type: Number, default: 0 },
          score: { type: Number, default: 0 },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
