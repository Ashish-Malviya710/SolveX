const User = require("../models/User");

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
 * GET /api/developers/:id
 * Public developer profile.
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

    res.status(200).json({ developer: profile });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
