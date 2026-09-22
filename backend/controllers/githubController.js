const { getRepoStats } = require("../services/githubService");

/**
 * GET /api/github/repo-stats?repoUrl=...
 * Fetch public GitHub repo stats on demand.
 */
exports.getRepoStats = async (req, res) => {
  try {
    const { repoUrl } = req.query;
    if (!repoUrl) {
      return res.status(400).json({ message: "repoUrl query parameter is required" });
    }

    const stats = await getRepoStats(repoUrl);

    if (!stats) {
      return res.status(200).json({
        stats: null,
        message: "Could not fetch stats — repo may be private or URL invalid",
      });
    }

    res.status(200).json({ stats });
  } catch (err) {
    console.error("GitHub stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
