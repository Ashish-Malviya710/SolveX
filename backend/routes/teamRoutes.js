const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { protect, authorize } = require("../middleware/auth");

router.get("/:id", protect, teamController.getTeam);
router.post("/:id/members", protect, authorize("DEVELOPER"), teamController.addMember);
router.delete("/:id/members/:userId", protect, authorize("DEVELOPER"), teamController.removeMember);
router.put("/:id/members/:userId/role", protect, authorize("DEVELOPER"), teamController.updateMemberRole);

// Backup Developer Matching
router.put("/:id/members/:userId/vacant", protect, teamController.markMemberVacant);
router.get("/:id/members/:userId/replacements", protect, teamController.findReplacementCandidates);
router.post("/:id/members/:userId/invite-replacement", protect, teamController.inviteReplacement);

module.exports = router;
