import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiFolder,
  FiSend,
  FiMail,
  FiAward,
  FiArrowRight,
  FiCompass,
  FiUsers,
  FiCheckCircle,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
} from "../../components/ui";

const DeveloperDashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [recruitingProjects, setRecruitingProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projRes, reqRes, invRes, incRes] = await Promise.all([
          api.get("/projects/my-projects"),
          api.get("/requests/my"),
          api.get("/invitations"),
          api.get("/requests/incoming").catch(() => ({ data: { requests: [] } })),
        ]);
        setProjects(projRes.data.projects || []);
        setRequests(reqRes.data.requests || []);
        setInvitations(invRes.data.invitations || []);
        setIncomingRequests(incRes.data.requests || []);
      } catch (err) {
        console.error("Failed to load developer dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingInvitationsCount = invitations.filter((i) => i.status === "PENDING").length;
  const pendingIncomingCount = incomingRequests.filter((r) => r.status === "PENDING").length;

  // Filter projects by active (in-development or pending) vs completed
  const activeProjects = projects.filter((p) => p.status !== "COMPLETED");
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  return (
    <Container className="space-y-8 py-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="DEVELOPER COCKPIT"
        title={`Welcome, ${user?.name || "Developer"}`}
        description="Monitor active workspaces, manage join requests, review client invitations, and track verified reputation points."
        actions={
          <>
            <Button to="/explore" variant="primary" size="sm" icon={FiCompass}>
              Discover Problems
            </Button>
            <Button to="/developer/portfolio" variant="secondary" size="sm" icon={FiAward}>
              My Portfolio
            </Button>
          </>
        }
      />

      {/* Alert banner for Team Leaders with pending join requests */}
      {pendingIncomingCount > 0 && (
        <Card className="border-lime/30 bg-carbon p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-button bg-graphite border border-hairline text-lime flex items-center justify-center shrink-0">
              <FiUsers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {pendingIncomingCount} Developer Join {pendingIncomingCount === 1 ? "Request" : "Requests"} Pending
                </span>
                <Badge variant="lime" size="sm">Action Required</Badge>
              </h3>
              <p className="text-xs text-smoke font-mono">
                Developers have requested to join teams you lead. Review their skills and application message.
              </p>
            </div>
          </div>
          <Button to="/developer/requests" variant="secondary" size="sm" icon={FiArrowRight} iconPosition="right">
            Review Applications
          </Button>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Reputation Score
          </span>
          <div className="text-3xl font-extrabold text-lime font-mono mt-1">
            {user?.reputation || 0} <span className="text-xs text-smoke font-normal">pts</span>
          </div>
          <span className="text-[11px] text-smoke mt-1 block">
            {user?.badges?.length || 0} Badges Earned
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Active Workspaces
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {activeProjects.length}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">In Dev or Pending</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Completed Projects
          </span>
          <div className="text-3xl font-extrabold text-lime font-mono mt-1">
            {completedProjects.length}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">Delivered & Verified</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Sent Requests
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {requests.length}
          </div>
          <Link to="/developer/requests" className="text-[11px] text-lime hover:underline mt-1 block font-mono">
            View Requests →
          </Link>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Invitations Inbox
          </span>
          <div className="text-3xl font-extrabold text-lime font-mono mt-1">
            {pendingInvitationsCount}
          </div>
          <Link to="/developer/invitations" className="text-[11px] text-lime hover:underline mt-1 block font-mono">
            Review Inbox →
          </Link>
        </Card>
      </div>

      {/* 1. Active Projects Grid (In Development or Pending) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiFolder className="text-lime w-4 h-4" />
            My Active Project Workspaces
          </h2>
          <Badge variant="lime" size="sm">
            {activeProjects.length} Active
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-graphite rounded-inputs w-2/3" />
                <div className="h-3 bg-graphite rounded-inputs w-full" />
                <div className="h-3 bg-graphite rounded-inputs w-4/5" />
              </Card>
            ))}
          </div>
        ) : activeProjects.length === 0 ? (
          <Card className="p-10 text-center text-smoke text-sm space-y-3">
            <p>You don't have any in-development or pending project workspaces right now.</p>
            <Button to="/explore" variant="primary" size="sm" icon={FiCompass}>
              Browse Open Challenges
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((p) => {
              const isLeader = p.projectLeader?._id === user?._id || p.projectLeader === user?._id;
              return (
                <Card key={p._id} hoverable className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="lime" size="sm">
                        {p.status.replace("_", " ")}
                      </Badge>
                      {isLeader ? (
                        <Badge variant="lime" size="sm">👑 Project Leader</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Team Member</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-lime transition-colors">
                      <Link to={`/projects/${p._id}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-smoke line-clamp-2 leading-relaxed font-mono">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-smoke font-mono">
                      Provider: <strong className="text-bone">{p.problemProvider?.name}</strong>
                    </span>
                    <Button to={`/projects/${p._id}`} variant="secondary" size="sm" icon={FiArrowRight} iconPosition="right">
                      Open Workspace
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Completed Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-lime w-4 h-4" />
            <h2 className="text-lg font-bold text-white">Completed Projects</h2>
            <Badge variant="success" size="sm">
              {completedProjects.length}
            </Badge>
          </div>
          <Link
            to="/developer/portfolio"
            className="text-xs text-lime hover:underline font-mono flex items-center gap-1"
          >
            Inspect Portfolio Record <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-graphite rounded-inputs w-2/3" />
                <div className="h-3 bg-graphite rounded-inputs w-full" />
                <div className="h-3 bg-graphite rounded-inputs w-4/5" />
              </Card>
            ))}
          </div>
        ) : completedProjects.length === 0 ? (
          <Card className="p-8 text-center text-smoke text-sm space-y-2">
            <p className="font-mono text-xs">
              No completed projects yet. Deliver on your active milestones to build your verified completion record!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedProjects.map((p) => {
              const isLeader = p.projectLeader?._id === user?._id || p.projectLeader === user?._id;
              return (
                <Card
                  key={p._id}
                  hoverable
                  className="p-6 flex flex-col justify-between space-y-4 border-l-2 border-l-lime"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="success" size="sm">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>Completed & Delivered</span>
                      </Badge>
                      {isLeader ? (
                        <Badge variant="lime" size="sm">👑 Project Leader</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Team Member</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-lime transition-colors">
                      <Link to={`/projects/${p._id}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-smoke line-clamp-2 leading-relaxed font-mono">
                      {p.solution?.completionSummary || p.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-smoke font-mono">
                      Provider: <strong className="text-bone">{p.problemProvider?.name}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {(p.solution?.liveUrl || p.liveUrl) && (
                        <Button
                          href={p.solution?.liveUrl || p.liveUrl}
                          target="_blank"
                          variant="ghost"
                          size="sm"
                        >
                          Live Demo
                        </Button>
                      )}
                      <Button
                        to={`/projects/${p._id}`}
                        variant="secondary"
                        size="sm"
                        icon={FiArrowRight}
                        iconPosition="right"
                      >
                        Workspace
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links Row: Requests & Invitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FiSend className="text-lime w-4 h-4" /> Recent Sent Requests
            </h3>
            <Link to="/developer/requests" className="text-xs text-lime hover:underline font-mono">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {requests.slice(0, 3).map((r) => (
              <div
                key={r._id}
                className="p-3 bg-graphite/40 border border-hairline rounded-button flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <Link
                    to={`/projects/${r.project?._id}`}
                    className="font-bold text-white hover:text-lime truncate block"
                  >
                    {r.project?.title || "Problem"}
                  </Link>
                  <span className="text-[10px] text-smoke font-mono">
                    Sent on {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
            ))}
            {requests.length === 0 && (
              <p className="text-xs text-smoke text-center py-4 font-mono">No pending requests sent.</p>
            )}
          </div>
        </Card>

        {/* Incoming Invitations */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FiMail className="text-lime w-4 h-4" /> Incoming Invitations
            </h3>
            <Link to="/developer/invitations" className="text-xs text-lime hover:underline font-mono">
              View Inbox
            </Link>
          </div>

          <div className="space-y-2">
            {invitations.slice(0, 3).map((inv) => (
              <div
                key={inv._id}
                className="p-3 bg-graphite/40 border border-hairline rounded-button flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <Link
                    to={`/projects/${inv.project?._id}`}
                    className="font-bold text-white hover:text-lime truncate block"
                  >
                    {inv.project?.title || "Problem"}
                  </Link>
                  <span className="text-[10px] text-smoke font-mono">
                    From {inv.provider?.name || "Provider"}
                  </span>
                </div>
                <Badge
                  variant={
                    inv.status === "ACCEPTED"
                      ? "success"
                      : inv.status === "REJECTED"
                      ? "danger"
                      : "warning"
                  }
                  size="sm"
                >
                  {inv.status}
                </Badge>
              </div>
            ))}
            {invitations.length === 0 && (
              <p className="text-xs text-smoke text-center py-4 font-mono">No invitations received.</p>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default DeveloperDashboard;
