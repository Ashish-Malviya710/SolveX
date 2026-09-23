const {
  getRepoStats,
  getRepoIssues,
  createRepoIssue,
  getRepoPullRequests,
  getPRReviews,
  getRepoMilestones,
  getContributorStats,
  getProjectProgress,
  getRecentActivity,
  normalizeGithubUrl,
  getRateLimitInfo,
} = require("../services/githubService");
const Project = require("../models/Project");

// ─── Helper: load project and verify access ───────────────────
async function loadProjectAndVerify(req, res) {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return null;
  }

  if (!project.githubRepoUrl) {
    res.status(400).json({ message: "No GitHub repository linked to this project" });
    return null;
  }

  // Verify user is a participant
  const userId = req.user._id.toString();
  const isProvider = project.problemProvider?.toString() === userId;
  const isLeader = project.projectLeader?.toString() === userId;
  const isMember = project.teamMembers?.some((m) => m.user?.toString() === userId);
  const isAdmin = req.user.role === "ADMIN";

  if (!isProvider && !isLeader && !isMember && !isAdmin) {
    res.status(403).json({ message: "Not authorized to access GitHub data for this project" });
    return null;
  }

  // Check git access (provider needs explicit grant)
  const isTeamMemberOrLeader = isLeader || isMember || isAdmin;
  const isProviderWithAccess = isProvider && (project.allowProviderGitAccess === true || isAdmin);
  if (!isTeamMemberOrLeader && !isProviderWithAccess) {
    res.status(403).json({ message: "Repository access not granted" });
    return null;
  }

  const parsed = normalizeGithubUrl(project.githubRepoUrl);
  if (!parsed || !parsed.owner || !parsed.repo) {
    res.status(400).json({ message: "Invalid GitHub repository URL" });
    return null;
  }

  return { project, owner: parsed.owner, repo: parsed.repo };
}

/**
 * GET /api/github/repo-stats?repoUrl=...
 * Fetch public GitHub repo stats on demand.
 */
exports.getRepoStats = async (req, res) => {
  try {
    const { repoUrl } = req.query;
    if (!repoUrl) {
      return res.status(400).json({ message: "repoUrl query parameter is required" });
    }

    const stats = await getRepoStats(repoUrl);

    if (!stats) {
      return res.status(200).json({
        stats: null,
        message: "Could not fetch stats — repo may be private or URL invalid",
      });
    }

    res.status(200).json({ stats, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/github/projects/:projectId/issues
 * Fetch all issues for the project's GitHub repository.
 */
exports.getIssues = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const data = await getRepoIssues(ctx.owner, ctx.repo);
    res.status(200).json({ ...data, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub issues error:", err);
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Repository not found or not accessible" });
    }
    if (err.response?.status === 403) {
      return res.status(429).json({ message: "GitHub API rate limit exceeded", rateLimit: getRateLimitInfo() });
    }
    res.status(500).json({ message: "Failed to fetch GitHub issues" });
  }
};

/**
 * POST /api/github/projects/:projectId/issues
 * Create a new issue in the project's GitHub repository.
 */
exports.createIssue = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const { title, body, labels, assignees } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Issue title is required" });
    }

    const issue = await createRepoIssue(ctx.owner, ctx.repo, title, body, labels, assignees);
    res.status(201).json({ issue, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub create issue error:", err);
    if (err.message?.includes("GitHub token required")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.response?.status === 403) {
      return res.status(403).json({ message: "No write permission on this repository. Ensure GITHUB_TOKEN has repo scope." });
    }
    if (err.response?.status === 422) {
      return res.status(422).json({ message: "Invalid issue data", details: err.response?.data?.errors });
    }
    res.status(500).json({ message: "Failed to create GitHub issue" });
  }
};

/**
 * GET /api/github/projects/:projectId/pulls
 * Fetch all pull requests for the project's GitHub repository.
 */
exports.getPullRequests = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const data = await getRepoPullRequests(ctx.owner, ctx.repo);
    res.status(200).json({ ...data, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub pulls error:", err);
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Repository not found or not accessible" });
    }
    if (err.response?.status === 403) {
      return res.status(429).json({ message: "GitHub API rate limit exceeded", rateLimit: getRateLimitInfo() });
    }
    res.status(500).json({ message: "Failed to fetch pull requests" });
  }
};

/**
 * GET /api/github/projects/:projectId/pulls/:prNumber/reviews
 * Fetch reviews for a specific pull request.
 */
exports.getPRReviewsHandler = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const { prNumber } = req.params;
    const data = await getPRReviews(ctx.owner, ctx.repo, prNumber);
    res.status(200).json({ ...data, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub PR reviews error:", err);
    res.status(500).json({ message: "Failed to fetch PR reviews" });
  }
};

/**
 * GET /api/github/projects/:projectId/milestones
 * Fetch GitHub milestones for the project's repository.
 */
exports.getMilestones = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const data = await getRepoMilestones(ctx.owner, ctx.repo);
    res.status(200).json({ ...data, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub milestones error:", err);
    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Repository not found or not accessible" });
    }
    res.status(500).json({ message: "Failed to fetch GitHub milestones" });
  }
};

/**
 * GET /api/github/projects/:projectId/contributions
 * Fetch per-developer contribution analysis.
 */
exports.getContributions = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const contributors = await getContributorStats(ctx.owner, ctx.repo);
    res.status(200).json({
      contributors,
      scoreFormula: "commits×1 + PRs×3 + mergedPRs×5 + issues×2 + reviews×2",
      rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error("GitHub contributions error:", err);
    res.status(500).json({ message: "Failed to fetch contribution analysis" });
  }
};

/**
 * GET /api/github/projects/:projectId/progress
 * Get combined project progress metrics.
 */
exports.getProjectProgressHandler = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const progress = await getProjectProgress(ctx.owner, ctx.repo);

    // Also fetch SolveX milestone progress if proposal exists
    const ProjectProposal = require("../models/ProjectProposal");
    let solvexMilestoneProgress = 0;
    try {
      const proposal = await ProjectProposal.findOne({ project: ctx.project._id });
      if (proposal && proposal.milestones.length > 0) {
        const completed = proposal.milestones.filter((m) => m.status === "Completed").length;
        solvexMilestoneProgress = Math.round((completed / proposal.milestones.length) * 100);
      }
    } catch (proposalErr) {
      // Non-blocking
    }

    res.status(200).json({
      ...progress,
      solvexMilestoneProgress,
      rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error("GitHub progress error:", err);
    res.status(500).json({ message: "Failed to calculate project progress" });
  }
};

/**
 * GET /api/github/projects/:projectId/activity
 * Get recent GitHub activity timeline.
 */
exports.getActivityTimeline = async (req, res) => {
  try {
    const ctx = await loadProjectAndVerify(req, res);
    if (!ctx) return;

    const limit = parseInt(req.query.limit, 10) || 30;
    const timeline = await getRecentActivity(ctx.owner, ctx.repo, limit);
    res.status(200).json({ timeline, rateLimit: getRateLimitInfo() });
  } catch (err) {
    console.error("GitHub activity error:", err);
    res.status(500).json({ message: "Failed to fetch activity timeline" });
  }
};
