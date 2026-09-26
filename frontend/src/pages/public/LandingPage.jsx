import React, { useState, useEffect, useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiCode,
  FiTerminal,
  FiPlusCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { getDashboardRoute } from "../../components/PublicOnlyRoute";
import api from "../../services/api";
import {
  Container,
  Card,
  Button,
  Badge,
} from "../../components/ui";

const LandingPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

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
    <div className="space-y-20 pb-20 bg-void text-paper">
      {/* HERO SECTION — ClickHouse Display Register */}
      <section className="pt-20 pb-16">
        <Container className="text-center space-y-8 max-w-4xl">
          {/* Eyebrow Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-pills bg-lime-dark border border-lime/30 text-lime font-mono text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-cursor-blink" />
            <span>AI-POWERED COLLABORATIVE DEVELOPMENT GRID</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
            Connect Real Problems with{" "}
            <span className="text-lime">Developers Who Deliver.</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-smoke leading-relaxed">
            SolveX turns community, NGO, and grassroots challenges into structured technical blueprints with Groq AI, coordinates team milestones, and verifies GitHub delivery.
          </p>

          {/* Two-Button Stack */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button to="/explore" variant="primary" size="lg" icon={FiArrowRight} iconPosition="right">
              Explore Open Problems
            </Button>
            <Button to="/register" variant="secondary" size="lg">
              Join as Developer / Provider
            </Button>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS LIFECYCLE */}
      <section>
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="eyebrow">STRUCTURED WORKFLOW</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From Raw Problem to Production Delivery
            </h2>
            <p className="text-smoke text-xs sm:text-sm">
              An orderly, transparent project lifecycle ensuring accountability and verified milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="p-6 space-y-4">
              <div className="w-8 h-8 rounded-inputs bg-graphite border border-iron text-lime font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white">AI Requirement Blueprint</h3>
              <p className="text-xs text-smoke leading-relaxed">
                NGOs describe challenges in plain words. Groq AI generates functional specifications, tech stack suggestions, and complexity breakdown automatically.
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="p-6 space-y-4">
              <div className="w-8 h-8 rounded-inputs bg-graphite border border-iron text-lime font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white">Leader &amp; Team Formation</h3>
              <p className="text-xs text-smoke leading-relaxed">
                Developers apply or receive invitations. The first selected developer becomes Project Leader, recruits up to the team cap, and submits the milestone proposal.
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="p-6 space-y-4">
              <div className="w-8 h-8 rounded-inputs bg-graphite border border-iron text-lime font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white">GitHub Build &amp; Sign-off</h3>
              <p className="text-xs text-smoke leading-relaxed">
                Code is developed on GitHub with commit tracking. On final deployment, the Problem Provider approves the solution and awards verified reputation points.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* FEATURED COMPLETED SHOWCASE */}
      <section>
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-iron/60 pb-4">
            <div>
              <span className="eyebrow">VERIFIED IMPACT</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Featured Completed Solutions
              </h2>
              <p className="text-smoke text-xs sm:text-sm mt-1">
                Real-world software built by SolveX teams actively serving communities.
              </p>
            </div>
            <Link to="/showcase" className="text-xs text-lime hover:underline flex items-center gap-1 font-mono">
              View All Showcase <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 space-y-3 animate-pulse">
                  <div className="h-5 bg-graphite rounded-inputs w-2/3" />
                  <div className="h-3 bg-graphite rounded-inputs w-full" />
                  <div className="h-3 bg-graphite rounded-inputs w-4/5" />
                </Card>
              ))}
            </div>
          ) : featuredProjects.length === 0 ? (
            <Card className="p-8 text-center text-smoke text-sm">
              Completed solutions will be highlighted here.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((p) => (
                <Card key={p._id} hoverable className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="success" size="sm">COMPLETED</Badge>
                      <span className="text-[11px] text-smoke font-mono">{p.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-lime transition-colors">
                      <Link to={`/projects/${p._id}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-smoke line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-iron/60 space-y-3 text-xs">
                    {p.impact?.peopleBenefited > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-smoke">Beneficiaries:</span>
                        <span className="font-mono font-bold text-lime">
                          {p.impact.peopleBenefited.toLocaleString()}+
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-smoke">Project Leader:</span>
                      <span className="font-medium text-bone">{p.projectLeader?.name || "Anonymous"}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button to={`/projects/${p._id}`} variant="secondary" size="sm" className="w-full">
                        View Story
                      </Button>
                      {p.solution?.liveUrl && (
                        <Button href={p.solution.liveUrl} variant="primary" size="sm" className="w-full">
                          Live Demo
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* TOP PERFORMERS LEADERBOARD */}
      <section>
        <Container>
          <Card className="p-6 sm:p-10 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-iron/60 pb-4">
              <div>
                <span className="eyebrow">HALL OF FAME</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Top Performing Developers
                </h2>
                <p className="text-xs text-smoke mt-0.5">
                  Ranked by verified milestone completions and leadership history.
                </p>
              </div>
              <Button to="/developers" variant="secondary" size="sm" icon={FiAward}>
                Full Leaderboard
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topDevelopers.map((dev, idx) => (
                <div
                  key={dev._id}
                  className="bg-void/60 border border-iron/70 rounded-inputs p-4 flex items-start gap-3.5 hover:border-steel transition-colors"
                >
                  <div className="w-8 h-8 rounded-inputs bg-graphite border border-iron flex-shrink-0 flex items-center justify-center text-lime font-mono font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate hover:text-lime transition-colors">
                      <Link to={`/developers/${dev._id}`}>{dev.name}</Link>
                    </h4>
                    <p className="text-xs font-mono font-semibold text-lime">{dev.reputation || 0} Points</p>
                    <p className="text-[11px] text-smoke">
                      {dev.projectsCompleted || 0} completed • {dev.projectsLed || 0} led
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      {/* CALL TO ACTION — Terminal Install Box Register */}
      <section>
        <Container size="narrow" className="text-center">
          <Card className="p-10 sm:p-12 space-y-6">
            <span className="eyebrow">GET STARTED</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Build High-Impact Software?
            </h2>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-smoke leading-relaxed">
              Join SolveX as a developer to boost your verified portfolio, or as a community organizer to turn your challenge into working code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button to="/register" variant="primary" size="md">
                Create Your Account
              </Button>
              <Button to="/explore" variant="secondary" size="md">
                Browse Problems
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;
