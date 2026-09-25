import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiCheck, FiX, FiGithub, FiExternalLink, FiAward } from "react-icons/fi";
import api from "../../services/api";

const DeveloperRequests = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        const list = res.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load provider problems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const fetchRequestsForProject = async () => {
        try {
          const res = await api.get(`/projects/${selectedProjectId}/requests`);
          setRequests(res.data.requests || []);
        } catch (err) {
          console.error("Failed to fetch requests for project:", err);
        }
      };
      fetchRequestsForProject();
    }
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const selectedProjectHasLeader = Boolean(selectedProject?.projectLeader);

  const handleAccept = async (reqId) => {
    setActionError("");
    setActionSuccess("");
    try {
      const acceptRes = await api.put(`/requests/${reqId}/accept`);
      setActionSuccess(acceptRes.data?.message || "Developer request accepted successfully!");
      // Refresh requests
      const res = await api.get(`/projects/${selectedProjectId}/requests`);
      setRequests(res.data.requests || []);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to accept request.");
    }
  };

  const handleReject = async (reqId) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/requests/${reqId}/reject`);
      setActionSuccess("Request declined.");
      const res = await api.get(`/projects/${selectedProjectId}/requests`);
      setRequests(res.data.requests || []);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to reject request.");
    }
  };

  return (
    <div className="page-container max-w-5xl space-y-6">
      <div className="section-header">
        <span className="badge badge-primary mb-2">Applicant Management</span>
        <h1 className="section-title">Developer Applications</h1>
        <p className="section-subtitle">
          Review developers who have applied to lead and build solutions for your posted challenges.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")}>✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")}>✕</button>
        </div>
      )}

      {/* Project Selector Bar */}
      {projects.length > 0 && (
        <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="text-xs font-semibold text-gray-300">Filter By Posted Challenge:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="select-field text-xs sm:w-80"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedProjectHasLeader && (
        <div className="p-3 bg-dark-900/60 border border-primary-500/20 rounded-xl text-xs text-gray-300 flex items-center justify-between flex-wrap gap-2">
          <span>
            👑 Team Leader: <strong className="text-white">{selectedProject.projectLeader?.name || "Assigned"}</strong>. Only the Team Leader reviews and accepts other team member requests.
          </span>
          <Link to={`/projects/${selectedProjectId}?tab=team`} className="text-primary-400 hover:underline">
            View Project Team →
          </Link>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-2">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state glass-card p-12">
          <FiUsers className="empty-state-icon" />
          <h3 className="text-base font-bold text-white mb-1">No Applications Yet</h3>
          <p className="empty-state-text text-xs">
            When developers discover and request to solve this problem, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r._id}
              className="glass-card-hover p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Dev Profile Info */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="avatar w-11 h-11 text-base">
                    {r.developer?.name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/developers/${r.developer?._id}`}
                        className="text-base font-bold text-white hover:text-primary-400 truncate"
                      >
                        {r.developer?.name}
                      </Link>
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
                    </div>
                    <span className="text-xs text-accent-400 font-semibold">
                      {r.developer?.reputation || 0} pts • {r.developer?.projectsCompleted || 0} projects completed
                    </span>
                  </div>
                </div>

                {r.message && (
                  <p className="text-xs text-gray-300 italic bg-dark-900/60 p-3 rounded-xl border border-dark-700/60">
                    "{r.message}"
                  </p>
                )}

                {r.developer?.skills && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.developer.skills.map((sk, idx) => (
                      <span key={idx} className="badge badge-neutral text-[10px] py-0 px-2">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                {r.status === "PENDING" && (
                  !selectedProjectHasLeader ? (
                    <>
                      <button
                        onClick={() => handleAccept(r._id)}
                        className="btn-success btn-sm flex items-center gap-1 text-xs"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Accept as Leader</span>
                      </button>
                      <button
                        onClick={() => handleReject(r._id)}
                        className="btn-secondary btn-sm text-red-400 text-xs"
                      >
                        <FiX className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className="badge badge-neutral text-xs py-1 px-3 border border-dark-600"
                      title="Only the designated Team Leader can accept or decline team member requests"
                    >
                      Team Leader Reviews
                    </span>
                  )
                )}
                <Link
                  to={`/developers/${r.developer?._id}`}
                  className="btn-secondary btn-sm text-xs"
                >
                  Full Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeveloperRequests;
