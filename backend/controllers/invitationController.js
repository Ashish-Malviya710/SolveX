const DeveloperInvitation = require("../models/DeveloperInvitation");
const Project = require("../models/Project");
const { applyRequestAcceptedReputation } = require("../services/projectService");
const { createNotification } = require("../services/notificationService");

/**
 * POST /api/projects/:id/invite/:developerId
 * Problem Provider or Project Leader invites a developer.
 */
exports.createInvitation = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isProvider = project.problemProvider.toString() === req.user._id.toString();
    const isLeader = project.projectLeader && project.projectLeader.toString() === req.user._id.toString();

    if (!isProvider && !isLeader && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to invite developers" });
    }

    // Check team size cap for team formation invites (when leader exists)
    if (project.projectLeader && project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: "Team is full" });
    }

    // Check if already invited
    const existing = await DeveloperInvitation.findOne({
      developer: req.params.developerId,
      project: req.params.id,
      status: "PENDING",
    });
    if (existing) return res.status(400).json({ message: "Developer already has a pending invitation" });

    const invitation = await DeveloperInvitation.create({
      provider: req.user._id,
      developer: req.params.developerId,
      project: req.params.id,
      message: req.body.message || "",
    });

    await createNotification(
      req.params.developerId,
      "NEW_INVITATION",
      `You've been invited to "${project.title}"`,
      { projectId: project._id, invitationId: invitation._id }
    );

    res.status(201).json({ invitation });
  } catch (err) {
    console.error("Create invitation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/invitations
 * Get current developer's received invitations.
 */
exports.getMyInvitations = async (req, res) => {
  try {
    const invitations = await DeveloperInvitation.find({ developer: req.user._id })
      .populate("project", "title status category budgetType budgetAmount currency maxTeamSize teamMembers")
      .populate("provider", "name")
      .sort("-createdAt");

    res.status(200).json({ invitations });
  } catch (err) {
    console.error("Get invitations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/:id/invitations
 * Get sent invitations for a project (provider/leader view).
 */
exports.getProjectInvitations = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isProvider = project.problemProvider.toString() === req.user._id.toString();
    const isLeader = project.projectLeader && project.projectLeader.toString() === req.user._id.toString();

    if (!isProvider && !isLeader && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const invitations = await DeveloperInvitation.find({ project: req.params.id })
      .populate("developer", "name skills reputation projectsCompleted githubProfile")
      .sort("-createdAt");

    res.status(200).json({ invitations });
  } catch (err) {
    console.error("Get project invitations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/invitations/:id/accept
 * Developer accepts an invitation.
 * - If project has no leader → becomes Project Leader
 * - If project has leader → joins as team member
 */
exports.acceptInvitation = async (req, res) => {
  try {
    const invitation = await DeveloperInvitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });

    if (invitation.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your invitation" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: "Invitation already responded to" });
    }

    const project = await Project.findById(invitation.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    invitation.status = "ACCEPTED";
    await invitation.save();

    if (!project.projectLeader) {
      // No leader yet → become leader
      project.projectLeader = req.user._id;
      project.teamMembers = [{ user: req.user._id, role: "Leader" }];
      project.status = "LEADER_SELECTED";
    } else {
      // Leader exists → join as team member
      if (project.teamMembers.length >= project.maxTeamSize) {
        return res.status(400).json({ message: "Team is full" });
      }
      project.teamMembers.push({ user: req.user._id, role: "Contributor" });
      if (project.status === "LEADER_SELECTED") {
        project.status = "TEAM_FORMING";
      }
    }

    await project.save();
    await applyRequestAcceptedReputation(req.user._id);

    await createNotification(
      invitation.provider,
      "REQUEST_ACCEPTED",
      `${req.user.name} accepted the invitation for "${project.title}"`,
      { projectId: project._id }
    );

    res.status(200).json({ message: "Invitation accepted", project });
  } catch (err) {
    console.error("Accept invitation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/invitations/:id/reject
 */
exports.rejectInvitation = async (req, res) => {
  try {
    const invitation = await DeveloperInvitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });

    if (invitation.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your invitation" });
    }

    invitation.status = "REJECTED";
    await invitation.save();

    res.status(200).json({ message: "Invitation rejected" });
  } catch (err) {
    console.error("Reject invitation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
