import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiShield,
  FiTrash2,
  FiSlash,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, projectsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/admin/users?search=${encodeURIComponent(userSearch)}`),
        api.get(`/admin/projects?search=${encodeURIComponent(projectSearch)}`),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data.projects || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userSearch, projectSearch]);

  const handleSuspendUser = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this user?")) return;
    try {
      await api.put(`/admin/users/${id}/suspend`);
      setActionSuccess("User suspended successfully.");
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to suspend user.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setActionSuccess("User deleted permanently.");
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleRemoveProject = async (id) => {
    if (!window.confirm("Are you sure you want to remove this project?")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setActionSuccess("Project removed successfully.");
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to remove project.");
    }
  };

  return (
    <Container className="space-y-8 py-8">
      {/* Header */}
      <PageHeader
        eyebrow="SYSTEM ADMINISTRATION"
        title="Admin Console"
        description="Monitor system-wide platform metrics, audit developer and provider accounts, and moderate community projects."
        actions={
          <Button onClick={fetchData} variant="secondary" size="sm" icon={FiRefreshCw} loading={loading}>
            Refresh
          </Button>
        }
      />

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-inputs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-smoke hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-inputs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="text-smoke hover:text-white">✕</button>
        </div>
      )}

      {/* Platform Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-white font-mono">{stats.totalUsers}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Total Users</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-lime font-mono">{stats.totalDevelopers}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Developers</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-white font-mono">{stats.totalProviders}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Providers</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-white font-mono">{stats.totalProjects}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Total Projects</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.completedProjects}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats.openProjects}</div>
            <div className="text-[11px] text-smoke uppercase tracking-wider font-mono mt-1">Open Challenges</div>
          </Card>
        </div>
      )}

      {/* Management Tables */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Sub-tabs & Search */}
        <div className="flex items-center justify-between pb-4 border-b border-iron/60 flex-wrap gap-4">
          <div className="flex gap-1.5 p-1 bg-void border border-iron rounded-inputs">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-inputs text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-carbon text-white border border-iron"
                  : "text-smoke hover:text-white"
              }`}
            >
              <FiUsers className="w-3.5 h-3.5 text-lime" />
              <span>Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded-inputs text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "projects"
                  ? "bg-carbon text-white border border-iron"
                  : "text-smoke hover:text-white"
              }`}
            >
              <FiFolder className="w-3.5 h-3.5 text-lime" />
              <span>Projects ({projects.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="w-64">
            <Input
              icon={FiSearch}
              placeholder={activeTab === "users" ? "Search users..." : "Search projects..."}
              value={activeTab === "users" ? userSearch : projectSearch}
              onChange={(e) =>
                activeTab === "users"
                  ? setUserSearch(e.target.value)
                  : setProjectSearch(e.target.value)
              }
              className="py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-semibold text-white">{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "DEVELOPER" ? "lime" : "neutral"} size="sm">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-smoke text-xs">{u.email}</TableCell>
                  <TableCell className="font-mono font-bold text-lime">{u.reputation || 0} pts</TableCell>
                  <TableCell className="text-right">
                    {u.role !== "ADMIN" && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSuspendUser(u._id)}
                          className="p-1.5 text-smoke hover:text-amber-400 hover:bg-graphite rounded-inputs transition-colors"
                          title="Suspend user"
                        >
                          <FiSlash className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-smoke hover:text-red-400 hover:bg-graphite rounded-inputs transition-colors"
                          title="Delete user"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Projects Table */}
        {activeTab === "projects" && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Title</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-semibold text-white">
                    <Link to={`/projects/${p._id}`} className="hover:text-lime transition-colors">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-smoke">{p.problemProvider?.name}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleRemoveProject(p._id)}
                      className="p-1.5 text-smoke hover:text-red-400 hover:bg-graphite rounded-inputs transition-colors"
                      title="Delete project"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Container>
  );
};

export default AdminDashboard;
