const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getRepoStats } = require("../controllers/githubController");

router.get("/repo-stats", protect, getRepoStats);

module.exports = router;
