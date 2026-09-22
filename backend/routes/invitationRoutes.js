const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getMyInvitations, acceptInvitation, rejectInvitation } = require("../controllers/invitationController");

router.get("/", protect, authorize("DEVELOPER"), getMyInvitations);
router.put("/:id/accept", protect, authorize("DEVELOPER"), acceptInvitation);
router.put("/:id/reject", protect, authorize("DEVELOPER"), rejectInvitation);

module.exports = router;
