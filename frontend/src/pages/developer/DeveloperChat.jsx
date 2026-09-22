import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare, FiUsers, FiSend, FiFolder, FiLock } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { useSocket } from "../../hooks/useSocket";

const DeveloperChat = () => {
  const { user, token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatType, setChatType] = useState(() =>
    user?.role === "PROBLEM_PROVIDER" ? "PROVIDER_LEADER" : "TEAM_GROUP"
  );
  const [targetMember, setTargetMember] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (user?.role === "PROBLEM_PROVIDER") {
      setChatType("PROVIDER_LEADER");
    }
  }, [user]);

  const { isConnected, messages, setMessages, joinRoom, sendMessage } = useSocket(token);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        const list = res.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0]._id);
          setSelectedProject(list[0]);
        }
      } catch (err) {
        console.error("Failed to load user projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSelectProject = async (id) => {
    setSelectedProjectId(id);
    const prj = projects.find((p) => p._id === id);
    setSelectedProject(prj);
  };

  useEffect(() => {
    if (selectedProjectId) {
      const fetchHistory = async () => {
        try {
          const params = new URLSearchParams({ chatType });
          if (targetMember) params.append("targetUserId", targetMember);
          const res = await api.get(`/messages/${selectedProjectId}?${params.toString()}`);
          setMessages(res.data.messages || []);
        } catch (err) {
          console.error("Failed to load chat history:", err);
        }
      };
      fetchHistory();
      joinRoom({ projectId: selectedProjectId, chatType, targetUserId: targetMember });
    }
  }, [selectedProjectId, chatType, targetMember, joinRoom, setMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProjectId) return;
    sendMessage({
      projectId: selectedProjectId,
      chatType,
      targetUserId: targetMember,
      content: chatInput,
    });
    setChatInput("");
  };

  const isLeader = selectedProject?.projectLeader?._id === user?._id || selectedProject?.projectLeader === user?._id;
  const isProvider = selectedProject?.problemProvider?._id === user?._id || selectedProject?.problemProvider === user?._id;

  return (
    <div className="page-container space-y-6">
      <div className="section-header">
        <span className="badge badge-primary mb-2">Real-Time Hub</span>
        <h1 className="section-title">Project Collaboration Chat</h1>
        <p className="section-subtitle">
          Isolated communication channels for problem providers, leaders, and team members.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-xs text-gray-400">Loading workspaces...</div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-gray-400">
          You are not part of any active project team yet.{" "}
          <Link to="/explore" className="text-primary-400 underline">
            Explore Open Challenges
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[600px]">
          {/* Project & Channel Sidebar */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-dark-700/60 bg-dark-900/60 space-y-6">
            {/* Project Picker */}
            <div className="space-y-2">
              <label className="input-label text-xs">Active Project Workspace</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="select-field text-xs"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Channels List */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Channel
              </span>
              <div className="space-y-1.5">
                {user?.role !== "PROBLEM_PROVIDER" && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatType("TEAM_GROUP");
                      setTargetMember("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                      chatType === "TEAM_GROUP"
                        ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                        : "text-gray-400 hover:text-white hover:bg-dark-800"
                    }`}
                  >
                    <FiUsers className="w-3.5 h-3.5" />
                    <span>Team Group Chat</span>
                  </button>
                )}

                {(isProvider || isLeader || user?.role === "ADMIN") && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatType("PROVIDER_LEADER");
                      setTargetMember("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                      chatType === "PROVIDER_LEADER"
                        ? "bg-accent-600/20 text-accent-300 border border-accent-500/30"
                        : "text-gray-400 hover:text-white hover:bg-dark-800"
                    }`}
                  >
                    <FiMessageSquare className="w-3.5 h-3.5 text-accent-400" />
                    <span>Provider ↔ Leader</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-dark-700/60">
              <Link
                to={`/projects/${selectedProjectId}`}
                className="btn-secondary btn-sm w-full text-center text-xs flex items-center justify-center gap-1.5"
              >
                <FiFolder className="w-3.5 h-3.5" />
                <span>Open Project View</span>
              </Link>
            </div>
          </div>

          {/* Messages & Feed Box */}
          <div className="md:col-span-3 flex flex-col h-[600px] bg-dark-950/40">
            <div className="p-4 border-b border-dark-700/60 bg-dark-900/80 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {chatType === "TEAM_GROUP"
                    ? "Team Group Room"
                    : "Private Provider ↔ Leader Channel"}
                </h4>
                <p className="text-[11px] text-gray-400 truncate max-w-md">
                  {selectedProject?.title}
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Socket Live
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                        <span>{isMe ? "You" : msg.sender?.name || "Member"}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-primary-600 text-white rounded-br-none shadow-glow-sm"
                            : "bg-dark-800 text-gray-200 border border-dark-700 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-dark-700/60 bg-dark-900/90 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="input-field py-2 text-xs flex-1"
              />
              <button type="submit" className="btn-primary btn-sm flex items-center gap-1">
                <FiSend className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperChat;
