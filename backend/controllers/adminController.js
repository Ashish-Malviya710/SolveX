const User = require("../models/User");
const Project = require("../models/Project");

/**
 * GET /api/admin/users
 * List all users with search/filter.
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/admin/users/:id/suspend
 */
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") return res.status(400).json({ message: "Cannot suspend an admin" });

    user.suspended = true;
    await user.save();
    res.status(200).json({ message: "User suspended" });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") return res.status(400).json({ message: "Cannot delete an admin" });

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/projects
 */
exports.getProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate("problemProvider", "name email")
      .populate("projectLeader", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ projects, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin get projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/projects/:id
 */
exports.removeProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Project removed" });
  } catch (err) {
    console.error("Remove project error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/stats
 * Basic platform stats for admin dashboard.
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDevelopers = await User.countDocuments({ role: "DEVELOPER" });
    const totalProviders = await User.countDocuments({ role: "PROBLEM_PROVIDER" });
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: "COMPLETED" });
    const openProjects = await Project.countDocuments({ status: "OPEN" });

    res.status(200).json({
      totalUsers,
      totalDevelopers,
      totalProviders,
      totalProjects,
      completedProjects,
      openProjects,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
