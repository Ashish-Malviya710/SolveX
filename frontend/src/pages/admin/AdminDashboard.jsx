import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiShield,
  FiTrash2,
  FiSlash,
  FiCheckCircle,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";

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
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="badge badge-warning mb-1 flex items-center gap-1 w-fit">
            <FiShield className="w-3 h-3" /> System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Monitor platform usage metrics, manage user accounts, and oversee projects.
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm flex items-center gap-1.5">
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")}>✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")}>✕</button>
        </div>
      )}

      {/* Platform Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white font-display">{stats.totalUsers}</div>
            <div className="text-[11px] text-gray-400">Total Users</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-primary-400 font-display">
              {stats.totalDevelopers}
            </div>
            <div className="text-[11px] text-gray-400">Developers</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-400 font-display">
              {stats.totalProviders}
            </div>
            <div className="text-[11px] text-gray-400">Providers</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white font-display">
              {stats.totalProjects}
            </div>
            <div className="text-[11px] text-gray-400">Total Projects</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-display">
              {stats.completedProjects}
            </div>
            <div className="text-[11px] text-gray-400">Completed</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-400 font-display">
              {stats.openProjects}
            </div>
            <div className="text-[11px] text-gray-400">Open Challenges</div>
          </div>
        </div>
      )}

      {/* Management Tables */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        {/* Sub-tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-700/60 flex-wrap gap-4">
          <div className="tab-list">
            <button
              onClick={() => setActiveTab("users")}
              className={activeTab === "users" ? "tab-item-active" : "tab-item"}
            >
              <div className="flex items-center gap-1.5">
                <FiUsers className="w-4 h-4" />
                <span>Users ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={activeTab === "projects" ? "tab-item-active" : "tab-item"}
            >
              <div className="flex items-center gap-1.5">
                <FiFolder className="w-4 h-4" />
                <span>Projects ({projects.length})</span>
              </div>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={activeTab === "users" ? "Search users..." : "Search projects..."}
              value={activeTab === "users" ? userSearch : projectSearch}
              onChange={(e) =>
                activeTab === "users"
                  ? setUserSearch(e.target.value)
                  : setProjectSearch(e.target.value)
              }
              className="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <div className="table-container">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">User</th>
                  <th className="table-cell">Role</th>
                  <th className="table-cell">Email</th>
                  <th className="table-cell">Reputation</th>
                  <th className="table-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="table-row">
                    <td className="table-cell font-medium text-white">{u.name}</td>
                    <td className="table-cell">
                      <span className="badge badge-primary text-[10px]">{u.role}</span>
                    </td>
                    <td className="table-cell text-gray-400">{u.email}</td>
                    <td className="table-cell text-accent-400 font-bold">{u.reputation || 0}</td>
                    <td className="table-cell text-right">
                      {u.role !== "ADMIN" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSuspendUser(u._id)}
                            className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-dark-800 rounded-lg transition"
                            title="Suspend user"
                          >
                            <FiSlash className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition"
                            title="Delete user"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Projects Table */}
        {activeTab === "projects" && (
          <div className="table-container">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Title</th>
                  <th className="table-cell">Provider</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell font-medium text-white">
                      <Link to={`/projects/${p._id}`} className="hover:text-primary-400">
                        {p.title}
                      </Link>
                    </td>
                    <td className="table-cell text-gray-400">{p.problemProvider?.name}</td>
                    <td className="table-cell">
                      <span className="badge badge-neutral text-[10px]">{p.status}</span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleRemoveProject(p._id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition"
                        title="Delete project"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
