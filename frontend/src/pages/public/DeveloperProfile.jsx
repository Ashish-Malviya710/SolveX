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
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const DeveloperProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
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
        (p) => ["OPEN", "LEADER_SELECTED", "TEAM_FORMING"].includes(p.status)
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
      setInviteError("Please select an active project to invite this developer to.");
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
      setInviteError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container max-w-4xl py-12 space-y-6">
        <div className="glass-card p-8 animate-pulse space-y-4">
          <div className="skeleton-avatar w-20 h-20" />
          <div className="skeleton-title" />
          <div className="skeleton-text" />
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="page-container text-center py-20">
        <div className="glass-card max-w-md mx-auto p-8 space-y-4">
          <FiUser className="w-12 h-12 text-dark-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Developer Not Found</h2>
          <p className="text-xs text-gray-400">This profile does not exist or has been removed.</p>
          <Link to="/developers" className="btn-secondary btn-sm inline-block">
            Back to Top Developers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl space-y-8">
      {/* Profile Header Card */}
      <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-glow-md flex-shrink-0">
              {developer.name ? developer.name.charAt(0).toUpperCase() : "D"}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  {developer.name}
                </h1>
                {developer.availability ? (
                  <span className="badge badge-success text-xs py-0.5 px-2.5">
                    ● Available for Projects
                  </span>
                ) : (
                  <span className="badge badge-neutral text-xs py-0.5 px-2.5">
                    ● Currently Busy
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                {developer.address && (
                  <span className="flex items-center gap-1">
                    <FiMapPin className="text-primary-400" /> {developer.address}
                  </span>
                )}
                {developer.email && (
                  <span className="flex items-center gap-1">
                    <FiMail className="text-accent-400" /> {developer.email}
                  </span>
                )}
                {developer.mobileNumber && (
                  <span className="flex items-center gap-1">
                    <FiPhone className="text-emerald-400" /> {developer.mobileNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action button: Invite if current user is Problem Provider or Leader */}
          {currentUser && currentUser.role === "PROBLEM_PROVIDER" && currentUser._id !== developer._id && (
            <button
              onClick={handleOpenInviteModal}
              className="btn-accent flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <FiSend className="w-4 h-4" />
              <span>Invite to Problem</span>
            </button>
          )}
        </div>

        {/* Social / Portfolio Links */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-dark-700/60 flex-wrap">
          {developer.githubProfile && (
            <a
              href={developer.githubProfile}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiGithub className="w-4 h-4 text-emerald-400" />
              <span>GitHub</span>
              <FiExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          )}
          {developer.linkedinOrPortfolio && (
            <a
              href={developer.linkedinOrPortfolio}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm flex items-center gap-2 text-xs"
            >
              <FiLinkedin className="w-4 h-4 text-primary-400" />
              <span>LinkedIn / Portfolio</span>
              <FiExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Stats & Bio & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Reputation & Stats */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <span className="input-label text-xs">Reputation Score</span>
            <div className="text-3xl font-extrabold text-accent-400 font-display mt-1">
              {developer.reputation || 0} <span className="text-sm font-normal text-gray-400">pts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-700/60">
            <div>
              <div className="text-xl font-bold text-white font-display">
                {developer.projectsCompleted || 0}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-400 font-display">
                {developer.projectsLed || 0}
              </div>
              <div className="text-xs text-gray-400">Projects Led</div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="pt-4 border-t border-dark-700/60 space-y-3">
            <span className="input-label text-xs flex items-center gap-1.5 text-amber-300">
              <FiAward className="w-4 h-4" /> Earned Badges
            </span>
            {developer.badges && developer.badges.length > 0 ? (
              <div className="flex flex-col gap-2">
                {developer.badges.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-dark-900/60 border border-dark-700/60 flex items-center gap-2 text-xs text-gray-200"
                  >
                    <span className="text-base">🏆</span>
                    <span className="font-semibold">{b}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No badges awarded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Bio, Skills & Experience */}
        <div className="md:col-span-2 glass-card p-6 sm:p-8 space-y-6">
          {/* Bio */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              About Developer
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {developer.bio || "No bio provided."}
            </p>
          </div>

          {/* Experience */}
          {developer.experience && (
            <div className="space-y-2 pt-4 border-t border-dark-700/60">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Experience & Background
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {developer.experience}
              </p>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2 pt-4 border-t border-dark-700/60">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Verified & Self-Declared Skills
            </h3>
            {developer.skills && developer.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {developer.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="badge badge-primary text-xs py-1 px-3 border border-primary-500/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No skills listed.</p>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiSend className="text-accent-400" />
                Invite {developer.name} to a Problem
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center space-y-2">
                <FiCheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Invitation Sent Successfully!</p>
                <p className="text-xs text-gray-400">
                  The developer will be notified and can accept or decline.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="input-label text-xs">Select Project / Problem</label>
                  {myProblems.length === 0 ? (
                    <div className="p-3 bg-dark-900/60 border border-dark-700 text-xs text-gray-400 rounded-xl">
                      You don't have any active open problems.{" "}
                      <Link to="/provider/create" className="text-primary-400 underline">
                        Post a problem first.
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="select-field text-xs"
                      required
                    >
                      {myProblems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="input-label text-xs">Personal Note / Scope Summary (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. We loved your MERN stack experience and would like you to lead this project..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="textarea-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
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
                    className="btn-primary btn-sm disabled:opacity-50"
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

export default DeveloperProfile;
