import React, { useState, useContext, useEffect } from "react";
import {
  FiSave,
  FiCheck,
  FiCode,
  FiX,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import {
  Container,
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
} from "../../components/ui";

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
      setMessage("Profile and preferences updated successfully!");
    } else {
      setError(res.error || "Failed to update profile.");
    }
  };

  return (
    <Container className="py-8 max-w-3xl">
      <PageHeader
        eyebrow="Account Center"
        title="Profile & Preferences"
        description="Manage your personal details, developer skillset, and contact privacy settings."
      />

      {message && (
        <div className="mb-6 p-3.5 bg-lime/10 border border-lime/30 text-lime text-xs font-mono rounded-button flex items-center gap-2">
          <FiCheck className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3.5 bg-red-950/30 border border-red-500/40 text-red-300 text-xs font-mono rounded-button">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name / Display Name *"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="+91 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />

              <Input
                label="City / Region"
                type="text"
                placeholder="e.g. Mumbai, India"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Textarea
              label="Bio / Summary (Max 500 chars)"
              rows={3}
              maxLength={500}
              placeholder="Tell others about your background, interests, and expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Links & Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Social & Online Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub Profile URL"
                type="url"
                icon={FiGithub}
                placeholder="https://github.com/username"
                value={githubProfile}
                onChange={(e) => setGithubProfile(e.target.value)}
              />

              <Input
                label="LinkedIn / Portfolio Website"
                type="url"
                icon={FiLinkedin}
                placeholder="https://linkedin.com/in/username"
                value={linkedinOrPortfolio}
                onChange={(e) => setLinkedinOrPortfolio(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProfilePublic}
                  onChange={(e) => setIsProfilePublic(e.target.checked)}
                  className="w-4 h-4 rounded bg-void border-hairline text-lime focus:ring-0 accent-lime cursor-pointer"
                />
                <span className="text-xs font-mono text-bone">
                  Make contact info (Email & Phone) visible on public profile
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Developer Specific Profile Section */}
        {user?.role === "DEVELOPER" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiCode className="w-4 h-4 text-lime" />
                <span>Developer Profile & Skills</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Skills Tag Editor */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-smoke uppercase tracking-wider">
                  Technical Skills
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. React, Docker, TypeScript..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleAddSkill}
                  >
                    Add Skill
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skills.map((s, idx) => (
                    <Badge
                      key={idx}
                      variant="neutral"
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-smoke hover:text-red-400"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Textarea
                label="Professional Engineering Experience"
                rows={3}
                placeholder="e.g. 3 years building distributed backend services and leading frontend teams..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(e) => setAvailability(e.target.checked)}
                    className="w-4 h-4 rounded bg-void border-hairline text-lime focus:ring-0 accent-lime cursor-pointer"
                  />
                  <span className="text-xs font-mono text-bone">
                    I am currently available to be invited or take on new challenges
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default Settings;
