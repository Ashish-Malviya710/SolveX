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
  FiArrowRight,
  FiRefreshCw,
  FiEdit3,
  FiMessageSquare,
  FiCheck,
  FiLayers,
  FiCode,
  FiCompass,
  FiZap,
  FiShield,
  FiTarget,
} from "react-icons/fi";
import api from "../../services/api";
import {
  startDiscovery,
  answerDiscoveryQuestion,
  generateBlueprint,
  updateBlueprint,
  regenerateBlueprint,
  completeDiscovery,
} from "../../services/discoveryApi";

const STAGES = {
  IDEA: "IDEA",
  DISCOVERY: "DISCOVERY",
  BLUEPRINT: "BLUEPRINT",
};

const CreateProblem = () => {
  const navigate = useNavigate();

  // Mode: "discovery" or "manual"
  const [mode, setMode] = useState("discovery");

  // Discovery Flow State
  const [stage, setStage] = useState(STAGES.IDEA);
  const [discoveryId, setDiscoveryId] = useState(null);
  const [initialIdea, setInitialIdea] = useState("");
  const [language, setLanguage] = useState("en");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [readinessScore, setReadinessScore] = useState(15);
  const [aiSummary, setAiSummary] = useState("");
  const [blueprint, setBlueprint] = useState(null);

  // Discovery User Input State
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customOptionText, setCustomOptionText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Blueprint Editing & Revision
  const [editingBlueprint, setEditingBlueprint] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedOverview, setEditedOverview] = useState("");
  const [editedSkills, setEditedSkills] = useState("");
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Optional project settings for final confirmation
  const [budgetType, setBudgetType] = useState("Volunteer");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [expectedDuration, setExpectedDuration] = useState("45 Days");
  const [maxTeamSize, setMaxTeamSize] = useState(5);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Classic Form State (Fallback)
  const [classicTitle, setClassicTitle] = useState("");
  const [classicDesc, setClassicDesc] = useState("");
  const [classicCategory, setClassicCategory] = useState("");
  const [classicFeatures, setClassicFeatures] = useState("");
  const [classicTech, setClassicTech] = useState("");
  const [classicSkills, setClassicSkills] = useState("");
  const [classicDuration, setClassicDuration] = useState("30 Days");
  const [classicDeadline, setClassicDeadline] = useState("");

  // Quick idea templates
  const IDEA_PROMPTS = [
    "I want to build an online marketplace for local farmers to sell directly to buyers with crop price indicators.",
    "A hospital patient triage, doctor appointment scheduling, and electronic health record management portal.",
    "A community ride-sharing and emergency volunteer transport network with live map tracking.",
    "An interactive peer-to-peer tutoring and skills exchange platform for university students.",
  ];

  // ----------------------------------------------------
  // DISCOVERY ACTIONS
  // ----------------------------------------------------

  const handleStartDiscovery = async () => {
    if (!initialIdea.trim() || initialIdea.trim().length < 5) {
      setError("Please describe your project or problem idea (at least 5 characters).");
      return;
    }

    setError("");
    setLoading(true);
    setLoadingAction("AI Architect is analyzing your initial idea...");

    try {
      const res = await startDiscovery(initialIdea.trim(), language);
      const { session, discoveryId: id } = res.data;
      setDiscoveryId(id);
      setCurrentQuestion(session.currentQuestion);
      setConversation(session.conversation || []);
      setReadinessScore(session.readinessScore || 20);
      setAiSummary(session.aiSummary || "");
      setUserAnswer("");
      setSelectedOptions([]);
      setCustomOptionText("");
      setStage(STAGES.DISCOVERY);
    } catch (err) {
      console.error("Start discovery error:", err);
      setError(err.response?.data?.message || "Failed to start AI Discovery. Please try again.");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleAnswerSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    let finalAnswer = "";
    if (currentQuestion?.type === "multiple_choice") {
      const combined = [...selectedOptions];
      if (customOptionText.trim()) combined.push(customOptionText.trim());
      if (combined.length === 0) {
        setError("Please select at least one option or enter your response.");
        return;
      }
      finalAnswer = combined.join(", ");
    } else if (currentQuestion?.type === "single_choice") {
      finalAnswer = customOptionText.trim() || userAnswer;
      if (!finalAnswer) {
        setError("Please select an option or type your answer.");
        return;
      }
    } else {
      finalAnswer = userAnswer.trim();
      if (!finalAnswer && currentQuestion?.required) {
        setError("Please enter your answer before continuing.");
        return;
      }
    }

    // Optimistic UI: immediately clear inputs and show answer in conversation
    setUserAnswer("");
    setSelectedOptions([]);
    setCustomOptionText("");
    setCurrentQuestion(null); // Hide current question immediately
    setLoading(true);
    setLoadingAction("Generating next question...");

    // Optimistically add user's answer to conversation for instant feedback
    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        type: "answer",
        content: finalAnswer,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await answerDiscoveryQuestion(discoveryId, finalAnswer);
      const { session, isReady } = res.data;
      setCurrentQuestion(session.currentQuestion);
      setConversation(session.conversation || []);
      setReadinessScore(session.readinessScore || 50);
      setAiSummary(session.aiSummary || "");

      if (isReady || !session.currentQuestion) {
        // Automatically trigger blueprint generation if ready
        await handleGenerateBlueprint(discoveryId);
      }
    } catch (err) {
      console.error("Answer submission error:", err);
      setError(err.response?.data?.message || "Failed to submit answer. Please retry.");
      // Restore the question on error so user can retry
      setCurrentQuestion(currentQuestion);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleGenerateBlueprint = async (id = discoveryId) => {
    setError("");
    setLoading(true);
    setLoadingAction("Synthesizing full Technical Engineering Blueprint...");

    try {
      const res = await generateBlueprint(id);
      const bp = res.data.blueprint;
      setBlueprint(bp);
      setEditedTitle(bp.title || initialIdea);
      setEditedOverview(bp.overview || "");
      setEditedSkills((bp.requiredSkills || []).join(", "));
      setStage(STAGES.BLUEPRINT);
      setSuccessMsg("✨ AI has generated your complete project technical blueprint!");
    } catch (err) {
      console.error("Generate blueprint error:", err);
      setError(err.response?.data?.message || "Failed to generate blueprint. Please try again.");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleRegenerateBlueprint = async () => {
    setError("");
    setLoading(true);
    setLoadingAction("Regenerating fresh blueprint version...");

    try {
      const res = await regenerateBlueprint(discoveryId);
      const bp = res.data.blueprint;
      setBlueprint(bp);
      setEditedTitle(bp.title || initialIdea);
      setEditedOverview(bp.overview || "");
      setEditedSkills((bp.requiredSkills || []).join(", "));
      setSuccessMsg("✨ Blueprint successfully regenerated!");
    } catch (err) {
      console.error("Regenerate error:", err);
      setError(err.response?.data?.message || "Failed to regenerate blueprint.");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleAskAiRevise = async () => {
    if (!revisionPrompt.trim()) return;
    setError("");
    setLoading(true);
    setLoadingAction(`AI is revising blueprint: "${revisionPrompt}"...`);

    try {
      const res = await updateBlueprint(discoveryId, { instruction: revisionPrompt.trim() });
      const bp = res.data.blueprint;
      setBlueprint(bp);
      setEditedTitle(bp.title || initialIdea);
      setEditedOverview(bp.overview || "");
      setEditedSkills((bp.requiredSkills || []).join(", "));
      setShowRevisionModal(false);
      setRevisionPrompt("");
      setSuccessMsg("✨ Blueprint revised successfully based on your feedback!");
    } catch (err) {
      console.error("Revision error:", err);
      setError(err.response?.data?.message || "Failed to revise blueprint.");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handleSaveManualEdit = () => {
    const updated = {
      ...blueprint,
      title: editedTitle,
      overview: editedOverview,
      requiredSkills: editedSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setBlueprint(updated);
    setEditingBlueprint(false);
    setSuccessMsg("Blueprint updated successfully.");
  };

  const handleConfirmAndCreate = async () => {
    setError("");
    setLoading(true);
    setLoadingAction("Creating official SolveX project and configuring developer matching...");

    try {
      const res = await completeDiscovery(discoveryId, {
        confirmedBlueprint: blueprint,
        budgetType,
        budgetAmount: budgetType === "Volunteer" ? 0 : Number(budgetAmount) || 0,
        currency,
        expectedDuration,
        maxTeamSize: Number(maxTeamSize) || 5,
      });

      const projectId = res.data.project?._id;
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error("Complete discovery error:", err);
      setError(err.response?.data?.message || "Failed to confirm and create project.");
      setLoading(false);
      setLoadingAction("");
    }
  };

  // ----------------------------------------------------
  // CLASSIC MANUAL FORM HANDLERS (Fallback)
  // ----------------------------------------------------

  const handleClassicSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!classicTitle.trim() || !classicDesc.trim()) {
      setError("Please provide both a project title and detailed description.");
      return;
    }

    setLoading(true);
    setLoadingAction("Creating project...");

    try {
      const payload = {
        title: classicTitle,
        description: classicDesc,
        category: classicCategory,
        requiredFeatures: classicFeatures,
        preferredTechnologies: classicTech,
        requiredSkills: classicSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        budgetType,
        budgetAmount: budgetType === "Volunteer" ? 0 : Number(budgetAmount) || 0,
        currency,
        expectedDuration: classicDuration,
        deadline: classicDeadline || undefined,
        maxTeamSize: Number(maxTeamSize) || 5,
      };

      const res = await api.post("/projects", payload);
      const projectId = res.data.project?._id;

      try {
        await api.put(`/projects/${projectId}/publish`);
      } catch (pubErr) {
        // continue
      }

      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error("Classic submit error:", err);
      setError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  // ----------------------------------------------------
  // RENDER: DISCOVERY STAGE 1 (INITIAL IDEA)
  // ----------------------------------------------------

  if (mode === "discovery" && stage === STAGES.IDEA) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-950/70 border border-primary-500/30 text-primary-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <FiCpu className="w-4 h-4 animate-pulse text-primary-400" />
            AI Project Discovery
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Turn Your Problem Idea Into a Technical Blueprint
          </h1>
          <p className="mt-3 text-base text-gray-400 max-w-2xl mx-auto">
            You don't need to fill a giant technical form. Just describe your problem or concept in plain words. Our AI Product Analyst will ask dynamic questions, extract requirements, and build an engineering specification for your developer team.
          </p>
        </div>

        {/* Error / Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Idea Input Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />

          <label className="block text-sm font-medium text-gray-200 mb-2">
            Describe your project, community challenge, or software idea
          </label>
          <textarea
            rows={5}
            value={initialIdea}
            onChange={(e) => setInitialIdea(e.target.value)}
            placeholder="e.g., I want to build a platform where rural farmers can sell surplus crops directly to local schools and restaurants, track fair market prices, and coordinate shared transport..."
            className="w-full bg-dark-950/90 border border-dark-700 rounded-xl px-4 py-3.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-base resize-none transition-colors"
          />

          {/* Quick Idea Starters */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiZap className="w-3.5 h-3.5 text-primary-400" /> Or pick a sample concept:
            </p>
            <div className="flex flex-wrap gap-2">
              {IDEA_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInitialIdea(promptText)}
                  className="text-xs bg-dark-800 hover:bg-dark-700/80 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-dark-700 text-left transition-colors"
                >
                  "{promptText.substring(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-dark-800">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="text-xs text-gray-400 hover:text-primary-400 transition-colors"
            >
              Prefer manual entry? Switch to classic form →
            </button>

            <button
              type="button"
              onClick={handleStartDiscovery}
              disabled={loading || !initialIdea.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  {loadingAction || "Analyzing Idea..."}
                </>
              ) : (
                <>
                  <FiCompass className="w-4 h-4" />
                  Start AI Discovery Session
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: DISCOVERY STAGE 2 (DYNAMIC INTERVIEW)
  // ----------------------------------------------------

  if (mode === "discovery" && stage === STAGES.DISCOVERY) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Readiness Header */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
                Discovery In Progress
              </span>
              <h2 className="text-lg font-bold text-white truncate max-w-md">
                "{initialIdea.substring(0, 60)}..."
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Readiness:</span>
                <span className="text-sm font-bold text-primary-400">{readinessScore}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(readinessScore, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2 italic flex items-center justify-between">
            <span>{aiSummary || "AI is learning about your project requirements..."}</span>
            {readinessScore >= 80 && (
              <button
                type="button"
                onClick={() => handleGenerateBlueprint()}
                disabled={loading}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium underline ml-2"
              >
                Generate Blueprint Now →
              </button>
            )}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleAnswerSubmit()}
              className="text-xs bg-red-800/80 hover:bg-red-700 text-white px-3 py-1 rounded-md"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Question Card */}
        {currentQuestion ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <FiCpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Question {conversation.filter((c) => c.type === "question").length}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white leading-snug mb-3">
              {currentQuestion.text}
            </h3>

            {currentQuestion.reason && (
              <p className="text-xs text-gray-400 mb-6 bg-dark-950/70 p-3 rounded-lg border border-dark-800">
                💡 <span className="font-semibold text-gray-300">Why this matters:</span> {currentQuestion.reason}
              </p>
            )}

            {/* Render dynamic question input */}
            <form onSubmit={handleAnswerSubmit}>
              {/* SINGLE CHOICE */}
              {currentQuestion.type === "single_choice" && (
                <div className="space-y-2.5 mb-6">
                  {(currentQuestion.options || []).map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setUserAnswer(opt);
                        setCustomOptionText("");
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        userAnswer === opt && !customOptionText
                          ? "bg-primary-950/70 border-primary-500/80 text-white shadow-md shadow-primary-950/50"
                          : "bg-dark-950/60 border-dark-800 text-gray-300 hover:bg-dark-800/60 hover:text-white"
                      }`}
                    >
                      <span>{opt}</span>
                      {userAnswer === opt && !customOptionText && (
                        <FiCheck className="w-4 h-4 text-primary-400" />
                      )}
                    </button>
                  ))}
                  {/* Or Custom input */}
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Or write custom answer..."
                      value={customOptionText}
                      onChange={(e) => {
                        setCustomOptionText(e.target.value);
                        setUserAnswer("");
                      }}
                      className="w-full bg-dark-950/80 border border-dark-800 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* MULTIPLE CHOICE */}
              {currentQuestion.type === "multiple_choice" && (
                <div className="space-y-2.5 mb-6">
                  {(currentQuestion.options || []).map((opt, i) => {
                    const isSelected = selectedOptions.includes(opt);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedOptions(selectedOptions.filter((o) => o !== opt));
                          } else {
                            setSelectedOptions([...selectedOptions, opt]);
                          }
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-primary-950/70 border-primary-500/80 text-white shadow-md"
                            : "bg-dark-950/60 border-dark-800 text-gray-300 hover:bg-dark-800/60 hover:text-white"
                        }`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary-600 border-primary-500 text-white"
                              : "border-dark-700 bg-dark-900"
                          }`}
                        >
                          {isSelected && <FiCheck className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Add another requirement / custom option..."
                      value={customOptionText}
                      onChange={(e) => setCustomOptionText(e.target.value)}
                      className="w-full bg-dark-950/80 border border-dark-800 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* BOOLEAN */}
              {currentQuestion.type === "boolean" && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {["Yes", "No"].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setUserAnswer(choice)}
                      className={`p-4 rounded-xl border text-base font-semibold text-center transition-all ${
                        userAnswer === choice
                          ? "bg-primary-950/80 border-primary-500 text-white shadow-lg"
                          : "bg-dark-950/60 border-dark-800 text-gray-300 hover:bg-dark-800/60 hover:text-white"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {/* NUMBER */}
              {currentQuestion.type === "number" && (
                <div className="mb-6">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter numeric value..."
                    className="w-full bg-dark-950/80 border border-dark-800 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-base"
                  />
                </div>
              )}

              {/* TEXT / TEXTAREA */}
              {(currentQuestion.type === "text" || currentQuestion.type === "textarea") && (
                <div className="mb-6">
                  <textarea
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your detailed response..."
                    className="w-full bg-dark-950/80 border border-dark-800 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" />
                  {showHistory ? "Hide Interview History" : "View Answers History"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-600/30 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      {loadingAction || "Analyzing..."}
                    </>
                  ) : (
                    <>
                      Continue
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : loading ? (
          /* Loading state — show spinner while waiting for next question (NOT the completion block) */
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 text-center">
            <FiRefreshCw className="w-10 h-10 text-primary-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-bold text-white mb-2">{loadingAction || "Generating next question..."}</h3>
            <p className="text-sm text-gray-400">AI is analyzing your response and preparing the next question.</p>
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 text-center">
            <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Discovery Session Complete!</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
              All essential specifications have been captured. We are ready to generate your unique technical blueprint.
            </p>
            <button
              type="button"
              onClick={() => handleGenerateBlueprint()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-lg text-sm"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing Blueprint...
                </>
              ) : (
                <>
                  <FiCpu className="w-4 h-4" />
                  Generate Technical Blueprint Now
                </>
              )}
            </button>
          </div>
        )}

        {/* Conversation History Drawer */}
        {showHistory && (
          <div className="mt-6 bg-dark-900/90 border border-dark-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Interview History
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs ${
                    msg.role === "assistant"
                      ? "bg-dark-950 border border-dark-800 text-gray-300"
                      : "bg-primary-950/40 border border-primary-500/20 text-primary-200 ml-4"
                  }`}
                >
                  <span className="font-semibold text-gray-400 block mb-1">
                    {msg.role === "assistant" ? "🤖 AI Analyst" : "👤 Your Answer"}:
                  </span>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: DISCOVERY STAGE 3 (BLUEPRINT PREVIEW & CONFIRM)
  // ----------------------------------------------------

  if (mode === "discovery" && stage === STAGES.BLUEPRINT && blueprint) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Notification Toast */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-950/50 border border-green-500/30 text-green-300 flex items-center justify-between">
            <span>{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg("")}
              className="text-xs text-green-400 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Blueprint Header */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-950/60 border border-green-500/30 text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <FiCheckCircle className="w-3.5 h-3.5" />
                Technical Blueprint Generated
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {blueprint.title || "Software Project Blueprint"}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Estimated Complexity:{" "}
                <span className="text-primary-400 font-semibold">{blueprint.complexity || "Moderate"}</span>{" "}
                • Architecture:{" "}
                <span className="text-gray-300">{blueprint.architecture?.type || "Full-Stack Web"}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingBlueprint(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs text-gray-200 border border-dark-700"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowRevisionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-950/60 hover:bg-primary-900/60 text-xs text-primary-300 border border-primary-500/30"
              >
                <FiZap className="w-3.5 h-3.5" />
                Ask AI to Revise
              </button>
              <button
                type="button"
                onClick={handleRegenerateBlueprint}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs text-gray-300 border border-dark-700"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>
          </div>

          {/* Section: Overview & Problem Statement */}
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Executive Overview
              </h3>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                {blueprint.overview}
              </p>
            </div>

            {blueprint.problemStatement && (
              <div className="bg-dark-950/60 p-4 rounded-xl border border-dark-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Problem Statement & Impacted Stakeholders
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {blueprint.problemStatement}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Blueprint Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Core Features */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiTarget className="w-4 h-4 text-primary-400" />
              Core Functional Deliverables
            </h3>
            <ul className="space-y-2.5">
              {(blueprint.features?.core || []).map((feat, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2.5">
                  <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiCode className="w-4 h-4 text-primary-400" />
              Recommended Tech Stack & Architecture
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Frontend:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(blueprint.technology?.frontend || []).map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-dark-950 border border-dark-700 text-primary-300 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Backend & Database:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...(blueprint.technology?.backend || []),
                    ...(blueprint.technology?.database || []),
                  ].map((t, i) => (
                    <span key={i} className="px-2.5 py-1 bg-dark-950 border border-dark-700 text-indigo-300 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {blueprint.technology?.realtime && blueprint.technology.realtime.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-1">Real-Time / Integrations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {blueprint.technology.realtime.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-dark-950 border border-dark-700 text-amber-300 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Required Developer Roles */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-primary-400" />
              Required Developer Roles & Extracted Skills
            </h3>
            <div className="space-y-3">
              {(blueprint.developerRoles || []).map((role, i) => (
                <div key={i} className="bg-dark-950/60 p-3 rounded-xl border border-dark-800 text-xs">
                  <span className="font-semibold text-gray-200 block mb-1">{role.role}</span>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {(role.skills || []).map((s, si) => (
                      <span key={si} className="px-2 py-0.5 bg-dark-800 text-gray-300 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiLayers className="w-4 h-4 text-primary-400" />
              Recommended Development Milestones
            </h3>
            <div className="space-y-3">
              {(blueprint.milestones || []).map((m, i) => (
                <div key={i} className="bg-dark-950/60 p-3 rounded-xl border border-dark-800 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-200">{m.title}</span>
                    <span className="text-[11px] text-primary-400">{m.duration}</span>
                  </div>
                  <ul className="text-gray-400 list-disc list-inside space-y-0.5">
                    {(m.deliverables || []).map((d, di) => (
                      <li key={di}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Project Settings Form Before Final Launch */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-primary-400" />
            Project Settings & Resource Allocation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Budget Model</label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-primary-500"
              >
                <option value="Volunteer">Volunteer / Civic</option>
                <option value="Fixed">Fixed Grant / Stipend</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>
            {budgetType !== "Volunteer" && (
              <div>
                <label className="block text-gray-400 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            )}
            <div>
              <label className="block text-gray-400 mb-1">Max Team Size</label>
              <input
                type="number"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Expected Timeline</label>
              <input
                type="text"
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Confirmation Action Bar */}
        <div className="bg-gradient-to-r from-primary-950/80 to-dark-900 border border-primary-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h4 className="text-base font-bold text-white">Ready to connect with vetted developers?</h4>
            <p className="text-xs text-gray-300 mt-0.5">
              Confirming will create your SolveX Project with these blueprint specifications and initiate developer matching.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirmAndCreate}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-xl shadow-primary-600/40 text-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                {loadingAction || "Creating Project..."}
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4" />
                Confirm & Launch Project
              </>
            )}
          </button>
        </div>

        {/* Edit Blueprint Modal */}
        {editingBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-white">Edit Blueprint Content</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Project Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Executive Overview</label>
                <textarea
                  rows={5}
                  value={editedOverview}
                  onChange={(e) => setEditedOverview(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Required Developer Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={editedSkills}
                  onChange={(e) => setEditedSkills(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-2.5 text-sm text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => setEditingBlueprint(false)}
                  className="px-4 py-2 rounded-lg bg-dark-800 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualEdit}
                  className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Revision Modal */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiZap className="w-4 h-4 text-primary-400" />
                Ask AI Architect to Revise Blueprint
              </h3>
              <p className="text-xs text-gray-400">
                Describe the changes or adjustments you'd like to make. The AI will preserve existing requirements while updating affected sections.
              </p>
              <textarea
                rows={4}
                value={revisionPrompt}
                onChange={(e) => setRevisionPrompt(e.target.value)}
                placeholder="e.g. Add offline mobile sync for rural users, replace Stripe with UPI gateway, or add an emergency SMS alert milestone..."
                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              />
              <div className="flex justify-end gap-3 pt-3 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-lg bg-dark-800 text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAskAiRevise}
                  disabled={loading || !revisionPrompt.trim()}
                  className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Apply AI Revision
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: CLASSIC MANUAL FORM (Fallback toggle)
  // ----------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-dark-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Manual Project Creation</h1>
          <p className="text-xs text-gray-400 mt-1">Standard form entry without AI discovery</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode("discovery");
            setStage(STAGES.IDEA);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-950/70 border border-primary-500/30 text-primary-300 hover:text-white text-xs font-semibold"
        >
          <FiCpu className="w-3.5 h-3.5" />
          Switch to AI Discovery Flow
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleClassicSubmit} className="space-y-6">
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={classicTitle}
              onChange={(e) => setClassicTitle(e.target.value)}
              placeholder="e.g. Rural Healthcare Tracker"
              className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-sm text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              required
              value={classicDesc}
              onChange={(e) => setClassicDesc(e.target.value)}
              placeholder="Detailed description of the community problem and requirements..."
              className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-sm text-gray-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={classicCategory}
                onChange={(e) => setClassicCategory(e.target.value)}
                placeholder="e.g. Healthcare, Education, Environment"
                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-sm text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Required Skills (comma-separated)</label>
              <input
                type="text"
                value={classicSkills}
                onChange={(e) => setClassicSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB"
                className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-sm text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblem;
