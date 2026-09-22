const ProjectProposal = require("../models/ProjectProposal");
const Project = require("../models/Project");
const { createNotification } = require("../services/notificationService");

/**
 * POST /api/projects/:id/proposal
 * Create a project proposal (Project Leader only).
 */
exports.createProposal = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.projectLeader || project.projectLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can create a proposal" });
    }

    // Check if proposal already exists
    const existing = await ProjectProposal.findOne({ project: req.params.id });
    if (existing) {
      return res.status(400).json({ message: "Proposal already exists. Use PUT to update." });
    }

    const {
      description, technologyStack, features, estimatedDuration, milestones,
    } = req.body;

    const proposal = await ProjectProposal.create({
      project: req.params.id,
      leader: req.user._id,
      teamMembers: project.teamMembers.map(m => ({
        user: m.user,
        role: m.role,
        customRole: m.customRole,
      })),
      description,
      technologyStack: technologyStack || [],
      features: features || [],
      estimatedDuration,
      milestones: milestones || [],
      status: "DRAFT",
    });

    res.status(201).json({ proposal });
  } catch (err) {
    console.error("Create proposal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/projects/:id/proposal
 * Get proposal for a project.
 */
exports.getProposal = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findOne({ project: req.params.id })
      .populate("leader", "name email")
      .populate("teamMembers.user", "name skills");

    if (!proposal) return res.status(404).json({ message: "No proposal found" });

    res.status(200).json({ proposal });
  } catch (err) {
    console.error("Get proposal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/proposals/:id
 * Update proposal (overwrites — no version history).
 */
exports.updateProposal = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    if (proposal.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can update the proposal" });
    }

    if (!["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status)) {
      return res.status(400).json({ message: "Proposal cannot be edited in its current status" });
    }

    const allowedFields = [
      "description", "technologyStack", "features", "estimatedDuration", "milestones",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        proposal[field] = req.body[field];
      }
    }

    if (req.body.teamMembers) {
      proposal.teamMembers = req.body.teamMembers;
    }

    await proposal.save();
    res.status(200).json({ proposal });
  } catch (err) {
    console.error("Update proposal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/proposals/:id/submit
 * Submit proposal for review (DRAFT → SUBMITTED).
 */
exports.submitProposal = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    if (proposal.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can submit" });
    }

    if (!["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status)) {
      return res.status(400).json({ message: "Proposal cannot be submitted in its current status" });
    }

    proposal.status = "SUBMITTED";
    await proposal.save();

    // Update project status
    const project = await Project.findById(proposal.project);
    if (project) {
      project.status = "PROPOSAL_PENDING";
      await project.save();

      await createNotification(
        project.problemProvider,
        "PROPOSAL_SUBMITTED",
        `Project structure for "${project.title}" has been submitted for your review`,
        { projectId: project._id, proposalId: proposal._id }
      );
    }

    res.status(200).json({ proposal });
  } catch (err) {
    console.error("Submit proposal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/proposals/:id/approve
 * Provider approves the proposal.
 */
exports.approveProposal = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    const project = await Project.findById(proposal.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can approve" });
    }

    proposal.status = "APPROVED";
    await proposal.save();

    project.status = "IN_DEVELOPMENT";
    await project.save();

    await createNotification(
      proposal.leader,
      "PROPOSAL_APPROVED",
      `Your proposal for "${project.title}" has been approved! Development can begin.`,
      { projectId: project._id }
    );

    res.status(200).json({ proposal, message: "Proposal approved — development can begin" });
  } catch (err) {
    console.error("Approve proposal error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/proposals/:id/request-changes
 * Provider requests changes to the proposal.
 */
exports.requestChanges = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    const project = await Project.findById(proposal.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.problemProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Problem Provider can request changes" });
    }

    proposal.status = "CHANGES_REQUESTED";
    proposal.providerFeedback = req.body.feedback || "";
    await proposal.save();

    project.status = "CHANGES_REQUESTED";
    await project.save();

    await createNotification(
      proposal.leader,
      "PROPOSAL_CHANGES_REQUESTED",
      `Changes have been requested for your proposal for "${project.title}"`,
      { projectId: project._id }
    );

    res.status(200).json({ proposal });
  } catch (err) {
    console.error("Request changes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/proposals/:id/milestones/:milestoneIndex
 * Update a milestone's status (Project Leader).
 */
exports.updateMilestoneStatus = async (req, res) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    if (proposal.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the Project Leader can update milestones" });
    }

    const idx = parseInt(req.params.milestoneIndex);
    if (isNaN(idx) || idx < 0 || idx >= proposal.milestones.length) {
      return res.status(400).json({ message: "Invalid milestone index" });
    }

    if (req.body.status) proposal.milestones[idx].status = req.body.status;
    if (req.body.deadline) proposal.milestones[idx].deadline = req.body.deadline;

    await proposal.save();
    res.status(200).json({ proposal });
  } catch (err) {
    console.error("Update milestone error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
