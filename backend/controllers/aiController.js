const { analyzeProblem, generateProblemDraft, generateAssistantReply } = require("../services/groqService");
const Project = require("../models/Project");

/**
 * POST /api/ai/assistant
 * Handles conversational queries to SolveX AI Copilot agent.
 */
exports.askAssistant = async (req, res) => {
  try {
    const { message, conversationHistory, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userContext = {
      role: req.user ? req.user.role : context?.role || "GUEST",
      userName: req.user ? req.user.name : context?.userName || "Guest",
      path: context?.path || "/",
    };

    const reply = await generateAssistantReply({
      message: message.trim(),
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      userContext,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("AI Assistant error:", err);
    return res.status(500).json({ message: "Error communicating with AI Assistant" });
  }
};

/**
 * POST /api/ai/generate-description
 * Takes { title, category, keywords } and uses AI to generate a complete, unique
 * natural language problem description narrative, suggested features, skills, etc.
 */
exports.generateDescription = async (req, res) => {
  try {
    const { title, category, keywords } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "A project title or heading is required to generate a description." });
    }

    const result = await generateProblemDraft({
      title: title.trim(),
      category: category ? category.trim() : "",
      keywords: keywords ? keywords.trim() : "",
    });

    return res.status(200).json({
      success: true,
      generated: result,
    });
  } catch (err) {
    console.error("AI generate description error:", err);
    return res.status(500).json({ message: err.message || "Server error while generating description" });
  }
};

/**
 * POST /api/ai/analyze-problem
 * Run AI analysis on a project's full description and parameters.
 */
exports.analyzeProblem = async (req, res) => {
  try {
    const { projectId, description, title, category, requiredFeatures, preferredTechnologies, requiredSkills } = req.body;

    // If projectId provided, get full context from project
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.problemProvider.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only the Problem Provider can trigger analysis" });
      }

      // Run analysis with complete context
      const result = await analyzeProblem({
        title: project.title,
        description: project.description,
        category: project.category,
        requiredFeatures: project.requiredFeatures,
        preferredTechnologies: project.preferredTechnologies,
        requiredSkills: project.requiredSkills,
      });

      // Store on project
      project.aiSummary = result.summary;
      project.aiSuggestedFeatures = result.suggestedFeatures;
      project.aiSuggestedSkills = result.suggestedSkills;
      project.aiComplexity = result.complexity;
      await project.save();

      return res.status(200).json({ analysis: result, project });
    }

    if (!description && !title) {
      return res.status(400).json({ message: "Problem description or title is required" });
    }

    const result = await analyzeProblem({
      title,
      description,
      category,
      requiredFeatures,
      preferredTechnologies,
      requiredSkills,
    });

    res.status(200).json({ analysis: result });
  } catch (err) {
    console.error("AI analyze error:", err);
    res.status(500).json({ message: "Server error during AI analysis" });
  }
};
