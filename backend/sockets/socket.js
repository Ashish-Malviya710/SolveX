const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Project = require("../models/Project");
const Message = require("../models/Message");
const { createNotification } = require("../services/notificationService");

/**
 * Socket.io Handler
 * Isolated channels per project:
 *  - PROVIDER_LEADER : private, Problem Provider <-> Project Leader
 *  - LEADER_MEMBER   : private, Project Leader <-> one Team Member
 *  - TEAM_GROUP      : shared room for developers & team members only (not Problem Provider)
 */
module.exports = function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    // User joins their personal room for direct notifications
    socket.join(`user:${user._id}`);

    // Join project channel room
    socket.on("join_room", async ({ projectId, chatType, targetUserId }) => {
      try {
        const project = await Project.findById(projectId);
        if (!project) {
          return socket.emit("error_msg", { message: "Project not found" });
        }

        const userId = user._id.toString();
        const isProvider = project.problemProvider.toString() === userId;
        const isLeader = project.projectLeader && project.projectLeader.toString() === userId;
        const isMember = project.teamMembers && project.teamMembers.some((m) => m.user?.toString() === userId);
        const isAdmin = user.role === "ADMIN";

        if (!isProvider && !isLeader && !isMember && !isAdmin) {
          return socket.emit("error_msg", { message: "Unauthorized for this project chat" });
        }

        // Determine channel type: Problem Provider is restricted to PROVIDER_LEADER
        let effectiveChatType = chatType;
        if (isProvider) {
          effectiveChatType = "PROVIDER_LEADER";
        } else if (!effectiveChatType) {
          effectiveChatType = "TEAM_GROUP";
        }

        let roomName;

        if (effectiveChatType === "PROVIDER_LEADER") {
          if (!isProvider && !isLeader && !isAdmin) {
            return socket.emit("error_msg", { message: "Unauthorized for Provider-Leader channel" });
          }
          roomName = `project:${projectId}:PROVIDER_LEADER`;
        } else if (effectiveChatType === "LEADER_MEMBER") {
          if (!isLeader && !isMember && !isAdmin) {
            return socket.emit("error_msg", { message: "Unauthorized for Leader-Member channel" });
          }
          const memberId = isLeader ? targetUserId : userId;
          const leaderId = project.projectLeader.toString();
          const sortedIds = [leaderId, memberId].sort().join(":");
          roomName = `project:${projectId}:LEADER_MEMBER:${sortedIds}`;
        } else {
          // TEAM_GROUP: Problem Providers cannot access internal team chat
          if (isProvider && !isAdmin) {
            return socket.emit("error_msg", { message: "Problem Providers communicate via the Provider-Leader channel." });
          }
          roomName = `project:${projectId}:TEAM_GROUP`;
        }

        socket.join(roomName);
        socket.emit("joined_room", { room: roomName, chatType: effectiveChatType, projectId });
      } catch (err) {
        console.error("Socket join_room error:", err);
        socket.emit("error_msg", { message: "Failed to join room" });
      }
    });

    // Handle sending chat message
    socket.on("send_message", async ({ projectId, chatType, targetUserId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const project = await Project.findById(projectId);
        if (!project) return socket.emit("error_msg", { message: "Project not found" });

        const userId = user._id.toString();
        const isProvider = project.problemProvider.toString() === userId;
        const isLeader = project.projectLeader && project.projectLeader.toString() === userId;
        const isMember = project.teamMembers && project.teamMembers.some((m) => m.user?.toString() === userId);
        const isAdmin = user.role === "ADMIN";

        if (!isProvider && !isLeader && !isMember && !isAdmin) {
          return socket.emit("error_msg", { message: "Unauthorized" });
        }

        let effectiveChatType = chatType;
        if (isProvider) {
          effectiveChatType = "PROVIDER_LEADER";
        } else if (!effectiveChatType) {
          effectiveChatType = "TEAM_GROUP";
        }

        let roomName;
        const recipientsToNotify = [];

        if (effectiveChatType === "PROVIDER_LEADER") {
          if (!isProvider && !isLeader && !isAdmin) {
            return socket.emit("error_msg", { message: "Unauthorized for Provider-Leader channel" });
          }
          roomName = `project:${projectId}:PROVIDER_LEADER`;

          // Determine recipient: if provider sent, notify leader; if leader sent, notify provider
          if (isProvider && project.projectLeader) {
            recipientsToNotify.push(project.projectLeader.toString());
          } else if (isLeader && project.problemProvider) {
            recipientsToNotify.push(project.problemProvider.toString());
          }
        } else if (effectiveChatType === "LEADER_MEMBER") {
          if (!isLeader && !isMember && !isAdmin) {
            return socket.emit("error_msg", { message: "Unauthorized for Leader-Member channel" });
          }
          const memberId = isLeader ? targetUserId : userId;
          const leaderId = project.projectLeader.toString();
          const sortedIds = [leaderId, memberId].sort().join(":");
          roomName = `project:${projectId}:LEADER_MEMBER:${sortedIds}`;

          if (isLeader && memberId) {
            recipientsToNotify.push(memberId);
          } else if (!isLeader && leaderId) {
            recipientsToNotify.push(leaderId);
          }
        } else {
          // TEAM_GROUP: developers and leader
          if (isProvider && !isAdmin) {
            return socket.emit("error_msg", { message: "Unauthorized for Team Group channel" });
          }
          roomName = `project:${projectId}:TEAM_GROUP`;

          // Notify all other team members and leader (except sender)
          if (project.projectLeader && project.projectLeader.toString() !== userId) {
            recipientsToNotify.push(project.projectLeader.toString());
          }
          for (const m of project.teamMembers || []) {
            if (m.user && m.user.toString() !== userId && !recipientsToNotify.includes(m.user.toString())) {
              recipientsToNotify.push(m.user.toString());
            }
          }
        }

        // Save message to DB
        const message = await Message.create({
          project: projectId,
          sender: user._id,
          content: content.trim(),
          chatType: effectiveChatType,
          targetUser: targetUserId || null,
        });

        const populated = await Message.findById(message._id).populate("sender", "name email role");

        // Broadcast to chat room
        io.to(roomName).emit("new_message", populated);

        // Send notifications to all recipients
        const notificationText = `New message from ${user.name} on "${project.title}": "${content.trim().slice(0, 60)}${content.length > 60 ? "..." : ""}"`;
        for (const recipientId of recipientsToNotify) {
          await createNotification(
            recipientId,
            "NEW_CHAT_MESSAGE",
            notificationText,
            { projectId: project._id, chatType: effectiveChatType }
          );
          // Alert user socket if online
          io.to(`user:${recipientId}`).emit("notification_received", {
            message: notificationText,
            projectId: project._id,
          });
        }
      } catch (err) {
        console.error("Socket send_message error:", err);
        socket.emit("error_msg", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};
