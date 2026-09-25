const User = require("../models/User");
const Project = require("../models/Project");
const Team = require("../models/Team");

/**
 * GET /api/developers/top-performers
 * Top developers sorted by reputation desc, tiebreak: projectsCompleted.
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await User.countDocuments({ role: "DEVELOPER" });
    const developers = await User.find({ role: "DEVELOPER" })
      .select("name bio skills projectsCompleted projectsLed reputation badges githubProfile linkedinOrPortfolio availability")
      .sort({ reputation: -1, projectsCompleted: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ developers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get top performers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/developers/search
 * Search developers with filters.
 */
exports.searchDevelopers = async (req, res) => {
  try {
    const { skill, minProjects, availability, search, page = 1, limit = 20 } = req.query;

    const filter = { role: "DEVELOPER" };

    if (skill) filter.skills = { $in: [new RegExp(skill, "i")] };
    if (minProjects) filter.projectsCompleted = { $gte: Number(minProjects) };
    if (availability !== undefined) filter.availability = availability === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const total = await User.countDocuments(filter);
    const developers = await User.find(filter)
      .select("name bio skills projectsCompleted projectsLed reputation badges githubProfile linkedinOrPortfolio availability")
      .sort({ reputation: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ developers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Search developers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Helper to fetch projects led or contributed by a developer
 */
async function fetchDeveloperProjects(developerId) {
  // 1. Projects where developer is explicitly set as projectLeader,
  // or is the leader in the Team model,
  // or has role === "Leader" in Project.teamMembers
  const ledTeams = await Team.find({ leaderId: developerId }).select("projectId");
  const ledTeamProjectIds = ledTeams.map((t) => t.projectId);

  const ledProjects = await Project.find({
    $or: [
      { projectLeader: developerId },
      { _id: { $in: ledTeamProjectIds } },
      { teamMembers: { $elemMatch: { user: developerId, role: "Leader" } } },
    ],
    status: { $ne: "DRAFT" },
  })
    .populate("problemProvider", "name organizationName email avatar")
    .populate("projectLeader", "name email githubProfile avatar")
    .populate("teamMembers.user", "name role skills avatar githubProfile")
    .sort({ completionDate: -1, updatedAt: -1, createdAt: -1 });

  const ledProjectIds = ledProjects.map((p) => p._id.toString());

  // 2. Projects where developer contributed as non-leader team member
  const contributedProjects = await Project.find({
    _id: { $nin: ledProjectIds },
    "teamMembers.user": developerId,
    status: { $ne: "DRAFT" },
  })
    .populate("problemProvider", "name organizationName email avatar")
    .populate("projectLeader", "name email githubProfile avatar")
    .populate("teamMembers.user", "name role skills avatar githubProfile")
    .sort({ completionDate: -1, updatedAt: -1, createdAt: -1 });

  return { ledProjects, contributedProjects };
}

/**
 * GET /api/developers/:id
 * Public developer profile with complete led projects and contributions.
 */
exports.getProfile = async (req, res) => {
  try {
    const developer = await User.findOne({ _id: req.params.id, role: "DEVELOPER" })
      .select("-password");

    if (!developer) {
      return res.status(404).json({ message: "Developer not found" });
    }

    // Privacy: hide sensitive fields if profile is not public
    const profile = developer.toObject();
    if (!developer.isProfilePublic) {
      delete profile.email;
      delete profile.mobileNumber;
      delete profile.address;
    }

    // Fetch projects led and contributed by this developer
    const { ledProjects, contributedProjects } = await fetchDeveloperProjects(req.params.id);

    res.status(200).json({
      developer: profile,
      ledProjects,
      contributedProjects,
      stats: {
        totalLed: ledProjects.length,
        totalContributed: contributedProjects.length,
        completedLed: ledProjects.filter((p) => p.status === "COMPLETED").length,
        inDevelopmentLed: ledProjects.filter((p) => p.status === "IN_DEVELOPMENT").length,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/developers/:id/projects
 * Get full list of projects led or contributed by developer
 */
exports.getDeveloperProjects = async (req, res) => {
  try {
    const { ledProjects, contributedProjects } = await fetchDeveloperProjects(req.params.id);
    res.status(200).json({
      ledProjects,
      contributedProjects,
      totalLed: ledProjects.length,
      totalContributed: contributedProjects.length,
    });
  } catch (err) {
    console.error("Get developer projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

