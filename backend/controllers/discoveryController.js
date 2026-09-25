const ProjectDiscovery = require("../models/ProjectDiscovery");
const Project = require("../models/Project");
const discoveryService = require("../services/projectDiscoveryService");
const { createNotification } = require("../services/notificationService");

/**
 * Helper to retrieve a discovery session by ID or Project ID,
 * and ensure ownership.
 */
async function getAuthorizedSession(id, user) {
  let session = await ProjectDiscovery.findById(id);
  if (!session) {
    session = await ProjectDiscovery.findOne({ projectId: id });
  }

  if (!session) {
    const error = new Error("Discovery session not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = session.userId.toString() === user._id.toString();
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    const error = new Error("Not authorized to access this discovery session");
    error.statusCode = 403;
    throw error;
  }

  return session;
}

/**
 * POST /api/projects/discovery/start
 * Initialize a new AI discovery session.
 */
exports.startDiscovery = async (req, res) => {
  try {
    const { initialIdea, language = "en" } = req.body;

    if (!initialIdea || typeof initialIdea !== "string" || initialIdea.trim().length < 5) {
      return res.status(400).json({
        message: "Please enter a descriptive project idea (minimum 5 characters).",
      });
    }

    const validLanguages = ["en", "hi", "hinglish"];
    const normalizedLang = validLanguages.includes(String(language).toLowerCase().trim())
      ? String(language).toLowerCase().trim()
      : "en";

    const sessionData = await discoveryService.startDiscoverySession({
      initialIdea: initialIdea.trim(),
      userId: req.user._id,
      language: normalizedLang,
    });

    const session = await ProjectDiscovery.create({
      userId: req.user._id,
      language: normalizedLang,
      ...sessionData,
    });

    res.status(201).json({
      success: true,
      discoveryId: session._id,
      session,
    });
  } catch (err) {
    console.error("Start discovery error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to start AI discovery session.",
    });
  }
};

/**
 * GET /api/projects/discovery/:id
 * Fetch the current state of a discovery session.
 */
exports.getDiscoverySession = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);
    res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("Get discovery session error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to retrieve discovery session.",
    });
  }
};

/**
 * POST /api/projects/discovery/:id/answer
 * Submit an answer to the current dynamic question.
 */
exports.answerQuestion = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);
    const { answer } = req.body;

    if (answer === undefined || answer === null || String(answer).trim() === "") {
      return res.status(400).json({ message: "Answer cannot be empty." });
    }

    const result = await discoveryService.processAnswerAndNextQuestion({
      initialIdea: session.initialIdea,
      conversation: session.conversation,
      collectedRequirements: session.collectedRequirements,
      currentQuestion: session.currentQuestion,
      answer,
      turnsCount: session.turnsCount,
      language: session.language || "en",
    });

    session.status = result.status;
    session.readinessScore = result.readinessScore;
    session.conversation = result.conversation;
    session.currentQuestion = result.currentQuestion;
    session.collectedRequirements = result.collectedRequirements;
    session.aiSummary = result.aiSummary;
    session.turnsCount = result.turnsCount;

    await session.save();

    res.status(200).json({
      success: true,
      session,
      isReady: result.status === "ready",
    });
  } catch (err) {
    console.error("Answer question error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to process answer.",
    });
  }
};

/**
 * PATCH /api/projects/discovery/:id/language
 * Update the language preference of the discovery session mid-interview.
 */
