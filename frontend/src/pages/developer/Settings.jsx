import React, { useState, useContext, useEffect } from "react";
import { FiSave, FiUser, FiGithub, FiLinkedin, FiMapPin, FiPhone, FiCheck, FiCode } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";

const Settings = () => {
  const { user, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [githubProfile, setGithubProfile] = useState("");
  const [linkedinOrPortfolio, setLinkedinOrPortfolio] = useState("");
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  // Developer specific
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setMobileNumber(user.mobileNumber || "");
      setAddress(user.address || "");
      setBio(user.bio || "");
      setGithubProfile(user.githubProfile || "");
      setLinkedinOrPortfolio(user.linkedinOrPortfolio || "");
      setIsProfilePublic(user.isProfilePublic ?? true);

      if (user.role === "DEVELOPER") {
        setSkills(user.skills || []);
        setExperience(user.experience || "");
        setAvailability(user.availability ?? true);
      }
    }
  }, [user]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      name,
      mobileNumber,
      address,
      bio,
      githubProfile,
      linkedinOrPortfolio,
      isProfilePublic,
    };

    if (user?.role === "DEVELOPER") {
      payload.skills = skills;
      payload.experience = experience;
      payload.availability = availability;
    }

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setMessage("Profile and settings updated successfully!");
    } else {
      setError(res.error || "Failed to update profile.");
    }
  };

  return (
    <div className="page-container max-w-3xl space-y-6">
      <div className="section-header">
        <span className="badge badge-primary mb-2">Account Center</span>
        <h1 className="section-title">Profile & Preferences</h1>
        <p className="section-subtitle">
          Manage your personal details, developer skillset, and contact privacy settings.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <FiCheck className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Profile Details */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            General Information
          </h3>

          <div>
            <label className="input-label text-xs">Full Name / Org Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label text-xs">Mobile Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="input-label text-xs">City / Region (Address)</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, India"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="input-label text-xs">Bio / Summary (Max 500 chars)</label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Tell others about your background, interests, and expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="textarea-field text-xs"
            />
          </div>
        </div>

        {/* Links & Visibility */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Social & Online Presence
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label text-xs">GitHub Profile URL</label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={githubProfile}
                onChange={(e) => setGithubProfile(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="input-label text-xs">LinkedIn / Portfolio Website</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinOrPortfolio}
                onChange={(e) => setLinkedinOrPortfolio(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={(e) => setIsProfilePublic(e.target.checked)}
                className="w-4 h-4 rounded bg-dark-800 border-dark-600 text-primary-600 focus:ring-0"
              />
              <span className="text-xs text-gray-300">
                Make contact info (Email & Phone) visible on public profile
              </span>
            </label>
          </div>
        </div>

        {/* Developer Specific Profile Section */}
        {user?.role === "DEVELOPER" && (
          <div className="glass-card p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FiCode className="text-primary-400" />
              Developer Profile Skills & Availability
            </h3>

            {/* Skills Tag Editor */}
            <div className="space-y-2">
              <label className="input-label text-xs">Self-Declared Technical Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, Docker, TypeScript..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="input-field text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn-secondary btn-sm text-xs"
                >
                  Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="badge badge-primary text-xs py-1 px-3 flex items-center gap-1.5"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label text-xs">Professional Experience</label>
              <textarea
                rows={2}
                placeholder="e.g. 3 years building MERN apps and leading frontend teams..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="textarea-field text-xs"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability}
                  onChange={(e) => setAvailability(e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-800 border-dark-600 text-primary-600 focus:ring-0"
                />
                <span className="text-xs text-gray-300">
                  I am currently available to be invited or take on new projects
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
