const Project = require("../models/Project");
const { analyzeProblem } = require("../services/groqService");
const { normalizeGithubUrl } = require("../services/githubService");
const { createNotification } = require("../services/notificationService");

/**
 * POST /api/projects
 * Create a new project/problem. Triggers AI analysis automatically.
 */
exports.createProject = async (req, res) => {
  try {
    const {
      title, description, category, requiredFeatures, preferredTechnologies,
      requiredSkills, budgetType, budgetAmount, currency, budgetDescription,
      expectedDuration, deadline, maxTeamSize, status,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const projectStatus = status || "OPEN";

    const project = await Project.create({
      title,
      description,
      problemProvider: req.user._id,
      category,
      requiredFeatures,
      preferredTechnologies,
      requiredSkills: requiredSkills || [],
      budgetType: budgetType || "Volunteer",
      budgetAmount,
      currency: currency || "INR",
      budgetDescription,
      expectedDuration,
      deadline,
      maxTeamSize: maxTeamSize || 5,
      status: projectStatus,
    });

    const populated = await Project.findById(project._id).populate("problemProvider", "name email");

    // Send immediate response so project creation is instantaneous (<50ms)
    res.status(201).json({ project: populated });

    // Run AI analysis asynchronously in background without blocking the user
    setImmediate(async () => {
      try {
        const aiResult = await analyzeProblem({
          title,
          description,
          category,
          requiredFeatures,
          preferredTechnologies,
          requiredSkills,
        });
        if (aiResult) {
          await Project.findByIdAndUpdate(project._id, {
            aiSummary: aiResult.summary,
            aiSuggestedFeatures: aiResult.suggestedFeatures,
            aiSuggestedSkills: aiResult.suggestedSkills,
            aiComplexity: aiResult.complexity,
          });
        }
      } catch (aiErr) {
        console.warn("Background AI analysis notice (non-blocking):", aiErr.message);
      }
    });

    // Notify provider in background
    createNotification(
      req.user._id,
      projectStatus === "OPEN" ? "PROJECT_PUBLISHED" : "PROJECT_CREATED",
      projectStatus === "OPEN"
        ? `🚀 Your project "${title}" is now LIVE and open for developer applications!`
        : `📝 Your project "${title}" has been created as a draft.`,
      { projectId: project._id, projectTitle: title }
    ).catch((notifErr) => console.warn("Notification error:", notifErr.message));
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects
 * List projects with filters and pagination.
 */
exports.getProjects = async (req, res) => {
  try {
    const {
      category, skill, budgetType, status, search,
      page = 1, limit = 20, sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (category) filter.category = { $regex: category, $options: "i" };
    if (skill) filter.requiredSkills = { $in: [new RegExp(skill, "i")] };
    if (budgetType) filter.budgetType = budgetType;
    if (status) {
      filter.status = status;
    } else {
      // By default show only active, ongoing projects for public explore listing (exclude DRAFT and COMPLETED)
      filter.status = { $nin: ["DRAFT", "COMPLETED"] };
    }
    if (req.query.excludeCompleted === "true" || req.query.excludeCompleted === true) {
      if (filter.status === "COMPLETED") {
        filter.status = { $nin: ["DRAFT", "COMPLETED"] };
      } else if (typeof filter.status === "object" && filter.status.$nin) {
        if (!filter.status.$nin.includes("COMPLETED")) {
          filter.status.$nin.push("COMPLETED");
        }
      } else if (!filter.status) {
        filter.status = { $nin: ["DRAFT", "COMPLETED"] };
      }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate("problemProvider", "name email")
      .populate("projectLeader", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      projects,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/:id
 * Get single project with populated fields.
 * Only Leader, Team Members, Problem Provider, and Admin can see githubRepoUrl.
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("problemProvider", "name email githubProfile linkedinOrPortfolio")
      .populate("projectLeader", "name email githubProfile skills reputation badges")
      .populate("teamMembers.user", "name email githubProfile skills reputation");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = req.user ? req.user._id.toString() : null;
    const isProvider = userId && project.problemProvider?._id?.toString() === userId;
    const isLeader = userId && project.projectLeader?._id?.toString() === userId;
    const isMember = userId && project.teamMembers?.some((m) => m.user?._id?.toString() === userId);
    const isAdmin = req.user && req.user.role === "ADMIN";
    const isParticipant = isProvider || isLeader || isMember || isAdmin;

    const isTeamMemberOrLeader = isLeader || isMember || isAdmin;
    const isProviderWithAccess = isProvider && (project.allowProviderGitAccess === true || isAdmin);
    const hasGitAccess = isTeamMemberOrLeader || isProviderWithAccess;

    const projectObj = project.toObject();

    // Mask private GitHub repo URL if user does not have repository access
    if (!hasGitAccess) {
      delete projectObj.githubRepoUrl;
    }

    res.status(200).json({ project: projectObj, isParticipant, hasGitAccess });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id
 * Update project (only by provider, only if DRAFT or OPEN).
 */
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can update this project" });
    }

    if (!["DRAFT", "OPEN"].includes(project.status)) {
      return res.status(400).json({ message: "Project can only be edited in DRAFT or OPEN status" });
    }

    const allowedFields = [
      "title", "description", "category", "requiredFeatures", "preferredTechnologies",
      "requiredSkills", "budgetType", "budgetAmount", "currency", "budgetDescription",
      "expectedDuration", "deadline", "maxTeamSize",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    // Re-run AI analysis in background if description changed
    if (req.body.description) {
      setImmediate(async () => {
        try {
          const aiResult = await analyzeProblem(req.body.description);
          if (aiResult) {
            await Project.findByIdAndUpdate(project._id, {
              aiSummary: aiResult.summary,
              aiSuggestedFeatures: aiResult.suggestedFeatures,
              aiSuggestedSkills: aiResult.suggestedSkills,
              aiComplexity: aiResult.complexity,
            });
          }
        } catch (aiErr) {
          console.warn("AI re-analysis failed (non-blocking):", aiErr.message);
        }
      });
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate("problemProvider", "name email")
      .populate("projectLeader", "name");

    res.status(200).json({ project: updated });
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/projects/:id
 * Delete project (only by provider, only if DRAFT).
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.problemProvider.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    if (project.status !== "DRAFT" && req.user.role !== "ADMIN") {
      return res.status(400).json({ message: "Only DRAFT projects can be deleted" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id/publish
 * Publish a DRAFT project → OPEN.
 */
exports.publishProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can publish" });
    }

    if (project.status !== "DRAFT") {
      return res.status(400).json({ message: "Only DRAFT projects can be published" });
    }

    project.status = "OPEN";
    await project.save();

    // Notify provider that project is now live
    await createNotification(
      req.user._id,
      "PROJECT_PUBLISHED",
      `🚀 Your project "${project.title}" is now LIVE and open for developer applications!`,
      { projectId: project._id, projectTitle: project.title }
    );

    res.status(200).json({ project });
  } catch (err) {
    console.error("Publish project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id/github
 * Link a GitHub repository URL (Project Leader only).
 */
exports.linkGithubRepo = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can link a GitHub repo" });
    }

    const parsed = normalizeGithubUrl(req.body.githubRepoUrl);
    project.githubRepoUrl = parsed ? parsed.normalizedUrl : req.body.githubRepoUrl;
    await project.save();

    res.status(200).json({ project });
  } catch (err) {
    console.error("Link GitHub error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id/github-access
 * Toggle whether the Problem Provider can view the GitHub repository (Project Leader only).
 */
exports.toggleProviderGitAccess = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can manage repository access permissions" });
    }

    const { allowProviderGitAccess } = req.body;
    project.allowProviderGitAccess = !!allowProviderGitAccess;
    await project.save();

    res.status(200).json({
      message: project.allowProviderGitAccess
        ? "Problem Provider has been granted access to view the GitHub repository."
        : "Problem Provider access to GitHub repository has been restricted.",
      allowProviderGitAccess: project.allowProviderGitAccess,
      project,
    });
  } catch (err) {
    console.error("Toggle GitHub access error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/projects/:id/submit-solution
 * Submit solution for review (Project Leader only).
 */
exports.submitSolution = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can submit solutions" });
    }

    if (!["IN_DEVELOPMENT", "CHANGES_REQUESTED"].includes(project.status)) {
      return res.status(400).json({ message: "Project must be in development to submit" });
    }

    const { completionSummary, liveUrl, githubRepoUrl, notes } = req.body;

    if (!completionSummary || !liveUrl) {
      return res.status(400).json({ message: "Completion summary and live URL are required" });
    }

    const rawRepo = githubRepoUrl || project.githubRepoUrl;
    const parsedRepo = normalizeGithubUrl(rawRepo);

    project.solution = {
      submittedAt: new Date(),
      completionSummary,
      liveUrl,
      githubRepoUrl: parsedRepo ? parsedRepo.normalizedUrl : rawRepo,
      notes: notes || "",
    };

    project.status = "SUBMITTED";
    await project.save();

    res.status(200).json({ project });
  } catch (err) {
    console.error("Submit solution error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/projects/:id/review-solution
 * Provider reviews submitted solution — approve or request changes.
 */
exports.reviewSolution = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can review" });
    }

    if (!["SUBMITTED", "UNDER_REVIEW"].includes(project.status)) {
      return res.status(400).json({ message: "No solution submitted for review" });
    }

    const { action, feedback } = req.body;

    if (action === "approve") {
      project.status = "COMPLETED";
      project.completionDate = new Date();
      await project.save();

      // Apply reputation and badges
      const { applyReputationAndBadges } = require("../services/projectService");
      await applyReputationAndBadges(project);

      res.status(200).json({ project, message: "Solution approved! Project completed." });
    } else if (action === "request_changes") {
      project.status = "IN_DEVELOPMENT";
      project.solution.feedback = feedback;
      await project.save();
      res.status(200).json({ project, message: "Changes requested" });
    } else {
      return res.status(400).json({ message: "Action must be 'approve' or 'request_changes'" });
    }
  } catch (err) {
    console.error("Review solution error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id/impact
 * Update social impact data (Provider only, after completion).
 */
exports.updateImpact = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can update impact" });
    }

    const { peopleBenefited, organizationsHelped, notes } = req.body;
    project.impact = { peopleBenefited, organizationsHelped, notes };
    await project.save();

    res.status(200).json({ project });
  } catch (err) {
    console.error("Update impact error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/my-projects
 * Get projects belonging to the current user (as provider or team member).
 */
exports.getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    let projects;

    if (req.user.role === "PROBLEM_PROVIDER") {
      projects = await Project.find({ problemProvider: userId })
        .populate("problemProvider", "name organizationName email avatar")
        .populate("projectLeader", "name email githubProfile avatar")
        .populate("teamMembers.user", "name role skills avatar githubProfile")
        .sort("-createdAt");
    } else {
      projects = await Project.find({
        $or: [
          { projectLeader: userId },
          { "teamMembers.user": userId },
        ],
      })
        .populate("problemProvider", "name organizationName email avatar")
        .populate("projectLeader", "name email githubProfile avatar")
        .populate("teamMembers.user", "name role skills avatar githubProfile")
        .sort("-createdAt");
    }

    res.status(200).json({ projects });
  } catch (err) {
    console.error("Get my projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/showcase
 * Get completed projects for public showcase.
 */
exports.getShowcaseProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await Project.countDocuments({ status: "COMPLETED" });
    const projects = await Project.find({ status: "COMPLETED" })
      .populate("problemProvider", "name")
      .populate("projectLeader", "name")
      .sort("-completionDate")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      projects,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get showcase error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
