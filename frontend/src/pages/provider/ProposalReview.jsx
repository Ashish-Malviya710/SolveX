import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiCheckSquare, FiCheck, FiX, FiFolder, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";

const ProposalReview = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        const list = res.data.projects || [];
        setProjects(list);
        if (list.length > 0) setSelectedProjectId(list[0]._id);
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
      const fetchProposal = async () => {
        try {
          const res = await api.get(`/projects/${selectedProjectId}/proposal`);
          setProposal(res.data?.proposal || null);
        } catch (err) {
          setProposal(null);
        }
      };
      fetchProposal();
    }
  }, [selectedProjectId]);

  const handleApprove = async () => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.post(`/proposals/${proposal._id}/approve`);
      setActionSuccess("Proposal approved! Development officially begins.");
      const res = await api.get(`/projects/${selectedProjectId}/proposal`);
      setProposal(res.data?.proposal || null);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to approve proposal.");
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      setActionError("Please provide specific feedback for requested changes.");
      return;
    }
    setActionError("");
    setActionSuccess("");
    try {
      await api.post(`/proposals/${proposal._id}/request-changes`, { feedback });
      setActionSuccess("Changes requested from Project Leader.");
      setFeedback("");
      const res = await api.get(`/projects/${selectedProjectId}/proposal`);
      setProposal(res.data?.proposal || null);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to request changes.");
    }
  };

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="section-header">
        <span className="badge badge-accent mb-2">Structure Review</span>
        <h1 className="section-title">Review Project Proposals</h1>
        <p className="section-subtitle">
          Inspect architecture proposals, tech stacks, and milestone roadmaps before approving development start.
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
          <label className="text-xs font-semibold text-gray-300">Select Posted Project:</label>
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

      {/* Proposal Card */}
      {!proposal ? (
        <div className="empty-state glass-card p-12">
          <FiCheckSquare className="empty-state-icon" />
          <h3 className="text-base font-bold text-white mb-1">No Proposal Submitted</h3>
          <p className="empty-state-text text-xs">
            The selected Project Leader has not submitted a milestone proposal for this problem yet.
          </p>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-dark-700/60">
            <div>
              <h3 className="text-base font-bold text-white">Project Proposal</h3>
              <span className="text-xs text-gray-400">
                Submitted by Leader <strong className="text-primary-400">{proposal.leader?.name}</strong>
              </span>
            </div>
            <span
              className={`badge text-xs ${
                proposal.status === "APPROVED"
                  ? "badge-success"
                  : proposal.status === "CHANGES_REQUESTED"
                  ? "badge-danger"
                  : "badge-primary"
              }`}
            >
              {proposal.status}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Solution Approach
              </span>
              <p className="text-gray-200 leading-relaxed bg-dark-900/60 p-4 rounded-xl border border-dark-700">
                {proposal.description}
              </p>
            </div>

            {proposal.technologyStack?.length > 0 && (
              <div>
                <span className="font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Proposed Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {proposal.technologyStack.map((t, idx) => (
                    <span key={idx} className="badge badge-neutral py-0.5 px-2">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <div className="space-y-2 pt-2">
              <span className="font-semibold text-gray-400 uppercase tracking-wider block">
                Target Milestones & Deadlines
              </span>
              <div className="space-y-2">
                {proposal.milestones?.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-dark-900/80 border border-dark-700 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-bold text-white">{m.title}</span>
                    <div className="flex items-center gap-3">
                      {m.deadline && (
                        <span className="text-gray-400 text-[11px]">
                          {new Date(m.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="badge badge-primary text-[10px]">{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Area */}
          {proposal.status === "SUBMITTED" && (
            <div className="pt-6 border-t border-dark-700/60 space-y-4">
              <div>
                <label className="input-label text-xs">Requested Revisions / Feedback Note</label>
                <textarea
                  rows={2}
                  placeholder="If requesting changes, explain what needs adjustment..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="textarea-field text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleApprove} className="btn-success btn-sm flex items-center gap-1.5">
                  <FiCheck className="w-4 h-4" />
                  <span>Approve & Authorize Development</span>
                </button>
                <button
                  onClick={handleRequestChanges}
                  className="btn-secondary btn-sm text-red-400 flex items-center gap-1.5"
                >
                  <FiX className="w-4 h-4" />
                  <span>Request Revisions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalReview;
