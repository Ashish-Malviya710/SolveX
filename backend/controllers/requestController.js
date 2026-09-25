const DeveloperRequest = require("../models/DeveloperRequest");
const Project = require("../models/Project");
const { applyRequestAcceptedReputation } = require("../services/projectService");
const { createNotification } = require("../services/notificationService");

/**
 * POST /api/projects/:id/request
 * Developer requests to solve/lead a problem OR join an active team.
 */
exports.createRequest = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Allow requests as long as the project is active and team is not full
    // (OPEN, LEADER_SELECTED, TEAM_FORMING, PROPOSAL_PENDING, CHANGES_REQUESTED, APPROVED, IN_DEVELOPMENT)
    const allowedStatuses = [
      "OPEN",
      "LEADER_SELECTED",
      "TEAM_FORMING",
      "PROPOSAL_PENDING",
      "CHANGES_REQUESTED",
      "APPROVED",
      "IN_DEVELOPMENT",
    ];
    if (!allowedStatuses.includes(project.status)) {
      return res.status(400).json({ message: "This project is currently not accepting new requests." });
    }

    const userId = req.user._id.toString();

    // Check if user is already a team member or leader
    const isAlreadyMember = project.teamMembers && project.teamMembers.some((m) => m.user?.toString() === userId);
    const isLeader = project.projectLeader && project.projectLeader.toString() === userId;
    if (isAlreadyMember || isLeader) {
      return res.status(400).json({ message: "You are already a member of this project team." });
    }

    // Check team size cap
    if (project.teamMembers && project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: `This project team is already full (${project.teamMembers.length}/${project.maxTeamSize}).` });
    }

    // Check if already requested and pending
    const existing = await DeveloperRequest.findOne({
      developer: req.user._id,
      project: req.params.id,
      status: "PENDING",
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending request for this project." });
    }

    const request = await DeveloperRequest.create({
      developer: req.user._id,
      project: req.params.id,
      message: req.body.message || "",
      status: "PENDING",
    });

    const isJoiningTeam = !!project.projectLeader;
    const notificationText = isJoiningTeam
      ? `${req.user.name} requested to join your team for "${project.title}"`
      : `${req.user.name} has requested to solve & lead "${project.title}"`;

    // If leader already exists, notify ONLY the Project Leader!
    // If no leader yet, notify the Problem Provider.
    if (project.projectLeader) {
      await createNotification(
        project.projectLeader,
        "NEW_DEVELOPER_REQUEST",
        notificationText,
        { projectId: project._id, requestId: request._id }
      );
    } else if (project.problemProvider) {
      await createNotification(
        project.problemProvider,
        "NEW_DEVELOPER_REQUEST",
        notificationText,
        { projectId: project._id, requestId: request._id }
      );
    }

    const populated = await DeveloperRequest.findById(request._id).populate(
      "developer",
      "name skills reputation projectsCompleted githubProfile"
    );

    res.status(201).json({ request: populated, message: "Request sent successfully!" });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/:id/requests
 * Get developer requests for a project (Provider or Leader view).
 */
exports.getProjectRequests = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isProvider = project.problemProvider && (project.problemProvider._id || project.problemProvider).toString() === userId;
    const isLeader = project.projectLeader && (project.projectLeader._id || project.projectLeader).toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isProvider && !isLeader && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view requests for this project." });
    }

    const requests = await DeveloperRequest.find({ project: req.params.id })
      .populate(
        "developer",
        "name skills reputation projectsCompleted projectsLed badges githubProfile linkedinOrPortfolio bio avatar"
      )
      .sort("-createdAt");

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Get project requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/requests/incoming
 * Get all incoming developer join/lead requests for projects owned or led by current user.
 */
