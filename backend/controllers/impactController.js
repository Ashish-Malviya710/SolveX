const Project = require("../models/Project");

/**
 * PUT /api/impact/:projectId
 * Update impact statistics for a completed project.
 */
exports.updateImpact = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (
      project.problemProvider.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ message: "Only the problem provider can update impact data" });
    }

    const { peopleBenefited, organizationsHelped, notes } = req.body;

    project.impact = {
      peopleBenefited: Number(peopleBenefited) || 0,
      organizationsHelped: Number(organizationsHelped) || 0,
      notes: notes || "",
    };

    await project.save();

    res.status(200).json({
      message: "Impact statistics updated successfully",
      impact: project.impact,
      project,
    });
  } catch (err) {
    console.error("Update impact error:", err);
    res.status(500).json({ message: "Server error updating impact data" });
  }
};
