const express = require("express");
const router = express.Router();
const impactController = require("../controllers/impactController");
const { protect } = require("../middleware/auth");

router.put("/:projectId", protect, impactController.updateImpact);

module.exports = router;
