const router = require("express").Router();
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  createProject, getProjects, getProjectById, updateProject, deleteProject,
  publishProject, linkGithubRepo, toggleProviderGitAccess, submitSolution, reviewSolution,
  updateImpact, getMyProjects, getShowcaseProjects,
} = require("../controllers/projectController");
const { createRequest, getProjectRequests } = require("../controllers/requestController");
const { createInvitation, getProjectInvitations } = require("../controllers/invitationController");
const { addMember, removeMember, updateMemberRole, getTeam, updateTeamSize } = require("../controllers/teamController");
const { createProposal, getProposal } = require("../controllers/proposalController");
const {
  startDiscovery,
  getDiscoverySession,
  answerQuestion,
  generateBlueprint,
  updateBlueprint,
  regenerateBlueprint,
  completeDiscovery,
  updateLanguage,
} = require("../controllers/discoveryController");

// AI Project Discovery (Must be declared before /:id routes)
router.post("/discovery/start", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), startDiscovery);
router.get("/discovery/:id", protect, getDiscoverySession);
router.patch("/discovery/:id/language", protect, updateLanguage);
router.post("/discovery/:id/answer", protect, answerQuestion);
router.post("/discovery/:id/generate-blueprint", protect, generateBlueprint);
router.put("/discovery/:id/blueprint", protect, updateBlueprint);
router.post("/discovery/:id/regenerate", protect, regenerateBlueprint);
router.post("/discovery/:id/complete", protect, completeDiscovery);

// Project CRUD
router.get("/showcase", getShowcaseProjects);
router.get("/my-projects", protect, getMyProjects);
router.post("/", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), createProject);
router.get("/", getProjects);
router.get("/:id", optionalAuth, getProjectById);
router.put("/:id", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), updateProject);
router.delete("/:id", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), deleteProject);
router.put("/:id/publish", protect, authorize("PROBLEM_PROVIDER"), publishProject);

// GitHub
router.put("/:id/github", protect, authorize("DEVELOPER"), linkGithubRepo);
router.put("/:id/github-access", protect, authorize("DEVELOPER"), toggleProviderGitAccess);

// Solution
router.post("/:id/submit-solution", protect, authorize("DEVELOPER"), submitSolution);
router.post("/:id/review-solution", protect, authorize("PROBLEM_PROVIDER"), reviewSolution);

// Impact
router.put("/:id/impact", protect, authorize("PROBLEM_PROVIDER"), updateImpact);

// Developer Requests (nested under project)
router.post("/:id/request", protect, authorize("DEVELOPER"), createRequest);
router.get("/:id/requests", protect, getProjectRequests);

// Invitations (nested under project)
router.post("/:id/invite/:developerId", protect, authorize("PROBLEM_PROVIDER", "DEVELOPER"), createInvitation);
router.get("/:id/invitations", protect, getProjectInvitations);

// Team (nested under project)
router.get("/:id/team", protect, getTeam);
router.post("/:id/team/members", protect, authorize("DEVELOPER"), addMember);
router.delete("/:id/team/members/:userId", protect, authorize("DEVELOPER"), removeMember);
router.put("/:id/team/members/:userId/role", protect, authorize("DEVELOPER"), updateMemberRole);
router.put("/:id/team/size", protect, updateTeamSize);

// Proposal (nested under project)
router.post("/:id/proposal", protect, authorize("DEVELOPER"), createProposal);
router.get("/:id/proposal", protect, getProposal);

module.exports = router;
