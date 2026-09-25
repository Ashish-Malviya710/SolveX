const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getMyRequests, getIncomingRequests, acceptRequest, rejectRequest } = require("../controllers/requestController");

router.get("/my", protect, authorize("DEVELOPER", "ADMIN"), getMyRequests);
router.get("/incoming", protect, getIncomingRequests);
router.put("/:id/accept", protect, authorize("PROBLEM_PROVIDER", "DEVELOPER", "ADMIN"), acceptRequest);
router.put("/:id/reject", protect, authorize("PROBLEM_PROVIDER", "DEVELOPER", "ADMIN"), rejectRequest);

module.exports = router;
