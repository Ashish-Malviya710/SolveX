import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiArrowRight,
  FiTag,
} from "react-icons/fi";
import api from "../../services/api";

const ExploreProblems = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [budgetType, setBudgetType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (skill) params.append("skill", skill);
      if (budgetType) params.append("budgetType", budgetType);
      if (status) params.append("status", status);
      params.append("page", page);
      params.append("limit", 12);

      const res = await api.get(`/projects?${params.toString()}`);
      setProjects(res.data.projects || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, skill, budgetType, status, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "OPEN":
        return <span className="badge badge-success">OPEN FOR REQUESTS</span>;
      case "LEADER_SELECTED":
      case "TEAM_FORMING":
        return <span className="badge badge-warning">TEAM FORMING</span>;
      case "IN_DEVELOPMENT":
        return <span className="badge badge-primary">IN DEVELOPMENT</span>;
      case "COMPLETED":
        return <span className="badge badge-accent">COMPLETED</span>;
      default:
        return <span className="badge badge-neutral">{st}</span>;
    }
  };

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="section-header">
        <span className="badge badge-primary mb-2">Problem Directory</span>
        <h1 className="section-title">Discover Real-World Problems</h1>
        <p className="section-subtitle">
          Browse vetted community and non-profit challenges ready for software solutions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search problems by title, keywords, or requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <FiSearch className="w-4 h-4" /> Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-dark-700/60">
          <div>
            <label className="input-label text-xs">Category</label>
            <input
              type="text"
              placeholder="e.g. Healthcare, Food..."
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="input-field py-2 text-xs"
            />
          </div>

          <div>
            <label className="input-label text-xs">Skill</label>
            <input
              type="text"
              placeholder="e.g. React, Node.js..."
              value={skill}
              onChange={(e) => {
                setSkill(e.target.value);
                setPage(1);
              }}
              className="input-field py-2 text-xs"
            />
          </div>

          <div>
            <label className="input-label text-xs">Budget Type</label>
            <select
              value={budgetType}
              onChange={(e) => {
                setBudgetType(e.target.value);
                setPage(1);
              }}
              className="select-field py-2 text-xs"
            >
              <option value="">All Budgets</option>
              <option value="Fixed">Fixed Budget</option>
              <option value="Negotiable">Negotiable</option>
              <option value="Volunteer">Volunteer / Free</option>
            </select>
          </div>

          <div>
            <label className="input-label text-xs">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="select-field py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open (Accepting)</option>
              <option value="TEAM_FORMING">Team Forming</option>
              <option value="IN_DEVELOPMENT">In Development</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Showing {projects.length} of {totalCount} problems</span>
        {(search || category || skill || budgetType || status !== "OPEN") && (
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setSkill("");
              setBudgetType("");
              setStatus("OPEN");
              setPage(1);
            }}
            className="text-primary-400 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 space-y-4 animate-pulse">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
              <div className="skeleton-text" />
              <div className="skeleton-avatar" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state glass-card">
          <FiFilter className="empty-state-icon" />
          <h3 className="text-lg font-bold text-white mb-1">No Problems Found</h3>
          <p className="empty-state-text text-sm">
            Try adjusting your search criteria or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="glass-card-hover p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(p.status)}
                  {p.category && (
                    <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                      {p.category}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white hover:text-primary-400 transition leading-snug">
                  <Link to={`/projects/${p._id}`}>{p.title}</Link>
                </h3>

                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {/* Required Skills Chips */}
                {p.requiredSkills && p.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.requiredSkills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="badge badge-neutral text-[10px] py-0.5 px-2">
                        {sk}
                      </span>
                    ))}
                    {p.requiredSkills.length > 4 && (
                      <span className="text-[10px] text-gray-500 self-center">
                        +{p.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Meta & Actions */}
              <div className="pt-4 border-t border-dark-700/60 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <FiDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {p.budgetType === "Volunteer"
                        ? "Volunteer"
                        : `${p.currency || "INR"} ${p.budgetAmount?.toLocaleString() || "Negotiable"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 justify-end">
                    <FiUsers className="w-3.5 h-3.5 text-primary-400" />
                    <span>
                      {p.teamMembers?.length || 0}/{p.maxTeamSize || 5} Team
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>
                    {p.projectLeader ? (
                      <span className="text-accent-400 font-semibold">
                        👑 Leader: {p.projectLeader.name}
                      </span>
                    ) : (
                      <span>Provider: {p.problemProvider?.name || "Community"}</span>
                    )}
                  </span>
                  {p.deadline && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <FiCalendar className="w-3 h-3" />
                      {new Date(p.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <Link
                  to={`/projects/${p._id}`}
                  className="btn-primary btn-sm w-full text-center flex items-center justify-center gap-1.5"
                >
                  <span>View Details</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreProblems;
