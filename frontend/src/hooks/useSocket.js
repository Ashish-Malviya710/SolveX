import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api", "")
  : "http://localhost:8000";

export const useSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("joined_room", ({ room, chatType, projectId }) => {
      setCurrentRoom(room);
    });

    socket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("error_msg", (err) => {
      console.warn("Socket error:", err.message);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const joinRoom = useCallback(({ projectId, chatType = "TEAM_GROUP", targetUserId }) => {
    if (socketRef.current) {
      socketRef.current.emit("join_room", { projectId, chatType, targetUserId });
    }
  }, []);

  const sendMessage = useCallback(({ projectId, chatType = "TEAM_GROUP", targetUserId, content }) => {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit("send_message", { projectId, chatType, targetUserId, content });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    setMessages,
    currentRoom,
    joinRoom,
    sendMessage,
  };
};
