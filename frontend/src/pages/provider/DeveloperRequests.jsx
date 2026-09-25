import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiCheck, FiX, FiInfo } from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Select,
} from "../../components/ui";

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
      setActionSuccess(
        acceptRes.data?.message || "Developer request accepted successfully!"
      );
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
    <Container className="py-8">
      <PageHeader
        eyebrow="Applicant Management"
        title="Developer Applications"
        description="Review developers who have applied to lead and build solutions for your posted challenges."
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
              Select Posted Challenge:
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

      {selectedProjectHasLeader && (
        <div className="mb-6 p-3.5 bg-graphite/60 border border-hairline rounded-button text-xs text-smoke font-mono flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiInfo className="w-4 h-4 text-lime shrink-0" />
            <span>
              Designated Team Leader:{" "}
              <strong className="text-paper">
                {selectedProject.projectLeader?.name || "Assigned"}
              </strong>
              . Only the Team Leader reviews and accepts further team member requests.
            </span>
          </div>
          <Link
            to={`/projects/${selectedProjectId}?tab=team`}
            className="text-lime hover:underline shrink-0"
          >
            Inspect Project Team →
          </Link>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-4 bg-graphite rounded w-1/3 mb-2" />
              <div className="h-3 bg-graphite rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-16 px-6">
          <FiUsers className="w-10 h-10 text-iron mx-auto mb-3" />
          <h3 className="text-base font-semibold text-paper mb-1">
            No Applications Yet
          </h3>
          <p className="text-xs text-smoke font-mono">
            When developers discover and submit applications for this problem, they will be listed here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r._id} hoverable>
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Dev Profile Info */}
                <div className="space-y-3 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-graphite border border-hairline flex items-center justify-center font-mono font-bold text-lime text-base shrink-0">
                      {r.developer?.name?.charAt(0)?.toUpperCase() || "D"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/developers/${r.developer?._id}`}
                          className="text-base font-semibold text-paper hover:text-lime transition truncate"
                        >
                          {r.developer?.name}
                        </Link>
                        <Badge
                          variant={
                            r.status === "ACCEPTED"
                              ? "success"
                              : r.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <span className="text-xs font-mono text-smoke">
                        <span className="text-lime font-bold">
                          {r.developer?.reputation || 0} pts
                        </span>{" "}
                        • {r.developer?.projectsCompleted || 0} projects completed
                      </span>
                    </div>
                  </div>

                  {r.message && (
                    <p className="text-xs font-mono text-smoke bg-void p-3 rounded-button border border-hairline">
                      "{r.message}"
                    </p>
                  )}

                  {r.developer?.skills && r.developer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.developer.skills.map((sk, idx) => (
                        <Badge key={idx} variant="neutral" size="sm">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {r.status === "PENDING" &&
                    (!selectedProjectHasLeader ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAccept(r._id)}
                        >
                          <FiCheck className="w-4 h-4" />
                          <span>Accept as Leader</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(r._id)}
                        >
                          <FiX className="w-4 h-4" />
                          <span>Decline</span>
                        </Button>
                      </>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Team Leader Reviews
                      </Badge>
                    ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    to={`/developers/${r.developer?._id}`}
                  >
                    Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default DeveloperRequests;
