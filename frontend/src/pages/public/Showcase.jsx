import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiExternalLink,
  FiGithub,
  FiUsers,
  FiHeart,
  FiAward,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import api from "../../services/api";

const Showcase = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/showcase?limit=20");
        setProjects(res.data.projects || []);
        setTotalCount(res.data.total || 0);
      } catch (err) {
        console.error("Failed to load showcase:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  return (
    <div className="page-container space-y-10">
      {/* Header */}
      <div className="section-header max-w-3xl">
        <span className="badge badge-success mb-2">Verified Social Solutions</span>
        <h1 className="section-title">Completed Projects Showcase</h1>
        <p className="section-subtitle">
          Explore production software solutions built by SolveX developer teams to address real-world community and NGO challenges.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 space-y-4 animate-pulse">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state glass-card">
          <FiLayers className="empty-state-icon" />
          <h3 className="text-lg font-bold text-white mb-1">Showcase Empty</h3>
          <p className="empty-state-text text-sm">
            Completed projects with verified provider sign-offs will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.map((p) => (
            <div
              key={p._id}
              className="glass-card-hover p-8 flex flex-col justify-between space-y-6"
            >
              {/* Top Meta & Title */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="badge badge-success text-xs py-1 px-3 flex items-center gap-1">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    Verified Completion
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{p.category}</span>
                </div>

                <h3 className="text-xl font-bold font-display text-white hover:text-primary-400 transition">
                  <Link to={`/projects/${p._id}`}>{p.title}</Link>
                </h3>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {p.solution?.completionSummary || p.description}
                </p>

                {/* Impact Highlights Box */}
                {(p.impact?.peopleBenefited > 0 || p.impact?.organizationsHelped > 0 || p.impact?.notes) && (
                  <div className="bg-dark-900/80 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      <FiHeart className="w-3.5 h-3.5" />
                      Reported Social Impact
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {p.impact?.peopleBenefited > 0 && (
                        <div>
                          <div className="text-lg font-bold text-white font-display">
                            {p.impact.peopleBenefited.toLocaleString()}+
                          </div>
                          <div className="text-[11px] text-gray-400">People Benefited</div>
                        </div>
                      )}
                      {p.impact?.organizationsHelped > 0 && (
                        <div>
                          <div className="text-lg font-bold text-white font-display">
                            {p.impact.organizationsHelped}
                          </div>
                          <div className="text-[11px] text-gray-400">Organizations Helped</div>
                        </div>
                      )}
                    </div>
                    {p.impact?.notes && (
                      <p className="text-xs text-gray-400 pt-1 italic">
                        "{p.impact.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Required / Used Skills */}
                {p.requiredSkills && p.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.requiredSkills.map((sk, idx) => (
                      <span key={idx} className="badge badge-neutral text-xs py-0.5 px-2">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Credits & External Links */}
              <div className="pt-6 border-t border-dark-700/60 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Provider: <strong className="text-gray-200">{p.problemProvider?.name || "NGO"}</strong>
                  </span>
                  <span>
                    Leader: <strong className="text-primary-400">{p.projectLeader?.name || "Developer"}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {p.solution?.liveUrl && (
                    <a
                      href={p.solution.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary btn-sm flex-1 flex items-center justify-center gap-2"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      <span>Live Deployed App</span>
                    </a>
                  )}
                  {p.githubRepoUrl && (
                    <a
                      href={p.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm flex-1 flex items-center justify-center gap-2"
                    >
                      <FiGithub className="w-4 h-4" />
                      <span>GitHub Repo</span>
                    </a>
                  )}
                  <Link
                    to={`/projects/${p._id}`}
                    className="btn-secondary btn-sm flex items-center justify-center px-4"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Showcase;
