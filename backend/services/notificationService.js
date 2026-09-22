const Notification = require("../models/Notification");

/**
 * Create a notification (used internally by other controllers/services).
 */
async function createNotification(userId, type, message, data = {}) {
  try {
    await Notification.create({
      user: userId,
      type,
      message,
      data,
    });
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

module.exports = { createNotification };
