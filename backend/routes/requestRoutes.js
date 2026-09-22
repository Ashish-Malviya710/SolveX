const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getMyRequests, acceptRequest, rejectRequest } = require("../controllers/requestController");

router.get("/my", protect, authorize("DEVELOPER"), getMyRequests);
router.put("/:id/accept", protect, authorize("PROBLEM_PROVIDER"), acceptRequest);
router.put("/:id/reject", protect, authorize("PROBLEM_PROVIDER"), rejectRequest);

module.exports = router;
