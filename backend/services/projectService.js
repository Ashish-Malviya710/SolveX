const User = require("../models/User");
const Project = require("../models/Project");

/**
 * Apply reputation points and check/award badges when a project is completed.
 */
async function applyReputationAndBadges(project) {
  try {
    // +15 for Project Leader
    if (project.projectLeader) {
      await User.findByIdAndUpdate(project.projectLeader, {
        $inc: { reputation: 15, projectsCompleted: 1, projectsLed: 1 },
      });
      await checkAndAwardBadges(project.projectLeader);
    }

    // +10 for each team member (excluding leader)
    for (const member of project.teamMembers || []) {
      if (member.user && member.user.toString() !== project.projectLeader?.toString()) {
        await User.findByIdAndUpdate(member.user, {
          $inc: { reputation: 10, projectsCompleted: 1 },
        });
        await checkAndAwardBadges(member.user);
      }
    }
  } catch (err) {
    console.error("Error applying reputation:", err);
  }
}

/**
 * Apply +5 reputation when a developer request is accepted.
 */
async function applyRequestAcceptedReputation(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { reputation: 5 },
    });
  } catch (err) {
    console.error("Error applying request accepted reputation:", err);
  }
}

/**
 * Check and award badges based on user stats.
 */
async function checkAndAwardBadges(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const newBadges = [...(user.badges || [])];

    // 🏆 First Project Completed
    if (user.projectsCompleted >= 1 && !newBadges.includes("First Project Completed")) {
      newBadges.push("First Project Completed");
    }

    // 🏆 Project Leader (first project led to completion)
    if (user.projectsLed >= 1 && !newBadges.includes("Project Leader")) {
      newBadges.push("Project Leader");
    }

    // 🏆 3 Projects Completed
    if (user.projectsCompleted >= 3 && !newBadges.includes("3 Projects Completed")) {
      newBadges.push("3 Projects Completed");
    }

    if (newBadges.length !== user.badges.length) {
      user.badges = newBadges;
      await user.save();
    }
  } catch (err) {
    console.error("Error checking badges:", err);
  }
}

module.exports = { applyReputationAndBadges, applyRequestAcceptedReputation, checkAndAwardBadges };
