const router = require("express").Router();
const { protect } = require("../middleware/auth");
const {
  getRepoStats,
  getIssues,
  createIssue,
  getPullRequests,
  getPRReviewsHandler,
  getMilestones,
  getContributions,
  getProjectProgressHandler,
  getActivityTimeline,
} = require("../controllers/githubController");

// Existing route — public repo stats
router.get("/repo-stats", protect, getRepoStats);

// GitHub Issues
router.get("/projects/:projectId/issues", protect, getIssues);
router.post("/projects/:projectId/issues", protect, createIssue);

// GitHub Pull Requests
router.get("/projects/:projectId/pulls", protect, getPullRequests);
router.get("/projects/:projectId/pulls/:prNumber/reviews", protect, getPRReviewsHandler);

// GitHub Milestones
router.get("/projects/:projectId/milestones", protect, getMilestones);

// Contribution Analysis
router.get("/projects/:projectId/contributions", protect, getContributions);

// Project Progress
router.get("/projects/:projectId/progress", protect, getProjectProgressHandler);

// Activity Timeline
router.get("/projects/:projectId/activity", protect, getActivityTimeline);

module.exports = router;
