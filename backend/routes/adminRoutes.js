const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getUsers, suspendUser, deleteUser, getProjects, removeProject, getStats } = require("../controllers/adminController");

router.use(protect, authorize("ADMIN"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);
router.get("/projects", getProjects);
router.delete("/projects/:id", removeProject);

module.exports = router;
