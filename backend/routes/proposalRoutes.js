const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const {
  updateProposal, submitProposal, approveProposal, requestChanges, updateMilestoneStatus,
  linkGithubMilestone,
} = require("../controllers/proposalController");

router.put("/:id", protect, authorize("DEVELOPER"), updateProposal);
router.post("/:id/submit", protect, authorize("DEVELOPER"), submitProposal);
router.post("/:id/approve", protect, authorize("PROBLEM_PROVIDER"), approveProposal);
router.post("/:id/request-changes", protect, authorize("PROBLEM_PROVIDER"), requestChanges);
router.put("/:id/milestones/:milestoneIndex", protect, authorize("DEVELOPER"), updateMilestoneStatus);
router.put("/:id/milestones/:milestoneIndex/github-link", protect, authorize("DEVELOPER"), linkGithubMilestone);

module.exports = router;
