const router = require("express").Router();
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const { analyzeProblem, generateDescription, askAssistant } = require("../controllers/aiController");

// Conversational AI Assistant / Copilot Agent (available anywhere on dashboard)
router.post("/assistant", optionalAuth, askAssistant);

// Generate full problem description & specs from a title/heading
router.post("/generate-description", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), generateDescription);

// Analyze existing problem description & parameters
router.post("/analyze-problem", protect, authorize("PROBLEM_PROVIDER", "ADMIN"), analyzeProblem);

module.exports = router;
