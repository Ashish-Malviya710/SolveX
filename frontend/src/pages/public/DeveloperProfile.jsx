import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiAward,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiSend,
  FiFolder,
  FiExternalLink,
  FiUser,
  FiCode,
  FiDollarSign,
  FiUsers,
  FiLayers,
  FiClock,
  FiFileText,
  FiPlayCircle,
  FiStar,
  FiEye,
  FiShield,
  FiGlobe,
  FiActivity,
  FiInfo,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const DeveloperProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [developer, setDeveloper] = useState(null);
  const [ledProjects, setLedProjects] = useState([]);
  const [contributedProjects, setContributedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("led"); // "led" | "contributed" | "all"
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSpecsProject, setSelectedSpecsProject] = useState(null);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [myProblems, setMyProblems] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/developers/${id}`);
        setDeveloper(res.data.developer || null);
        setLedProjects(res.data.ledProjects || []);
        setContributedProjects(res.data.contributedProjects || []);
      } catch (err) {
        console.error("Failed to load developer profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleOpenInviteModal = async () => {
    setInviteModalOpen(true);
    setInviteSuccess(false);
    setInviteError("");
    try {
      const res = await api.get("/projects/my-projects");
      const activeProblems = (res.data.projects || []).filter(
        (p) =>
          ["OPEN", "LEADER_SELECTED", "TEAM_FORMING", "PROPOSAL_PENDING", "CHANGES_REQUESTED", "APPROVED", "IN_DEVELOPMENT"].includes(p.status) &&
          (!p.teamMembers || p.teamMembers.length < (p.maxTeamSize || 5))
      );
      setMyProblems(activeProblems);
      if (activeProblems.length > 0) {
        setSelectedProject(activeProblems[0]._id);
      }
    } catch (err) {
      console.error("Failed to load provider problems:", err);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setInviteError("Please select an active project to invite this developer to.");
      return;
    }
    setInviting(true);
    setInviteError("");
    try {
      await api.post(`/projects/${selectedProject}/invite/${developer._id}`, {
        message: inviteMessage,
      });
      setInviteSuccess(true);
      setTimeout(() => {
        setInviteModalOpen(false);
      }, 1500);
    } catch (err) {
      setInviteError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  // Filter projects depending on active tab, status, and search
  const displayedProjects = (() => {
    let list = [];
    if (activeTab === "led") {
      list = ledProjects;
    } else if (activeTab === "contributed") {
      list = contributedProjects;
    } else {
      list = [...ledProjects, ...contributedProjects];
    }

    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.requiredSkills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  })();

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
            <FiCode className="w-3.5 h-3.5" /> In Active Development
          </span>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <span className="badge badge-warning text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiClock className="w-3.5 h-3.5" /> Under Provider Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="badge badge-accent text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
            <FiCheckCircle className="w-3.5 h-3.5" /> Proposal Approved
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

  if (loading) {
    return (
      <div className="page-container max-w-5xl py-12 space-y-6">
        <div className="glass-card p-8 animate-pulse space-y-4">
          <div className="skeleton-avatar w-20 h-20" />
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="page-container text-center py-20">
        <div className="glass-card max-w-md mx-auto p-8 space-y-4">
          <FiUser className="w-12 h-12 text-dark-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Developer Not Found</h2>
          <p className="text-xs text-gray-400">This profile does not exist or has been removed.</p>
          <Link to="/developers" className="btn-secondary btn-sm inline-block">
            Back to Top Developers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl space-y-8 pb-16">
      {/* Profile Header Card */}
      <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary-600 via-accent-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-3xl shadow-glow-md flex-shrink-0">
              {developer.name ? developer.name.charAt(0).toUpperCase() : "D"}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  {developer.name}
                </h1>
                {developer.availability ? (
                  <span className="badge badge-success text-xs py-0.5 px-2.5">
                    ● Available for Projects
                  </span>
                ) : (
                  <span className="badge badge-neutral text-xs py-0.5 px-2.5">
                    ● Currently Busy
                  </span>
                )}
                {ledProjects.length > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs py-0.5 px-2.5 flex items-center gap-1 font-semibold">
                    👑 Verified Project Leader
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                {developer.address && (
                  <span className="flex items-center gap-1">
                    <FiMapPin className="text-primary-400" /> {developer.address}
                  </span>
                )}
                {developer.email && (
                  <span className="flex items-center gap-1">
                    <FiMail className="text-accent-400" /> {developer.email}
                  </span>
                )}
                {developer.mobileNumber && (
                  <span className="flex items-center gap-1">
                    <FiPhone className="text-emerald-400" /> {developer.mobileNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action button: Invite if current user is Problem Provider */}
          {currentUser && currentUser.role === "PROBLEM_PROVIDER" && currentUser._id !== developer._id && (
            <button
              onClick={handleOpenInviteModal}
              className="btn-accent flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <FiSend className="w-4 h-4" />
              <span>Invite to Lead Problem</span>
            </button>
          )}
        </div>

        {/* Social / Portfolio Links */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-dark-700/60 flex-wrap">
          {developer.githubProfile && (
            <a
              href={developer.githubProfile}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiGithub className="w-4 h-4 text-emerald-400" />
              <span>GitHub</span>
              <FiExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          )}
          {developer.linkedinOrPortfolio && (
            <a
              href={developer.linkedinOrPortfolio}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiLinkedin className="w-4 h-4 text-primary-400" />
              <span>LinkedIn / Portfolio</span>
              <FiExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Stats & Bio & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Reputation & Stats */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <span className="input-label text-xs">Reputation Score</span>
            <div className="text-3xl font-extrabold text-accent-400 font-display mt-1">
              {developer.reputation || 0} <span className="text-sm font-normal text-gray-400">pts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-700/60">
            <div>
              <div className="text-xl font-bold text-white font-display">
                {developer.projectsCompleted || 0}
              </div>
              <div className="text-xs text-gray-400">Total Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400 font-display flex items-center gap-1">
                <span>👑</span>
                <span>{ledProjects.length || developer.projectsLed || 0}</span>
              </div>
              <div className="text-xs text-gray-400">Projects Led</div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="pt-4 border-t border-dark-700/60 space-y-3">
            <span className="input-label text-xs flex items-center gap-1.5 text-amber-300">
              <FiAward className="w-4 h-4" /> Earned Badges
            </span>
            {developer.badges && developer.badges.length > 0 ? (
              <div className="flex flex-col gap-2">
                {developer.badges.map((b, idx) => (
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
              <p className="text-xs text-gray-500 italic">No badges awarded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Bio, Skills & Experience */}
        <div className="md:col-span-2 glass-card p-6 sm:p-8 space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              About Developer
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {developer.bio || "No bio provided."}
            </p>
          </div>

          {/* Experience */}
          {developer.experience && (
            <div className="space-y-2 pt-4 border-t border-dark-700/60">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Experience & Background
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {developer.experience}
              </p>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2 pt-4 border-t border-dark-700/60">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Verified & Technical Skills
            </h3>
            {developer.skills && developer.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {developer.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="badge badge-primary text-xs py-1 px-3 border border-primary-500/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No skills listed.</p>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PROJECTS DEVELOPED AS LEADER & TEAM LEADER (SHOWCASE SECTION)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6 pt-4">
        {/* Section Title & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FiShield className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                Leadership & Project Portfolio
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Verified projects architected and delivered by {developer.name} as Team Leader.
            </p>
          </div>

          {/* Tabs */}
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
              <span>All Projects</span>
              <span className="px-1.5 py-0.2 rounded-md bg-dark-950/30 text-[10px]">
                {ledProjects.length + contributedProjects.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search projects or skills..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "COMPLETED", "IN_DEVELOPMENT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  statusFilter === st
                    ? "bg-dark-700 text-white border border-dark-600 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-dark-800/60"
                }`}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {displayedProjects.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <FiFolder className="w-12 h-12 text-dark-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Projects Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {activeTab === "led"
                ? `${developer.name} hasn't published or delivered projects as a team leader matching this criteria yet.`
                : "No matching project history found."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedProjects.map((project) => {
              const isLeader =
                project.projectLeader?._id?.toString() === developer._id?.toString() ||
                project.projectLeader?.toString() === developer._id?.toString() ||
                project.teamMembers?.some(
                  (m) =>
                    (m.user?._id?.toString() === developer._id?.toString() ||
                      m.user?.toString() === developer._id?.toString()) &&
                    m.role === "Leader"
                );

              const leaderMember = project.teamMembers?.find(
                (m) =>
                  (m.user?._id?.toString() === developer._id?.toString() ||
                    m.user?.toString() === developer._id?.toString()) &&
                  m.role === "Leader"
              );

              return (
                <div
                  key={project._id}
                  className={`glass-card p-6 sm:p-8 space-y-6 transition-all hover:border-dark-600/80 relative overflow-hidden ${
                    isLeader ? "border-l-4 border-l-amber-400/90 shadow-glass" : ""
                  }`}
                >
                  {/* Top Bar: Leadership Badge, Status, Category */}
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

                  {/* Project Title & Client Details */}
                  <div className="space-y-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-xl sm:text-2xl font-bold text-white hover:text-primary-400 transition font-display flex items-center gap-2 group"
                    >
                      <span>{project.title}</span>
                      <FiChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition" />
                    </Link>

                    {/* Metadata line: Provider, Budget */}
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

                  {/* Problem Description & Architecture Scope */}
                  <div className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-dark-900/40 p-4 rounded-2xl border border-dark-700/50 space-y-2">
                    <p>{project.aiSummary || project.description}</p>
                  </div>

                  {/* Verified Solution & Live Deliverables Box (for Completed / Active projects) */}
                  {(project.solution?.completionSummary ||
                    project.solution?.liveUrl ||
                    project.liveUrl ||
                    project.solution?.demoVideo) && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-dark-900/60 to-dark-900/40 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                          <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Delivered Solution & Production Deliverables</span>
                        </div>
                        {project.solution?.submittedAt && (
                          <span className="text-[11px] text-gray-400">
                            Verified on{" "}
                            {new Date(project.solution.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {project.solution?.completionSummary && (
                        <p className="text-xs text-gray-200 leading-relaxed">
                          {project.solution.completionSummary}
                        </p>
                      )}

                      {/* Deliverable Links */}
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

                  {/* Real-World Social Impact Metrics (if available) */}
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

                  {/* Team Members Led by Developer */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-dark-700/50">
                      <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <FiUsers className="w-3.5 h-3.5 text-primary-400" />
                        <span>
                          Engineering Team Managed ({project.teamMembers.length} / {project.maxTeamSize || 5} members)
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

                  {/* Tech Stack Chips & Actions */}
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

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => setSelectedSpecsProject(project)}
                        className="btn-secondary btn-xs flex items-center gap-1.5"
                      >
                        <FiInfo className="w-3.5 h-3.5 text-accent-400" />
                        <span>Inspect Specs</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Specifications & Blueprint Modal */}
      {selectedSpecsProject && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <FiInfo className="text-accent-400 w-5 h-5" />
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedSpecsProject.title} — Blueprint & Specs
                </h3>
              </div>
              <button
                onClick={() => setSelectedSpecsProject(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Required Architecture Features
                </h4>
                <p className="text-xs text-gray-200 leading-relaxed bg-dark-900/70 p-3 rounded-xl border border-dark-700/60">
                  {selectedSpecsProject.requiredFeatures || "Features specified in project scope."}
                </p>
              </div>

              {selectedSpecsProject.aiSuggestedFeatures &&
                selectedSpecsProject.aiSuggestedFeatures.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Delivered Feature Milestones
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                      {selectedSpecsProject.aiSuggestedFeatures.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="p-2.5 rounded-xl bg-dark-900/50 border border-dark-700/50 flex items-start gap-2"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-700/60">
                  <span className="text-gray-400 block text-[10px] uppercase">Complexity</span>
                  <span className="font-bold text-white">
                    {selectedSpecsProject.aiComplexity || "Standard Production"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-700/60">
                  <span className="text-gray-400 block text-[10px] uppercase">Client Org</span>
                  <span className="font-bold text-white truncate block">
                    {selectedSpecsProject.problemProvider?.organizationName ||
                      selectedSpecsProject.problemProvider?.name ||
                      "Verified Organization"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center pt-3 border-t border-dark-700">
              <button
                type="button"
                onClick={() => setSelectedSpecsProject(null)}
                className="btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiSend className="text-accent-400" />
                Invite {developer.name} to Lead a Problem
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center space-y-2">
                <FiCheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Invitation Sent Successfully!</p>
                <p className="text-xs text-gray-400">
                  The developer will be notified and can accept or decline.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="input-label text-xs">Select Project / Problem</label>
                  {myProblems.length === 0 ? (
                    <div className="p-3 bg-dark-900/60 border border-dark-700 text-xs text-gray-400 rounded-xl">
                      You don't have any active open problems.{" "}
                      <Link to="/provider/create" className="text-primary-400 underline">
                        Post a problem first.
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="select-field text-xs"
                      required
                    >
                      {myProblems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="input-label text-xs">
                    Personal Note / Scope Summary (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. We loved your leadership experience and would like you to lead this engineering team..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || myProblems.length === 0}
                    className="btn-primary btn-sm disabled:opacity-50"
                  >
                    {inviting ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperProfile;

