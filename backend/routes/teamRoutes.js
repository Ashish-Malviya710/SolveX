const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { protect, authorize } = require("../middleware/auth");

router.get("/:id", protect, teamController.getTeam);
router.post("/:id/members", protect, authorize("DEVELOPER"), teamController.addMember);
router.delete("/:id/members/:userId", protect, authorize("DEVELOPER"), teamController.removeMember);
router.put("/:id/members/:userId/role", protect, authorize("DEVELOPER"), teamController.updateMemberRole);

module.exports = router;
