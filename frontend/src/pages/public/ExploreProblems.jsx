import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiArrowRight,
  FiFilter,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Select,
} from "../../components/ui";

const ExploreProblems = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [budgetType, setBudgetType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Problem Providers manage their own challenges and are directed to find developers
  useEffect(() => {
    if (user?.role === "PROBLEM_PROVIDER") {
      navigate("/provider/find", { replace: true });
    }
  }, [user, navigate]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (skill) params.append("skill", skill);
      if (budgetType) params.append("budgetType", budgetType);
      if (status) params.append("status", status);
      params.append("excludeCompleted", "true");
      params.append("page", page);
      params.append("limit", 12);

      const res = await api.get(`/projects?${params.toString()}`);
      const activeProjects = (res.data.projects || []).filter(
        (p) => p.status !== "COMPLETED"
      );
      setProjects(activeProjects);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, skill, budgetType, status, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "OPEN":
        return <Badge variant="success" size="sm">OPEN</Badge>;
      case "LEADER_SELECTED":
      case "TEAM_FORMING":
        return <Badge variant="warning" size="sm">TEAM FORMING</Badge>;
      case "IN_DEVELOPMENT":
        return <Badge variant="lime" size="sm">IN DEVELOPMENT</Badge>;
      case "COMPLETED":
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{st}</Badge>;
    }
  };

  return (
    <Container className="space-y-8 py-8">
      {/* Header */}
      <PageHeader
        eyebrow="PROBLEM DIRECTORY"
        title="Discover Real-World Problems"
        description="Browse vetted community and non-profit challenges ready for high-impact software engineering teams."
      />

      {/* Filter and Search Card */}
      <Card className="p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              icon={FiSearch}
              placeholder="Search problems by title, keywords, requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md" icon={FiSearch}>
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-iron/60">
          <Input
            label="Category"
            placeholder="e.g. Healthcare..."
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          />

          <Input
            label="Skill"
            placeholder="e.g. React, Node.js..."
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setPage(1);
            }}
          />

          <Select
            label="Budget Type"
            value={budgetType}
            onChange={(e) => {
              setBudgetType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Budgets</option>
            <option value="Fixed">Fixed Budget</option>
            <option value="Negotiable">Negotiable</option>
            <option value="Volunteer">Volunteer / Free</option>
          </Select>

          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Active Statuses</option>
            <option value="OPEN">Open (Accepting)</option>
            <option value="TEAM_FORMING">Team Forming</option>
            <option value="IN_DEVELOPMENT">In Development</option>
          </Select>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-smoke font-mono">
        <span>Showing {projects.length} of {totalCount} problems</span>
        {(search || category || skill || budgetType || status !== "") && (
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setSkill("");
              setBudgetType("");
              setStatus("");
              setPage(1);
            }}
            className="text-lime hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-graphite rounded-inputs w-2/3" />
              <div className="h-3 bg-graphite rounded-inputs w-full" />
              <div className="h-3 bg-graphite rounded-inputs w-4/5" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center text-smoke space-y-3">
          <FiFilter className="w-8 h-8 text-iron mx-auto" />
          <h3 className="text-base font-bold text-white">No Problems Found</h3>
          <p className="text-xs text-smoke">
            Try adjusting your search criteria or category filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Card
              key={p._id}
              hoverable
              className="p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(p.status)}
                  {p.category && (
                    <span className="text-[11px] text-smoke font-mono truncate max-w-[120px]">
                      {p.category}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white hover:text-lime transition-colors leading-snug">
                  <Link to={`/projects/${p._id}`}>{p.title}</Link>
                </h3>

                <p className="text-xs text-smoke line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {/* Required Skills Chips */}
                {p.requiredSkills && p.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.requiredSkills.slice(0, 4).map((sk, idx) => (
                      <Badge key={idx} variant="neutral" size="sm" pill={false}>
                        {sk}
                      </Badge>
                    ))}
                    {p.requiredSkills.length > 4 && (
                      <span className="text-[10px] text-smoke self-center font-mono">
                        +{p.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Meta & Actions */}
              <div className="pt-4 border-t border-iron/60 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-smoke">
                    <FiDollarSign className="w-3.5 h-3.5 text-lime" />
                    <span>
                      {p.budgetType === "Volunteer"
                        ? "Volunteer"
                        : `${p.currency || "INR"} ${p.budgetAmount?.toLocaleString() || "Negotiable"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-smoke justify-end">
                    <FiUsers className="w-3.5 h-3.5 text-white" />
                    <span>
                      {p.teamMembers?.length || 0}/{p.maxTeamSize || 5} Team
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-smoke pt-1">
                  <span>
                    {p.projectLeader ? (
                      <span className="text-lime font-mono">
                        👑 {p.projectLeader.name}
                      </span>
                    ) : (
                      <span>Provider: {p.problemProvider?.name || "Community"}</span>
                    )}
                  </span>
                  {p.deadline && (
                    <span className="flex items-center gap-1 text-fog font-mono text-[10px]">
                      <FiCalendar className="w-3 h-3" />
                      {new Date(p.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <Button
                  to={`/projects/${p._id}`}
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={FiArrowRight}
                  iconPosition="right"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-xs text-smoke font-mono px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ExploreProblems;
