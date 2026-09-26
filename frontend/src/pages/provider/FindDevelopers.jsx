import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiSend,
  FiFilter,
  FiCheckCircle,
  FiUser,
  FiCode,
  FiAward,
} from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
} from "../../components/ui";

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
        (p) =>
          [
            "OPEN",
            "LEADER_SELECTED",
            "TEAM_FORMING",
            "PROPOSAL_PENDING",
            "CHANGES_REQUESTED",
            "APPROVED",
            "IN_DEVELOPMENT",
          ].includes(p.status) &&
          (!p.teamMembers || p.teamMembers.length < (p.maxTeamSize || 5))
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
      setInviteError("Please select a target problem.");
      return;
    }
    setInviting(true);
    setInviteError("");
    try {
      await api.post(
        `/projects/${selectedProject}/invite/${selectedDeveloper._id}`,
        { message: inviteMessage }
      );
      setInviteSuccess(true);
      setTimeout(() => setInviteModalOpen(false), 1500);
    } catch (err) {
      setInviteError(
        err.response?.data?.message || "Failed to send invitation."
      );
    } finally {
      setInviting(false);
    }
  };

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Talent Discovery"
        title="Find & Invite Developers"
        description="Search vetted engineers with verified reputations, inspect verified skill profiles, and invite them directly to lead or build your problem challenge."
      />

      {/* Filter and Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-5 space-y-4">
          <Input
            icon={FiSearch}
            placeholder="Search by engineer name, bio keywords, or domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-hairline">
            <Input
              label="Required Skill"
              placeholder="e.g. React, Node.js, Python..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />

            <Input
              label="Min Projects Completed"
              type="number"
              min="0"
              placeholder="e.g. 2"
              value={minProjects}
              onChange={(e) => setMinProjects(e.target.value)}
            />

            <Select
              label="Availability Status"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">All Developers</option>
              <option value="true">Available Now</option>
              <option value="false">Busy / Committed</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Developers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="w-12 h-12 bg-graphite rounded-lg mb-4" />
              <div className="h-4 bg-graphite rounded w-3/4 mb-2" />
              <div className="h-3 bg-graphite rounded w-1/2 mb-4" />
              <div className="h-10 bg-graphite rounded" />
            </Card>
          ))}
        </div>
      ) : developers.length === 0 ? (
        <Card className="text-center py-16 px-6">
          <FiFilter className="w-10 h-10 text-iron mx-auto mb-3" />
          <h3 className="text-base font-semibold text-paper mb-1">
            No Developers Found
          </h3>
          <p className="text-xs text-smoke font-mono">
            Try loosening your skill or experience filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <Card
              key={dev._id}
              hoverable
              className="flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-lg bg-graphite border border-hairline flex items-center justify-center font-mono font-bold text-lime text-base shrink-0">
                    {dev.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-lime block">
                      {dev.reputation || 0} pts
                    </span>
                    <span className="text-[11px] font-mono text-smoke">
                      {dev.projectsCompleted || 0} done • {dev.projectsLed || 0} led
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-paper hover:text-lime transition truncate">
                    <Link to={`/developers/${dev._id}`}>{dev.name}</Link>
                  </h3>
                  <p className="text-xs text-smoke line-clamp-2 mt-1 leading-relaxed">
                    {dev.bio || "Full stack developer ready for civic impact projects."}
                  </p>
                </div>

                {dev.skills && dev.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dev.skills.slice(0, 4).map((sk, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {sk}
                      </Badge>
                    ))}
                    {dev.skills.length > 4 && (
                      <Badge variant="neutral" size="sm">
                        +{dev.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>

              <div className="px-6 py-4 border-t border-hairline bg-carbon/50 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenInvite(dev)}
                  className="flex-1"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Invite to Problem</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  to={`/developers/${dev._id}`}
                >
                  Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen && Boolean(selectedDeveloper)}
        onClose={() => setInviteModalOpen(false)}
        title={`Invite ${selectedDeveloper?.name || "Developer"}`}
      >
        {inviteSuccess ? (
          <div className="py-8 text-center space-y-3">
            <FiCheckCircle className="w-12 h-12 text-lime mx-auto animate-bounce" />
            <p className="text-sm font-semibold text-paper font-mono">
              Invitation successfully sent to {selectedDeveloper?.name}!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            {inviteError && (
              <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-300 text-xs rounded-button font-mono">
                {inviteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-smoke mb-1.5 uppercase tracking-wider">
                Select Target Challenge / Problem
              </label>
              {myProblems.length === 0 ? (
                <div className="p-4 bg-void border border-hairline rounded-button text-xs text-smoke font-mono">
                  No active open problems found. Please post a problem first.
                </div>
              ) : (
                <Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                >
                  {myProblems.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <Textarea
              label="Personal Note (Optional)"
              rows={3}
              placeholder="Describe why you'd like this engineer to contribute or lead..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={inviting || myProblems.length === 0}
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Container>
  );
};

export default FindDevelopers;
