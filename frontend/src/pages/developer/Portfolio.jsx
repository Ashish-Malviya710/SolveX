import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiAward,
  FiGithub,
  FiLinkedin,
  FiFolder,
  FiExternalLink,
  FiSettings,
  FiCheckCircle,
  FiCode,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const Portfolio = () => {
  const { user } = useContext(AuthContext);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        const completed = (res.data.projects || []).filter((p) => p.status === "COMPLETED");
        setCompletedProjects(completed);
      } catch (err) {
        console.error("Failed to load portfolio projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolioProjects();
  }, []);

  return (
    <div className="page-container max-w-5xl space-y-8">
      {/* Portfolio Header Card */}
      <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary-600 via-accent-500 to-neon-green flex items-center justify-center text-white font-extrabold text-3xl shadow-glow-md flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  {user?.name}
                </h1>
                <span className="badge badge-accent text-xs py-0.5 px-2.5">
                  Verified Developer
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                {user?.bio || "Full stack software engineer contributing to verified social impact solutions."}
              </p>
            </div>
          </div>

          <Link
            to="/settings"
            className="btn-secondary btn-sm flex items-center gap-2 self-end sm:self-center"
          >
            <FiSettings className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Links & Availability */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-dark-700/60 flex-wrap">
          {user?.githubProfile && (
            <a
              href={user.githubProfile}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiGithub className="text-emerald-400" />
              <span>GitHub</span>
            </a>
          )}
          {user?.linkedinOrPortfolio && (
            <a
              href={user.linkedinOrPortfolio}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiLinkedin className="text-primary-400" />
              <span>LinkedIn</span>
            </a>
          )}
          <Link to={`/developers/${user?._id}`} className="text-xs text-primary-400 hover:underline ml-auto">
            View Public Profile →
          </Link>
        </div>
      </div>

      {/* Stats & Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Reputation & Badges */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <span className="input-label text-xs">Platform Reputation</span>
            <div className="text-3xl font-extrabold text-accent-400 font-display mt-1">
              {user?.reputation || 0} <span className="text-xs font-normal text-gray-400">pts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-700/60">
            <div>
              <div className="text-xl font-bold text-white font-display">
                {user?.projectsCompleted || 0}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-400 font-display">
                {user?.projectsLed || 0}
              </div>
              <div className="text-xs text-gray-400">Led to Delivery</div>
            </div>
          </div>

          {/* Badges Box */}
          <div className="pt-4 border-t border-dark-700/60 space-y-3">
            <span className="input-label text-xs flex items-center gap-1 text-amber-300">
              <FiAward className="w-4 h-4" /> Earned Badges
            </span>
            {user?.badges && user.badges.length > 0 ? (
              <div className="flex flex-col gap-2">
                {user.badges.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-700/60 flex items-center gap-2 text-xs text-gray-200"
                  >
                    <span className="text-base">🏆</span>
                    <span className="font-semibold">{b}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Complete projects to unlock badges!</p>
            )}
          </div>
        </div>

        {/* Right: Verified Skills & Experience */}
        <div className="md:col-span-2 glass-card p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Technical Skillset
            </h3>
            {user?.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {user.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="badge badge-primary text-xs py-1 px-3 border border-primary-500/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No skills listed yet. Add skills in Settings.</p>
            )}
          </div>

          {user?.experience && (
            <div className="space-y-2 pt-4 border-t border-dark-700/60">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Engineering Experience
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {user.experience}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Projects Showcase Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FiCheckCircle className="text-emerald-400" />
          Verified Completed Project Contributions
        </h2>

        {loading ? (
          <div className="glass-card p-8 animate-pulse space-y-3">
            <div className="skeleton-title" />
            <div className="skeleton-text" />
          </div>
        ) : completedProjects.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-xs">
            No completed projects on your portfolio yet. As your teams deliver and get approved by problem providers, they will be archived here permanently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedProjects.map((p) => (
              <div key={p._id} className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="badge badge-success text-[10px]">COMPLETED</span>
                  <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                    <Link to={`/projects/${p._id}`}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-3">
                    {p.solution?.completionSummary || p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-dark-700/60 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Leader: <strong className="text-gray-200">{p.projectLeader?.name}</strong>
                  </span>
                  <Link
                    to={`/projects/${p._id}`}
                    className="text-primary-400 font-semibold hover:underline"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
