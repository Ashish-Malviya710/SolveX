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
  FiPlayCircle,
  FiShield,
  FiGlobe,
  FiInfo,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
} from "../../components/ui";

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
          [
            "OPEN",
            "LEADER_SELECTED",
            "TEAM_FORMING",
            "PROPOSAL_PENDING",
            "CHANGES_REQUESTED",
            "APPROVED",
            "IN_DEVELOPMENT",
          ].includes(p.status) &&
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
      setInviteError(
        "Please select an active project to invite this developer to."
      );
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
      setInviteError(
        err.response?.data?.message || "Failed to send invitation."
      );
    } finally {
      setInviting(false);
    }
  };

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
          <Badge variant="success" size="sm">
            <FiCheckCircle className="w-3.5 h-3.5" /> Completed & Delivered
          </Badge>
        );
      case "IN_DEVELOPMENT":
        return (
          <Badge variant="lime" size="sm">
            <FiCode className="w-3.5 h-3.5" /> In Active Development
          </Badge>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <Badge variant="warning" size="sm">
            <FiClock className="w-3.5 h-3.5" /> Under Provider Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="success" size="sm">
            <FiCheckCircle className="w-3.5 h-3.5" /> Proposal Approved
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            <FiLayers className="w-3.5 h-3.5" /> {status?.replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Container className="py-12 max-w-5xl">
        <Card className="animate-pulse p-8">
          <div className="w-20 h-20 bg-graphite rounded-lg mb-4" />
          <div className="h-6 bg-graphite rounded w-1/3 mb-2" />
          <div className="h-4 bg-graphite rounded w-1/2" />
        </Card>
      </Container>
    );
  }

  if (!developer) {
    return (
      <Container className="py-20 text-center">
        <Card className="max-w-md mx-auto p-8 space-y-4">
          <FiUser className="w-12 h-12 text-iron mx-auto" />
          <h2 className="text-xl font-bold text-paper">Developer Not Found</h2>
          <p className="text-xs font-mono text-smoke">
            This profile does not exist or has been removed.
          </p>
          <Button variant="secondary" size="sm" to="/developers">
            Back to Top Developers
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 max-w-5xl space-y-8 pb-16">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-8 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-graphite border border-hairline flex items-center justify-center text-lime font-mono font-bold text-3xl shrink-0">
                {developer.name ? developer.name.charAt(0).toUpperCase() : "D"}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-paper font-display">
                    {developer.name}
                  </h1>
                  {developer.availability ? (
                    <Badge variant="lime" size="sm" dot>
                      Available for Projects
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Currently Busy
                    </Badge>
                  )}
                  {ledProjects.length > 0 && (
                    <Badge variant="warning" size="sm">
                      👑 Verified Project Leader
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-smoke flex-wrap">
                  {developer.address && (
                    <span className="flex items-center gap-1">
                      <FiMapPin className="text-lime" /> {developer.address}
                    </span>
                  )}
                  {developer.email && (
                    <span className="flex items-center gap-1">
                      <FiMail className="text-lime" /> {developer.email}
                    </span>
                  )}
                  {developer.mobileNumber && (
                    <span className="flex items-center gap-1">
                      <FiPhone className="text-lime" /> {developer.mobileNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action button: Invite if current user is Problem Provider */}
            {currentUser &&
              currentUser.role === "PROBLEM_PROVIDER" &&
              currentUser._id !== developer._id && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenInviteModal}
                  className="w-full sm:w-auto"
                >
                  <FiSend className="w-4 h-4" />
                  <span>Invite to Lead Problem</span>
                </Button>
              )}
          </div>

          {/* Social / Portfolio Links */}
          <div className="flex items-center gap-3 pt-6 border-t border-hairline flex-wrap">
            {developer.githubProfile && (
              <Button
                variant="secondary"
                size="sm"
                href={developer.githubProfile}
                target="_blank"
                rel="noreferrer"
              >
                <FiGithub className="text-lime" />
                <span>GitHub</span>
                <FiExternalLink className="w-3 h-3 text-smoke" />
              </Button>
            )}
            {developer.linkedinOrPortfolio && (
              <Button
                variant="secondary"
                size="sm"
                href={developer.linkedinOrPortfolio}
                target="_blank"
                rel="noreferrer"
              >
                <FiLinkedin className="text-lime" />
                <span>LinkedIn / Portfolio</span>
                <FiExternalLink className="w-3 h-3 text-smoke" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Stats & Bio & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Reputation & Stats */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-smoke block">
                Reputation Score
              </span>
              <div className="text-3xl font-mono font-bold text-lime mt-1">
                {developer.reputation || 0}{" "}
                <span className="text-xs font-normal text-smoke">pts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-hairline font-mono">
              <div>
                <div className="text-xl font-bold text-paper">
                  {developer.projectsCompleted || 0}
                </div>
                <div className="text-xs text-smoke">Total Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-lime flex items-center gap-1">
                  <span>👑</span>
                  <span>{ledProjects.length || developer.projectsLed || 0}</span>
                </div>
                <div className="text-xs text-smoke">Projects Led</div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="pt-4 border-t border-hairline space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-smoke flex items-center gap-1.5">
                <FiAward className="w-4 h-4 text-lime" /> Earned Badges
              </span>
              {developer.badges && developer.badges.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {developer.badges.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-button bg-void border border-hairline flex items-center gap-2 text-xs font-mono text-bone"
                    >
                      <span>🏆</span>
                      <span className="font-semibold text-paper">{b}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-smoke italic">
                  No badges awarded yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Bio, Skills & Experience */}
        <Card className="md:col-span-2">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-smoke">
                About Developer
              </h3>
              <p className="text-xs font-mono text-bone leading-relaxed whitespace-pre-line bg-void p-4 rounded-button border border-hairline">
                {developer.bio || "No bio provided."}
              </p>
            </div>

            {developer.experience && (
              <div className="space-y-2 pt-4 border-t border-hairline">
                <h3 className="text-xs font-mono uppercase tracking-wider text-smoke">
                  Experience & Background
                </h3>
                <p className="text-xs font-mono text-bone leading-relaxed whitespace-pre-line bg-void p-4 rounded-button border border-hairline">
                  {developer.experience}
                </p>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-hairline">
              <h3 className="text-xs font-mono uppercase tracking-wider text-smoke">
                Verified Technical Skills
              </h3>
              {developer.skills && developer.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {developer.skills.map((s, idx) => (
                    <Badge key={idx} variant="neutral" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-smoke italic">
                  No skills listed.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership & Project Portfolio */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-lime" />
              <h2 className="text-xl sm:text-2xl font-bold text-paper font-display">
                Leadership & Project Portfolio
              </h2>
            </div>
            <p className="text-xs font-mono text-smoke mt-1">
              Verified projects architected and delivered by {developer.name} as Team Leader.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "led" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("led")}
            >
              <span>👑 Projects Led ({ledProjects.length})</span>
            </Button>

            {contributedProjects.length > 0 && (
              <Button
                variant={activeTab === "contributed" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("contributed")}
              >
                <span>👥 Contributions ({contributedProjects.length})</span>
              </Button>
            )}

            <Button
              variant={activeTab === "all" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("all")}
            >
              <span>All ({ledProjects.length + contributedProjects.length})</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              icon={FiSearch}
              placeholder="Search projects or skills..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "COMPLETED", "IN_DEVELOPMENT"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "primary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(st)}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {displayedProjects.length === 0 ? (
          <Card className="text-center py-16 px-6">
            <FiFolder className="w-12 h-12 text-iron mx-auto mb-3" />
            <h3 className="text-base font-semibold text-paper mb-1">
              No Projects Found
            </h3>
            <p className="text-xs font-mono text-smoke max-w-md mx-auto">
              {activeTab === "led"
                ? `${developer.name} hasn't published or delivered projects as a team leader matching this criteria yet.`
                : "No matching project history found."}
            </p>
          </Card>
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
                <Card
                  key={project._id}
                  hoverable
                  className={isLeader ? "border-l-4 border-l-lime" : ""}
                >
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isLeader ? (
                          <Badge variant="lime" size="sm">
                            👑 Team Leader
                            {leaderMember?.customRole && ` • ${leaderMember.customRole}`}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            <FiUsers className="w-3.5 h-3.5 text-lime" />
                            <span>Team Contributor</span>
                          </Badge>
                        )}

                        {getStatusBadge(project.status)}

                        {project.category && (
                          <Badge variant="neutral" size="sm">
                            {project.category}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs font-mono text-smoke flex items-center gap-1.5">
                        <FiClock className="w-3.5 h-3.5" />
                        {project.completionDate ? (
                          <span>
                            Delivered:{" "}
                            <strong className="text-paper">
                              {new Date(project.completionDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </strong>
                          </span>
                        ) : (
                          <span>Duration: {project.expectedDuration || "Active milestone"}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to={`/projects/${project._id}`}
                        className="text-xl sm:text-2xl font-bold text-paper hover:text-lime transition font-display flex items-center gap-2 group"
                      >
                        <span>{project.title}</span>
                        <FiChevronRight className="w-5 h-5 text-smoke group-hover:text-lime group-hover:translate-x-1 transition" />
                      </Link>

                      <div className="flex items-center gap-4 text-xs font-mono text-smoke flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <FiUser className="text-lime w-3.5 h-3.5" />
                          Client:{" "}
                          <strong className="text-paper">
                            {project.problemProvider?.organizationName ||
                              project.problemProvider?.name ||
                              "Verified Client"}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1.5">
                          <FiDollarSign className="text-lime w-3.5 h-3.5" />
                          Budget:{" "}
                          <strong className="text-paper">
                            {project.budgetType === "Volunteer"
                              ? "Volunteer Project"
                              : `${project.currency === "INR" ? "₹" : project.currency || "₹"}${
                                  project.budgetAmount?.toLocaleString() || 0
                                } (${project.budgetType || "Fixed"})`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-bone leading-relaxed bg-void p-4 rounded-button border border-hairline">
                      <p>{project.aiSummary || project.description}</p>
                    </div>

                    {(project.solution?.completionSummary ||
                      project.solution?.liveUrl ||
                      project.liveUrl ||
                      project.solution?.demoVideo) && (
                      <div className="p-4 sm:p-5 rounded-button bg-void border border-lime/30 space-y-3 font-mono text-xs">
                        <div className="font-semibold text-lime flex items-center gap-2">
                          <FiCheckCircle className="w-4 h-4 text-lime" />
                          <span>Delivered Solution & Production Deliverables</span>
                        </div>

                        {project.solution?.completionSummary && (
                          <p className="text-bone leading-relaxed">
                            {project.solution.completionSummary}
                          </p>
                        )}

                        <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                          {(project.solution?.liveUrl || project.liveUrl) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              href={project.solution?.liveUrl || project.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FiGlobe className="w-3.5 h-3.5 text-lime" />
                              <span>Live Application / Demo</span>
                              <FiExternalLink className="w-3 h-3 text-smoke" />
                            </Button>
                          )}

                          {project.solution?.demoVideo && (
                            <Button
                              variant="secondary"
                              size="sm"
                              href={project.solution.demoVideo}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FiPlayCircle className="w-3.5 h-3.5 text-lime" />
                              <span>Video Walkthrough</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {project.impact &&
                      (project.impact.peopleBenefited || project.impact.organizationsHelped) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-button bg-void border border-hairline font-mono text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-button bg-graphite border border-hairline text-lime flex items-center justify-center font-bold text-sm">
                              👥
                            </div>
                            <div>
                              <div className="text-sm font-bold text-paper">
                                {project.impact.peopleBenefited?.toLocaleString() || 0}+
                              </div>
                              <div className="text-[11px] text-smoke">People Benefited</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-button bg-graphite border border-hairline text-lime flex items-center justify-center font-bold text-sm">
                              🏢
                            </div>
                            <div>
                              <div className="text-sm font-bold text-paper">
                                {project.impact.organizationsHelped || 0}
                              </div>
                              <div className="text-[11px] text-smoke">Organizations Helped</div>
                            </div>
                          </div>

                          {project.impact.notes && (
                            <div className="sm:col-span-1 text-smoke italic flex items-center">
                              "{project.impact.notes}"
                            </div>
                          )}
                        </div>
                      )}

                    {project.teamMembers && project.teamMembers.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-hairline font-mono text-xs">
                        <div className="text-smoke flex items-center gap-1.5 uppercase tracking-wider">
                          <FiUsers className="w-3.5 h-3.5 text-lime" />
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
                                className={`p-2 rounded-button flex items-center gap-2 border ${
                                  isMemLeader
                                    ? "bg-carbon border-lime/40 text-paper"
                                    : "bg-void border-hairline text-bone"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                                    isMemLeader
                                      ? "bg-lime text-black"
                                      : "bg-graphite text-lime"
                                  }`}
                                >
                                  {member.user?.name ? member.user.name.charAt(0) : "M"}
                                </div>
                                <div className="leading-tight">
                                  <p className="font-semibold text-paper truncate max-w-[120px]">
                                    {member.user?.name || "Developer"}
                                  </p>
                                  <p className="text-[10px] text-smoke">
                                    {member.customRole || member.role}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-hairline">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs font-mono text-smoke mr-1 flex items-center gap-1">
                          <FiCode className="w-3.5 h-3.5 text-lime" /> Stack:
                        </span>
                        {project.requiredSkills && project.requiredSkills.length > 0 ? (
                          project.requiredSkills.map((sk, sIdx) => (
                            <Badge key={sIdx} variant="neutral" size="sm">
                              {sk}
                            </Badge>
                          ))
                        ) : project.preferredTechnologies ? (
                          project.preferredTechnologies.split(",").map((tech, tIdx) => (
                            <Badge key={tIdx} variant="neutral" size="sm">
                              {tech.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs font-mono text-smoke italic">Full Stack</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedSpecsProject(project)}
                        >
                          <FiInfo className="w-3.5 h-3.5 text-lime" />
                          <span>Inspect Specs</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Specifications & Blueprint Modal */}
      <Modal
        isOpen={Boolean(selectedSpecsProject)}
        onClose={() => setSelectedSpecsProject(null)}
        title={`${selectedSpecsProject?.title || "Problem"} — Blueprint & Specs`}
      >
        {selectedSpecsProject && (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <h4 className="text-smoke uppercase tracking-wider mb-1">
                Required Architecture Features
              </h4>
              <p className="text-bone leading-relaxed bg-void p-3 rounded-button border border-hairline">
                {selectedSpecsProject.requiredFeatures || "Features specified in project scope."}
              </p>
            </div>

            {selectedSpecsProject.aiSuggestedFeatures &&
              selectedSpecsProject.aiSuggestedFeatures.length > 0 && (
                <div>
                  <h4 className="text-smoke uppercase tracking-wider mb-2">
                    Delivered Feature Milestones
                  </h4>
                  <div className="space-y-1.5">
                    {selectedSpecsProject.aiSuggestedFeatures.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2.5 rounded-button bg-void border border-hairline flex items-start gap-2"
                      >
                        <FiCheckCircle className="w-3.5 h-3.5 text-lime mt-0.5 shrink-0" />
                        <span className="text-bone">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-button bg-void border border-hairline">
                <span className="text-smoke block text-[10px] uppercase">Complexity</span>
                <span className="font-bold text-paper">
                  {selectedSpecsProject.aiComplexity || "Standard Production"}
                </span>
              </div>
              <div className="p-3 rounded-button bg-void border border-hairline">
                <span className="text-smoke block text-[10px] uppercase">Client Org</span>
                <span className="font-bold text-paper truncate block">
                  {selectedSpecsProject.problemProvider?.organizationName ||
                    selectedSpecsProject.problemProvider?.name ||
                    "Verified Organization"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-hairline">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSpecsProject(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={`Invite ${developer.name} to Lead a Problem`}
      >
        {inviteSuccess ? (
          <div className="py-8 text-center space-y-3 font-mono">
            <FiCheckCircle className="w-12 h-12 text-lime mx-auto animate-bounce" />
            <p className="text-sm font-semibold text-paper">
              Invitation Sent Successfully!
            </p>
            <p className="text-xs text-smoke">
              The developer will be notified and can accept or decline.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            {inviteError && (
              <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-300 font-mono text-xs rounded-button">
                {inviteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-smoke uppercase tracking-wider mb-1">
                Select Project / Problem
              </label>
              {myProblems.length === 0 ? (
                <div className="p-3 bg-void border border-hairline text-xs font-mono text-smoke rounded-button">
                  You don't have any active open problems.{" "}
                  <Link to="/provider/create" className="text-lime underline">
                    Post a problem first.
                  </Link>
                </div>
              ) : (
                <Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                >
                  {myProblems.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.status})
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <Textarea
              label="Personal Note / Scope Summary (Optional)"
              rows={3}
              placeholder="e.g. We loved your leadership experience and would like you to lead this engineering team..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={inviting || myProblems.length === 0}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Container>
  );
};

export default DeveloperProfile;
