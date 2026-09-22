import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import api from "../services/api";

const NotificationBell = () => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket(token);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications?limit=8"),
        api.get("/notifications/unread-count"),
      ]);
      setNotifications(listRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time socket notification listener
  useEffect(() => {
    if (!socket) return;
    const handleNotification = () => {
      fetchNotifications();
    };
    socket.on("notification_received", handleNotification);
    return () => {
      socket.off("notification_received", handleNotification);
    };
  }, [socket, fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getNotificationLink = (n) => {
    if (n.data?.projectId) {
      return `/projects/${n.data.projectId}`;
    }
    return "#";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-dark-700/60 rounded-xl transition-all"
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold text-white bg-gradient-to-r from-accent-500 to-primary-500 rounded-full shadow-glow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card border border-dark-600/60 rounded-2xl shadow-glass z-50 overflow-hidden animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-dark-700/60 bg-dark-800/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-accent text-[10px] py-0.5 px-2">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium transition"
              >
                <FiCheckCircle className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-dark-700/40">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                <FiBell className="w-8 h-8 text-dark-500 mb-2" />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    n.read ? "bg-dark-900/40 hover:bg-dark-800/40" : "bg-dark-800/90 hover:bg-dark-700/70"
                  }`}
                >
                  <Link
                    to={getNotificationLink(n)}
                    onClick={() => {
                      if (!n.read) handleMarkAsRead(n._id);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-xs text-gray-200 hover:text-primary-300 leading-relaxed"
                  >
                    <p className={`${!n.read ? "font-medium text-white" : "text-gray-300"}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Link>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="text-gray-500 hover:text-primary-400 p-1"
                      title="Mark as read"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
