const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Get current user's notifications.
 */
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await Notification.countDocuments({ user: req.user._id });
    const notifications = await Notification.find({ user: req.user._id })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ notifications, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ count });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
