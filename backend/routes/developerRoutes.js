const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getTopPerformers, searchDevelopers, getProfile } = require("../controllers/developerController");

router.get("/top-performers", getTopPerformers);
router.get("/search", searchDevelopers);
router.get("/:id", getProfile);

module.exports = router;
