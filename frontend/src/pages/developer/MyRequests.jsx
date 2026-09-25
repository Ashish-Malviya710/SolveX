import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSend,
  FiFolder,
  FiUsers,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiGithub,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
} from "../../components/ui";

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
        api
          .get("/requests/incoming")
          .catch(() => ({ data: { requests: [], projects: [] } })),
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
        text:
          res.data?.message ||
          "Developer join request accepted! Member added to the team.",
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
      await api.put(`/requests/${reqId}/reject`);
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

  const pendingIncomingCount = incomingRequests.filter(
    (r) => r.status === "PENDING"
  ).length;

  return (
    <Container className="py-8 max-w-5xl">
      <PageHeader
        eyebrow="Request Hub"
        title="Developer Requests"
        description="Manage applications you've sent to join projects, and review incoming requests from developers applying to your team."
      />

      {actionMessage.text && (
        <div
          className={`mb-6 p-3.5 rounded-button border text-xs font-mono flex items-center justify-between gap-2 ${
            actionMessage.type === "success"
              ? "bg-lime/10 border-lime/30 text-lime"
              : "bg-red-950/30 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <FiCheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <FiAlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: "", text: "" })}
            className="text-smoke hover:text-paper"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hairline pb-3 mb-6">
        <Button
          variant={activeTab === "sent" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sent")}
        >
          <FiSend className="w-3.5 h-3.5" />
          <span>Sent Applications ({sentRequests.length})</span>
        </Button>

        <Button
          variant={activeTab === "incoming" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("incoming")}
        >
          <FiUsers className="w-3.5 h-3.5" />
          <span>Incoming Team Requests ({incomingRequests.length})</span>
          {pendingIncomingCount > 0 && (
            <Badge variant="lime" size="sm" className="ml-1">
              {pendingIncomingCount} New
            </Badge>
          )}
        </Button>

        <div className="ml-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            title="Refresh requests"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-4 bg-graphite rounded w-1/3 mb-2" />
              <div className="h-3 bg-graphite rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : activeTab === "sent" ? (
        /* TAB 1: SENT APPLICATIONS */
        sentRequests.length === 0 ? (
          <Card className="text-center py-16 px-6">
            <FiSend className="w-10 h-10 text-iron mx-auto mb-3" />
            <h3 className="text-base font-semibold text-paper mb-1">
              No Requests Sent
            </h3>
            <p className="text-xs text-smoke font-mono mb-4">
              You haven't requested to solve any problems yet.
            </p>
            <Button variant="primary" size="sm" to="/explore">
              Browse Open Problems
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((r) => (
              <Card key={r._id} hoverable>
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
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
                      <span className="text-[11px] font-mono text-smoke">
                        Sent on {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-paper hover:text-lime transition">
                      <Link to={`/projects/${r.project?._id}`}>
                        {r.project?.title}
                      </Link>
                    </h3>

                    {r.message && (
                      <p className="text-xs font-mono text-smoke italic line-clamp-2 bg-void p-3 rounded-button border border-hairline">
                        "{r.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      to={`/projects/${r.project?._id}`}
                    >
                      <FiFolder className="w-3.5 h-3.5" />
                      <span>Open Problem</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* TAB 2: INCOMING TEAM REQUESTS */
        incomingRequests.length === 0 ? (
          <Card className="text-center py-16 px-6">
            <FiUsers className="w-10 h-10 text-iron mx-auto mb-3" />
            <h3 className="text-base font-semibold text-paper mb-1">
              No Incoming Team Requests
            </h3>
            <p className="text-xs text-smoke font-mono mb-4">
              {ledProjects.length > 0
                ? "You are designated as the Leader for active projects, but no developers have requested to join yet."
                : "You are not currently leading any projects. When you lead a project, developer join requests will appear here."}
            </p>
            <Button variant="primary" size="sm" to="/explore">
              Explore Active Projects
            </Button>
          </Card>
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
                <Card
                  key={req._id}
                  className={isPending ? "border-lime/40" : ""}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-graphite border border-hairline flex items-center justify-center font-mono font-bold text-lime text-base shrink-0">
                          {dev?.name?.charAt(0)?.toUpperCase() || "D"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/developers/${dev?._id}`}
                              className="text-base font-semibold text-paper hover:text-lime transition"
                            >
                              {dev?.name || "Developer"}
                            </Link>
                            <Badge variant="lime" size="sm">
                              {dev?.reputation || 0} pts
                            </Badge>
                            <Badge
                              variant={
                                req.status === "ACCEPTED"
                                  ? "success"
                                  : req.status === "REJECTED"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {req.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-smoke mt-1 flex-wrap">
                            <span>Applied to:</span>
                            <Link
                              to={`/projects/${project?._id}?tab=team`}
                              className="text-lime hover:underline font-semibold"
                            >
                              {project?.title}
                            </Link>
                            <span>
                              • {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                            {dev?.githubProfile && (
                              <a
                                href={dev.githubProfile}
                                target="_blank"
                                rel="noreferrer"
                                className="text-smoke hover:text-paper flex items-center gap-1 ml-1"
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
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(req._id)}
                            disabled={
                              isFull || actionLoading[req._id] === "accept"
                            }
                            title={
                              isFull
                                ? "Team capacity full."
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
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectRequest(req._id)}
                            disabled={actionLoading[req._id] === "reject"}
                          >
                            <FiX className="w-3.5 h-3.5" />
                            <span>
                              {actionLoading[req._id] === "reject"
                                ? "Declining..."
                                : "Decline"}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {req.message && (
                      <p className="text-xs font-mono text-smoke bg-void p-3 rounded-button border border-hairline italic">
                        "{req.message}"
                      </p>
                    )}

                    {dev?.skills && dev.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dev.skills.map((skill, idx) => (
                          <Badge key={idx} variant="neutral" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </Container>
  );
};

export default MyRequests;
