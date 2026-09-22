import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiAward, FiSearch, FiCheckCircle, FiGithub, FiExternalLink, FiUser } from "react-icons/fi";
import api from "../../services/api";

const DeveloperShowcase = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = search
        ? `/developers/search?search=${encodeURIComponent(search)}&page=${page}&limit=15`
        : `/developers/top-performers?page=${page}&limit=15`;
      const res = await api.get(endpoint);
      setDevelopers(res.data.developers || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error("Failed to fetch top performers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-dark-950 font-black text-sm shadow-[0_0_15px_rgba(251,191,36,0.5)]">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-300 to-gray-500 flex items-center justify-center text-dark-950 font-black text-sm shadow-[0_0_15px_rgba(209,213,219,0.3)]">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-yellow-900 flex items-center justify-center text-white font-black text-sm">
          3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center text-gray-400 font-bold text-xs">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="section-header">
        <span className="badge badge-accent mb-2">Platform Leaderboard</span>
        <h1 className="section-title">Top Performing Developers</h1>
        <p className="section-subtitle">
          Ranked purely by verified completed solutions, leadership milestones, and community reputation points.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search developers by name, skills (e.g. React, Node.js, Python)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse flex items-center gap-4">
              <div className="skeleton-avatar" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
              </div>
            </div>
          ))}
        </div>
      ) : developers.length === 0 ? (
        <div className="empty-state glass-card">
          <FiAward className="empty-state-icon" />
          <h3 className="text-lg font-bold text-white mb-1">No Developers Found</h3>
          <p className="empty-state-text text-sm">Try searching for other skills or keywords.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {developers.map((dev, idx) => (
            <div
              key={dev._id}
              className="glass-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Side: Rank + Avatar + Name & Bio */}
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="flex-shrink-0 pt-0.5 sm:pt-0">
                  {getRankBadge(idx + (page - 1) * 15)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/developers/${dev._id}`}
                      className="text-base font-bold text-white hover:text-primary-400 transition truncate"
                    >
                      {dev.name}
                    </Link>
                    {dev.availability && (
                      <span className="badge badge-success text-[10px] py-0.5 px-2">
                        Available
                      </span>
                    )}
                  </div>

                  {dev.bio && (
                    <p className="text-xs text-gray-400 line-clamp-1 max-w-xl">
                      {dev.bio}
                    </p>
                  )}

                  {/* Skills preview */}
                  {dev.skills && dev.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dev.skills.slice(0, 5).map((sk, sIdx) => (
                        <span key={sIdx} className="badge badge-neutral text-[10px] py-0 px-1.5">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Stats & Badges */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-dark-700/60 flex-shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-extrabold text-accent-400 font-display">
                    {dev.reputation || 0}{" "}
                    <span className="text-xs font-normal text-gray-400">pts</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {dev.projectsCompleted || 0} completed • {dev.projectsLed || 0} led
                  </div>
                </div>

                {/* Badges preview */}
                {dev.badges && dev.badges.length > 0 && (
                  <div className="hidden lg:flex items-center gap-1">
                    {dev.badges.map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className="badge badge-primary text-[10px] py-0.5 px-2 whitespace-nowrap"
                        title={b}
                      >
                        🏆 {b}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  to={`/developers/${dev._id}`}
                  className="btn-secondary btn-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FiUser className="w-3.5 h-3.5" />
                  <span>Profile</span>
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

export default DeveloperShowcase;
