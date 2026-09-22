import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiCpu,
  FiUsers,
  FiMessageSquare,
  FiFileText,
  FiGithub,
  FiCheckSquare,
  FiHeart,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiLock,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { useSocket } from "../../hooks/useSocket";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Request to solve modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // GitHub stats
  const [githubStats, setGithubStats] = useState(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [repoInput, setRepoInput] = useState("");

  // Solution Submission Form
  const [solutionSummary, setSolutionSummary] = useState("");
  const [solutionLiveUrl, setSolutionLiveUrl] = useState("");
  const [solutionRepoUrl, setSolutionRepoUrl] = useState("");
  const [solutionNotes, setSolutionNotes] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [providerFeedback, setProviderFeedback] = useState("");

  // Proposal Edit Form (Leader)
  const [proposalDesc, setProposalDesc] = useState("");
  const [proposalTech, setProposalTech] = useState("");
  const [proposalFeatures, setProposalFeatures] = useState("");
  const [proposalDuration, setProposalDuration] = useState("");
  const [milestones, setMilestones] = useState([
    { title: "Architecture & Data Setup", deadline: "", status: "Pending" },
    { title: "Core Features & API Integration", deadline: "", status: "Pending" },
    { title: "Testing & Deployment", deadline: "", status: "Pending" },
  ]);

  // AI Re-run state
  const [rerunningAI, setRerunningAI] = useState(false);

  // Impact edit state
  const [peopleBenefited, setPeopleBenefited] = useState("");
  const [organizationsHelped, setOrganizationsHelped] = useState("");
  const [impactNotes, setImpactNotes] = useState("");

  // Chat Setup
  const [chatType, setChatType] = useState(() =>
    user?.role === "PROBLEM_PROVIDER" ? "PROVIDER_LEADER" : "TEAM_GROUP"
  );
  const [targetMember, setTargetMember] = useState("");
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  // Keep chatType synchronized if user role is PROBLEM_PROVIDER
  useEffect(() => {
    if (user?.role === "PROBLEM_PROVIDER") {
      setChatType("PROVIDER_LEADER");
    }
  }, [user]);

  const { isConnected, messages, setMessages, joinRoom, sendMessage } = useSocket(token);

  // Fetch Project & Proposal
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      const prj = res.data.project;
      setProject(prj);
      setRepoInput(prj.githubRepoUrl || "");
      setPeopleBenefited(prj.impact?.peopleBenefited || "");
      setOrganizationsHelped(prj.impact?.organizationsHelped || "");
      setImpactNotes(prj.impact?.notes || "");

      // Try fetching proposal
      try {
        const propRes = await api.get(`/projects/${id}/proposal`);
        if (propRes.data?.proposal) {
          setProposal(propRes.data.proposal);
          setProposalDesc(propRes.data.proposal.description || "");
          setProposalTech(propRes.data.proposal.technologyStack?.join(", ") || "");
          setProposalFeatures(propRes.data.proposal.features?.join("\n") || "");
          setProposalDuration(propRes.data.proposal.estimatedDuration || "");
          setMilestones(propRes.data.proposal.milestones || []);
        }
      } catch (propErr) {
        // No proposal yet is normal
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Load chat messages when chat tab or channel changes
  useEffect(() => {
    if (activeTab === "chat" && project) {
      const fetchChat = async () => {
        try {
          const params = new URLSearchParams({ chatType });
          if (targetMember) params.append("targetUserId", targetMember);
          const res = await api.get(`/messages/${id}?${params.toString()}`);
          setMessages(res.data.messages || []);
        } catch (err) {
          console.error("Failed to load chat history:", err);
        }
      };
      fetchChat();
      joinRoom({ projectId: id, chatType, targetUserId: targetMember });
    }
  }, [activeTab, chatType, targetMember, id, project, joinRoom, setMessages]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // GitHub Stats fetch
  const fetchGithubStats = async () => {
    if (!project?.githubRepoUrl) return;
    setLoadingGithub(true);
    try {
      const res = await api.get(`/github/repo-stats?repoUrl=${encodeURIComponent(project.githubRepoUrl)}`);
      setGithubStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to fetch repo stats:", err);
    } finally {
      setLoadingGithub(false);
    }
  };

  useEffect(() => {
    if (activeTab === "github" && project?.githubRepoUrl) {
      fetchGithubStats();
    }
  }, [activeTab, project?.githubRepoUrl]);

  // Helper flags
  const isProvider = user && project && project.problemProvider?._id === user._id;
  const isLeader = user && project && project.projectLeader?._id === user._id;
  const isMember = user && project && project.teamMembers?.some((m) => m.user?._id === user._id);
  const isAdmin = user && user.role === "ADMIN";
  const isParticipant = isProvider || isLeader || isMember || isAdmin;
  const hasGitAccess = isLeader || isMember || (isProvider && project?.allowProviderGitAccess) || isAdmin;

  // Handlers
  const handleToggleProviderGitAccess = async () => {
    try {
      const nextVal = !project.allowProviderGitAccess;
      const res = await api.put(`/projects/${id}/github-access`, { allowProviderGitAccess: nextVal });
      setProject((prev) => ({ ...prev, allowProviderGitAccess: nextVal }));
      setActionSuccess(res.data.message || "Provider repository access updated!");
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update provider GitHub access.");
    }
  };
  const handleRequestToSolve = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.post(`/projects/${id}/request`, { message: requestMessage });
      setActionSuccess(res.data?.message || "Your request has been submitted successfully!");
      setRequestModalOpen(false);
      setRequestMessage("");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRerunAI = async () => {
    setRerunningAI(true);
    try {
      const res = await api.post("/ai/analyze-problem", { projectId: id });
      setProject(res.data.project);
      setActionSuccess("AI Problem Analysis re-run successfully!");
    } catch (err) {
      setActionError("Failed to re-run AI analysis.");
    } finally {
      setRerunningAI(false);
    }
  };

  const handleSaveProposal = async (statusToSet = "DRAFT") => {
    setActionError("");
    setActionSuccess("");
    try {
      const payload = {
        description: proposalDesc,
        technologyStack: proposalTech.split(",").map((s) => s.trim()).filter(Boolean),
        features: proposalFeatures.split("\n").map((s) => s.trim()).filter(Boolean),
        estimatedDuration: proposalDuration,
        milestones,
      };

      let res;
      if (proposal?._id) {
        res = await api.put(`/proposals/${proposal._id}`, payload);
        if (statusToSet === "SUBMITTED") {
          res = await api.post(`/proposals/${proposal._id}/submit`);
        }
      } else {
        res = await api.post(`/projects/${id}/proposal`, payload);
        if (statusToSet === "SUBMITTED") {
          res = await api.post(`/proposals/${res.data.proposal._id}/submit`);
        }
      }
      setProposal(res.data.proposal);
      setActionSuccess(
        statusToSet === "SUBMITTED"
          ? "Proposal submitted for Provider Approval!"
          : "Proposal draft saved."
      );
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to save proposal.");
    }
  };

  const handleApproveProposal = async () => {
    try {
      await api.post(`/proposals/${proposal._id}/approve`);
      setActionSuccess("Proposal approved! Project is now in official development.");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to approve proposal.");
    }
  };

  const handleRequestProposalChanges = async () => {
    if (!providerFeedback) {
      setActionError("Please provide change request feedback.");
      return;
    }
    try {
      await api.post(`/proposals/${proposal._id}/request-changes`, { feedback: providerFeedback });
      setActionSuccess("Feedback submitted! Project Leader can now update the structure.");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to request changes.");
    }
  };

  const handleMilestoneStatusChange = async (idx, newStatus) => {
    try {
      const res = await api.put(`/proposals/${proposal._id}/milestones/${idx}`, { status: newStatus });
      setProposal(res.data.proposal);
      setMilestones(res.data.proposal.milestones);
    } catch (err) {
      console.error("Failed to update milestone:", err);
    }
  };

  const handleLinkGithub = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}/github`, { githubRepoUrl: repoInput });
      setActionSuccess("GitHub repository linked successfully!");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to link GitHub repo.");
    }
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    setSubmittingSolution(true);
    setActionError("");
    try {
      await api.post(`/projects/${id}/submit-solution`, {
        completionSummary: solutionSummary,
        liveUrl: solutionLiveUrl,
        githubRepoUrl: solutionRepoUrl || project.githubRepoUrl,
        notes: solutionNotes,
      });
      setActionSuccess("Solution submitted! Problem Provider can now review the live application.");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to submit solution.");
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleReviewSolution = async (action) => {
    try {
      await api.post(`/projects/${id}/review-solution`, {
        action,
        feedback: providerFeedback,
      });
      setActionSuccess(action === "approve" ? "Solution approved & completed! Reputation points awarded." : "Changes requested.");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to review solution.");
    }
  };

  const handleUpdateImpact = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}/impact`, {
        peopleBenefited,
        organizationsHelped,
        notes: impactNotes,
      });
      setActionSuccess("Social impact data updated!");
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update impact data.");
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage({
      projectId: id,
      chatType,
      targetUserId: targetMember,
      content: chatInput,
    });
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="page-container py-20 text-center space-y-4">
        <div className="spinner border-t-primary-500 mx-auto" />
        <p className="text-xs text-gray-400">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container text-center py-20">
        <div className="glass-card max-w-md mx-auto p-8 space-y-4">
          <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Project Not Found</h2>
          <Link to="/explore" className="btn-secondary btn-sm inline-block">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* Notifications Alert Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")}>✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")}>✕</button>
        </div>
      )}

      {/* Top Project Banner */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="badge badge-primary text-xs py-1 px-3">
                {project.status.replace("_", " ")}
              </span>
              {project.category && (
                <span className="badge badge-neutral text-xs py-1 px-3">
                  {project.category}
                </span>
              )}
              {project.aiComplexity && (
                <span className="badge badge-accent text-xs py-1 px-3">
                  {project.aiComplexity} Complexity
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              {project.title}
            </h1>
            <p className="text-xs text-gray-400">
              Submitted by <strong className="text-gray-200">{project.problemProvider?.name}</strong> • Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Quick Action Button for Developers */}
          <div className="flex items-center gap-3">
            {user?.role === "DEVELOPER" && !isParticipant && ["OPEN", "LEADER_SELECTED", "TEAM_FORMING"].includes(project.status) && (
              project.teamMembers?.length < project.maxTeamSize ? (
                <button
                  onClick={() => setRequestModalOpen(true)}
                  className="btn-primary flex items-center gap-2 shadow-glow-sm"
                >
                  <FiSend className="w-4 h-4" />
                  <span>
                    {!project.projectLeader ? "Request to Solve & Lead" : "Request to Join Team"}
                  </span>
                </button>
              ) : (
                <span className="badge badge-neutral text-xs py-1.5 px-3">Team Full</span>
              )
            )}
          </div>
        </div>

        {/* Project Navigation Tabs */}
        <div className="tab-list pt-2">
          {[
            { id: "overview", label: "Overview", icon: FiFileText },
            { id: "requirements", label: "AI Requirements", icon: FiCpu },
            { id: "team", label: `Team (${project.teamMembers?.length || 0}/${project.maxTeamSize})`, icon: FiUsers },
            ...(isParticipant ? [{ id: "chat", label: "Project Chat", icon: FiMessageSquare }] : []),
            { id: "proposal", label: "Project Structure", icon: FiCheckSquare },
            ...(isParticipant ? [{ id: "github", label: "GitHub Grid", icon: FiGithub }] : []),
            { id: "solution", label: "Solution & Delivery", icon: FiCheckCircle },
            { id: "impact", label: "Social Impact", icon: FiHeart },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={active ? "tab-item-active" : "tab-item"}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREA */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Problem Description
              </h3>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {project.description}
              </p>
            </div>

            {project.requiredFeatures && (
              <div className="glass-card p-6 space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Provider Stated Requirements
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {project.requiredFeatures}
                </p>
              </div>
            )}

            {project.requiredSkills && project.requiredSkills.length > 0 && (
              <div className="glass-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Target Technical Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills.map((sk, idx) => (
                    <span key={idx} className="badge badge-primary text-xs py-1 px-3">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Meta Info */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Project Parameters
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-dark-700/60">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <FiDollarSign className="text-emerald-400" /> Budget
                  </span>
                  <span className="font-bold text-white">
                    {project.budgetType === "Volunteer"
                      ? "Volunteer / No Budget"
                      : `${project.currency || "INR"} ${project.budgetAmount?.toLocaleString()} (${project.budgetType})`}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-dark-700/60">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <FiUsers className="text-primary-400" /> Max Team Size
                  </span>
                  <span className="font-bold text-white">{project.maxTeamSize} Developers</span>
                </div>

                {project.expectedDuration && (
                  <div className="flex items-center justify-between pb-2 border-b border-dark-700/60">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <FiClock className="text-amber-400" /> Duration
                    </span>
                    <span className="font-bold text-white">{project.expectedDuration}</span>
                  </div>
                )}

                {project.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <FiCalendar className="text-accent-400" /> Target Deadline
                    </span>
                    <span className="font-bold text-white">
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Provider Card */}
            <div className="glass-card p-6 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Problem Provider
              </h4>
              <div className="flex items-center gap-3">
                <div className="avatar">
                  {project.problemProvider?.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {project.problemProvider?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {project.problemProvider?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Leader Card */}
            <div className="glass-card p-6 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Project Leader 👑
              </h4>
              {project.projectLeader ? (
                <div className="flex items-center gap-3">
                  <div className="avatar bg-gradient-to-tr from-accent-600 to-amber-500">
                    {project.projectLeader?.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/developers/${project.projectLeader._id}`}
                      className="text-sm font-bold text-white hover:text-primary-400 truncate block"
                    >
                      {project.projectLeader.name}
                    </Link>
                    <p className="text-xs text-accent-400 font-medium">
                      {project.projectLeader.reputation || 0} pts
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No leader selected yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. AI REQUIREMENTS TAB */}
      {activeTab === "requirements" && (
        <div className="space-y-6">
          {/* Header & Controls Card */}
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-dark-700/60 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600/30 to-accent-600/30 text-primary-400 flex items-center justify-center font-bold border border-primary-500/30 shadow-glow-sm">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      AI Problem Analysis & Scope Breakdown
                    </h3>
                    {project.aiComplexity && (
                      <span className="badge badge-accent text-[11px] py-0.5 px-2.5">
                        {project.aiComplexity} Scope
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Distilled from the Problem Provider's full statement using Groq Llama 3.3
                  </span>
                </div>
              </div>

              {isProvider && (
                <button
                  onClick={handleRerunAI}
                  disabled={rerunningAI}
                  className="btn-primary btn-sm flex items-center gap-2 shadow-glow-sm"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${rerunningAI ? "animate-spin" : ""}`} />
                  <span>{rerunningAI ? "Synthesizing Requirements..." : "Re-Run AI Analysis"}</span>
                </button>
              )}
            </div>

            {/* Provider's Raw Problem Context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="input-label text-xs uppercase tracking-wider text-gray-400 font-bold">
                  Problem Provider's Raw Narrative & Inputs
                </span>
                {project.category && (
                  <span className="badge badge-neutral text-[10px]">
                    Category: {project.category}
                  </span>
                )}
              </div>
              <div className="bg-dark-900/90 border border-dark-700/70 p-4 rounded-xl space-y-2 text-xs">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
                {project.requiredFeatures && (
                  <div className="pt-2 border-t border-dark-800 text-[11px] text-gray-400">
                    <strong className="text-gray-300">Raw Requested Features:</strong> {project.requiredFeatures}
                  </div>
                )}
              </div>
            </div>

            {/* AI Synthesized Technical Summary */}
            <div className="space-y-2 pt-2">
              <span className="input-label text-xs uppercase tracking-wider text-primary-400 font-bold flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5" />
                Synthesized Executive Technical Solution
              </span>
              <p className="text-sm text-gray-200 leading-relaxed bg-primary-950/20 border border-primary-500/30 p-4 rounded-xl font-normal shadow-sm">
                {project.aiSummary || "AI analysis not generated yet."}
              </p>
            </div>

            {/* Suggested Functional Requirements Checklist */}
            <div className="space-y-3 pt-2">
              <span className="input-label text-xs uppercase tracking-wider text-accent-400 font-bold flex items-center gap-1.5">
                <FiCheckSquare className="w-3.5 h-3.5" />
                AI-Extracted Functional Specifications
              </span>
              {project.aiSuggestedFeatures && project.aiSuggestedFeatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.aiSuggestedFeatures.map((feat, idx) => {
                    const [featureTitle, ...featureDescParts] = feat.includes(":") ? feat.split(":") : [feat, ""];
                    const featureDesc = featureDescParts.join(":").trim();
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-dark-900/80 border border-dark-700/80 rounded-xl flex items-start gap-3 text-xs text-gray-200 hover:border-dark-600 transition"
                      >
                        <span className="w-6 h-6 rounded-lg bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-white tracking-wide">{featureTitle.trim()}</p>
                          {featureDesc && <p className="text-gray-400 text-[11px] leading-relaxed">{featureDesc}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No suggested features extracted.</p>
              )}
            </div>

            {/* Suggested Technologies */}
            <div className="space-y-2 pt-2">
              <span className="input-label text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <FiCpu className="w-3.5 h-3.5" />
                Recommended Architecture & Technology Stack
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.aiSuggestedSkills?.map((s, idx) => (
                  <span key={idx} className="badge badge-success text-xs py-1 px-3">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEAM TAB */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-dark-700/60 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Project Development Team</h3>
                <p className="text-xs text-gray-400">
                  Maximum team size enforced server-side:{" "}
                  <strong className="text-white">
                    {project.teamMembers?.length || 0} / {project.maxTeamSize} Members
                  </strong>
                </p>
              </div>

              {user?.role === "DEVELOPER" && !isParticipant && ["OPEN", "LEADER_SELECTED", "TEAM_FORMING"].includes(project.status) && (
                project.teamMembers?.length < project.maxTeamSize ? (
                  <button
                    onClick={() => setRequestModalOpen(true)}
                    className="btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Request to Join Team</span>
                  </button>
                ) : (
                  <span className="badge badge-neutral text-xs py-1 px-3">Team Capacity Reached</span>
                )
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.teamMembers?.map((m) => (
                <div
                  key={m.user?._id || m._id}
                  className="bg-dark-900/80 border border-dark-700 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="avatar">
                      {m.user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/developers/${m.user?._id}`}
                        className="text-sm font-bold text-white hover:text-primary-400 truncate block"
                      >
                        {m.user?.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="badge badge-primary text-[10px] py-0 px-2">
                          {m.role}
                        </span>
                        {m.customRole && (
                          <span className="text-[11px] text-accent-400 font-medium truncate">
                            {m.customRole}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {m.user?.reputation || 0} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CHAT TAB (3-CHANNEL SOCKET.IO) */}
      {activeTab === "chat" && isParticipant && (
        <div className="glass-card overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[550px]">
          {/* Channel Selector Sidebar */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-dark-700/60 bg-dark-900/60 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Communication Channels
            </h4>
            <div className="space-y-1.5">
              {/* Only show Team Group Chat to Developers, Leaders, and Admins (not Problem Providers) */}
              {user?.role !== "PROBLEM_PROVIDER" && (
                <button
                  onClick={() => setChatType("TEAM_GROUP")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    chatType === "TEAM_GROUP"
                      ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                      : "text-gray-400 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Team Group Chat</span>
                </button>
              )}

              {(isProvider || isLeader || user?.role === "ADMIN") && (
                <button
                  onClick={() => setChatType("PROVIDER_LEADER")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    chatType === "PROVIDER_LEADER"
                      ? "bg-accent-600/20 text-accent-300 border border-accent-500/30"
                      : "text-gray-400 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <FiMessageSquare className="w-4 h-4 text-accent-400" />
                  <span>Provider ↔ Leader</span>
                </button>
              )}
            </div>
          </div>

          {/* Chat Messages & Input Area */}
          <div className="md:col-span-3 flex flex-col h-[550px] bg-dark-950/40">
            {/* Room Header */}
            <div className="p-4 border-b border-dark-700/60 bg-dark-900/80 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {chatType === "TEAM_GROUP"
                    ? "Team Group Room"
                    : "Private Provider ↔ Leader Channel"}
                </h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime Socket Connected
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-xs">
                  No messages in this channel yet. Say hello!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                        <span>{isMe ? "You" : msg.sender?.name || "Participant"}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-primary-600 text-white rounded-br-none shadow-glow-sm"
                            : "bg-dark-800 text-gray-200 border border-dark-700 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-dark-700/60 bg-dark-900/90 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="input-field py-2 text-xs flex-1"
              />
              <button type="submit" className="btn-primary btn-sm flex items-center gap-1">
                <FiSend className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. PROPOSAL TAB */}
      {activeTab === "proposal" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-dark-700/60 flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Project Structure & Proposal</h3>
                <span className="text-xs text-gray-400">
                  Status: <strong className="text-primary-400">{proposal?.status || "DRAFT"}</strong>
                </span>
              </div>

              {/* Provider Approval / Feedback Actions */}
              {isProvider && proposal?.status === "SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <button onClick={handleApproveProposal} className="btn-success btn-sm">
                    Approve Structure
                  </button>
                </div>
              )}
            </div>

            {/* Provider Feedback Notice if changes requested */}
            {proposal?.providerFeedback && (
              <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <FiAlertCircle /> Provider Feedback / Requested Changes:
                </span>
                <p className="text-gray-200">{proposal.providerFeedback}</p>
              </div>
            )}

            {/* If Leader and can edit: Form */}
            {isLeader && ["DRAFT", "CHANGES_REQUESTED"].includes(proposal?.status || "DRAFT") ? (
              <div className="space-y-4">
                <div>
                  <label className="input-label text-xs">Solution Approach & Architecture</label>
                  <textarea
                    rows={3}
                    value={proposalDesc}
                    onChange={(e) => setProposalDesc(e.target.value)}
                    className="textarea-field text-xs"
                    placeholder="Describe how your team intends to solve this problem..."
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Technologies (comma separated)</label>
                  <input
                    type="text"
                    value={proposalTech}
                    onChange={(e) => setProposalTech(e.target.value)}
                    className="input-field text-xs"
                    placeholder="React, Node.js, MongoDB..."
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Estimated Duration</label>
                  <input
                    type="text"
                    value={proposalDuration}
                    onChange={(e) => setProposalDuration(e.target.value)}
                    className="input-field text-xs"
                    placeholder="30 Days"
                  />
                </div>

                {/* Milestones editor */}
                <div className="space-y-3 pt-2">
                  <label className="input-label text-xs">Development Milestones & Deadlines</label>
                  {milestones.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 bg-dark-900/60 p-3 rounded-xl border border-dark-700">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].title = e.target.value;
                          setMilestones(updated);
                        }}
                        className="input-field py-1 text-xs"
                        placeholder="Milestone title"
                      />
                      <input
                        type="date"
                        value={m.deadline ? new Date(m.deadline).toISOString().split('T')[0] : ""}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].deadline = e.target.value;
                          setMilestones(updated);
                        }}
                        className="input-field py-1 text-xs"
                      />
                      <select
                        value={m.status}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].status = e.target.value;
                          setMilestones(updated);
                        }}
                        className="select-field py-1 text-xs"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setMilestones([...milestones, { title: "", deadline: "", status: "Pending" }])
                    }
                    className="btn-secondary btn-sm text-xs"
                  >
                    + Add Milestone
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => handleSaveProposal("DRAFT")} className="btn-secondary btn-sm">
                    Save Draft
                  </button>
                  <button onClick={() => handleSaveProposal("SUBMITTED")} className="btn-primary btn-sm">
                    Submit Proposal for Review
                  </button>
                </div>
              </div>
            ) : (
              /* Read Only Proposal Display */
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Solution Approach
                  </h4>
                  <p className="text-xs text-gray-200 leading-relaxed bg-dark-900/60 p-4 rounded-xl border border-dark-700">
                    {proposal?.description || "No proposal submitted yet."}
                  </p>
                </div>

                {/* Milestone Progress Board */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Milestone Roadmap
                  </h4>
                  <div className="space-y-2">
                    {proposal?.milestones?.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-dark-900/80 border border-dark-700 rounded-xl flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-white">{m.title}</p>
                          {m.deadline && (
                            <span className="text-[11px] text-gray-400">
                              Target: {new Date(m.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isLeader && project.status === "IN_DEVELOPMENT" ? (
                            <select
                              value={m.status}
                              onChange={(e) => handleMilestoneStatusChange(idx, e.target.value)}
                              className="select-field py-1 text-xs"
                            >
                              <option value="Pending">⏳ Pending</option>
                              <option value="In Progress">🔄 In Progress</option>
                              <option value="Completed">✅ Completed</option>
                            </select>
                          ) : (
                            <span
                              className={`badge ${
                                m.status === "Completed"
                                  ? "badge-success"
                                  : m.status === "In Progress"
                                  ? "badge-warning"
                                  : "badge-neutral"
                              }`}
                            >
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider Request Changes Input */}
                {isProvider && proposal?.status === "SUBMITTED" && (
                  <div className="p-4 bg-dark-900/80 border border-dark-700 rounded-xl space-y-3">
                    <label className="input-label text-xs">Request Structure Changes</label>
                    <textarea
                      rows={2}
                      placeholder="Specify what should be updated in the milestone or scope..."
                      value={providerFeedback}
                      onChange={(e) => setProviderFeedback(e.target.value)}
                      className="textarea-field text-xs"
                    />
                    <button
                      onClick={handleRequestProposalChanges}
                      className="btn-secondary btn-sm text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      Request Changes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. GITHUB TAB */}
      {activeTab === "github" && (
        hasGitAccess ? (
          <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiGithub className="text-emerald-400" />
                  GitHub Development Workspace
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  SolveX links to your GitHub repository without listening to webhooks or storing secret tokens.
                </p>
              </div>

              {/* Access Control Guide Notice */}
              <div className="p-4 bg-primary-600/10 border border-primary-500/30 rounded-xl text-xs text-gray-300 space-y-1.5">
                <strong className="text-primary-300 flex items-center gap-1.5">
                  🔒 Access Control Workflow:
                </strong>
                <p>
                  By default, only the <strong>Project Leader & Developer Team</strong> have repository access. Problem Providers can only see the repository if explicitly granted permission by the Project Leader below.
                </p>
              </div>

              {/* Provider Access Toggle for Project Leader */}
              {isLeader && (
                <div className="p-4 bg-dark-900/90 border border-dark-700 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {project.allowProviderGitAccess ? (
                        <span className="text-emerald-400">🔓 Problem Provider Access: Enabled</span>
                      ) : (
                        <span className="text-amber-400">🔒 Problem Provider Access: Disabled (Default)</span>
                      )}
                    </span>
                    <p className="text-[11px] text-gray-400">
                      {project.allowProviderGitAccess
                        ? "The Problem Provider is currently allowed to view the GitHub repository link & live stats."
                        : "The Problem Provider cannot see the GitHub repository. Only you and your team have access."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleProviderGitAccess}
                    className={`btn-sm text-xs font-semibold px-4 py-2 rounded-xl transition ${
                      project.allowProviderGitAccess
                        ? "btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10"
                        : "btn-primary shadow-glow-sm"
                    }`}
                  >
                    {project.allowProviderGitAccess ? "Revoke Provider Access" : "Grant Provider Access"}
                  </button>
                </div>
              )}

              {/* Link repo form for Leader */}
              {isLeader && (
                <form onSubmit={handleLinkGithub} className="space-y-3">
                  <label className="input-label text-xs">GitHub Repository URL (Accepts any format)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. github.com/Ashish-Malviya710/ISRO-Explore.git"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      className="input-field text-xs"
                      required
                    />
                    <button type="submit" className="btn-primary btn-sm whitespace-nowrap">
                      Save Repository
                    </button>
                  </div>
                </form>
              )}

              {/* Repo Stats Card (if linked) */}
              {project.githubRepoUrl ? (
                <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-primary-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{project.githubRepoUrl}</span>
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={fetchGithubStats}
                      disabled={loadingGithub}
                      className="btn-secondary btn-sm text-xs"
                    >
                      {loadingGithub ? "Polling..." : "Refresh Stats"}
                    </button>
                  </div>

                  {githubStats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div className="glass-card p-3 text-center">
                        <div className="text-lg font-bold text-white font-display">
                          {githubStats.openIssues}
                        </div>
                        <div className="text-[10px] text-gray-400">Open Issues</div>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <div className="text-lg font-bold text-amber-400 font-display">
                          {githubStats.stars}
                        </div>
                        <div className="text-[10px] text-gray-400">Stars</div>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <div className="text-lg font-bold text-accent-400 font-display">
                          {githubStats.forks}
                        </div>
                        <div className="text-[10px] text-gray-400">Forks</div>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <div className="text-lg font-bold text-emerald-400 font-display">
                          {githubStats.language || "JS"}
                        </div>
                        <div className="text-[10px] text-gray-400">Main Language</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Public stats only available for public repositories.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No GitHub repo linked yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-dark-800 border border-dark-600 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
              <FiLock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Repository Access Restricted</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              The Project Leader has not granted repository view access for this project. By default, the GitHub repository is private and accessible only to the developer team.
            </p>
          </div>
        )
      )}

      {/* 7. SOLUTION TAB */}
      {activeTab === "solution" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-dark-700/60">
              <h3 className="text-base font-bold text-white">Solution Submission & Provider Sign-Off</h3>
              <span className="badge badge-primary">{project.status}</span>
            </div>

            {/* Solution Submission Form for Leader */}
            {isLeader && ["IN_DEVELOPMENT", "CHANGES_REQUESTED"].includes(project.status) && (
              <form onSubmit={handleSubmitSolution} className="space-y-4">
                <div>
                  <label className="input-label text-xs">Live Deployed Application URL (Mandatory)</label>
                  <input
                    type="url"
                    placeholder="https://your-solution.vercel.app"
                    value={solutionLiveUrl}
                    onChange={(e) => setSolutionLiveUrl(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="input-label text-xs">GitHub Repository URL (Mandatory)</label>
                  <input
                    type="text"
                    placeholder="e.g. github.com/Ashish-Malviya710/ISRO-Explore.git"
                    value={solutionRepoUrl || project.githubRepoUrl || ""}
                    onChange={(e) => setSolutionRepoUrl(e.target.value)}
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Completion Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what features have been completed and verified..."
                    value={solutionSummary}
                    onChange={(e) => setSolutionSummary(e.target.value)}
                    className="textarea-field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Instructions & Demo Credentials for Provider</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Use demo account admin@ngo.test to access dashboard..."
                    value={solutionNotes}
                    onChange={(e) => setSolutionNotes(e.target.value)}
                    className="textarea-field text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingSolution}
                  className="btn-primary btn-sm"
                >
                  {submittingSolution ? "Submitting..." : "Submit Solution for Review"}
                </button>
              </form>
            )}

            {/* Provider Review Action */}
            {isProvider && ["SUBMITTED", "UNDER_REVIEW"].includes(project.status) && (
              <div className="bg-dark-900/80 border border-primary-500/30 rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white">Review Submitted Solution</h4>
                <div className="space-y-2 text-xs">
                  <p className="text-gray-300">
                    <strong>Summary:</strong> {project.solution?.completionSummary}
                  </p>
                  {project.solution?.liveUrl && (
                    <p className="text-primary-400">
                      <strong>Live Demo:</strong>{" "}
                      <a href={project.solution.liveUrl} target="_blank" rel="noreferrer" className="underline">
                        {project.solution.liveUrl}
                      </a>
                    </p>
                  )}
                  {project.solution?.notes && (
                    <p className="text-gray-400">
                      <strong>Notes:</strong> {project.solution.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="input-label text-xs">Feedback (Optional)</label>
                  <textarea
                    rows={2}
                    value={providerFeedback}
                    onChange={(e) => setProviderFeedback(e.target.value)}
                    className="textarea-field text-xs mb-3"
                    placeholder="Provide comments or reason for requesting changes..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewSolution("approve")}
                    className="btn-success btn-sm"
                  >
                    ✅ Approve & Complete Project
                  </button>
                  <button
                    onClick={() => handleReviewSolution("request_changes")}
                    className="btn-secondary btn-sm text-red-400"
                  >
                    Request Revisions
                  </button>
                </div>
              </div>
            )}

            {/* Read-Only Solution Details */}
            {project.status === "COMPLETED" && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <span className="badge badge-success">COMPLETED & VERIFIED</span>
                  <p className="text-xs text-gray-200">
                    {project.solution?.completionSummary}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <FiExternalLink /> Live Solution
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. IMPACT TAB */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiHeart className="text-accent-400" />
                Community Impact Metrics
              </h3>
              <p className="text-xs text-gray-400">
                Track how many people and organizations were helped by this software solution.
              </p>
            </div>

            {isProvider ? (
              <form onSubmit={handleUpdateImpact} className="space-y-4 max-w-xl">
                <div>
                  <label className="input-label text-xs">Number of People Benefited</label>
                  <input
                    type="number"
                    value={peopleBenefited}
                    onChange={(e) => setPeopleBenefited(e.target.value)}
                    className="input-field text-xs"
                    placeholder="e.g. 2500"
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Number of Organizations Helped</label>
                  <input
                    type="number"
                    value={organizationsHelped}
                    onChange={(e) => setOrganizationsHelped(e.target.value)}
                    className="input-field text-xs"
                    placeholder="e.g. 8"
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Impact Notes / Testimonial</label>
                  <textarea
                    rows={3}
                    value={impactNotes}
                    onChange={(e) => setImpactNotes(e.target.value)}
                    className="textarea-field text-xs"
                    placeholder="Describe how the solution is currently used in the field..."
                  />
                </div>

                <button type="submit" className="btn-primary btn-sm">
                  Save Impact Stats
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold font-display text-emerald-400">
                    {project.impact?.peopleBenefited?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-400">People Benefited</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold font-display text-primary-400">
                    {project.impact?.organizationsHelped || 0}
                  </div>
                  <div className="text-xs text-gray-400">Organizations Helped</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST TO SOLVE / JOIN MODAL */}
      {requestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-dark-700">
              <h3 className="text-base font-bold text-white">
                {!project.projectLeader ? "Request to Solve & Lead Project" : "Request to Join Team"}
              </h3>
              <button onClick={() => setRequestModalOpen(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestToSolve} className="space-y-4">
              <div>
                <label className="input-label text-xs">
                  {!project.projectLeader
                    ? "Why are you the right developer to lead this project?"
                    : "Describe your skills and how you would like to contribute to this team:"}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    !project.projectLeader
                      ? "Describe your tech stack experience, previous projects, and how you would organize the team..."
                      : "Mention your tech stack strengths (e.g. React frontend, Node backend, database design) and weekly availability..."
                  }
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="textarea-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="btn-primary btn-sm"
                >
                  {submittingRequest ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
