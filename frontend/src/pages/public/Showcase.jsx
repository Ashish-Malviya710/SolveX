import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiExternalLink,
  FiGithub,
  FiHeart,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
} from "../../components/ui";

const Showcase = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/showcase?limit=20");
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to load showcase:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  return (
    <Container className="space-y-8 py-8">
      {/* Header */}
      <PageHeader
        eyebrow="VERIFIED SOCIAL SOLUTIONS"
        title="Completed Projects Showcase"
        description="Explore production software solutions built by SolveX developer teams to address real-world community and NGO challenges."
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-graphite rounded-inputs w-2/3" />
              <div className="h-3 bg-graphite rounded-inputs w-full" />
              <div className="h-3 bg-graphite rounded-inputs w-4/5" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center text-smoke space-y-3">
          <FiLayers className="w-8 h-8 text-iron mx-auto" />
          <h3 className="text-base font-bold text-white">Showcase Empty</h3>
          <p className="text-xs text-smoke">
            Completed projects with verified provider sign-offs will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Card
              key={p._id}
              hoverable
              className="p-7 flex flex-col justify-between space-y-6"
            >
              {/* Top Meta & Title */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="success" size="sm">
                    <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                    Verified Completion
                  </Badge>
                  <span className="text-xs text-smoke font-mono font-medium">{p.category}</span>
                </div>

                <h3 className="text-xl font-bold text-white hover:text-lime transition-colors">
                  <Link to={`/projects/${p._id}`}>{p.title}</Link>
                </h3>

                <p className="text-xs sm:text-sm text-smoke leading-relaxed">
                  {p.solution?.completionSummary || p.description}
                </p>

                {/* Impact Highlights Box */}
                {(p.impact?.peopleBenefited > 0 || p.impact?.organizationsHelped > 0 || p.impact?.notes) && (
                  <div className="bg-void/60 border border-iron/80 rounded-inputs p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-lime uppercase tracking-wider">
                      <FiHeart className="w-3.5 h-3.5" />
                      Reported Social Impact
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
                      {p.impact?.peopleBenefited > 0 && (
                        <div>
                          <div className="text-xl font-bold text-white">
                            {p.impact.peopleBenefited.toLocaleString()}+
                          </div>
                          <div className="text-[11px] text-smoke">People Benefited</div>
                        </div>
                      )}
                      {p.impact?.organizationsHelped > 0 && (
                        <div>
                          <div className="text-xl font-bold text-white">
                            {p.impact.organizationsHelped}
                          </div>
                          <div className="text-[11px] text-smoke">Organizations Helped</div>
                        </div>
                      )}
                    </div>
                    {p.impact?.notes && (
                      <p className="text-xs text-smoke pt-1 italic">
                        "{p.impact.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Required / Used Skills */}
                {p.requiredSkills && p.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.requiredSkills.map((sk, idx) => (
                      <Badge key={idx} variant="neutral" size="sm" pill={false}>
                        {sk}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Credits & External Links */}
              <div className="pt-4 border-t border-iron/60 space-y-4">
                <div className="flex items-center justify-between text-xs text-smoke">
                  <span>
                    Provider: <strong className="text-bone">{p.problemProvider?.name || "NGO"}</strong>
                  </span>
                  <span>
                    Leader: <strong className="text-lime">{p.projectLeader?.name || "Developer"}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  {p.solution?.liveUrl && (
                    <Button
                      href={p.solution.liveUrl}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      icon={FiExternalLink}
                    >
                      Live Deployed App
                    </Button>
                  )}
                  {p.githubRepoUrl && (
                    <Button
                      href={p.githubRepoUrl}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      icon={FiGithub}
                    >
                      View GitHub
                    </Button>
                  )}
                  <Button
                    to={`/projects/${p._id}`}
                    variant="outline"
                    size="sm"
                  >
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default Showcase;
