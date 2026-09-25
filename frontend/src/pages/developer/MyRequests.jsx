import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSend,
  FiFolder,
  FiClock,
  FiUsers,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiGithub,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../../services/api";

const MyRequests = () => {
  const [activeTab, setActiveTab] = useState("sent"); // "sent" | "incoming"
  const [sentRequests, setSentRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [ledProjects, setLedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sentRes, incomingRes] = await Promise.all([
        api.get("/requests/my").catch(() => ({ data: { requests: [] } })),
        api.get("/requests/incoming").catch(() => ({ data: { requests: [], projects: [] } })),
      ]);
      setSentRequests(sentRes.data.requests || []);
      setIncomingRequests(incomingRes.data.requests || []);
      setLedProjects(incomingRes.data.projects || []);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptRequest = async (reqId) => {
    setActionLoading((prev) => ({ ...prev, [reqId]: "accept" }));
    setActionMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/requests/${reqId}/accept`);
      setActionMessage({
        type: "success",
        text: res.data?.message || "Developer join request accepted! Member added to the team.",
      });
      fetchData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to accept request.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [reqId]: null }));
    }
  };

  const handleRejectRequest = async (reqId) => {
    setActionLoading((prev) => ({ ...prev, [reqId]: "reject" }));
    setActionMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/requests/${reqId}/reject`);
      setActionMessage({ type: "success", text: "Join request declined." });
      fetchData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to decline request.",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [reqId]: null }));
    }
  };

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="section-header">
        <span className="badge badge-primary mb-2">Request Hub</span>
        <h1 className="section-title">Developer Requests</h1>
        <p className="section-subtitle">
          Manage applications you've sent to join projects, and review incoming requests from developers applying to your team.
        </p>
      </div>

      {actionMessage.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: "", text: "" })}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-700/60 pb-2">
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "sent"
              ? "bg-primary-500 text-white shadow-glow-sm"
              : "text-gray-400 hover:text-white hover:bg-dark-800"
          }`}
        >
          <FiSend className="w-3.5 h-3.5" />
          <span>Sent Applications ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "incoming"
              ? "bg-primary-500 text-white shadow-glow-sm"
              : "text-gray-400 hover:text-white hover:bg-dark-800"
          }`}
        >
          <FiUsers className="w-3.5 h-3.5" />
          <span>Incoming Team Requests ({incomingRequests.length})</span>
          {pendingIncomingCount > 0 && (
            <span className="badge badge-accent text-[10px] py-0 px-1.5 animate-pulse">
              {pendingIncomingCount} New
            </span>
          )}
        </button>

        <div className="ml-auto">
          <button
            onClick={fetchData}
            className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
            title="Refresh requests"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-2">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : activeTab === "sent" ? (
        /* TAB 1: SENT APPLICATIONS */
        sentRequests.length === 0 ? (
          <div className="empty-state glass-card p-12">
            <FiSend className="empty-state-icon" />
            <h3 className="text-base font-bold text-white mb-1">No Requests Sent</h3>
            <p className="empty-state-text text-xs mb-4">
              You haven't requested to solve any problems yet.
            </p>
            <Link to="/explore" className="btn-primary btn-sm">
              Browse Open Problems
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((r) => (
              <div
                key={r._id}
                className="glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge text-[10px] ${
                        r.status === "ACCEPTED"
                          ? "badge-success"
                          : r.status === "REJECTED"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Sent on {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                    <Link to={`/projects/${r.project?._id}`}>{r.project?.title}</Link>
                  </h3>

                  {r.message && (
                    <p className="text-xs text-gray-300 italic line-clamp-2">
                      "{r.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <Link
                    to={`/projects/${r.project?._id}`}
                    className="btn-secondary btn-sm flex items-center gap-1 text-xs"
                  >
                    <FiFolder className="w-3.5 h-3.5" />
                    <span>Open Project</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 2: INCOMING TEAM REQUESTS (FOR TEAM LEADERS) */
        incomingRequests.length === 0 ? (
          <div className="empty-state glass-card p-12">
            <FiUsers className="empty-state-icon" />
            <h3 className="text-base font-bold text-white mb-1">No Incoming Team Requests</h3>
            <p className="empty-state-text text-xs mb-4">
              {ledProjects.length > 0
                ? "You are designated as the Leader for active projects, but no developers have requested to join yet."
                : "You are not currently leading any projects. When you lead a project, developer join requests will appear here."}
            </p>
            <Link to="/developer/dashboard" className="btn-primary btn-sm">
              Go to Workspace Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((req) => {
              const dev = req.developer;
              const isPending = req.status === "PENDING";
              const project = req.project;
              const isFull =
                project &&
                project.teamMembers &&
                project.teamMembers.length >= (project.maxTeamSize || 5);

              return (
                <div
                  key={req._id}
                  className={`glass-card p-5 space-y-4 transition-all ${
                    isPending
                      ? "border-primary-500/30 hover:border-primary-500/50 shadow-glow-sm"
                      : "opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="avatar">
                        {dev?.name?.charAt(0) || "D"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/developers/${dev?._id}`}
                            className="text-sm font-bold text-white hover:text-primary-400 transition"
                          >
                            {dev?.name || "Developer"}
                          </Link>
                          <span className="badge badge-accent text-[10px] py-0 px-2">
                            {dev?.reputation || 0} pts
                          </span>
                          <span
                            className={`badge text-[10px] py-0 px-2 ${
                              req.status === "ACCEPTED"
                                ? "badge-success"
                                : req.status === "REJECTED"
                                ? "badge-danger"
                                : "badge-warning"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                          <span>Applied to:</span>
                          <Link
                            to={`/projects/${project?._id}?tab=team`}
                            className="text-primary-400 hover:underline font-semibold"
                          >
                            {project?.title}
                          </Link>
                          <span>• {new Date(req.createdAt).toLocaleDateString()}</span>
                          {dev?.githubProfile && (
                            <a
                              href={dev.githubProfile}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-300 hover:text-white flex items-center gap-1 ml-1"
                            >
                              <FiGithub className="w-3 h-3" />
                              <span>GitHub</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          disabled={isFull || actionLoading[req._id] === "accept"}
                          className={`btn-primary btn-sm text-xs flex items-center gap-1.5 ${
                            isFull ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title={
                            isFull
                              ? "Team capacity full. Expand team size in project settings."
                              : "Accept developer into team"
                          }
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                          <span>
                            {actionLoading[req._id] === "accept"
                              ? "Accepting..."
                              : isFull
                              ? "Team Full"
                              : "Accept to Team"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          disabled={actionLoading[req._id] === "reject"}
                          className="btn-secondary btn-sm text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1"
                          title="Decline request"
                        >
                          <FiX className="w-3.5 h-3.5" />
                          <span>
                            {actionLoading[req._id] === "reject" ? "Declining..." : "Decline"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Application Message */}
                  {req.message && (
                    <div className="bg-dark-900/70 rounded-xl p-3 text-xs text-gray-300 border border-dark-700/60">
                      <p className="italic leading-relaxed">"{req.message}"</p>
                    </div>
                  )}

                  {/* Skills */}
                  {dev?.skills && dev.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dev.skills.map((skill, idx) => (
                        <span key={idx} className="badge badge-neutral text-[10px] py-0 px-2">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default MyRequests;
