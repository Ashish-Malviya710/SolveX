import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCpu,
  FiPlusCircle,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../services/api";

const CreateProblem = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [requiredFeatures, setRequiredFeatures] = useState("");
  const [preferredTechnologies, setPreferredTechnologies] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [budgetType, setBudgetType] = useState("Fixed");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budgetDescription, setBudgetDescription] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("30 Days");
  const [deadline, setDeadline] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const handleGenerateAIDescription = async () => {
    if (!title.trim()) {
      setError("Please enter a Project Title or Heading first so AI knows what to generate.");
      return;
    }

    setError("");
    setAiSuccessMsg("");
    setGeneratingAI(true);

    try {
      const res = await api.post("/ai/generate-description", {
        title: title.trim(),
        category: category.trim() || undefined,
        keywords: [category, preferredTechnologies, requiredSkills].filter(Boolean).join(", "),
      });

      const { generated } = res.data;
      if (generated) {
        if (generated.description) setDescription(generated.description);
        if (generated.category) setCategory(generated.category);
        if (generated.requiredFeatures) setRequiredFeatures(generated.requiredFeatures);
        if (generated.suggestedSkills && Array.isArray(generated.suggestedSkills)) {
          setRequiredSkills(generated.suggestedSkills.join(", "));
        }
        if (generated.preferredTechnologies) {
          setPreferredTechnologies(generated.preferredTechnologies);
        }
        if (generated.expectedDuration) {
          setExpectedDuration(generated.expectedDuration);
        }

        setAiSuccessMsg(`✨ AI successfully generated an authentic, original description and specifications for "${title}"!`);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      setError(err.response?.data?.message || "Failed to generate AI description. Please try again.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please provide both a project title and detailed problem description.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        category,
        requiredFeatures,
        preferredTechnologies,
        requiredSkills: requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        budgetType,
        budgetAmount: budgetType === "Volunteer" ? 0 : Number(budgetAmount) || 0,
        currency,
        budgetDescription,
        expectedDuration,
        deadline: deadline || undefined,
        maxTeamSize: Number(maxTeamSize) || 5,
      };

      const res = await api.post("/projects", payload);
      const projectId = res.data.project?._id;

      // Automatically publish to OPEN status so developers can discover it
      try {
        await api.put(`/projects/${projectId}/publish`);
      } catch (pubErr) {
        // Continue even if publish warning
      }

      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="section-header">
        <span className="badge badge-accent mb-2">Problem Genesis</span>
        <h1 className="section-title">Post a Real-World Problem</h1>
        <p className="section-subtitle">
          Describe the challenge facing your community or NGO. Our Groq AI engine will automatically extract functional requirements and technical scope.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Description Card */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-dark-700/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FiCpu className="text-primary-400 w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Problem Definition & AI Intake
              </h3>
            </div>
            <button
              type="button"
              onClick={handleGenerateAIDescription}
              disabled={generatingAI || !title.trim()}
              className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium transition border ${
                !title.trim()
                  ? "bg-dark-800/50 border-dark-700 text-gray-500 cursor-not-allowed"
                  : generatingAI
                  ? "bg-primary-900/30 border-primary-500/40 text-primary-300 cursor-wait animate-pulse"
                  : "bg-primary-600/20 hover:bg-primary-600/30 border-primary-500/50 text-primary-300 hover:text-white shadow-sm"
              }`}
              title={!title.trim() ? "Type a Project Title first" : "Generate complete description with AI"}
            >
              {generatingAI ? (
                <>
                  <span className="animate-spin rounded-full h-3 w-3 border-2 border-primary-400 border-t-transparent" />
                  <span>Generating AI Narrative...</span>
                </>
              ) : (
                <>
                  <FiCpu className="w-3.5 h-3.5 text-primary-400" />
                  <span>{description ? "✨ Regenerate Description with AI" : "✨ Generate Description with AI"}</span>
                </>
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between pb-1">
              <label className="input-label text-xs mb-0">Project Title / Heading *</label>
              {!title.trim() && (
                <span className="text-[10px] text-gray-500 italic">Enter title to unlock one-click AI generation</span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Autonomous Drone Delivery for Emergency Blood Supplies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="input-label text-xs">Category / Domain (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Healthcare, Environmental Sustainability, Education, Disaster Relief..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
              <label className="input-label text-xs mb-0">
                Natural Language Problem Description * (AI Analyzed)
              </label>
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={generatingAI || !title.trim()}
                className="text-[11px] text-primary-400 hover:text-primary-300 underline font-medium flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
              >
                {description ? "Regenerate with AI" : "Auto-fill with AI"}
              </button>
            </div>
            <textarea
              rows={6}
              required
              placeholder="Describe the challenge facing your community or NGO, or click 'Generate Description with AI' above to auto-create a complete narrative based on your title..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-field text-xs leading-relaxed"
            />
            <span className="text-[11px] text-gray-400 block pt-1">
              ✨ AI generates unique multi-paragraph narratives, functional requirements, and skill sets tailored specifically to your heading.
            </span>
          </div>
        </div>

        {/* Requirements & Tech Expectations */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Desired Features & Skills (Optional)
          </h3>

          <div>
            <label className="input-label text-xs">Specific Required Features (Free Text)</label>
            <textarea
              rows={2}
              placeholder="e.g. Donor registration, SMS alerts, driver pickup route map, export reports to CSV..."
              value={requiredFeatures}
              onChange={(e) => setRequiredFeatures(e.target.value)}
              className="textarea-field text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label text-xs">Required Developer Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB, Leaflet..."
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="input-label text-xs">Preferred Technologies</label>
              <input
                type="text"
                placeholder="e.g. MERN Stack, Next.js, Python..."
                value={preferredTechnologies}
                onChange={(e) => setPreferredTechnologies(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Budget & Team Scope */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Project Scope & Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label text-xs">Budget Type</label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                className="select-field text-xs"
              >
                <option value="Fixed">Fixed Stipend</option>
                <option value="Negotiable">Negotiable</option>
                <option value="Volunteer">Volunteer / Free for Social Good</option>
              </select>
            </div>

            {budgetType !== "Volunteer" && (
              <>
                <div>
                  <label className="input-label text-xs">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="select-field text-xs"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label text-xs">Budget Amount</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 35000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="input-label text-xs">Expected Duration</label>
              <input
                type="text"
                placeholder="e.g. 30 Days"
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="input-label text-xs">Expected Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="input-label text-xs">Max Team Size</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner w-4 h-4 border-2" />
                <span>Running AI Analysis & Publishing...</span>
              </>
            ) : (
              <>
                <FiPlusCircle className="w-5 h-5" />
                <span>Post Problem & Launch AI Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblem;
