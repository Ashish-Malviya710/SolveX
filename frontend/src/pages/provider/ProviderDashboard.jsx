import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiPlusCircle,
  FiFolder,
  FiUsers,
  FiArrowRight,
  FiSearch,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
} from "../../components/ui";

const ProviderDashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to load provider projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProviderProjects();
  }, []);

  const openCount = projects.filter((p) => p.status === "OPEN").length;
  const inDevCount = projects.filter((p) => p.status === "IN_DEVELOPMENT").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <Container className="space-y-8 py-8">
      {/* Header */}
      <PageHeader
        eyebrow="PROVIDER HEADQUARTERS"
        title={user?.name || "Provider"}
        description="Create real-world problem challenges, recruit skilled developers, and coordinate milestone delivery with your teams."
        actions={
          <>
            <Button to="/provider/create" variant="primary" size="sm" icon={FiPlusCircle}>
              Post New Problem
            </Button>
            <Button to="/provider/find" variant="secondary" size="sm" icon={FiSearch}>
              Find Developers
            </Button>
          </>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Total Challenges
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {projects.length}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">Created Problems</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Open For Requests
          </span>
          <div className="text-3xl font-extrabold text-lime font-mono mt-1">
            {openCount}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">Accepting Devs</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            In Development
          </span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {inDevCount}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">Active Build Phase</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-smoke">
            Completed Solutions
          </span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {completedCount}
          </div>
          <span className="text-[11px] text-smoke mt-1 block">Delivered &amp; Signed Off</span>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiFolder className="text-lime w-4 h-4" />
            My Posted Problems &amp; Projects
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-graphite rounded-inputs w-2/3" />
                <div className="h-3 bg-graphite rounded-inputs w-full" />
                <div className="h-3 bg-graphite rounded-inputs w-4/5" />
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center text-smoke text-sm space-y-4">
            <p>You haven't posted any real-world problems yet.</p>
            <Button to="/provider/create" variant="primary" size="sm" icon={FiPlusCircle}>
              Create Your First Problem
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Card key={p._id} hoverable className="p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        p.status === "COMPLETED"
                          ? "success"
                          : p.status === "IN_DEVELOPMENT"
                          ? "lime"
                          : p.status === "OPEN"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {p.status.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] text-smoke font-mono">{p.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-lime transition-colors">
                    <Link to={`/projects/${p._id}`}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-smoke line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-iron/60 flex items-center justify-between text-xs">
                  <span className="text-smoke">
                    Leader:{" "}
                    <strong className="text-bone">
                      {p.projectLeader?.name || "Not assigned yet"}
                    </strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/provider/requests"
                      className="text-smoke hover:text-lime text-xs font-mono transition-colors"
                    >
                      Applicants
                    </Link>
                    <Button to={`/projects/${p._id}`} variant="secondary" size="sm" icon={FiArrowRight} iconPosition="right">
                      Workspace
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ProviderDashboard;
