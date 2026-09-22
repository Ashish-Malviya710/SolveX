import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiAward,
  FiSend,
  FiUser,
  FiGithub,
  FiLinkedin,
  FiCheckCircle,
  FiFilter,
} from "react-icons/fi";
import api from "../../services/api";

const FindDevelopers = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState("");
  const [minProjects, setMinProjects] = useState("");
  const [availability, setAvailability] = useState("");
  const [search, setSearch] = useState("");

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [myProblems, setMyProblems] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (skill) params.append("skill", skill);
      if (minProjects) params.append("minProjects", minProjects);
      if (availability) params.append("availability", availability);
      params.append("limit", 20);

      const res = await api.get(`/developers/search?${params.toString()}`);
      setDevelopers(res.data.developers || []);
    } catch (err) {
      console.error("Failed to search developers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, skill, minProjects, availability]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const handleOpenInvite = async (dev) => {
    setSelectedDeveloper(dev);
    setInviteModalOpen(true);
    setInviteSuccess(false);
    setInviteError("");

    try {
      const res = await api.get("/projects/my-projects");
      const active = (res.data.projects || []).filter(
        (p) => ["OPEN", "LEADER_SELECTED", "TEAM_FORMING"].includes(p.status)
      );
      setMyProblems(active);
      if (active.length > 0) setSelectedProject(active[0]._id);
    } catch (err) {
      console.error("Failed to fetch my problems:", err);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setInviteError("Please select a project.");
      return;
    }
    setInviting(true);
    setInviteError("");
    try {
      await api.post(`/projects/${selectedProject}/invite/${selectedDeveloper._id}`, {
        message: inviteMessage,
      });
      setInviteSuccess(true);
      setTimeout(() => setInviteModalOpen(false), 1500);
    } catch (err) {
      setInviteError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="page-container space-y-8">
      <div className="section-header">
        <span className="badge badge-accent mb-2">Talent Discovery</span>
        <h1 className="section-title">Find & Invite Developers</h1>
        <p className="section-subtitle">
          Search for software engineers with verified reputations and invite them to lead or contribute to your challenge.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by developer name, bio, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-dark-700/60">
          <div>
            <label className="input-label text-xs">Required Skill</label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, Python..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="input-field py-2 text-xs"
            />
          </div>

          <div>
            <label className="input-label text-xs">Min Completed Projects</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 2"
              value={minProjects}
              onChange={(e) => setMinProjects(e.target.value)}
              className="input-field py-2 text-xs"
            />
          </div>

          <div>
            <label className="input-label text-xs">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="select-field py-2 text-xs"
            >
              <option value="">All Developers</option>
              <option value="true">Available Now</option>
              <option value="false">Busy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Developers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 space-y-3 animate-pulse">
              <div className="skeleton-avatar" />
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : developers.length === 0 ? (
        <div className="empty-state glass-card p-12">
          <FiFilter className="empty-state-icon" />
          <h3 className="text-base font-bold text-white mb-1">No Developers Found</h3>
          <p className="empty-state-text text-xs">Try loosening your skill or project filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <div
              key={dev._id}
              className="glass-card-hover p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="avatar w-12 h-12 text-base">
                    {dev.name?.charAt(0) || "D"}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-accent-400 font-display">
                      {dev.reputation || 0} pts
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {dev.projectsCompleted || 0} completed • {dev.projectsLed || 0} led
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white hover:text-primary-400 transition truncate">
                    <Link to={`/developers/${dev._id}`}>{dev.name}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {dev.bio || "Full stack developer ready for civic impact projects."}
                  </p>
                </div>

                {dev.skills && dev.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dev.skills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="badge badge-neutral text-[10px] py-0 px-2">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-dark-700/60 flex items-center gap-2">
                <button
                  onClick={() => handleOpenInvite(dev)}
                  className="btn-accent btn-sm flex-1 flex items-center justify-center gap-1 text-xs"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Invite to Problem</span>
                </button>
                <Link
                  to={`/developers/${dev._id}`}
                  className="btn-secondary btn-sm text-xs px-3"
                >
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && selectedDeveloper && (
        <div className="modal-overlay">
          <div className="modal-content space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <h3 className="text-base font-bold text-white">
                Invite {selectedDeveloper.name}
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center space-y-2">
                <FiCheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Invitation Sent!</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="input-label text-xs">Select Target Challenge / Problem</label>
                  {myProblems.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">
                      No active open problems found. Post a problem first.
                    </p>
                  ) : (
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="select-field text-xs"
                      required
                    >
                      {myProblems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="input-label text-xs">Personal Note (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe why you'd like this developer on your team..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || myProblems.length === 0}
                    className="btn-primary btn-sm"
                  >
                    {inviting ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDevelopers;
