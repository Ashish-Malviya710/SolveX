const router = require("express").Router();
const { protect } = require("../middleware/auth");
const {
  getTopPerformers,
  searchDevelopers,
  getProfile,
  getDeveloperProjects,
} = require("../controllers/developerController");

router.get("/top-performers", getTopPerformers);
router.get("/search", searchDevelopers);
router.get("/:id", getProfile);
router.get("/:id/projects", getDeveloperProjects);

module.exports = router;