exports.updateLanguage = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);
    const { language } = req.body;

    const validLanguages = ["en", "hi", "hinglish"];
    const normalized = String(language || "").toLowerCase().trim();
    if (!validLanguages.includes(normalized)) {
      return res.status(400).json({
        message: `Invalid language '${language}'. Supported languages: English ('en'), Hindi ('hi'), Hinglish ('hinglish').`,
      });
    }

    session.language = normalized;

    // If there is an active question, regenerate it in the newly selected language
    if (session.currentQuestion && session.status !== "ready" && session.status !== "completed") {
      try {
        const regeneratedQuestion = await discoveryService.regenerateCurrentQuestionInLanguage({
          initialIdea: session.initialIdea,
          conversation: session.conversation,
          collectedRequirements: session.collectedRequirements,
          turn: session.turnsCount || 1,
          language: normalized,
        });

        if (regeneratedQuestion) {
          session.currentQuestion = regeneratedQuestion;
          // Update the last assistant question in the conversation array
          for (let i = session.conversation.length - 1; i >= 0; i--) {
            if (session.conversation[i].role === "assistant" && session.conversation[i].type === "question") {
              session.conversation[i].content = regeneratedQuestion.text;
              session.conversation[i].options = regeneratedQuestion.options || [];
              session.conversation[i].reason = regeneratedQuestion.reason || "";
              break;
            }
          }
        }
      } catch (reErr) {
        console.warn("Language question regeneration warning:", reErr.message);
      }
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: `Discovery language updated to ${normalized}`,
      session,
    });
  } catch (err) {
    console.error("Update discovery language error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to update discovery language.",
    });
  }
};

/**
 * POST /api/projects/discovery/:id/generate-blueprint
 * Generate the comprehensive project blueprint from the discovery session.
 */
exports.generateBlueprint = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);

    const blueprint = await discoveryService.generateBlueprint({
      initialIdea: session.initialIdea,
      conversation: session.conversation,
      collectedRequirements: session.collectedRequirements,
      language: session.language || "en",
    });

    const newVersion = (session.blueprintHistory?.length || 0) + 1;
    session.generatedBlueprint = blueprint;
    session.status = "ready";
    session.readinessScore = 100;
    session.blueprintHistory.push({
      version: newVersion,
      blueprint,
      changeSummary: `Version ${newVersion} generated by AI Analyst`,
      createdAt: new Date(),
    });

    await session.save();

    res.status(200).json({
      success: true,
      session,
      blueprint,
    });
  } catch (err) {
    console.error("Generate blueprint error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to generate project blueprint.",
    });
  }
};

/**
 * PUT /api/projects/discovery/:id/blueprint
 * Update or revise the blueprint (direct edits or natural language revision).
 */
exports.updateBlueprint = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);
    const { editedBlueprint, instruction } = req.body;

    let updatedBlueprint;
    let changeSummary = "User manual edit";

    if (instruction && instruction.trim()) {
      updatedBlueprint = await discoveryService.reviseBlueprint({
        currentBlueprint: session.generatedBlueprint,
        instruction: instruction.trim(),
      });
      changeSummary = `AI Revision: ${instruction.trim()}`;
    } else if (editedBlueprint && typeof editedBlueprint === "object") {
      updatedBlueprint = editedBlueprint;
    } else {
      return res.status(400).json({
        message: "Please provide either an instruction for AI revision or an updated blueprint object.",
      });
    }

    const newVersion = (session.blueprintHistory?.length || 0) + 1;
    session.generatedBlueprint = updatedBlueprint;
    session.blueprintHistory.push({
      version: newVersion,
      blueprint: updatedBlueprint,
      changeSummary,
      createdAt: new Date(),
    });

    await session.save();

    res.status(200).json({
      success: true,
      session,
      blueprint: updatedBlueprint,
    });
  } catch (err) {
    console.error("Update blueprint error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to update blueprint.",
    });
  }
};

/**
 * POST /api/projects/discovery/:id/regenerate
 * Request a fresh blueprint generation.
 */
exports.regenerateBlueprint = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);

    const blueprint = await discoveryService.generateBlueprint({
      initialIdea: session.initialIdea,
      conversation: session.conversation,
      collectedRequirements: session.collectedRequirements,
      language: session.language || "en",
    });

    const newVersion = (session.blueprintHistory?.length || 0) + 1;
    session.generatedBlueprint = blueprint;
    session.blueprintHistory.push({
      version: newVersion,
      blueprint,
      changeSummary: `Version ${newVersion} regenerated by AI Analyst`,
      createdAt: new Date(),
    });

    await session.save();

    res.status(200).json({
      success: true,
      session,
      blueprint,
    });
  } catch (err) {
    console.error("Regenerate blueprint error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to regenerate blueprint.",
    });
  }
};

/**
 * POST /api/projects/discovery/:id/complete
 * Confirm the blueprint and create or update the official SolveX Project.
 */
