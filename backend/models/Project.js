const mongoose = require("mongoose");

/**
 * Project Model — see prompt Section 32.
 */
const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    problemProvider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectLeader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    category: { type: String, trim: true },
    requiredFeatures: { type: String },
    preferredTechnologies: { type: String },
    requiredSkills: [{ type: String, trim: true }],

    // AI Problem Analysis (single call — Section 7)
    aiSummary: String,
    aiSuggestedFeatures: [String],
    aiSuggestedSkills: [String],
    aiComplexity: { type: String, enum: ["Simple", "Moderate", "Complex"] },

    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Leader", "Contributor", "Reviewer"], default: "Contributor" },
        customRole: { type: String, trim: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    maxTeamSize: { type: Number, default: 5 },

    githubRepoUrl: String,
    allowProviderGitAccess: { type: Boolean, default: false },

    budgetType: { type: String, enum: ["Fixed", "Negotiable", "Volunteer"], default: "Volunteer" },
    budgetAmount: Number,
    currency: { type: String, default: "INR" },
    budgetDescription: String,

    expectedDuration: String,
    deadline: Date,

    liveUrl: String,

    solution: {
      completionSummary: String,
      liveUrl: String,
      githubRepoUrl: String,
      documentation: String,
      screenshots: [String],
      demoVideo: String,
      notes: String,
      feedback: String,
      submittedAt: Date,
    },

    impact: {
      peopleBenefited: Number,
      organizationsHelped: Number,
      notes: String,
    },

    status: {
      type: String,
      enum: [
        "DRAFT", "OPEN", "LEADER_SELECTED", "TEAM_FORMING",
        "PROPOSAL_PENDING", "CHANGES_REQUESTED", "APPROVED",
        "IN_DEVELOPMENT", "SUBMITTED", "UNDER_REVIEW", "COMPLETED",
      ],
      default: "DRAFT",
    },
    completionDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