exports.getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ problemProvider: userId }, { projectLeader: userId }],
    }).select("_id title status maxTeamSize teamMembers");

    const projectIds = projects.map((p) => p._id);

    const requests = await DeveloperRequest.find({ project: { $in: projectIds } })
      .populate("project", "title status maxTeamSize teamMembers projectLeader problemProvider")
      .populate(
        "developer",
        "name skills reputation projectsCompleted projectsLed badges githubProfile linkedinOrPortfolio bio avatar"
      )
      .sort("-createdAt");

    res.status(200).json({ requests, projects });
  } catch (err) {
    console.error("Get incoming requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/requests/my
 * Get current developer's sent requests.
 */
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await DeveloperRequest.find({ developer: req.user._id })
      .populate("project", "title status category budgetType budgetAmount currency")
      .sort("-createdAt");

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Get my requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/requests/:id/accept
 * Accept a developer request:
 *  - If no leader: developer becomes Project Leader 👑
 *  - If leader exists: developer is added to team members as Contributor
 */
exports.acceptRequest = async (req, res) => {
  try {
    const request = await DeveloperRequest.findById(req.params.id).populate("project");
    if (!request) return res.status(404).json({ message: "Request not found" });

    const project = await Project.findById(request.project._id || request.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isProvider = project.problemProvider && (project.problemProvider._id || project.problemProvider).toString() === userId;
    const isLeader = project.projectLeader && (project.projectLeader._id || project.projectLeader).toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isProvider && !isLeader && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to accept requests for this project." });
    }

    // CASE 1: Initial Leader Selection (no leader yet)
    if (!project.projectLeader) {
      if (!isProvider && !isAdmin) {
        return res.status(403).json({ message: "Only the Problem Provider can designate the Project Leader." });
      }

      request.status = "ACCEPTED";
      await request.save();

      project.projectLeader = request.developer;
      project.teamMembers = [{ user: request.developer, role: "Leader" }];
      project.status = "LEADER_SELECTED";
      await project.save();

      await applyRequestAcceptedReputation(request.developer);

      // Only reject other requests if team has reached maximum capacity; otherwise keep them pending for the leader to review as team contributors
      if (project.teamMembers.length >= project.maxTeamSize) {
        await DeveloperRequest.updateMany(
          { project: project._id, _id: { $ne: request._id }, status: "PENDING" },
          { status: "REJECTED" }
        );
      }

      await createNotification(
        request.developer,
        "REQUEST_ACCEPTED",
        `Your request to solve "${project.title}" has been accepted! You are now designated as the Project Leader 👑.`,
        { projectId: project._id }
      );

      return res.status(200).json({
        message: "Request accepted — developer is now Project Leader",
        project,
      });
    }

    // CASE 2: Team Member Join Request (Leader already exists)
    // ONLY the Team Leader (or Admin) can accept team member requests, NOT the Problem Provider!
    if (!isLeader && !isAdmin) {
      return res.status(403).json({ message: "Only the Team Leader can accept team member requests." });
    }

    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: `Team is full (${project.teamMembers.length}/${project.maxTeamSize}).` });
    }

    const alreadyInTeam = project.teamMembers.some(
      (m) => m.user?.toString() === request.developer.toString()
    );

    if (!alreadyInTeam) {
      project.teamMembers.push({
        user: request.developer,
        role: "Contributor",
      });
    }

    if (project.status === "LEADER_SELECTED") {
      project.status = "TEAM_FORMING";
    }

    request.status = "ACCEPTED";
    await request.save();
    await project.save();

    await applyRequestAcceptedReputation(request.developer);

    await createNotification(
      request.developer,
      "REQUEST_ACCEPTED",
      `Your request to join "${project.title}" was accepted! You are now a team contributor.`,
      { projectId: project._id }
    );

    const updated = await Project.findById(project._id)
      .populate("teamMembers.user", "name skills reputation githubProfile")
      .populate("projectLeader", "name");

    res.status(200).json({
      message: "Contributor request accepted — added to project team!",
      project: updated,
    });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/requests/:id/reject
 */
exports.rejectRequest = async (req, res) => {
  try {
    const request = await DeveloperRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const project = await Project.findById(request.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isProvider = project.problemProvider && (project.problemProvider._id || project.problemProvider).toString() === userId;
    const isLeader = project.projectLeader && (project.projectLeader._id || project.projectLeader).toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    // If no leader yet, only provider can reject leader applications.
    // If leader exists, ONLY the Team Leader can reject team member requests, NOT the problem provider!
    if (!project.projectLeader) {
      if (!isProvider && !isAdmin) {
        return res.status(403).json({ message: "Only the Problem Provider can decline leader applications." });
      }
    } else {
      if (!isLeader && !isAdmin) {
        return res.status(403).json({ message: "Only the Team Leader can decline team member requests." });
      }
    }

    request.status = "REJECTED";
    await request.save();

    await createNotification(
      request.developer,
      "REQUEST_ACCEPTED",
      `Your request for "${project.title}" has been declined.`,
      { projectId: project._id }
    );

    res.status(200).json({ message: "Request rejected" });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