exports.completeDiscovery = async (req, res) => {
  try {
    const session = await getAuthorizedSession(req.params.id, req.user);
    const {
      confirmedBlueprint,
      category,
      budgetType,
      budgetAmount,
      currency,
      expectedDuration,
      deadline,
      maxTeamSize,
    } = req.body;

    const bp = confirmedBlueprint || session.generatedBlueprint;
    if (!bp || !bp.overview) {
      return res.status(400).json({
        message: "A generated blueprint must be present before confirming project creation.",
      });
    }

    // Extract all required skills from developer roles and skills list
    const developerRoleSkills = (bp.developerRoles || []).flatMap((r) => r.skills || []);
    const directSkills = Array.isArray(bp.requiredSkills) ? bp.requiredSkills : [];
    const extractedSkills = Array.from(new Set([...directSkills, ...developerRoleSkills])).filter(Boolean);

    const title = (bp.title || session.initialIdea).substring(0, 100);
    const description = bp.overview
      ? `${bp.overview}\n\n**Problem Statement:**\n${bp.problemStatement || ""}`
      : session.initialIdea;

    const coreFeaturesList = Array.isArray(bp.features?.core)
      ? bp.features.core.join("\n")
      : (bp.requiredFeatures || "");

    const techList = Array.isArray(bp.technology?.frontend)
      ? [
          ...(bp.technology?.frontend || []),
          ...(bp.technology?.backend || []),
          ...(bp.technology?.database || []),
        ].join(", ")
      : (bp.preferredTechnologies || "React, Node.js, Express, MongoDB");

    // Check if a linked project already exists
    let project;
    if (session.projectId) {
      project = await Project.findById(session.projectId);
    }

    if (project) {
      project.title = title;
      project.description = description;
      project.category = category || bp.category || project.category || "Community Platform";
      project.requiredFeatures = coreFeaturesList || project.requiredFeatures;
      project.preferredTechnologies = techList || project.preferredTechnologies;
      project.requiredSkills = extractedSkills.length ? extractedSkills : project.requiredSkills;
      project.aiSummary = bp.overview;
      project.aiComplexity = bp.complexity || "Moderate";
      project.aiSuggestedFeatures = bp.features?.core || [];
      project.aiSuggestedSkills = extractedSkills;
      project.blueprint = bp;
      project.discoverySession = session._id;
      if (budgetType) project.budgetType = budgetType;
      if (budgetAmount) project.budgetAmount = budgetAmount;
      if (currency) project.currency = currency;
      if (expectedDuration) project.expectedDuration = expectedDuration;
      if (deadline) project.deadline = deadline;
      if (maxTeamSize) project.maxTeamSize = maxTeamSize;
      await project.save();
    } else {
      project = await Project.create({
        title,
        description,
        problemProvider: req.user._id,
        category: category || bp.category || "Community Platform",
        requiredFeatures: coreFeaturesList,
        preferredTechnologies: techList,
        requiredSkills: extractedSkills.length ? extractedSkills : ["React", "Node.js", "Express.js", "MongoDB"],
        aiSummary: bp.overview,
        aiComplexity: bp.complexity || "Moderate",
        aiSuggestedFeatures: bp.features?.core || [],
        aiSuggestedSkills: extractedSkills,
        blueprint: bp,
        discoverySession: session._id,
        budgetType: budgetType || "Volunteer",
        budgetAmount: budgetAmount || undefined,
        currency: currency || "INR",
        expectedDuration: expectedDuration || "45 Days",
        deadline: deadline || undefined,
        maxTeamSize: maxTeamSize || 5,
        status: "OPEN",
      });
    }

    session.status = "completed";
    session.projectId = project._id;
    await session.save();

    // Send notification to the provider about successful project creation & launch
    await createNotification(
      req.user._id,
      "PROJECT_CREATED",
      `🚀 Your project "${title}" has been successfully created and is now OPEN for developer applications!`,
      { projectId: project._id, projectTitle: title }
    );

    res.status(200).json({
      success: true,
      message: "Project successfully created with AI Blueprint specifications!",
      project,
      discoveryId: session._id,
    });
  } catch (err) {
    console.error("Complete discovery error:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "Failed to complete discovery and create project.",
    });
  }
};
