const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const DeveloperRequest = require("../models/DeveloperRequest");
const DeveloperInvitation = require("../models/DeveloperInvitation");
const { createNotification } = require("../services/notificationService");
const { normalizeGithubUrl, getContributorStats } = require("../services/githubService");

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

// ───────────────────────────────────────────────────────────────
// Backup Developer Matching
// ───────────────────────────────────────────────────────────────

/**
 * PUT /api/teams/:id/members/:userId/vacant
 * Mark a team member as VACANT when they leave.
 * Preserves their contribution history. Does NOT reopen the project.
 * Only Project Leader or Problem Provider can do this.
 */
exports.markMemberVacant = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isLeader = project.projectLeader?.toString() === userId;
    const isProvider = project.problemProvider?.toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isLeader && !isProvider && !isAdmin) {
      return res.status(403).json({ message: "Only Project Leader or Problem Provider can mark members as vacant" });
    }

    // Cannot vacate the leader
    if (req.params.userId === project.projectLeader?.toString()) {
      return res.status(400).json({ message: "Cannot mark the Project Leader as vacant" });
    }

    const member = project.teamMembers.find(
      (m) => m.user?.toString() === req.params.userId
    );
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    if (member.status === "VACANT") {
      return res.status(400).json({ message: "This position is already vacant" });
    }

    // Capture contribution snapshot before vacating (best-effort)
    let contributionSnapshot = { commits: 0, prs: 0, mergedPrs: 0, issues: 0, reviews: 0, score: 0 };
    if (project.githubRepoUrl) {
      try {
        const parsed = normalizeGithubUrl(project.githubRepoUrl);
        if (parsed?.owner && parsed?.repo) {
          const leavingUser = await User.findById(req.params.userId);
          const contributors = await getContributorStats(parsed.owner, parsed.repo);
          // Try matching by GitHub username
          const ghUsername = leavingUser?.githubProfile
            ? leavingUser.githubProfile.replace(/.*github\.com\//i, "").replace(/\/$/, "")
            : null;
          if (ghUsername) {
            const match = contributors.find(
              (c) => c.author.toLowerCase() === ghUsername.toLowerCase()
            );
            if (match) {
              contributionSnapshot = {
                commits: match.commits,
                prs: match.prs,
                mergedPrs: match.mergedPrs,
                issues: match.issues,
                reviews: match.reviews,
                score: match.score,
              };
            }
          }
        }
      } catch (ghErr) {
        console.warn("Non-blocking: could not capture contribution snapshot:", ghErr.message);
      }
    }

    // Update Team model (if it exists)
    try {
      const team = await Team.findOne({ projectId: project._id });
      if (team) {
        const teamMember = team.members.find((m) => m.userId?.toString() === req.params.userId);
        if (teamMember) {
          teamMember.status = "VACANT";
          teamMember.vacatedAt = new Date();
        }
        // Add to previousMembers
        team.previousMembers.push({
          userId: req.params.userId,
          role: member.role,
          customRole: member.customRole,
          joinedAt: member.joinedAt,
          leftAt: new Date(),
          contributionSnapshot,
        });
        await team.save();
      }
    } catch (teamErr) {
      console.warn("Non-blocking: Team model update skipped:", teamErr.message);
    }

    // Mark as vacant in Project model
    member.status = "VACANT";
    member.vacatedAt = new Date();
    await project.save();

    // Notify relevant users
    const leavingUser = await User.findById(req.params.userId).select("name");
    const memberName = leavingUser?.name || "A team member";

    // Notify leader (if not the one who triggered it)
    if (project.projectLeader && project.projectLeader.toString() !== userId) {
      await createNotification(
        project.projectLeader,
        "MEMBER_VACATED",
        `${memberName} has left "${project.title}". The ${member.customRole || member.role} position is now VACANT.`,
        { projectId: project._id, vacantRole: member.role, vacantCustomRole: member.customRole }
      );
    }

    // Notify provider
    if (project.problemProvider && project.problemProvider.toString() !== userId) {
      await createNotification(
        project.problemProvider,
        "MEMBER_VACATED",
        `${memberName} has left "${project.title}". A replacement may be needed.`,
        { projectId: project._id }
      );
    }

    const updated = await Project.findById(project._id)
      .populate("teamMembers.user", "name skills reputation githubProfile");

    res.status(200).json({
      message: `${memberName}'s position marked as VACANT. Contribution history preserved.`,
      project: updated,
      contributionSnapshot,
    });
  } catch (err) {
    console.error("Mark member vacant error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/teams/:id/members/:userId/replacements
 * Find and rank suitable replacement developers for a vacant position.
 * Returns candidates sorted by match percentage.
 */
exports.findReplacementCandidates = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("teamMembers.user", "name skills");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isLeader = project.projectLeader?.toString() === userId;
    const isProvider = project.problemProvider?.toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isLeader && !isProvider && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to find replacements" });
    }

    // Find the vacant member slot
    const vacantMember = project.teamMembers.find(
      (m) => m.user?.toString() === req.params.userId || m.user?._id?.toString() === req.params.userId
    );
    if (!vacantMember) {
      return res.status(404).json({ message: "Team member not found" });
    }
    if (vacantMember.status !== "VACANT") {
      return res.status(400).json({ message: "This position is not vacant" });
    }

    // Determine required skills from project and the vacant member's customRole
    const requiredSkills = [...(project.requiredSkills || [])];
    if (project.aiSuggestedSkills?.length) {
      for (const skill of project.aiSuggestedSkills) {
        if (!requiredSkills.includes(skill)) requiredSkills.push(skill);
      }
    }

    // Get existing team member IDs (to exclude them)
    const currentMemberIds = project.teamMembers
      .filter((m) => m.status !== "VACANT")
      .map((m) => m.user?.toString() || m.user?._id?.toString())
      .filter(Boolean);

    // Also exclude the provider and the vacant user
    const excludeIds = [
      ...currentMemberIds,
      project.problemProvider?.toString(),
      req.params.userId,
    ].filter(Boolean);

    // Search for available developers
    const candidates = await User.find({
      role: "DEVELOPER",
      availability: true,
      _id: { $nin: excludeIds },
    }).select("name skills reputation projectsCompleted projectsLed badges githubProfile linkedinOrPortfolio bio experience");

    // Calculate match percentage for each candidate
    const rankedCandidates = candidates.map((dev) => {
      const devSkills = (dev.skills || []).map((s) => s.toLowerCase());
      const reqSkillsLower = requiredSkills.map((s) => s.toLowerCase());

      // Skill match
      let matchedSkills = 0;
      const matchedSkillNames = [];
      for (const skill of reqSkillsLower) {
        if (devSkills.some((ds) => ds.includes(skill) || skill.includes(ds))) {
          matchedSkills++;
          matchedSkillNames.push(skill);
        }
      }

      const skillMatchPct = reqSkillsLower.length > 0
        ? (matchedSkills / reqSkillsLower.length) * 60  // skills worth 60% of match
        : 30; // If no required skills, give base score

      // Reputation/experience bonus (up to 25%)
      const repScore = Math.min(dev.reputation / 100, 1) * 15;
      const projectScore = Math.min(dev.projectsCompleted / 5, 1) * 10;

      // Availability bonus (15%)
      const availBonus = dev.availability ? 15 : 0;

      const matchPercentage = Math.min(
        Math.round(skillMatchPct + repScore + projectScore + availBonus),
        100
      );

      return {
        developer: dev,
        matchPercentage,
        matchedSkills: matchedSkillNames,
        totalRequiredSkills: reqSkillsLower.length,
      };
    });

    // Sort by match percentage descending
    rankedCandidates.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      vacantRole: vacantMember.role,
      vacantCustomRole: vacantMember.customRole,
      requiredSkills,
      candidates: rankedCandidates.slice(0, 20), // Top 20
      totalCandidates: rankedCandidates.length,
    });
  } catch (err) {
    console.error("Find replacements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/teams/:id/members/:userId/invite-replacement
 * Invite a replacement developer for a vacant position.
 * Uses the existing DeveloperInvitation system.
 */
exports.inviteReplacement = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isLeader = project.projectLeader?.toString() === userId;
    const isProvider = project.problemProvider?.toString() === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isLeader && !isProvider && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to invite replacements" });
    }

    // Verify the slot is vacant
    const vacantMember = project.teamMembers.find(
      (m) => m.user?.toString() === req.params.userId
    );
    if (!vacantMember || vacantMember.status !== "VACANT") {
      return res.status(400).json({ message: "This position is not vacant" });
    }

    const { developerId, message } = req.body;
    if (!developerId) {
      return res.status(400).json({ message: "developerId is required" });
    }

    // Check if already invited
    const existing = await DeveloperInvitation.findOne({
      developer: developerId,
      project: project._id,
      status: "PENDING",
    });
    if (existing) {
      return res.status(400).json({ message: "Developer already has a pending invitation" });
    }

    const invitation = await DeveloperInvitation.create({
      provider: req.user._id,
      developer: developerId,
      project: project._id,
      message: message || `You are invited to fill the ${vacantMember.customRole || vacantMember.role} position.`,
      replacingUserId: req.params.userId,
      vacantRole: vacantMember.role,
      vacantCustomRole: vacantMember.customRole,
    });

    await createNotification(
      developerId,
      "REPLACEMENT_INVITED",
      `You've been invited to fill a vacant ${vacantMember.customRole || vacantMember.role} position in "${project.title}"`,
      { projectId: project._id, invitationId: invitation._id, vacantRole: vacantMember.role }
    );

    res.status(201).json({ invitation });
  } catch (err) {
    console.error("Invite replacement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
