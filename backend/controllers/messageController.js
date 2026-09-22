const Message = require("../models/Message");
const Project = require("../models/Project");
const { createNotification } = require("../services/notificationService");

/**
 * GET /api/messages/:projectId
 * Get chat history for a project channel.
 */
exports.getMessages = async (req, res) => {
  try {
    const { chatType, targetUserId } = req.query;
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Authorization: must be a project participant
    const userId = req.user._id.toString();
    const isProvider = project.problemProvider.toString() === userId;
    const isLeader = project.projectLeader && project.projectLeader.toString() === userId;
    const isMember = project.teamMembers && project.teamMembers.some((m) => m.user?.toString() === userId);
    const isAdmin = req.user.role === "ADMIN";

    if (!isProvider && !isLeader && !isMember && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }

    // Build filter
    const filter = { project: projectId };

    // Problem Providers can only see PROVIDER_LEADER
    if (isProvider) {
      filter.chatType = "PROVIDER_LEADER";
    } else if (chatType === "PROVIDER_LEADER") {
      if (!isProvider && !isLeader && !isAdmin) {
        return res.status(403).json({ message: "Not authorized for this channel" });
      }
      filter.chatType = "PROVIDER_LEADER";
    } else if (chatType === "LEADER_MEMBER") {
      if (!isLeader && !isMember && !isAdmin) {
        return res.status(403).json({ message: "Not authorized for this channel" });
      }
      filter.chatType = "LEADER_MEMBER";
      if (targetUserId) {
        filter.$or = [
          { sender: userId, targetUser: targetUserId },
          { sender: targetUserId, targetUser: userId },
        ];
      }
    } else {
      filter.chatType = "TEAM_GROUP";
    }

    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find(filter)
      .populate("sender", "name email role")
      .sort("createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/messages
 * Send a message with notifications triggered to recipients.
 */
exports.sendMessage = async (req, res) => {
  try {
    const { projectId, content, chatType, targetUserId } = req.body;

    if (!projectId || !content || !content.trim()) {
      return res.status(400).json({ message: "projectId and content are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isProvider = project.problemProvider.toString() === userId;
    const isLeader = project.projectLeader && project.projectLeader.toString() === userId;
    const isMember = project.teamMembers && project.teamMembers.some((m) => m.user?.toString() === userId);
    const isAdmin = req.user.role === "ADMIN";

    if (!isProvider && !isLeader && !isMember && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to send messages in this project" });
    }

    let effectiveChatType = chatType;
    if (isProvider) {
      effectiveChatType = "PROVIDER_LEADER";
    } else if (!effectiveChatType) {
      effectiveChatType = "TEAM_GROUP";
    }

    const message = await Message.create({
      project: projectId,
      sender: req.user._id,
      content: content.trim(),
      chatType: effectiveChatType,
      targetUser: targetUserId || null,
    });

    const populated = await Message.findById(message._id).populate("sender", "name email role");

    // Trigger in-app notifications to recipients
    const recipientsToNotify = [];
    if (effectiveChatType === "PROVIDER_LEADER") {
      if (isProvider && project.projectLeader) {
        recipientsToNotify.push(project.projectLeader.toString());
      } else if (isLeader && project.problemProvider) {
        recipientsToNotify.push(project.problemProvider.toString());
      }
    } else if (effectiveChatType === "LEADER_MEMBER") {
      const memberId = isLeader ? targetUserId : userId;
      const leaderId = project.projectLeader?.toString();
      if (isLeader && memberId) recipientsToNotify.push(memberId);
      else if (!isLeader && leaderId) recipientsToNotify.push(leaderId);
    } else {
      if (project.projectLeader && project.projectLeader.toString() !== userId) {
        recipientsToNotify.push(project.projectLeader.toString());
      }
      for (const m of project.teamMembers || []) {
        if (m.user && m.user.toString() !== userId && !recipientsToNotify.includes(m.user.toString())) {
          recipientsToNotify.push(m.user.toString());
        }
      }
    }

    const notifText = `New message from ${req.user.name} on "${project.title}": "${content.trim().slice(0, 60)}${content.length > 60 ? "..." : ""}"`;
    for (const recipientId of recipientsToNotify) {
      await createNotification(
        recipientId,
        "NEW_CHAT_MESSAGE",
        notifText,
        { projectId: project._id, chatType: effectiveChatType }
      );
    }

    res.status(201).json({ message: populated });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
