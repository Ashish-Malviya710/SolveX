const mongoose = require("mongoose");

const ProjectProposalSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Leader", "Contributor", "Reviewer"], default: "Contributor" },
        customRole: String,
      },
    ],
    description: { type: String },
    technologyStack: [String],
    features: [String],
    estimatedDuration: String,
    milestones: [
      {
        title: { type: String, required: true },
        deadline: Date,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
          default: "Pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED"],
      default: "DRAFT",
    },
    providerFeedback: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectProposal", ProjectProposalSchema);
