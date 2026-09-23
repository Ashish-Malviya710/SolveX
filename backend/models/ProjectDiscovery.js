const mongoose = require("mongoose");

/**
 * ProjectDiscovery Model
 * Stateful session tracking an AI-guided requirement discovery process.
 */
const ProjectDiscoverySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    initialIdea: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "needs_more_information", "ready", "completed"],
      default: "active",
      index: true,
    },
    language: {
      type: String,
      enum: ["en", "hi", "hinglish"],
      default: "en",
      index: true,
    },
    conversation: [
      {
        role: {
          type: String,
          enum: ["assistant", "user", "system"],
          required: true,
        },
        type: {
          type: String,
          enum: ["question", "answer", "system_note"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        questionId: String,
        questionType: {
          type: String,
          enum: [
            "text",
            "textarea",
            "single_choice",
            "multiple_choice",
            "number",
            "boolean",
          ],
          default: "text",
        },
        options: [String],
        reason: String,
        answer: mongoose.Schema.Types.Mixed,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentQuestion: {
      id: String,
      text: String,
      type: {
        type: String,
        enum: [
          "text",
          "textarea",
          "single_choice",
          "multiple_choice",
          "number",
          "boolean",
        ],
        default: "text",
      },
      options: [String],
      required: {
        type: Boolean,
        default: true,
      },
      reason: String,
    },
    collectedRequirements: {
      projectGoal: String,
      targetUsers: [String],
      userRoles: [String],
      businessRequirements: [String],
      functionalRequirements: [String],
      nonFunctionalRequirements: [String],
      features: [String],
      constraints: [String],
      technologyPreferences: [String],
      integrations: [String],
      securityRequirements: [String],
      timeline: String,
      budget: String,
      deploymentPreferences: [String],
      unknowns: [String],
    },
    readinessScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    aiSummary: String,
    generatedBlueprint: {
      type: mongoose.Schema.Types.Mixed,
    },
    blueprintHistory: [
      {
        version: Number,
        blueprint: mongoose.Schema.Types.Mixed,
        changeSummary: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    turnsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectDiscovery", ProjectDiscoverySchema);
