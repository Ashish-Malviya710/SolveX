const Project = require("../models/Project");
const DeveloperRequest = require("../models/DeveloperRequest");

/**
 * POST /api/projects/:id/team/members
 * Project Leader adds a member (from accepted requests or direct).
 */
exports.addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can manage the team" });
    }

    // Enforce team size cap
    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: `Team is full (${project.maxTeamSize}/${project.maxTeamSize})` });
    }

    const { userId, role } = req.body;

    // Check if already a member
    const exists = project.teamMembers.some(m => m.user.toString() === userId);
    if (exists) return res.status(400).json({ message: "User is already a team member" });

    project.teamMembers.push({
      user: userId,
      role: role || "Contributor",
    });

    if (project.status === "LEADER_SELECTED") {
      project.status = "TEAM_FORMING";
    }

    await project.save();

    const updated = await Project.findById(project._id)
      .populate("teamMembers.user", "name skills reputation githubProfile");

    res.status(200).json({ project: updated });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/projects/:id/team/members/:userId
 * Remove a team member (Project Leader only).
 */
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can manage the team" });
    }

    // Cannot remove the leader
    if (req.params.userId === project.projectLeader.toString()) {
      return res.status(400).json({ message: "Cannot remove the Project Leader" });
    }

    project.teamMembers = project.teamMembers.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();

    res.status(200).json({ message: "Team member removed", project });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/projects/:id/team/members/:userId/role
 * Update a team member's role (Project Leader only).
 */
exports.updateMemberRole = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can update roles" });
    }

    const member = project.teamMembers.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: "Team member not found" });

    if (req.body.role) member.role = req.body.role;
    if (req.body.customRole !== undefined) member.customRole = req.body.customRole;

    await project.save();

    res.status(200).json({ message: "Role updated", project });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/:id/team
 * Get team members for a project.
 */
exports.getTeam = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("teamMembers.user", "name email skills reputation projectsCompleted badges githubProfile linkedinOrPortfolio bio")
      .populate("projectLeader", "name email skills reputation");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({
      team: project.teamMembers,
      projectLeader: project.projectLeader,
      maxTeamSize: project.maxTeamSize,
      currentSize: project.teamMembers.length,
    });
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
