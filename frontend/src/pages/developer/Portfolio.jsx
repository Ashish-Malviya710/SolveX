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
  FiShield,
  FiUsers,
  FiClock,
  FiDollarSign,
  FiGlobe,
  FiFileText,
  FiPlayCircle,
  FiUser,
  FiChevronRight,
  FiLayers,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const Portfolio = () => {
  const { user } = useContext(AuthContext);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("led"); // "led" | "contributed" | "all"

  useEffect(() => {
    const fetchPortfolioProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        setAllProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to load portfolio projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolioProjects();
  }, []);

  const isUserLeader = (project) => {
    if (!user) return false;
    const userId = user._id?.toString();
    const leaderId = project.projectLeader?._id?.toString() || project.projectLeader?.toString();
    if (leaderId === userId) return true;
    return project.teamMembers?.some(
      (m) => (m.user?._id?.toString() === userId || m.user?.toString() === userId) && m.role === "Leader"
    );
  };

  const ledProjects = allProjects.filter((p) => isUserLeader(p));
  const contributedProjects = allProjects.filter((p) => !isUserLeader(p));

  const displayedProjects =
    activeTab === "led"
      ? ledProjects
      : activeTab === "contributed"
      ? contributedProjects
      : allProjects;

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="badge badge-success text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiCheckCircle className="w-3.5 h-3.5" /> Completed & Delivered
          </span>
        );
      case "IN_DEVELOPMENT":
        return (
          <span className="badge badge-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiCode className="w-3.5 h-3.5" /> In Development
          </span>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <span className="badge badge-warning text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiClock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="badge badge-accent text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiCheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiLayers className="w-3.5 h-3.5" /> {status?.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="page-container max-w-5xl space-y-8 pb-16">
      {/* Portfolio Header Card */}
      <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary-600 via-accent-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-3xl shadow-glow-md flex-shrink-0">
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
                {ledProjects.length > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs py-0.5 px-2.5 flex items-center gap-1 font-semibold">
                    👑 Verified Project Leader
                  </span>
                )}
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
          <Link to={`/developers/${user?._id}`} className="text-xs text-primary-400 hover:underline ml-auto flex items-center gap-1">
            <span>View Public Profile</span>
            <FiExternalLink className="w-3 h-3" />
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
              <div className="text-xs text-gray-400">Total Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400 font-display flex items-center gap-1">
                <span>👑</span>
                <span>{ledProjects.length || user?.projectsLed || 0}</span>
              </div>
              <div className="text-xs text-gray-400">Projects Led</div>
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

      {/* Projects Showcase Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FiShield className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                Projects Portfolio & Leadership Record
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Verified projects delivered as Leader or Contributor on SolveX.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-dark-900/80 border border-dark-700/60 flex-wrap">
            <button
              onClick={() => setActiveTab("led")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "led"
                  ? "bg-amber-500 text-dark-950 font-bold shadow-glow-sm"
                  : "text-gray-300 hover:text-white hover:bg-dark-800"
              }`}
            >
              <span>👑 Projects Led</span>
              <span className="px-1.5 py-0.2 rounded-md bg-dark-950/20 text-[10px]">
                {ledProjects.length}
              </span>
            </button>

            {contributedProjects.length > 0 && (
              <button
                onClick={() => setActiveTab("contributed")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "contributed"
                    ? "bg-primary-600 text-white shadow-glow-sm"
                    : "text-gray-300 hover:text-white hover:bg-dark-800"
                }`}
              >
                <span>👥 Contributions</span>
                <span className="px-1.5 py-0.2 rounded-md bg-dark-950/30 text-[10px]">
                  {contributedProjects.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-dark-700 text-white"
                  : "text-gray-300 hover:text-white hover:bg-dark-800"
              }`}
            >
              <span>All ({allProjects.length})</span>
            </button>
          </div>
        </div>

        {/* Project Cards */}
        {loading ? (
          <div className="glass-card p-8 animate-pulse space-y-3">
            <div className="skeleton-title" />
            <div className="skeleton-text" />
          </div>
        ) : displayedProjects.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-400 text-xs space-y-3">
            <FiFolder className="w-12 h-12 text-dark-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Projects in this View</h3>
            <p className="max-w-md mx-auto">
              {activeTab === "led"
                ? "You haven't led any project teams yet. Apply to lead an open problem on the Explore page!"
                : "No project contributions recorded."}
            </p>
            {activeTab === "led" && (
              <Link to="/explore" className="btn-primary btn-sm inline-block mt-2">
                Explore Problems to Lead
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {displayedProjects.map((project) => {
              const isLeader = isUserLeader(project);
              const leaderMember = project.teamMembers?.find(
                (m) =>
                  (m.user?._id?.toString() === user?._id?.toString() ||
                    m.user?.toString() === user?._id?.toString()) &&
                  m.role === "Leader"
              );

              return (
                <div
                  key={project._id}
                  className={`glass-card p-6 sm:p-8 space-y-6 transition-all hover:border-dark-600/80 relative overflow-hidden ${
                    isLeader ? "border-l-4 border-l-amber-400/90 shadow-glass" : ""
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLeader ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                          <span>👑 Team Leader</span>
                          {leaderMember?.customRole && (
                            <span className="text-amber-200/80 font-normal">
                              • {leaderMember.customRole}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-dark-800 text-gray-300 border border-dark-700 flex items-center gap-1.5">
                          <FiUsers className="w-3.5 h-3.5 text-primary-400" />
                          <span>Team Contributor</span>
                        </span>
                      )}

                      {getStatusBadge(project.status)}

                      {project.category && (
                        <span className="text-xs text-gray-400 bg-dark-900/80 px-2.5 py-0.5 rounded-md border border-dark-700/60">
                          {project.category}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5 text-gray-500" />
                      {project.completionDate ? (
                        <span>
                          Delivered:{" "}
                          <strong className="text-gray-200">
                            {new Date(project.completionDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      ) : (
                        <span>Duration: {project.expectedDuration || "Active milestone"}</span>
                      )}
                    </div>
                  </div>

                  {/* Title & Client Metadata */}
                  <div className="space-y-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-xl sm:text-2xl font-bold text-white hover:text-primary-400 transition font-display flex items-center gap-2 group"
                    >
                      <span>{project.title}</span>
                      <FiChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition" />
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <FiUser className="text-accent-400 w-3.5 h-3.5" />
                        Client / Provider:{" "}
                        <strong className="text-gray-200">
                          {project.problemProvider?.organizationName ||
                            project.problemProvider?.name ||
                            "Verified Client"}
                        </strong>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <FiDollarSign className="text-emerald-400 w-3.5 h-3.5" />
                        Budget:{" "}
                        <strong className="text-gray-200">
                          {project.budgetType === "Volunteer"
                            ? "Volunteer Project"
                            : `${project.currency === "INR" ? "₹" : project.currency || "₹"}${
                                project.budgetAmount?.toLocaleString() || 0
                              } (${project.budgetType || "Fixed"})`}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-dark-900/40 p-4 rounded-2xl border border-dark-700/50">
                    <p>{project.aiSummary || project.description}</p>
                  </div>

                  {/* Verified Solution & Production Deliverables */}
                  {(project.solution?.completionSummary ||
                    project.solution?.liveUrl ||
                    project.liveUrl ||
                    project.solution?.demoVideo) && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-dark-900/60 to-dark-900/40 border border-emerald-500/30 space-y-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Delivered Solution & Deliverables</span>
                      </div>

                      {project.solution?.completionSummary && (
                        <p className="text-xs text-gray-200 leading-relaxed">
                          {project.solution.completionSummary}
                        </p>
                      )}

                      <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                        {(project.solution?.liveUrl || project.liveUrl) && (
                          <a
                            href={project.solution?.liveUrl || project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary btn-xs inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400"
                          >
                            <FiGlobe className="w-3.5 h-3.5" />
                            <span>Live Application / Demo</span>
                            <FiExternalLink className="w-3 h-3 text-emerald-400/70" />
                          </a>
                        )}

                        {project.solution?.demoVideo && (
                          <a
                            href={project.solution.demoVideo}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary btn-xs inline-flex items-center gap-1.5 text-rose-300 hover:text-rose-200"
                          >
                            <FiPlayCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Video Walkthrough</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Impact */}
                  {project.impact &&
                    (project.impact.peopleBenefited || project.impact.organizationsHelped) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-dark-900/50 border border-dark-700/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold text-sm">
                            👥
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white font-display">
                              {project.impact.peopleBenefited?.toLocaleString() || 0}+
                            </div>
                            <div className="text-[11px] text-gray-400">People Benefited</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                            🏢
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white font-display">
                              {project.impact.organizationsHelped || 0}
                            </div>
                            <div className="text-[11px] text-gray-400">Organizations Helped</div>
                          </div>
                        </div>

                        {project.impact.notes && (
                          <div className="sm:col-span-1 text-xs text-gray-300 italic flex items-center">
                            "{project.impact.notes}"
                          </div>
                        )}
                      </div>
                    )}

                  {/* Team Members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-dark-700/50">
                      <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <FiUsers className="w-3.5 h-3.5 text-primary-400" />
                        <span>
                          Engineering Team ({project.teamMembers.length} / {project.maxTeamSize || 5} members)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {project.teamMembers.map((member, mIdx) => {
                          const isMemLeader = member.role === "Leader";
                          return (
                            <div
                              key={mIdx}
                              className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                isMemLeader
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                                  : "bg-dark-900/60 border-dark-700/60 text-gray-300"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isMemLeader
                                    ? "bg-amber-500 text-dark-950"
                                    : "bg-primary-600 text-white"
                                }`}
                              >
                                {member.user?.name ? member.user.name.charAt(0) : "M"}
                              </div>
                              <div className="leading-tight">
                                <p className="font-semibold text-white truncate max-w-[120px]">
                                  {member.user?.name || "Developer"}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {member.customRole || member.role}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer & Link */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-dark-700/60">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
                        <FiCode className="w-3.5 h-3.5" /> Stack:
                      </span>
                      {project.requiredSkills && project.requiredSkills.length > 0 ? (
                        project.requiredSkills.map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="badge badge-primary text-[11px] py-0.5 px-2 bg-dark-900/80 border border-primary-500/20 text-primary-300"
                          >
                            {sk}
                          </span>
                        ))
                      ) : project.preferredTechnologies ? (
                        project.preferredTechnologies.split(",").map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="badge badge-primary text-[11px] py-0.5 px-2 bg-dark-900/80 border border-primary-500/20 text-primary-300"
                          >
                            {tech.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">Full Stack Stack</span>
                      )}
                    </div>

                    <Link
                      to={`/projects/${project._id}`}
                      className="btn-primary btn-xs flex items-center gap-1.5 self-end sm:self-center"
                    >
                      <span>View Project Workspace</span>
                      <FiExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;

