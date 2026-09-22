import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiPlusCircle,
  FiFolder,
  FiUsers,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiSend,
  FiSearch,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const ProviderDashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to load provider projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProviderProjects();
  }, []);

  const openCount = projects.filter((p) => p.status === "OPEN").length;
  const inDevCount = projects.filter((p) => p.status === "IN_DEVELOPMENT").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge badge-accent mb-1">Provider Headquarters</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Create real-world problem challenges, review applicant developers, and oversee solution delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/provider/create" className="btn-primary btn-sm flex items-center gap-1.5 shadow-glow-sm">
            <FiPlusCircle className="w-4 h-4" />
            <span>Post New Problem</span>
          </Link>
          <Link to="/provider/find" className="btn-secondary btn-sm flex items-center gap-1.5">
            <FiSearch className="w-4 h-4 text-emerald-400" />
            <span>Find Developers</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Total Challenges</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {projects.length}
          </div>
          <span className="text-[10px] text-gray-500 block">Created</span>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Open For Requests</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary-400 font-display">
            {openCount}
          </div>
          <span className="text-[10px] text-gray-500 block">Accepting Devs</span>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">In Development</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-display">
            {inDevCount}
          </div>
          <span className="text-[10px] text-gray-500 block">Active Build Phase</span>
        </div>

        <div className="glass-card p-5 space-y-1">
          <span className="text-xs font-semibold text-gray-400">Completed Solutions</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">
            {completedCount}
          </div>
          <span className="text-[10px] text-gray-500 block">Delivered & Signed Off</span>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiFolder className="text-accent-400" />
            My Posted Problems & Projects
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
          <div className="glass-card p-12 text-center text-gray-400 text-xs sm:text-sm space-y-4">
            <p>You haven't posted any real-world problems yet.</p>
            <Link to="/provider/create" className="btn-primary btn-sm inline-flex items-center gap-1.5">
              <FiPlusCircle className="w-4 h-4" /> Create Your First Problem
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => (
              <div key={p._id} className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`badge text-[10px] ${
                        p.status === "COMPLETED"
                          ? "badge-success"
                          : p.status === "IN_DEVELOPMENT"
                          ? "badge-primary"
                          : p.status === "OPEN"
                          ? "badge-accent"
                          : "badge-neutral"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-gray-400">{p.category}</span>
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
                    Leader:{" "}
                    <strong className="text-white">
                      {p.projectLeader?.name || "Not assigned yet"}
                    </strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/provider/requests`}
                      className="text-accent-400 hover:underline text-xs"
                    >
                      Applicant Requests
                    </Link>
                    <Link
                      to={`/projects/${p._id}`}
                      className="text-primary-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Workspace <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
