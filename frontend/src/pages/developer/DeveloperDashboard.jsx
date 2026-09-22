import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiFolder,
  FiSend,
  FiMail,
  FiAward,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCompass,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const DeveloperDashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [recruitingProjects, setRecruitingProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projRes, reqRes, invRes, openRes] = await Promise.all([
          api.get("/projects/my-projects"),
          api.get("/requests/my"),
          api.get("/invitations"),
          api.get("/projects?limit=4"),
        ]);
        setProjects(projRes.data.projects || []);
        setRequests(reqRes.data.requests || []);
        setInvitations(invRes.data.invitations || []);
        setRecruitingProjects(openRes.data.projects || []);
      } catch (err) {
        console.error("Failed to load developer dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingInvitationsCount = invitations.filter((i) => i.status === "PENDING").length;

  return (
    <div className="page-container space-y-8">
      {/* Welcome & Stats Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge badge-primary mb-1">Developer Cockpit</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Track your active project teams, requests, incoming invitations, and reputation points.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explore" className="btn-primary btn-sm flex items-center gap-1.5">
            <FiCompass className="w-4 h-4" />
            <span>Discover Problems</span>
          </Link>
          <Link to="/developer/portfolio" className="btn-secondary btn-sm flex items-center gap-1.5">
            <FiAward className="w-4 h-4 text-accent-400" />
            <span>My Portfolio</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Reputation Score</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-accent-400 font-display">
            {user?.reputation || 0} <span className="text-xs font-normal text-gray-400">pts</span>
          </div>
          <span className="text-[10px] text-gray-500 block">
            {user?.badges?.length || 0} Badges Earned
          </span>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Active Workspaces</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary-400 font-display">
            {projects.length}
          </div>
          <span className="text-[10px] text-gray-500 block">Led or Joined</span>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Sent Requests</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {requests.length}
          </div>
          <Link to="/developer/requests" className="text-[10px] text-primary-400 hover:underline block">
            View Requests →
          </Link>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Invitations Inbox</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">
            {pendingInvitationsCount}
          </div>
          <Link to="/developer/invitations" className="text-[10px] text-emerald-400 hover:underline block">
            Review Invitations →
          </Link>
        </div>
      </div>

      {/* Active Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiFolder className="text-primary-400" />
            My Active Project Workspaces
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 space-y-3 animate-pulse">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-xs sm:text-sm space-y-3">
            <p>You haven't joined or led any active project workspaces yet.</p>
            <Link to="/explore" className="btn-primary btn-sm inline-flex items-center gap-1.5">
              <FiCompass className="w-4 h-4" /> Browse Open Challenges
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => {
              const isLeader = p.projectLeader?._id === user?._id;
              return (
                <div key={p._id} className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-primary text-[10px]">
                        {p.status.replace("_", " ")}
                      </span>
                      {isLeader ? (
                        <span className="badge badge-accent text-[10px]">👑 Project Leader</span>
                      ) : (
                        <span className="badge badge-neutral text-[10px]">Team Member</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                      <Link to={`/projects/${p._id}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-dark-700/60 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Provider: <strong className="text-gray-300">{p.problemProvider?.name}</strong>
                    </span>
                    <Link
                      to={`/projects/${p._id}`}
                      className="text-primary-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Open Workspace <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discover & Join Opportunities */}
      {recruitingProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiCompass className="text-accent-400" />
                Opportunities to Join & Lead
              </h2>
              <p className="text-xs text-gray-400">
                Active problems recruiting developers and forming project teams.
              </p>
            </div>
            <Link to="/explore" className="text-xs text-accent-400 hover:underline flex items-center gap-1">
              Explore All <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recruitingProjects.slice(0, 4).map((p) => {
              const hasLeader = !!p.projectLeader;
              const isJoined = projects.some((myP) => myP._id === p._id);
              return (
                <div key={p._id} className="p-4 bg-dark-900/70 border border-dark-700/70 rounded-2xl flex flex-col justify-between space-y-3 hover:border-dark-600 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-primary text-[10px]">
                        {p.status.replace("_", " ")}
                      </span>
                      {hasLeader ? (
                        <span className="text-[11px] text-accent-400 font-medium">
                          👑 Leader: {p.projectLeader?.name}
                        </span>
                      ) : (
                        <span className="badge badge-success text-[10px]">Needs Leader</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      <Link to={`/projects/${p._id}`} className="hover:text-primary-400 transition">
                        {p.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-dark-800 flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-[11px]">
                      {p.teamMembers?.length || 0}/{p.maxTeamSize || 5} Team
                    </span>
                    <Link
                      to={`/projects/${p._id}`}
                      className="btn-secondary btn-sm text-xs py-1 px-3"
                    >
                      {isJoined ? "Open Workspace" : hasLeader ? "Request to Join" : "Apply to Lead"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links Row: Requests & Invitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dark-700/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FiSend className="text-primary-400" /> Recent Sent Requests
            </h3>
            <Link to="/developer/requests" className="text-xs text-primary-400 hover:underline">
              View All
            </Link>
          </div>

          {requests.slice(0, 3).map((r) => (
            <div
              key={r._id}
              className="p-3 bg-dark-900/60 border border-dark-700/60 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <Link
                  to={`/projects/${r.project?._id}`}
                  className="font-bold text-white hover:text-primary-400 truncate block"
                >
                  {r.project?.title || "Problem"}
                </Link>
                <span className="text-[10px] text-gray-400">
                  Sent on {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
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
          ))}
          {requests.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No pending requests sent.</p>
          )}
        </div>

        {/* Incoming Invitations */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dark-700/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FiMail className="text-emerald-400" /> Incoming Invitations
            </h3>
            <Link to="/developer/invitations" className="text-xs text-emerald-400 hover:underline">
              View Inbox
            </Link>
          </div>

          {invitations.slice(0, 3).map((inv) => (
            <div
              key={inv._id}
              className="p-3 bg-dark-900/60 border border-dark-700/60 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <Link
                  to={`/projects/${inv.project?._id}`}
                  className="font-bold text-white hover:text-primary-400 truncate block"
                >
                  {inv.project?.title || "Problem"}
                </Link>
                <span className="text-[10px] text-gray-400">
                  From {inv.provider?.name || "Provider"}
                </span>
              </div>
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
            </div>
          ))}
          {invitations.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No invitations received.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
