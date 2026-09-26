import React, { useState, useEffect } from "react";
import { FiCheckSquare, FiCheck, FiX, FiCalendar } from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Textarea,
} from "../../components/ui";

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
      setActionError(
        err.response?.data?.message || "Failed to approve proposal."
      );
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
      await api.post(`/proposals/${proposal._id}/request-changes`, {
        feedback,
      });
      setActionSuccess("Changes requested from Project Leader.");
      setFeedback("");
      const res = await api.get(`/projects/${selectedProjectId}/proposal`);
      setProposal(res.data?.proposal || null);
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to request changes."
      );
    }
  };

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Structure Review"
        title="Review Project Proposals"
        description="Inspect architecture proposals, tech stacks, and milestone roadmaps before approving development start."
      />

      {actionSuccess && (
        <div className="mb-6 p-3.5 bg-lime/10 border border-lime/30 text-lime text-xs font-mono rounded-button flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess("")}
            className="text-smoke hover:text-paper"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-3.5 bg-red-950/30 border border-red-500/40 text-red-300 text-xs font-mono rounded-button flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError("")}
            className="text-smoke hover:text-paper"
          >
            ✕
          </button>
        </div>
      )}

      {/* Project Selector Bar */}
      {projects.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="text-xs font-mono uppercase tracking-wider text-smoke">
              Select Posted Problem:
            </label>
            <div className="w-full sm:w-96">
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.status})
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Card */}
      {!proposal ? (
        <Card className="text-center py-16 px-6">
          <FiCheckSquare className="w-10 h-10 text-iron mx-auto mb-3" />
          <h3 className="text-base font-semibold text-paper mb-1">
            No Proposal Submitted
          </h3>
          <p className="text-xs text-smoke font-mono">
            The assigned Project Leader has not submitted a milestone proposal for this problem yet.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-hairline gap-3">
              <div>
                <h3 className="text-base font-semibold text-paper">
                  Project Execution Plan
                </h3>
                <span className="text-xs text-smoke font-mono">
                  Submitted by Leader:{" "}
                  <strong className="text-lime">{proposal.leader?.name}</strong>
                </span>
              </div>
              <Badge
                variant={
                  proposal.status === "APPROVED"
                    ? "success"
                    : proposal.status === "CHANGES_REQUESTED"
                    ? "danger"
                    : "warning"
                }
                size="md"
              >
                {proposal.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-smoke block mb-1.5">
                  Solution Approach & Architecture
                </span>
                <p className="text-xs text-bone font-mono leading-relaxed bg-void p-4 rounded-button border border-hairline">
                  {proposal.description}
                </p>
              </div>

              {proposal.technologyStack?.length > 0 && (
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-smoke block mb-1.5">
                    Proposed Tech Stack
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.technologyStack.map((t, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-smoke block">
                  Target Milestones & Deadlines
                </span>
                <div className="space-y-2">
                  {proposal.milestones?.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-void border border-hairline rounded-button flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <span className="font-semibold text-paper">{m.title}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        {m.deadline && (
                          <span className="text-smoke text-[11px] flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            {new Date(m.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="neutral" size="sm">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Area */}
            {proposal.status === "SUBMITTED" && (
              <div className="pt-6 border-t border-hairline space-y-4">
                <Textarea
                  label="Requested Revisions / Feedback Note"
                  rows={3}
                  placeholder="If requesting revisions, explain specifically what architecture or milestone changes are required..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprove}
                  >
                    <FiCheck className="w-4 h-4" />
                    <span>Approve & Authorize Development</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRequestChanges}
                  >
                    <FiX className="w-4 h-4" />
                    <span>Request Revisions</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ProposalReview;
