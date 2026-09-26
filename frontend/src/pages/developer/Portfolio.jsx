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
  FiPlayCircle,
  FiUser,
  FiChevronRight,
  FiLayers,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
} from "../../components/ui";

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
    const leaderId =
      project.projectLeader?._id?.toString() ||
      project.projectLeader?.toString();
    if (leaderId === userId) return true;
    return project.teamMembers?.some(
      (m) =>
        (m.user?._id?.toString() === userId ||
          m.user?.toString() === userId) &&
        m.role === "Leader"
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
          <Badge variant="success" size="sm">
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Completed & Delivered</span>
          </Badge>
        );
      case "IN_DEVELOPMENT":
        return (
          <Badge variant="lime" size="sm">
            <FiCode className="w-3.5 h-3.5" />
            <span>In Development</span>
          </Badge>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <Badge variant="warning" size="sm">
            <FiClock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="success" size="sm">
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Approved</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            <FiLayers className="w-3.5 h-3.5" />
            <span>{status?.replace(/_/g, " ")}</span>
          </Badge>
        );
    }
  };

  return (
    <Container className="py-8 max-w-5xl space-y-8">
      {/* Portfolio Header Card */}
      <Card>
        <CardContent className="p-8 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-graphite border border-hairline flex items-center justify-center text-lime font-mono font-bold text-3xl shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-paper font-display">
                    {user?.name}
                  </h1>
                  <Badge variant="lime" size="sm">
                    Verified Developer
                  </Badge>
                  {ledProjects.length > 0 && (
                    <Badge variant="warning" size="sm">
                      👑 Verified Project Leader
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-smoke max-w-xl leading-relaxed">
                  {user?.bio ||
                    "Full stack software engineer contributing to verified social impact solutions."}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              to="/settings"
              className="self-end sm:self-center"
            >
              <FiSettings className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          </div>

          {/* Links & Public profile */}
          <div className="flex items-center gap-3 pt-6 border-t border-hairline flex-wrap">
            {user?.githubProfile && (
              <Button
                variant="secondary"
                size="sm"
                href={user.githubProfile}
                target="_blank"
                rel="noreferrer"
              >
                <FiGithub className="text-lime" />
                <span>GitHub</span>
              </Button>
            )}
            {user?.linkedinOrPortfolio && (
              <Button
                variant="secondary"
                size="sm"
                href={user.linkedinOrPortfolio}
                target="_blank"
                rel="noreferrer"
              >
                <FiLinkedin className="text-lime" />
                <span>LinkedIn</span>
              </Button>
            )}
            <Link
              to={`/developers/${user?._id}`}
              className="text-xs font-mono text-lime hover:underline ml-auto flex items-center gap-1"
            >
              <span>View Public Profile</span>
              <FiExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats & Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Reputation & Badges */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-smoke block">
                Platform Reputation
              </span>
              <div className="text-3xl font-mono font-bold text-lime mt-1">
                {user?.reputation || 0}{" "}
                <span className="text-xs font-normal text-smoke">pts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-hairline font-mono">
              <div>
                <div className="text-xl font-bold text-paper">
                  {user?.projectsCompleted || 0}
                </div>
                <div className="text-xs text-smoke">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-lime flex items-center gap-1">
                  <span>👑</span>
                  <span>{ledProjects.length || user?.projectsLed || 0}</span>
                </div>
                <div className="text-xs text-smoke">Projects Led</div>
              </div>
            </div>

            {/* Badges Box */}
            <div className="pt-4 border-t border-hairline space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-smoke flex items-center gap-1.5">
                <FiAward className="w-4 h-4 text-lime" /> Earned Badges
              </span>
              {user?.badges && user.badges.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {user.badges.map((b, idx) => (
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
                  Complete challenges to earn reputation badges!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Technical Skills & Experience */}
        <Card className="md:col-span-2">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-smoke">
                Technical Skillset
              </h3>
              {user?.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.skills.map((s, idx) => (
                    <Badge key={idx} variant="neutral" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-smoke italic">
                  No skills listed yet. Add skills in Settings.
                </p>
              )}
            </div>

            {user?.experience && (
              <div className="space-y-2 pt-4 border-t border-hairline">
                <h3 className="text-xs font-mono uppercase tracking-wider text-smoke">
                  Engineering Experience
                </h3>
                <p className="text-xs font-mono text-bone leading-relaxed whitespace-pre-line bg-void p-4 rounded-button border border-hairline">
                  {user.experience}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Showcase Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-lime" />
              <h2 className="text-xl sm:text-2xl font-bold text-paper font-display">
                Projects Portfolio & Leadership Record
              </h2>
            </div>
            <p className="text-xs font-mono text-smoke mt-1">
              Verified projects delivered as Leader or Contributor on SolveX.
            </p>
          </div>

          {/* Filter Tabs */}
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
              <span>All ({allProjects.length})</span>
            </Button>
          </div>
        </div>

        {/* Project Cards */}
        {loading ? (
          <Card className="animate-pulse p-8">
            <div className="h-4 bg-graphite rounded w-1/3 mb-2" />
            <div className="h-3 bg-graphite rounded w-2/3" />
          </Card>
        ) : displayedProjects.length === 0 ? (
          <Card className="text-center py-16 px-6">
            <FiFolder className="w-12 h-12 text-iron mx-auto mb-3" />
            <h3 className="text-base font-semibold text-paper mb-1">
              No Projects in this View
            </h3>
            <p className="text-xs font-mono text-smoke max-w-md mx-auto mb-4">
              {activeTab === "led"
                ? "You haven't led any project teams yet. Apply to lead an open problem on the Explore page!"
                : "No project contributions recorded."}
            </p>
            {activeTab === "led" && (
              <Button variant="primary" size="sm" to="/explore">
                Explore Problems to Lead
              </Button>
            )}
          </Card>
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
                <Card
                  key={project._id}
                  hoverable
                  className={isLeader ? "border-l-4 border-l-lime" : ""}
                >
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Top Bar */}
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
                        <FiClock className="w-3.5 h-3.5 text-smoke" />
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

                    {/* Title & Client Metadata */}
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

                    {/* Problem Description */}
                    <div className="text-xs font-mono text-bone leading-relaxed bg-void p-4 rounded-button border border-hairline">
                      <p>{project.aiSummary || project.description}</p>
                    </div>

                    {/* Deliverables */}
                    {(project.solution?.completionSummary ||
                      project.solution?.liveUrl ||
                      project.liveUrl ||
                      project.solution?.demoVideo) && (
                      <div className="p-4 sm:p-5 rounded-button bg-void border border-lime/30 space-y-3 font-mono text-xs">
                        <div className="font-semibold text-lime flex items-center gap-2">
                          <FiCheckCircle className="w-4 h-4 text-lime" />
                          <span>Delivered Solution & Deliverables</span>
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

                    {/* Impact */}
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

                    {/* Team Members */}
                    {project.teamMembers && project.teamMembers.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-hairline">
                        <div className="text-xs font-mono uppercase tracking-wider text-smoke flex items-center gap-1.5">
                          <FiUsers className="w-3.5 h-3.5 text-lime" />
                          <span>
                            Engineering Team ({project.teamMembers.length} / {project.maxTeamSize || 5} members)
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
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

                    {/* Footer & Stack */}
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

                      <Button
                        variant="secondary"
                        size="sm"
                        to={`/projects/${project._id}`}
                        className="self-end sm:self-center"
                      >
                        <span>View Workspace</span>
                        <FiExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Portfolio;
