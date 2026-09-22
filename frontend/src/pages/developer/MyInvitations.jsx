import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiCheck, FiX, FiFolder, FiCheckCircle } from "react-icons/fi";
import api from "../../services/api";

const MyInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/invitations");
      setInvitations(res.data.invitations || []);
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (id) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/invitations/${id}/accept`);
      setActionSuccess("Invitation accepted! You have joined the project team.");
      fetchInvitations();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to accept invitation.");
    }
  };

  const handleReject = async (id) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/invitations/${id}/reject`);
      setActionSuccess("Invitation declined.");
      fetchInvitations();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to decline invitation.");
    }
  };

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="section-header">
        <span className="badge badge-accent mb-2">Direct Invitations</span>
        <h1 className="section-title">Received Project Invitations</h1>
        <p className="section-subtitle">
          Review problem providers who have invited you directly to lead or contribute to their challenge.
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-2">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <div className="empty-state glass-card p-12">
          <FiMail className="empty-state-icon" />
          <h3 className="text-base font-bold text-white mb-1">No Invitations Yet</h3>
          <p className="empty-state-text text-xs">
            When problem providers discover your profile, direct invitations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div
              key={inv._id}
              className="glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge text-[10px] ${
                      inv.status === "ACCEPTED"
                        ? "badge-success"
                        : inv.status === "REJECTED"
                        ? "badge-danger"
                        : "badge-warning"
                    }`}
                  >
                    {inv.status}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Invited by <strong className="text-gray-200">{inv.provider?.name || "Provider"}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                  <Link to={`/projects/${inv.project?._id}`}>{inv.project?.title}</Link>
                </h3>

                {inv.message && (
                  <p className="text-xs text-gray-300 italic line-clamp-2">
                    "{inv.message}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {inv.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => handleAccept(inv._id)}
                      className="btn-success btn-sm flex items-center gap-1 text-xs"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv._id)}
                      className="btn-secondary btn-sm text-red-400 text-xs"
                    >
                      <FiX className="w-3.5 h-3.5" /> Decline
                    </button>
                  </>
                ) : (
                  <Link
                    to={`/projects/${inv.project?._id}`}
                    className="btn-secondary btn-sm flex items-center gap-1 text-xs"
                  >
                    <FiFolder className="w-3.5 h-3.5" /> Open Project
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInvitations;
