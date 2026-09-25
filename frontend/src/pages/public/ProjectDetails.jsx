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
  FiGitPullRequest,
  FiGitCommit,
  FiTarget,
  FiActivity,
  FiTrendingUp,
  FiUserMinus,
  FiUserPlus,
  FiSearch,
  FiTag,
  FiMessageCircle,
  FiAward,
  FiCheck,
  FiX,
  FiCode,
  FiLayers,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import {
  getGithubIssues, createGithubIssue, getGithubPulls, getPRReviews,
  getGithubMilestones, getContributions, getProjectProgress,
  getActivityTimeline, markMemberVacant, findReplacements, inviteReplacement,
  linkGithubMilestone,
} from "../../services/githubApi";

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

  // Team Size Adjustment (Leader / Provider / Admin)
  const [teamSizeModalOpen, setTeamSizeModalOpen] = useState(false);
  const [newTeamSize, setNewTeamSize] = useState(5);
  const [updatingTeamSize, setUpdatingTeamSize] = useState(false);
  const [teamSizeError, setTeamSizeError] = useState("");

  // Incoming Join Requests (Leader / Provider / Admin)
  const [projectRequests, setProjectRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState({});

  // GitHub stats
  const [githubStats, setGithubStats] = useState(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [repoInput, setRepoInput] = useState("");

  // GitHub Issues / PRs / Milestones
  const [ghIssues, setGhIssues] = useState(null);
  const [ghPulls, setGhPulls] = useState(null);
  const [ghMilestones, setGhMilestones] = useState(null);
  const [ghSubTab, setGhSubTab] = useState("issues");
  const [loadingGhData, setLoadingGhData] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [expandedPR, setExpandedPR] = useState(null);
  const [prReviews, setPrReviews] = useState({});

  // Contributions
  const [contributions, setContributions] = useState(null);
  const [loadingContributions, setLoadingContributions] = useState(false);

  // Project Progress
  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Activity Timeline
  const [activityTimeline, setActivityTimeline] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Backup Developer Matching
  const [vacantModalUserId, setVacantModalUserId] = useState(null);
  const [replacementCandidates, setReplacementCandidates] = useState(null);
  const [loadingReplacements, setLoadingReplacements] = useState(false);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [replacementVacantInfo, setReplacementVacantInfo] = useState(null);

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
  const chatMessagesRef = useRef(null);

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
    if (activeTab === "chat" && chatMessagesRef.current) {
      const el = chatMessagesRef.current;
      // Scroll only the chat container to bottom, preventing the browser window from jumping or scrolling up
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
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

  // Fetch GitHub Issues / PRs / Milestones when github tab is active
  useEffect(() => {
    if (activeTab === "github" && project?.githubRepoUrl && hasGitAccess) {
      const fetchGhData = async () => {
        setLoadingGhData(true);
        try {
          const [issuesRes, pullsRes, msRes] = await Promise.all([
            getGithubIssues(id).catch(() => null),
            getGithubPulls(id).catch(() => null),
            getGithubMilestones(id).catch(() => null),
          ]);
          if (issuesRes?.data) setGhIssues(issuesRes.data);
          if (pullsRes?.data) setGhPulls(pullsRes.data);
          if (msRes?.data) setGhMilestones(msRes.data);
        } catch (err) {
          console.error("GitHub data fetch error:", err);
        } finally {
          setLoadingGhData(false);
        }
      };
      fetchGhData();
    }
  }, [activeTab, project?.githubRepoUrl, id]);

  // Fetch Contributions when tab is active
  useEffect(() => {
    if (activeTab === "contributions" && project?.githubRepoUrl) {
      const fetchContribs = async () => {
        setLoadingContributions(true);
        try {
          const res = await getContributions(id);
          setContributions(res.data);
        } catch (err) {
          console.error("Contributions fetch error:", err);
        } finally {
          setLoadingContributions(false);
        }
      };
      fetchContribs();
    }
  }, [activeTab, id, project?.githubRepoUrl]);

  // Fetch Progress when tab is active
  useEffect(() => {
    if (activeTab === "progress" && project?.githubRepoUrl) {
      const fetchProgress = async () => {
        setLoadingProgress(true);
        try {
          const res = await getProjectProgress(id);
          setProgressData(res.data);
        } catch (err) {
          console.error("Progress fetch error:", err);
        } finally {
          setLoadingProgress(false);
        }
      };
      fetchProgress();
    }
  }, [activeTab, id, project?.githubRepoUrl]);

  // Fetch Activity Timeline when tab is active
  useEffect(() => {
    if (activeTab === "activity" && project?.githubRepoUrl) {
      const fetchActivity = async () => {
        setLoadingActivity(true);
        try {
          const res = await getActivityTimeline(id);
          setActivityTimeline(res.data.timeline);
        } catch (err) {
          console.error("Activity fetch error:", err);
        } finally {
          setLoadingActivity(false);
        }
      };
      fetchActivity();
    }
  }, [activeTab, id, project?.githubRepoUrl]);

  // ─── New Handlers ───

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setCreatingIssue(true);
    try {
      await createGithubIssue(id, { title: newIssueTitle, body: newIssueBody });
      setActionSuccess("GitHub issue created successfully!");
      setCreateIssueOpen(false);
      setNewIssueTitle("");
      setNewIssueBody("");
      // Refresh issues
      const res = await getGithubIssues(id);
      if (res?.data) setGhIssues(res.data);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to create GitHub issue.");
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleLoadPRReviews = async (prNumber) => {
    if (prReviews[prNumber]) return; // Already loaded
    try {
      const res = await getPRReviews(id, prNumber);
      setPrReviews((prev) => ({ ...prev, [prNumber]: res.data }));
    } catch (err) {
      console.error("PR reviews fetch error:", err);
    }
  };

  const handleMarkVacant = async (memberId) => {
    try {
      const res = await markMemberVacant(id, memberId);
      setActionSuccess(res.data.message);
      setVacantModalUserId(null);
      fetchProjectData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to mark member as vacant.");
    }
  };

  const handleFindReplacements = async (memberId) => {
    setLoadingReplacements(true);
    setReplacementModalOpen(true);
    try {
      const res = await findReplacements(id, memberId);
      setReplacementCandidates(res.data.candidates);
      setReplacementVacantInfo({
        userId: memberId,
        role: res.data.vacantRole,
        customRole: res.data.vacantCustomRole,
        requiredSkills: res.data.requiredSkills,
      });
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to find replacements.");
      setReplacementModalOpen(false);
    } finally {
      setLoadingReplacements(false);
    }
  };

  const handleInviteReplacement = async (developerId) => {
    if (!replacementVacantInfo) return;
    try {
      await inviteReplacement(id, replacementVacantInfo.userId, { developerId });
      setActionSuccess("Replacement invitation sent!");
      setReplacementModalOpen(false);
      setReplacementCandidates(null);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to invite replacement.");
    }
  };

  // Helper: hasGitAccess depends on computed values
  const _hasGitAccess = () => {
    const _isLeader = user && project && ((project.projectLeader?._id || project.projectLeader)?.toString() === user._id?.toString());
    const _isMember = user && project && project.teamMembers?.some((m) => ((m.user?._id || m.user)?.toString() === user._id?.toString()));
    const _isAdmin = user && user.role === "ADMIN";
    const _isProvider = user && project && ((project.problemProvider?._id || project.problemProvider)?.toString() === user._id?.toString());
    return _isLeader || _isMember || (_isProvider && project?.allowProviderGitAccess) || _isAdmin;
  };

  // Helper flags

  const isProvider = user && project && ((project.problemProvider?._id || project.problemProvider)?.toString() === user._id?.toString());
  const isLeader = user && project && ((project.projectLeader?._id || project.projectLeader)?.toString() === user._id?.toString());
  const isMember = user && project && project.teamMembers?.some((m) => ((m.user?._id || m.user)?.toString() === user._id?.toString()));
  const isAdmin = user && user.role === "ADMIN";
  const isParticipant = isProvider || isLeader || isMember || isAdmin;
  const hasGitAccess = isLeader || isMember || (isProvider && project?.allowProviderGitAccess) || isAdmin;

  const pendingRequestsCount = projectRequests.filter((r) => r.status === "PENDING").length;

  const fetchProjectRequests = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingRequests(true);
      const res = await api.get(`/projects/${id}/requests`);
      setProjectRequests(res.data?.requests || []);
    } catch (err) {
      console.warn("Requests fetch non-blocking:", err.message);
      setProjectRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [id]);

  useEffect(() => {
    if (project && (isLeader || isProvider || isAdmin)) {
      fetchProjectRequests();
    }
  }, [project, isLeader, isProvider, isAdmin, fetchProjectRequests]);

  const handleAcceptJoinRequest = async (reqId) => {
    setRequestActionLoading((prev) => ({ ...prev, [reqId]: "accept" }));
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.put(`/requests/${reqId}/accept`);
      setActionSuccess(res.data?.message || "Developer accepted into the team!");
      fetchProjectData();
      fetchProjectRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to accept request.");
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [reqId]: null }));
    }
  };

  const handleRejectJoinRequest = async (reqId) => {
    setRequestActionLoading((prev) => ({ ...prev, [reqId]: "reject" }));
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.put(`/requests/${reqId}/reject`);
      setActionSuccess("Request declined.");
      fetchProjectRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to decline request.");
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [reqId]: null }));
    }
  };

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

  const handleUpdateTeamSize = async (e) => {
    e.preventDefault();
    const parsed = parseInt(newTeamSize, 10);
    const currentMembers = project?.teamMembers ? project.teamMembers.length : 0;
    if (!parsed || parsed < 1 || parsed > 25) {
      setTeamSizeError("Team size must be between 1 and 25 developers.");
      return;
    }
    if (parsed < currentMembers) {
      setTeamSizeError(`Cannot set team size lower than current active member count (${currentMembers}).`);
      return;
    }

    setUpdatingTeamSize(true);
    setTeamSizeError("");
    try {
      const res = await api.put(`/projects/${id}/team/size`, { maxTeamSize: parsed });
      setProject((prev) => ({ ...prev, maxTeamSize: parsed }));
      setActionSuccess(res.data?.message || `Team capacity set to ${parsed} developers!`);
      setTeamSizeModalOpen(false);
      fetchProjectData();
    } catch (err) {
      setTeamSizeError(err.response?.data?.message || "Failed to update team size.");
    } finally {
      setUpdatingTeamSize(false);
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
          <Link
            to={user?.role === "PROBLEM_PROVIDER" ? "/provider/dashboard" : "/explore"}
            className="btn-secondary btn-sm inline-block"
          >
            {user?.role === "PROBLEM_PROVIDER" ? "Back to Dashboard" : "Back to Explore"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

      {/* Workspace Body: Left Sidebar Navigation + Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Navigation - Direct Button Form */}
        <aside className="w-full lg:w-80 xl:w-[320px] shrink-0 space-y-2.5 lg:sticky lg:top-20">
          {[
            {
              id: "overview",
              label: "Overview",
              icon: FiFileText,
              iconColor: "text-sky-400",
              iconBg: "bg-sky-500/10",
            },
            ...(project?.blueprint
              ? [
                  {
                    id: "blueprint",
                    label: "Technical Blueprint",
                    icon: FiCpu,
                    iconColor: "text-lime",
                    iconBg: "bg-lime/10",
                  },
                ]
              : []),
            {
              id: "team",
              label: "Project Team",
              icon: FiUsers,
              iconColor: "text-cyan-400",
              iconBg: "bg-cyan-500/10",
            },
            ...(isParticipant
              ? [
                  {
                    id: "chat",
                    label: "Project Chat",
                    icon: FiMessageSquare,
                    iconColor: "text-emerald-400",
                    iconBg: "bg-emerald-500/10",
                  },
                ]
              : []),
            {
              id: "proposal",
              label: "Project Structure",
              icon: FiCheckSquare,
              iconColor: "text-amber-400",
              iconBg: "bg-amber-500/10",
            },
            ...(isParticipant
              ? [
                  {
                    id: "github",
                    label: "GitHub Grid",
                    icon: FiGithub,
                    iconColor: "text-paper",
                    iconBg: "bg-void/70",
                  },
                  ...(project?.githubRepoUrl
                    ? [
                        {
                          id: "contributions",
                          label: "Contributions",
                          icon: FiAward,
                          iconColor: "text-yellow-400",
                          iconBg: "bg-yellow-500/10",
                        },
                        {
                          id: "progress",
                          label: "Progress",
                          icon: FiTrendingUp,
                          iconColor: "text-cyan-400",
                          iconBg: "bg-cyan-500/10",
                        },
                        {
                          id: "activity",
                          label: "Activity",
                          icon: FiActivity,
                          iconColor: "text-fuchsia-400",
                          iconBg: "bg-fuchsia-500/10",
                        },
                      ]
                    : []),
                ]
              : []),
            {
              id: "solution",
              label: "Solution & Delivery",
              icon: FiCheckCircle,
              iconColor: "text-emerald-400",
              iconBg: "bg-emerald-500/10",
            },
            {
              id: "impact",
              label: "Social Impact",
              icon: FiHeart,
              iconColor: "text-rose-400",
              iconBg: "bg-rose-500/10",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl font-mono transition-all duration-200 flex items-center gap-3.5 group ${
                  active
                    ? "bg-graphite border-l-4 border-lime text-paper shadow-glow-sm"
                    : "bg-carbon/80 hover:bg-graphite/60 text-smoke hover:text-paper"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    active
                      ? "bg-lime text-black font-bold shadow-glow-sm"
                      : `${tab.iconBg} ${tab.iconColor} group-hover:scale-105`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-sm font-semibold truncate ${
                    active ? "text-lime font-bold" : "text-bone group-hover:text-paper"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6 w-full">
          {/* TAB CONTENT AREA */}

          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Project Hero Header inside Overview */}
              <div className="glass-card p-6 sm:p-8 space-y-4">
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
                    {user?.role === "DEVELOPER" && !isParticipant && ["OPEN", "LEADER_SELECTED", "TEAM_FORMING", "PROPOSAL_PENDING", "CHANGES_REQUESTED", "APPROVED", "IN_DEVELOPMENT"].includes(project.status) && (
                      project.teamMembers?.length < (project.maxTeamSize || 5) ? (
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
              </div>

              {/* Main Overview Grid */}
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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{project.maxTeamSize || 5} Developers</span>
                          {(isLeader || isProvider || isAdmin) && (
                            <button
                              onClick={() => {
                                setNewTeamSize(project.maxTeamSize || 5);
                                setTeamSizeModalOpen(true);
                                setTeamSizeError("");
                              }}
                              className="text-xs text-primary-400 hover:text-primary-300 underline flex items-center gap-1 ml-1"
                              title="Decide or adjust team capacity"
                            >
                              <FiEdit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
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
            </div>
          )}

      {/* 1.5 TECHNICAL BLUEPRINT TAB */}
      {activeTab === "blueprint" && project?.blueprint && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="glass-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-dark-700/60 flex-wrap gap-4">
              <div>
                <span className="badge badge-primary text-xs py-1 px-3 mb-2 inline-block">
                  Verified Technical Blueprint
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  {project.blueprint.title || project.title}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Architecture: <strong className="text-gray-200">{project.blueprint.architecture?.type || "Full-Stack"}</strong> • Estimated Complexity: <strong className="text-primary-400">{project.blueprint.complexity || project.aiComplexity || "Moderate"}</strong>
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Executive Overview
              </h4>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                {project.blueprint.overview}
              </p>
            </div>

            {project.blueprint.problemStatement && (
              <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/50">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Problem Context & Stakeholder Impact
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {project.blueprint.problemStatement}
                </p>
              </div>
            )}
          </div>

          {/* Core Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Functional Features */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiTarget className="text-primary-400" /> Core Features & Deliverables
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                {(project.blueprint.features?.core || []).map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Technology Stack */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiCode className="text-primary-400" /> Technology Architecture
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Frontend:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.blueprint.technology?.frontend || []).map((t, i) => (
                      <span key={i} className="badge badge-primary text-xs py-1 px-2.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Backend & Database:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ...(project.blueprint.technology?.backend || []),
                      ...(project.blueprint.technology?.database || []),
                    ].map((t, i) => (
                      <span key={i} className="badge badge-accent text-xs py-1 px-2.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {project.blueprint.architecture?.description && (
                  <div className="pt-2 text-gray-300 italic">
                    "{project.blueprint.architecture.description}"
                  </div>
                )}
              </div>
            </div>

            {/* Developer Roles & Skills */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiUsers className="text-primary-400" /> Required Developer Roles
              </h3>
              <div className="space-y-3">
                {(project.blueprint.developerRoles || []).map((role, i) => (
                  <div key={i} className="p-3 rounded-xl bg-dark-900/60 border border-dark-700/50 text-xs">
                    <span className="font-bold text-white block mb-1">{role.role}</span>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(role.skills || []).map((s, si) => (
                        <span key={si} className="badge badge-neutral text-[11px] py-0.5 px-2">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiLayers className="text-primary-400" /> Phased Milestones
              </h3>
              <div className="space-y-3">
                {(project.blueprint.milestones || []).map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-dark-900/60 border border-dark-700/50 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-white">{m.title}</span>
                      <span className="text-[11px] text-primary-400 font-medium">{m.duration}</span>
                    </div>
                    <ul className="text-gray-400 list-disc list-inside space-y-0.5">
                      {(m.deliverables || []).map((d, di) => (
                        <li key={di}>{d}</li>
                      ))}
                    </ul>
                  </div>
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
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Project Development Team</h3>
                  {isLeader && (
                    <span className="badge badge-primary text-[10px] py-0.5 px-2">Team Leader</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recruitment active across proposal &amp; development:{" "}
                  <strong className="text-white">
                    {project.teamMembers?.length || 0} / {project.maxTeamSize || 5} Members
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(isLeader || isProvider || isAdmin) && (
                  <button
                    onClick={() => {
                      setNewTeamSize(project.maxTeamSize || 5);
                      setTeamSizeModalOpen(true);
                      setTeamSizeError("");
                    }}
                    className="btn-secondary btn-sm flex items-center gap-1.5 text-xs"
                    title="Decide or adjust team capacity"
                  >
                    <FiUsers className="w-3.5 h-3.5 text-primary-400" />
                    <span>{isLeader ? "Decide / Adjust Team Size" : "Adjust Team Capacity"}</span>
                  </button>
                )}

                {user?.role === "DEVELOPER" && !isParticipant && ["OPEN", "LEADER_SELECTED", "TEAM_FORMING", "PROPOSAL_PENDING", "CHANGES_REQUESTED", "APPROVED", "IN_DEVELOPMENT"].includes(project.status) && (
                  project.teamMembers?.length < (project.maxTeamSize || 5) ? (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.teamMembers?.map((m) => (
                <div
                  key={m.user?._id || m._id}
                  className={`bg-dark-900/80 border rounded-xl p-4 flex items-center justify-between gap-4 ${
                    m.status === "VACANT" ? "border-amber-500/50 bg-amber-500/5" : "border-dark-700"
                  }`}
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
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="badge badge-primary text-[10px] py-0 px-2">
                          {m.role}
                        </span>
                        {m.customRole && (
                          <span className="text-[11px] text-accent-400 font-medium truncate">
                            {m.customRole}
                          </span>
                        )}
                        {m.status === "VACANT" && (
                          <span className="badge text-[10px] py-0 px-2 bg-amber-500/20 text-amber-400 border-amber-500/40">
                            ⚠ VACANT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {m.user?.reputation || 0} pts
                    </span>
                    {/* Leader can mark members as vacant (not self) */}
                    {isLeader && m.role !== "Leader" && m.status !== "VACANT" && (
                      <button
                        onClick={() => setVacantModalUserId(m.user?._id)}
                        className="btn-sm text-[10px] px-2 py-1 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10"
                        title="Mark as Vacant"
                      >
                        <FiUserMinus className="w-3 h-3" />
                      </button>
                    )}
                    {/* Find replacement for vacant positions */}
                    {(isLeader || isProvider) && m.status === "VACANT" && (
                      <button
                        onClick={() => handleFindReplacements(m.user?._id)}
                        className="btn-sm text-[10px] px-2 py-1 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10"
                        title="Find Replacement"
                      >
                        <FiSearch className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* INCOMING DEVELOPER JOIN REQUESTS (Team Leader / Provider / Admin) */}
            {(isLeader || isProvider || isAdmin) && (
              <div className="pt-6 border-t border-dark-700/60 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                      <FiSend className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Incoming Join Requests</h4>
                        <span
                          className={`badge text-[10px] py-0.5 px-2 ${
                            pendingRequestsCount > 0 ? "badge-primary animate-pulse" : "badge-neutral"
                          }`}
                        >
                          {pendingRequestsCount} Pending
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {isLeader
                          ? "Developers requesting to join your team. Review skills and application message to accept or decline."
                          : "Review developer join applications for this project."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={fetchProjectRequests}
                    className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
                    title="Refresh join requests"
                  >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingRequests ? (
                  <div className="text-center py-6">
                    <div className="spinner border-t-primary-500 mx-auto" />
                  </div>
                ) : projectRequests.length === 0 ? (
                  <div className="bg-dark-900/40 rounded-xl p-6 text-center border border-dark-700/40">
                    <p className="text-xs text-gray-400">No developer join requests yet.</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Developers can send join requests throughout proposal and development until your team reaches capacity ({project.maxTeamSize || 5} members).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectRequests.map((req) => {
                      const dev = req.developer;
                      const isPending = req.status === "PENDING";
                      const isFull = (project.teamMembers?.length || 0) >= (project.maxTeamSize || 5);
                      return (
                        <div
                          key={req._id}
                          className={`bg-dark-900/90 border rounded-xl p-4 space-y-3 transition-all ${
                            isPending
                              ? "border-primary-500/40 hover:border-primary-500/60 shadow-glow-sm"
                              : "border-dark-700/60 opacity-80"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="avatar">
                                {dev?.name?.charAt(0) || "D"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    to={`/developers/${dev?._id}`}
                                    className="text-sm font-bold text-white hover:text-primary-400 transition"
                                  >
                                    {dev?.name || "Developer"}
                                  </Link>
                                  <span className="badge badge-accent text-[10px] py-0 px-2">
                                    {dev?.reputation || 0} pts
                                  </span>
                                  <span
                                    className={`badge text-[10px] py-0 px-2 ${
                                      req.status === "ACCEPTED"
                                        ? "badge-success"
                                        : req.status === "REJECTED"
                                        ? "badge-danger"
                                        : "badge-warning"
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                                  <span>Applied on {new Date(req.createdAt).toLocaleDateString()}</span>
                                  {dev?.projectsCompleted !== undefined && (
                                    <span>• {dev.projectsCompleted} completed</span>
                                  )}
                                  {dev?.githubProfile && (
                                    <a
                                      href={dev.githubProfile}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary-400 hover:underline flex items-center gap-1"
                                    >
                                      <FiGithub className="w-3 h-3" />
                                      <span>GitHub</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions for Leader / Provider / Admin */}
                            {isPending && (
                              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                {project.projectLeader ? (
                                  /* Project already has a leader: ONLY the Team Leader (or Admin) can accept or decline */
                                  isLeader || isAdmin ? (
                                    <>
                                      <button
                                        onClick={() => handleAcceptJoinRequest(req._id)}
                                        disabled={isFull || requestActionLoading[req._id] === "accept"}
                                        className={`btn-primary btn-sm text-xs flex items-center gap-1.5 ${
                                          isFull ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                        title={
                                          isFull
                                            ? "Team capacity reached. Click 'Decide / Adjust Team Size' to increase capacity first."
                                            : "Accept developer into team"
                                        }
                                      >
                                        <FiCheck className="w-3.5 h-3.5" />
                                        <span>
                                          {requestActionLoading[req._id] === "accept"
                                            ? "Accepting..."
                                            : isFull
                                            ? "Team Full"
                                            : "Accept to Team"}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectJoinRequest(req._id)}
                                        disabled={requestActionLoading[req._id] === "reject"}
                                        className="btn-secondary btn-sm text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1"
                                        title="Decline request"
                                      >
                                        <FiX className="w-3.5 h-3.5" />
                                        <span>
                                          {requestActionLoading[req._id] === "reject" ? "Declining..." : "Decline"}
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <span
                                      className="badge badge-neutral text-xs py-1 px-3 border border-dark-600"
                                      title="Only the Team Leader can accept or decline team member requests"
                                    >
                                      Managed by Team Leader
                                    </span>
                                  )
                                ) : (
                                  /* No leader yet: Provider (or Admin) designates initial leader */
                                  isProvider || isAdmin ? (
                                    <>
                                      <button
                                        onClick={() => handleAcceptJoinRequest(req._id)}
                                        disabled={requestActionLoading[req._id] === "accept"}
                                        className="btn-primary btn-sm text-xs flex items-center gap-1.5"
                                        title="Designate as Project Leader"
                                      >
                                        <FiCheck className="w-3.5 h-3.5" />
                                        <span>
                                          {requestActionLoading[req._id] === "accept" ? "Accepting..." : "Designate as Leader"}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectJoinRequest(req._id)}
                                        disabled={requestActionLoading[req._id] === "reject"}
                                        className="btn-secondary btn-sm text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/60 flex items-center gap-1"
                                        title="Decline application"
                                      >
                                        <FiX className="w-3.5 h-3.5" />
                                        <span>
                                          {requestActionLoading[req._id] === "reject" ? "Declining..." : "Decline"}
                                        </span>
                                      </button>
                                    </>
                                  ) : null
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message / Pitch */}
                          {req.message && (
                            <div className="bg-dark-800/80 rounded-lg p-3 text-xs text-gray-300 border border-dark-700/50">
                              <p className="italic leading-relaxed">"{req.message}"</p>
                            </div>
                          )}

                          {/* Skills */}
                          {dev?.skills && dev.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {dev.skills.map((skill, idx) => (
                                <span key={idx} className="badge badge-neutral text-[10px] py-0 px-2">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VACANT CONFIRMATION MODAL */}
      {vacantModalUserId && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4">
            <h3 className="text-base font-bold text-white">Mark Member as Vacant?</h3>
            <p className="text-xs text-gray-400">
              This will mark the position as <strong className="text-amber-400">VACANT</strong> and preserve their contribution history. The project will <strong>NOT</strong> be reopened.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setVacantModalUserId(null)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={() => handleMarkVacant(vacantModalUserId)} className="btn-primary btn-sm bg-amber-500 hover:bg-amber-600">Mark Vacant</button>
            </div>
          </div>
        </div>
      )}

      {/* REPLACEMENT CANDIDATES MODAL */}
      {replacementModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4 max-w-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-dark-700">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiUserPlus className="text-emerald-400" /> Find Replacement Developer
                </h3>
                {replacementVacantInfo && (
                  <p className="text-xs text-gray-400 mt-1">
                    Position: <strong className="text-white">{replacementVacantInfo.customRole || replacementVacantInfo.role}</strong>
                  </p>
                )}
              </div>
              <button onClick={() => { setReplacementModalOpen(false); setReplacementCandidates(null); }} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {loadingReplacements ? (
              <div className="text-center py-8">
                <div className="spinner border-t-primary-500 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Searching available developers...</p>
              </div>
            ) : replacementCandidates?.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {replacementCandidates.map((c) => (
                  <div key={c.developer._id} className="bg-dark-900/80 border border-dark-700 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/developers/${c.developer._id}`} className="text-sm font-bold text-white hover:text-primary-400 truncate">
                          {c.developer.name}
                        </Link>
                        <span className={`badge text-[10px] py-0 px-2 ${
                          c.matchPercentage >= 70 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : c.matchPercentage >= 40 ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-red-500/20 text-red-400 border-red-500/40"
                        }`}>
                          {c.matchPercentage}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {c.developer.skills?.slice(0, 5).map((s) => (
                          <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded ${
                            c.matchedSkills.includes(s.toLowerCase()) ? "bg-emerald-500/20 text-emerald-400" : "bg-dark-700 text-gray-400"
                          }`}>{s}</span>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {c.developer.reputation} pts • {c.developer.projectsCompleted} projects
                      </p>
                    </div>
                    <button
                      onClick={() => handleInviteReplacement(c.developer._id)}
                      className="btn-primary btn-sm text-xs whitespace-nowrap"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No available candidates found matching the required skills.</p>
            )}
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
            <div ref={chatMessagesRef} className="flex-1 p-4 overflow-y-auto space-y-3">
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

              {/* ─── GitHub Sub-Tabs: Issues / PRs / Milestones ─── */}
              {project.githubRepoUrl && (
                <div className="space-y-4 pt-4 border-t border-dark-700/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: "issues", label: `Issues${ghIssues ? ` (${ghIssues.counts?.total || 0})` : ""}`, icon: FiAlertCircle },
                      { id: "pulls", label: `Pull Requests${ghPulls ? ` (${ghPulls.counts?.total || 0})` : ""}`, icon: FiGitPullRequest },
                      { id: "milestones", label: `Milestones${ghMilestones ? ` (${ghMilestones.counts?.total || 0})` : ""}`, icon: FiTarget },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setGhSubTab(st.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${
                          ghSubTab === st.id
                            ? "bg-primary-500/20 text-primary-400 border border-primary-500/40"
                            : "bg-dark-800 text-gray-400 border border-dark-600 hover:text-white"
                        }`}
                      >
                        <st.icon className="w-3.5 h-3.5" />
                        {st.label}
                      </button>
                    ))}
                    {loadingGhData && <span className="text-[10px] text-gray-500 ml-2">Loading...</span>}
                  </div>

                  {/* ISSUES SUB-TAB */}
                  {ghSubTab === "issues" && (
                    <div className="space-y-4">
                      {ghIssues?.counts && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-emerald-400 font-display">{ghIssues.counts.open}</div>
                            <div className="text-[10px] text-gray-400">Open</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-red-400 font-display">{ghIssues.counts.closed}</div>
                            <div className="text-[10px] text-gray-400">Closed</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-white font-display">{ghIssues.counts.total}</div>
                            <div className="text-[10px] text-gray-400">Total</div>
                          </div>
                        </div>
                      )}

                      {/* Create Issue Button */}
                      {isParticipant && (
                        <button onClick={() => setCreateIssueOpen(true)} className="btn-primary btn-sm text-xs flex items-center gap-1.5">
                          <FiPlus className="w-3.5 h-3.5" /> Create Issue
                        </button>
                      )}

                      {/* Create Issue Form */}
                      {createIssueOpen && (
                        <form onSubmit={handleCreateIssue} className="bg-dark-900/80 border border-dark-700 rounded-xl p-4 space-y-3">
                          <input
                            type="text"
                            placeholder="Issue title"
                            value={newIssueTitle}
                            onChange={(e) => setNewIssueTitle(e.target.value)}
                            className="input-field text-xs"
                            required
                          />
                          <textarea
                            rows={3}
                            placeholder="Issue description (optional)"
                            value={newIssueBody}
                            onChange={(e) => setNewIssueBody(e.target.value)}
                            className="textarea-field text-xs"
                          />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setCreateIssueOpen(false)} className="btn-secondary btn-sm text-xs">Cancel</button>
                            <button type="submit" disabled={creatingIssue} className="btn-primary btn-sm text-xs">
                              {creatingIssue ? "Creating..." : "Create Issue"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Issues List */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ghIssues?.issues?.length > 0 ? ghIssues.issues.map((issue) => (
                          <div key={issue.number} className="bg-dark-900/60 border border-dark-700 rounded-xl p-3 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-gray-500">#{issue.number}</span>
                                <a href={issue.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-white hover:text-primary-400 truncate">
                                  {issue.title}
                                </a>
                                <span className={`badge text-[9px] py-0 px-1.5 ${issue.state === "open" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}>
                                  {issue.state}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-500">by {issue.author}</span>
                                {issue.assignee && <span className="text-[10px] text-gray-500">→ {issue.assignee}</span>}
                                <span className="text-[10px] text-gray-600">{new Date(issue.createdAt).toLocaleDateString()}</span>
                                {issue.labels?.map((l) => (
                                  <span key={l.name} className="text-[9px] px-1.5 py-0 rounded" style={{ backgroundColor: `#${l.color}22`, color: `#${l.color}`, border: `1px solid #${l.color}44` }}>
                                    {l.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <a href={issue.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-primary-400 flex-shrink-0">
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )) : <p className="text-xs text-gray-500 italic text-center py-4">No issues found.</p>}
                      </div>
                    </div>
                  )}

                  {/* PULL REQUESTS SUB-TAB */}
                  {ghSubTab === "pulls" && (
                    <div className="space-y-4">
                      {ghPulls?.counts && (
                        <div className="grid grid-cols-4 gap-3">
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-emerald-400 font-display">{ghPulls.counts.open}</div>
                            <div className="text-[10px] text-gray-400">Open</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-purple-400 font-display">{ghPulls.counts.merged}</div>
                            <div className="text-[10px] text-gray-400">Merged</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-red-400 font-display">{ghPulls.counts.closed}</div>
                            <div className="text-[10px] text-gray-400">Closed</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-white font-display">{ghPulls.counts.total}</div>
                            <div className="text-[10px] text-gray-400">Total</div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ghPulls?.pullRequests?.length > 0 ? ghPulls.pullRequests.map((pr) => (
                          <div key={pr.number} className="bg-dark-900/60 border border-dark-700 rounded-xl p-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-gray-500">#{pr.number}</span>
                                  <a href={pr.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-white hover:text-primary-400 truncate">
                                    {pr.title}
                                  </a>
                                  <span className={`badge text-[9px] py-0 px-1.5 ${
                                    pr.state === "merged" ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                      : pr.state === "open" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                      : "bg-red-500/20 text-red-400 border-red-500/40"
                                  }`}>
                                    {pr.state}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 flex-wrap">
                                  <span>by {pr.author}</span>
                                  <span className="text-gray-600">{pr.sourceBranch} → {pr.targetBranch}</span>
                                  <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                                  {pr.mergedAt && <span className="text-purple-400">merged {new Date(pr.mergedAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => { setExpandedPR(expandedPR === pr.number ? null : pr.number); handleLoadPRReviews(pr.number); }}
                                className="text-[10px] text-gray-400 hover:text-primary-400 flex-shrink-0"
                              >
                                {expandedPR === pr.number ? "Hide" : "Reviews"}
                              </button>
                            </div>

                            {/* Expanded PR Reviews */}
                            {expandedPR === pr.number && prReviews[pr.number] && (
                              <div className="pl-4 border-l-2 border-dark-600 space-y-2 pt-2">
                                <div className="flex items-center gap-3 text-[10px]">
                                  <span className="text-emerald-400">✓ {prReviews[pr.number].summary?.approved || 0} Approved</span>
                                  <span className="text-amber-400">⟳ {prReviews[pr.number].summary?.changesRequested || 0} Changes</span>
                                  <span className="text-gray-400">💬 {prReviews[pr.number].summary?.commented || 0} Comments</span>
                                </div>
                                {prReviews[pr.number].reviews?.map((r) => (
                                  <div key={r.id} className="text-[10px] text-gray-400">
                                    <span className="font-medium text-gray-300">{r.author}</span>: {r.state.replace("_", " ")}
                                    {r.body && <span className="text-gray-500 ml-1">— "{r.body.substring(0, 80)}..."</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )) : <p className="text-xs text-gray-500 italic text-center py-4">No pull requests found.</p>}
                      </div>
                    </div>
                  )}

                  {/* MILESTONES SUB-TAB */}
                  {ghSubTab === "milestones" && (
                    <div className="space-y-4">
                      {ghMilestones?.counts && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-emerald-400 font-display">{ghMilestones.counts.open}</div>
                            <div className="text-[10px] text-gray-400">Open</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-gray-400 font-display">{ghMilestones.counts.closed}</div>
                            <div className="text-[10px] text-gray-400">Closed</div>
                          </div>
                          <div className="glass-card p-3 text-center">
                            <div className="text-lg font-bold text-white font-display">{ghMilestones.counts.total}</div>
                            <div className="text-[10px] text-gray-400">Total</div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ghMilestones?.milestones?.length > 0 ? ghMilestones.milestones.map((ms) => (
                          <div key={ms.number} className="bg-dark-900/60 border border-dark-700 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <a href={ms.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-white hover:text-primary-400 flex items-center gap-1.5">
                                {ms.title} <FiExternalLink className="w-3 h-3" />
                              </a>
                              <span className={`badge text-[9px] py-0 px-1.5 ${ms.state === "open" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-gray-500/20 text-gray-400 border-gray-500/40"}`}>
                                {ms.state}
                              </span>
                            </div>
                            {ms.description && <p className="text-[11px] text-gray-400 line-clamp-2">{ms.description}</p>}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-400">
                                <span>{ms.closedIssues}/{ms.totalIssues} issues closed</span>
                                <span className="font-bold text-primary-400">{ms.progress}%</span>
                              </div>
                              <div className="w-full bg-dark-700 rounded-full h-1.5">
                                <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${ms.progress}%` }} />
                              </div>
                            </div>
                            {ms.dueOn && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" /> Due: {new Date(ms.dueOn).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )) : <p className="text-xs text-gray-500 italic col-span-2 text-center py-4">No milestones found.</p>}
                      </div>
                    </div>
                  )}
                </div>
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

      {/* ─── CONTRIBUTIONS TAB ─── */}
      {activeTab === "contributions" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiAward className="text-amber-400" /> Contribution Analysis
                </h3>
                <p className="text-xs text-gray-400 mt-1">Per-developer GitHub contribution breakdown with transparent scoring.</p>
              </div>
            </div>

            {contributions?.scoreFormula && (
              <div className="p-3 bg-primary-600/10 border border-primary-500/30 rounded-xl text-xs text-gray-300">
                <strong className="text-primary-300">Score Formula:</strong> {contributions.scoreFormula}
              </div>
            )}

            {loadingContributions ? (
              <div className="text-center py-8">
                <div className="spinner border-t-primary-500 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Analyzing contributions...</p>
              </div>
            ) : contributions?.contributors?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dark-700 text-gray-400">
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">Developer</th>
                      <th className="text-center py-2 px-3">Commits</th>
                      <th className="text-center py-2 px-3">PRs</th>
                      <th className="text-center py-2 px-3">Merged</th>
                      <th className="text-center py-2 px-3">Issues</th>
                      <th className="text-center py-2 px-3">Reviews</th>
                      <th className="text-center py-2 px-3 font-bold text-primary-400">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.contributors.map((c, i) => {
                      const maxScore = contributions.contributors[0]?.score || 1;
                      return (
                        <tr key={c.author} className="border-b border-dark-800 hover:bg-dark-800/50">
                          <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white">{c.author}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-300">{c.commits}</td>
                          <td className="py-2.5 px-3 text-center text-gray-300">{c.prs}</td>
                          <td className="py-2.5 px-3 text-center text-purple-400">{c.mergedPrs}</td>
                          <td className="py-2.5 px-3 text-center text-gray-300">{c.issues}</td>
                          <td className="py-2.5 px-3 text-center text-gray-300">{c.reviews}</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-dark-700 rounded-full h-1.5">
                                <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${(c.score / maxScore) * 100}%` }} />
                              </div>
                              <span className="font-bold text-primary-400 w-8 text-right">{c.score}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-6">No contribution data available. Ensure a GitHub repository is linked.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── PROGRESS TAB ─── */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-emerald-400" /> Project Development Progress
            </h3>

            {loadingProgress ? (
              <div className="text-center py-8">
                <div className="spinner border-t-primary-500 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Calculating progress...</p>
              </div>
            ) : progressData ? (
              <div className="space-y-6">
                {/* Overall Progress */}
                <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-6 text-center space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Overall Project Health</p>
                  <div className="text-5xl font-extrabold font-display text-primary-400">{progressData.overallProgress}%</div>
                  <div className="w-full bg-dark-700 rounded-full h-3 max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-primary-500 to-emerald-500 h-3 rounded-full transition-all" style={{ width: `${progressData.overallProgress}%` }} />
                  </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-4 text-center space-y-1">
                    <div className="text-2xl font-bold text-emerald-400 font-display">{progressData.issueResolutionRate}%</div>
                    <div className="text-[10px] text-gray-400">Issue Resolution</div>
                    <div className="text-[9px] text-gray-600">{progressData.issues?.closed || 0}/{progressData.issues?.total || 0} closed</div>
                  </div>
                  <div className="glass-card p-4 text-center space-y-1">
                    <div className="text-2xl font-bold text-purple-400 font-display">{progressData.prMergeRate}%</div>
                    <div className="text-[10px] text-gray-400">PR Merge Rate</div>
                    <div className="text-[9px] text-gray-600">{progressData.pullRequests?.merged || 0}/{progressData.pullRequests?.total || 0} merged</div>
                  </div>
                  <div className="glass-card p-4 text-center space-y-1">
                    <div className="text-2xl font-bold text-primary-400 font-display">{progressData.githubMilestoneProgress}%</div>
                    <div className="text-[10px] text-gray-400">GitHub Milestones</div>
                    <div className="text-[9px] text-gray-600">{progressData.milestones?.closed || 0}/{progressData.milestones?.total || 0} done</div>
                  </div>
                  <div className="glass-card p-4 text-center space-y-1">
                    <div className="text-2xl font-bold text-amber-400 font-display">{progressData.solvexMilestoneProgress}%</div>
                    <div className="text-[10px] text-gray-400">SolveX Milestones</div>
                  </div>
                </div>

                {/* Commit Activity */}
                <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FiGitCommit className="text-primary-400" /> Commit Activity
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white font-display">{progressData.commitActivity?.total || 0}</div>
                      <div className="text-[10px] text-gray-400">Total Commits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-400 font-display">{progressData.commitActivity?.last30Days || 0}</div>
                      <div className="text-[10px] text-gray-400">Last 30 Days</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-6">No progress data available. Ensure a GitHub repository is linked.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── ACTIVITY TIMELINE TAB ─── */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FiActivity className="text-primary-400" /> Recent GitHub Activity
            </h3>

            {loadingActivity ? (
              <div className="text-center py-8">
                <div className="spinner border-t-primary-500 mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Loading activity...</p>
              </div>
            ) : activityTimeline?.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-dark-700 space-y-4">
                {activityTimeline.map((event, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[25px] w-3 h-3 rounded-full border-2 ${
                      event.type === "commit" ? "bg-emerald-500 border-emerald-400"
                        : event.type === "pull_request" ? "bg-purple-500 border-purple-400"
                        : "bg-amber-500 border-amber-400"
                    }`} />
                    <div className="bg-dark-900/60 border border-dark-700 rounded-xl p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.type === "commit" && <FiGitCommit className="w-3.5 h-3.5 text-emerald-400" />}
                        {event.type === "pull_request" && <FiGitPullRequest className="w-3.5 h-3.5 text-purple-400" />}
                        {event.type === "issue" && <FiAlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                        <span className="text-[10px] font-bold text-gray-300 uppercase">{event.type.replace("_", " ")}</span>
                        {event.state && (
                          <span className={`text-[9px] px-1.5 py-0 rounded ${
                            event.state === "merged" ? "bg-purple-500/20 text-purple-400"
                              : event.state === "open" ? "bg-emerald-500/20 text-emerald-400"
                              : event.state === "closed" ? "bg-red-500/20 text-red-400"
                              : "bg-dark-700 text-gray-400"
                          }`}>{event.state}</span>
                        )}
                        <span className="text-[10px] text-gray-600 ml-auto">{new Date(event.date).toLocaleString()}</span>
                      </div>
                      <a href={event.url} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-primary-400 mt-1 block truncate">
                        {event.sha && <span className="text-gray-500 font-mono mr-1">{event.sha}</span>}
                        {event.message}
                      </a>
                      <span className="text-[10px] text-gray-500">by {event.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-6">No recent activity found.</p>
            )}
          </div>
        </div>
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
        </main>
      </div>

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

      {/* DECIDE / ADJUST TEAM SIZE MODAL */}
      {teamSizeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                  <FiUsers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isLeader ? "Leader Team Size Decision" : "Adjust Team Capacity"}
                  </h3>
                  <p className="text-xs text-gray-400">Configure developer capacity for this project</p>
                </div>
              </div>
              <button
                onClick={() => setTeamSizeModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {teamSizeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{teamSizeError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeamSize} className="space-y-4">
              <div>
                <label className="input-label text-xs mb-1 block">
                  Maximum Team Size (Developers)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={project.teamMembers?.length || 1}
                    max={25}
                    required
                    value={newTeamSize}
                    onChange={(e) => setNewTeamSize(e.target.value)}
                    className="input-field text-sm font-semibold"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Active: <strong className="text-white">{project.teamMembers?.length || 0}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  {isLeader
                    ? "As the Team Leader, you can decide and adjust team capacity based on project scope, even if not provided by the Problem Provider."
                    : "Configure maximum team capacity. Developers can send join requests until this limit is reached."}
                </p>
              </div>

              <div className="bg-dark-900/60 rounded-xl p-3 border border-dark-700/60 space-y-1.5 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current active members:</span>
                  <span className="font-semibold text-white">{project.teamMembers?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Open recruitment slots:</span>
                  <span className="font-semibold text-emerald-400">
                    {Math.max(0, (parseInt(newTeamSize, 10) || 0) - (project.teamMembers?.length || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recruitment open during:</span>
                  <span className="text-gray-200">Proposal &amp; Development phases</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamSizeModalOpen(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTeamSize}
                  className="btn-primary btn-sm flex items-center gap-1.5"
                >
                  {updatingTeamSize ? "Saving..." : "Save Team Size"}
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
