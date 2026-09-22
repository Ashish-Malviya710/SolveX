import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCpu,
  FiUsers,
  FiCheckCircle,
  FiAward,
  FiCode,
  FiHeart,
  FiShield,
  FiLayers,
} from "react-icons/fi";
import api from "../../services/api";

const LandingPage = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [topDevelopers, setTopDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [showcaseRes, devRes] = await Promise.all([
          api.get("/projects/showcase?limit=3"),
          api.get("/developers/top-performers?limit=3"),
        ]);
        setFeaturedProjects(showcaseRes.data.projects || []);
        setTopDevelopers(devRes.data.developers || []);
      } catch (err) {
        console.error("Failed to load landing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-600/20 via-accent-500/20 to-neon-green/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-800/80 border border-primary-500/30 text-xs font-semibold text-primary-300 shadow-glow-sm animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-neon-green animate-ping" />
            Next-Gen AI-Powered Social Dev Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.1] animate-slide-up">
            Connect Real Problems with{" "}
            <span className="text-gradient">Developers Who Can Solve Them</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-300 font-normal leading-relaxed animate-slide-up">
            SolveX turns community, NGO, and grassroots challenges into structured technical requirements with Groq AI, manages team formation, and coordinates delivery without replacing GitHub.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-scale-in">
            <Link to="/explore" className="btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2">
              <span>Explore Open Problems</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="btn-secondary btn-lg w-full sm:w-auto">
              Join as Developer / Provider
            </Link>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
            <div className="glass-card p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold font-display text-white">100%</span>
              <p className="text-xs text-gray-400 mt-1">Free-for-Good Platform</p>
            </div>
            <div className="glass-card p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold font-display text-primary-400">Groq AI</span>
              <p className="text-xs text-gray-400 mt-1">Instant Scope Engine</p>
            </div>
            <div className="glass-card p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold font-display text-accent-400">Socket.io</span>
              <p className="text-xs text-gray-400 mt-1">3-Channel Realtime Chat</p>
            </div>
            <div className="glass-card p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold font-display text-emerald-400">Verified</span>
              <p className="text-xs text-gray-400 mt-1">Developer Badges & Rep</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS LIFECYCLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="badge badge-primary">Structured Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            From Real Problem to Verified Solution
          </h2>
          <p className="text-gray-400 text-sm">
            SolveX guides projects through an orderly lifecycle ensuring accountability and clear communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="glass-card-hover p-8 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/40 text-primary-400 flex items-center justify-center font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-bold text-white">AI Problem Breakdown</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              NGOs and providers describe challenges in plain words. Groq AI extracts functional requirements, recommended tech stacks, and estimated complexity automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card-hover p-8 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-accent-600/20 border border-accent-500/40 text-accent-400 flex items-center justify-center font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Leader & Team Formation</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Developers apply or receive invitations. The first selected developer becomes Project Leader, recruits up to the hard team cap, and submits the milestone proposal.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card-hover p-8 space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-bold text-white">GitHub Build & Review</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Code is built on GitHub with live stat tracking. On delivery, the Problem Provider inspects the live deployment, approves the solution, and awards reputation.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED COMPLETED SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="badge badge-success mb-2">Proven Impact</span>
            <h2 className="text-3xl font-bold font-display text-white">
              Featured Completed Solutions
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Real-world software built by SolveX teams actively serving communities.
            </p>
          </div>
          <Link to="/showcase" className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center gap-1">
            View All Showcase <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 space-y-4 animate-pulse">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
                <div className="skeleton-text" />
              </div>
            ))}
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-sm">
            Completed solutions will be highlighted here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((p) => (
              <div key={p._id} className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-success text-[10px]">COMPLETED</span>
                    <span className="text-[11px] text-gray-400">{p.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                    <Link to={`/projects/${p._id}`}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-dark-700/60 space-y-3">
                  {p.impact?.peopleBenefited > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">People Benefited:</span>
                      <span className="font-bold text-emerald-400">
                        {p.impact.peopleBenefited.toLocaleString()}+
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Project Leader:</span>
                    <span className="font-medium text-white">{p.projectLeader?.name || "Anonymous"}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link to={`/projects/${p._id}`} className="btn-secondary btn-sm w-full text-center">
                      View Story
                    </Link>
                    {p.solution?.liveUrl && (
                      <a
                        href={p.solution.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary btn-sm w-full text-center"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TOP PERFORMERS LEADERBOARD PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 border-primary-500/20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <span className="badge badge-accent">Hall of Fame</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Top Performing Developers
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Ranked by verified milestone completion points and leadership history.
              </p>
            </div>
            <Link to="/developers" className="btn-secondary btn-sm flex items-center gap-2">
              <FiAward className="w-4 h-4 text-accent-400" />
              <span>Full Leaderboard</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topDevelopers.map((dev, idx) => (
              <div key={dev._id} className="bg-dark-900/70 border border-dark-700/80 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                  #{idx + 1}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate hover:text-primary-400">
                    <Link to={`/developers/${dev._id}`}>{dev.name}</Link>
                  </h4>
                  <p className="text-xs text-accent-400 font-semibold">{dev.reputation || 0} Points</p>
                  <p className="text-[11px] text-gray-400">
                    {dev.projectsCompleted || 0} completed • {dev.projectsLed || 0} led
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="glass-card p-10 sm:p-16 border-primary-500/30 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-accent-500/10 to-transparent pointer-events-none -z-10" />
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
            Ready to Build High-Impact Software?
          </h2>
          <p className="max-w-xl mx-auto text-sm text-gray-300">
            Join SolveX today as a developer to boost your verified portfolio, or as an NGO/community to turn your problem into a working system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="btn-primary btn-lg w-full sm:w-auto">
              Create Your Account
            </Link>
            <Link to="/explore" className="btn-secondary btn-lg w-full sm:w-auto">
              Browse Problems
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
