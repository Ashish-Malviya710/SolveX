import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCpu,
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
  FiUsers,
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
  Select,
  Textarea,
  Modal,
} from "../../components/ui";

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

    setUserAnswer("");
    setSelectedOptions([]);
    setCustomOptionText("");
    setCurrentQuestion(null);
    setLoading(true);
    setLoadingAction("Generating next question...");

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
        await handleGenerateBlueprint(discoveryId);
      }
    } catch (err) {
      console.error("Answer submission error:", err);
      setError(err.response?.data?.message || "Failed to submit answer. Please retry.");
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
      setSuccessMsg("AI has generated your complete project technical blueprint!");
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
      setSuccessMsg("Blueprint successfully regenerated!");
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
      setSuccessMsg("Blueprint revised successfully based on your feedback!");
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
        status: "OPEN",
      };

      const res = await api.post("/projects", payload);
      const projectId = res.data.project?._id;

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
      <Container className="py-12 max-w-4xl">
        <PageHeader
          eyebrow="AI Project Discovery"
          title="Turn Your Problem Idea Into a Technical Blueprint"
          description="Describe your problem or concept in plain words. Our AI Product Architect asks dynamic questions, extracts requirements, and builds an engineering specification for your developer team."
        />

        {error && (
          <div className="mb-6 p-4 rounded-button bg-red-950/30 border border-red-500/40 text-red-300 font-mono text-xs flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <Textarea
              label="Describe your problem challenge or software concept"
              rows={5}
              value={initialIdea}
              onChange={(e) => setInitialIdea(e.target.value)}
              placeholder="e.g. I want to build a platform where rural farmers can sell surplus crops directly to local schools and restaurants, track fair market prices, and coordinate shared transport..."
            />

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-smoke mb-3 flex items-center gap-1.5">
                <FiZap className="w-3.5 h-3.5 text-lime" /> Or pick a sample concept:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IDEA_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInitialIdea(promptText)}
                    className="p-3 bg-void border border-hairline hover:border-lime/50 rounded-button text-left text-xs font-mono text-bone hover:text-paper transition"
                  >
                    "{promptText.substring(0, 52)}..."
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-hairline">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className="text-xs font-mono text-smoke hover:text-lime transition"
              >
                Prefer manual entry? Switch to classic form →
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={handleStartDiscovery}
                disabled={loading || !initialIdea.trim()}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>{loadingAction || "Analyzing Idea..."}</span>
                  </>
                ) : (
                  <>
                    <FiCompass className="w-4 h-4" />
                    <span>Start AI Discovery Session</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ----------------------------------------------------
  // RENDER: DISCOVERY STAGE 2 (DYNAMIC INTERVIEW)
  // ----------------------------------------------------

  if (mode === "discovery" && stage === STAGES.DISCOVERY) {
    return (
      <Container className="py-8 max-w-3xl">
        {/* Readiness Header */}
        <Card className="mb-6">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-lime block">
                  Discovery In Progress
                </span>
                <h2 className="text-base font-semibold text-paper truncate max-w-md">
                  "{initialIdea.substring(0, 60)}..."
                </h2>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-smoke">Readiness:</span>
                <Badge variant="lime" size="sm">
                  {readinessScore}%
                </Badge>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-void rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-lime transition-all duration-500"
                style={{ width: `${Math.min(readinessScore, 100)}%` }}
              />
            </div>

            <div className="text-xs font-mono text-smoke flex items-center justify-between pt-1">
              <span>{aiSummary || "AI is synthesizing project requirements..."}</span>
              {readinessScore >= 80 && (
                <button
                  type="button"
                  onClick={() => handleGenerateBlueprint()}
                  disabled={loading}
                  className="text-lime hover:underline shrink-0 ml-2"
                >
                  Generate Blueprint Now →
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 rounded-button bg-red-950/30 border border-red-500/40 text-red-300 font-mono text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAnswerSubmit()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Dynamic Question Card */}
        {currentQuestion ? (
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="lime" size="sm">
                  Question {conversation.filter((c) => c.type === "question").length}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-paper leading-snug mb-2">
                  {currentQuestion.text}
                </h3>
                {currentQuestion.reason && (
                  <p className="text-xs font-mono text-smoke bg-void p-3 rounded-button border border-hairline">
                    <span className="text-lime font-bold">Why this matters:</span> {currentQuestion.reason}
                  </p>
                )}
              </div>

              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                {/* SINGLE CHOICE */}
                {currentQuestion.type === "single_choice" && (
                  <div className="space-y-2">
                    {(currentQuestion.options || []).map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setUserAnswer(opt);
                          setCustomOptionText("");
                        }}
                        className={`w-full text-left p-3.5 rounded-button border text-xs font-mono transition-all flex items-center justify-between ${
                          userAnswer === opt && !customOptionText
                            ? "bg-carbon border-lime text-lime"
                            : "bg-void border-hairline text-bone hover:border-iron hover:text-paper"
                        }`}
                      >
                        <span>{opt}</span>
                        {userAnswer === opt && !customOptionText && (
                          <FiCheck className="w-4 h-4 text-lime" />
                        )}
                      </button>
                    ))}
                    <div className="pt-2">
                      <Input
                        placeholder="Or type a custom answer..."
                        value={customOptionText}
                        onChange={(e) => {
                          setCustomOptionText(e.target.value);
                          setUserAnswer("");
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* MULTIPLE CHOICE */}
                {currentQuestion.type === "multiple_choice" && (
                  <div className="space-y-2">
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
                          className={`w-full text-left p-3.5 rounded-button border text-xs font-mono transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-carbon border-lime text-lime"
                              : "bg-void border-hairline text-bone hover:border-iron hover:text-paper"
                          }`}
                        >
                          <span>{opt}</span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-lime border-lime text-black"
                                : "border-hairline bg-graphite"
                            }`}
                          >
                            {isSelected && <FiCheck className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                    <div className="pt-2">
                      <Input
                        placeholder="Add another requirement / custom option..."
                        value={customOptionText}
                        onChange={(e) => setCustomOptionText(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* BOOLEAN */}
                {currentQuestion.type === "boolean" && (
                  <div className="grid grid-cols-2 gap-4">
                    {["Yes", "No"].map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setUserAnswer(choice)}
                        className={`p-4 rounded-button border text-xs font-mono font-semibold text-center transition-all ${
                          userAnswer === choice
                            ? "bg-carbon border-lime text-lime"
                            : "bg-void border-hairline text-bone hover:border-iron hover:text-paper"
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}

                {/* NUMBER */}
                {currentQuestion.type === "number" && (
                  <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter numeric value..."
                  />
                )}

                {/* TEXT / TEXTAREA */}
                {(currentQuestion.type === "text" || currentQuestion.type === "textarea") && (
                  <Textarea
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your detailed response..."
                  />
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-hairline">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <FiMessageSquare className="w-3.5 h-3.5" />
                    <span>{showHistory ? "Hide History" : "View Answer History"}</span>
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                        <span>{loadingAction || "Analyzing..."}</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <FiArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="text-center py-16 px-6">
            <FiRefreshCw className="w-10 h-10 text-lime mx-auto mb-4 animate-spin" />
            <h3 className="text-base font-semibold text-paper mb-1">
              {loadingAction || "Generating next question..."}
            </h3>
            <p className="text-xs text-smoke font-mono">
              AI Architect is synthesizing your answers and planning next requirements.
            </p>
          </Card>
        ) : (
          <Card className="text-center py-16 px-6 space-y-4">
            <FiCheckCircle className="w-12 h-12 text-lime mx-auto" />
            <h3 className="text-base font-semibold text-paper">
              Discovery Session Complete!
            </h3>
            <p className="text-xs text-smoke font-mono max-w-md mx-auto">
              All essential specifications have been captured. We are ready to synthesize your technical blueprint.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleGenerateBlueprint()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Blueprint...</span>
                </>
              ) : (
                <>
                  <FiCpu className="w-4 h-4" />
                  <span>Generate Technical Blueprint Now</span>
                </>
              )}
            </Button>
          </Card>
        )}

        {/* History Drawer */}
        {showHistory && (
          <Card className="mt-6">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-smoke">
                Interview Log
              </h4>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2 font-mono text-xs">
                {conversation.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-button border ${
                      msg.role === "assistant"
                        ? "bg-void border-hairline text-bone"
                        : "bg-carbon border-hairline text-lime ml-4"
                    }`}
                  >
                    <span className="text-[10px] text-smoke block mb-1">
                      {msg.role === "assistant" ? "🤖 AI Analyst" : "👤 Your Answer"}:
                    </span>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    );
  }

  // ----------------------------------------------------
  // RENDER: DISCOVERY STAGE 3 (BLUEPRINT PREVIEW & CONFIRM)
  // ----------------------------------------------------

  if (mode === "discovery" && stage === STAGES.BLUEPRINT && blueprint) {
    return (
      <Container className="py-8 max-w-5xl">
        {successMsg && (
          <div className="mb-6 p-4 rounded-button bg-lime/10 border border-lime/30 text-lime font-mono text-xs flex items-center justify-between">
            <span>{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg("")}
              className="text-smoke hover:text-paper"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-button bg-red-950/30 border border-red-500/40 text-red-300 font-mono text-xs flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Blueprint Header */}
        <Card className="mb-6">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
              <div>
                <Badge variant="lime" size="sm" className="mb-2">
                  Technical Blueprint Generated
                </Badge>
                <h1 className="text-xl sm:text-2xl font-bold text-paper">
                  {blueprint.title || "Software Project Blueprint"}
                </h1>
                <p className="text-xs font-mono text-smoke mt-1">
                  Complexity:{" "}
                  <span className="text-lime">{blueprint.complexity || "Moderate"}</span>{" "}
                  • Architecture:{" "}
                  <span className="text-bone">{blueprint.architecture?.type || "Full-Stack Web"}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingBlueprint(true)}
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRevisionModal(true)}
                >
                  <FiZap className="w-3.5 h-3.5 text-lime" />
                  <span>Ask AI to Revise</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateBlueprint}
                  disabled={loading}
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Regenerate</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-smoke block mb-1">
                  Executive Overview
                </span>
                <p className="text-xs font-mono text-bone leading-relaxed whitespace-pre-line bg-void p-4 rounded-button border border-hairline">
                  {blueprint.overview}
                </p>
              </div>

              {blueprint.problemStatement && (
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-smoke block mb-1">
                    Problem Statement & Stakeholders
                  </span>
                  <p className="text-xs font-mono text-bone leading-relaxed bg-void p-4 rounded-button border border-hairline">
                    {blueprint.problemStatement}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blueprint Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiTarget className="w-4 h-4 text-lime" />
                <span>Core Functional Deliverables</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(blueprint.features?.core || []).map((feat, i) => (
                <div key={i} className="text-xs font-mono text-bone flex items-start gap-2">
                  <FiCheck className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiCode className="w-4 h-4 text-lime" />
                <span>Recommended Tech Stack</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-smoke block mb-1">Frontend:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(blueprint.technology?.frontend || []).map((t, i) => (
                    <Badge key={i} variant="neutral" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-smoke block mb-1">Backend & Database:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...(blueprint.technology?.backend || []),
                    ...(blueprint.technology?.database || []),
                  ].map((t, i) => (
                    <Badge key={i} variant="neutral" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-lime" />
                <span>Required Developer Roles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              {(blueprint.developerRoles || []).map((role, i) => (
                <div key={i} className="p-3 bg-void border border-hairline rounded-button">
                  <span className="font-semibold text-paper block mb-1">{role.role}</span>
                  <div className="flex flex-wrap gap-1">
                    {(role.skills || []).map((s, si) => (
                      <Badge key={si} variant="neutral" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiLayers className="w-4 h-4 text-lime" />
                <span>Development Milestones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              {(blueprint.milestones || []).map((m, i) => (
                <div key={i} className="p-3 bg-void border border-hairline rounded-button">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-paper">{m.title}</span>
                    <span className="text-[11px] text-lime">{m.duration}</span>
                  </div>
                  <ul className="text-smoke list-disc list-inside space-y-0.5">
                    {(m.deliverables || []).map((d, di) => (
                      <li key={di}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Project Settings Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-lime" />
              <span>Project Settings & Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Budget Model"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
              >
                <option value="Volunteer">Volunteer / Civic</option>
                <option value="Fixed">Fixed Grant / Stipend</option>
                <option value="Negotiable">Negotiable</option>
              </Select>

              {budgetType !== "Volunteer" && (
                <Input
                  label={`Amount (${currency})`}
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 50000"
                />
              )}

              <Input
                label="Max Team Size"
                type="number"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
              />

              <Input
                label="Expected Timeline"
                type="text"
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Bar */}
        <Card className="border-lime/30 bg-carbon">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-paper">
                Ready to launch and match with engineers?
              </h4>
              <p className="text-xs font-mono text-smoke mt-0.5">
                Confirming publishes your problem with these blueprint specifications and opens developer applications.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmAndCreate}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>{loadingAction || "Creating Project..."}</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Confirm & Launch Project</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Modal
          isOpen={editingBlueprint}
          onClose={() => setEditingBlueprint(false)}
          title="Edit Blueprint Content"
        >
          <div className="space-y-4">
            <Input
              label="Project Title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
            <Textarea
              label="Executive Overview"
              rows={5}
              value={editedOverview}
              onChange={(e) => setEditedOverview(e.target.value)}
            />
            <Input
              label="Required Skills (comma-separated)"
              value={editedSkills}
              onChange={(e) => setEditedSkills(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBlueprint(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveManualEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* AI Revision Modal */}
        <Modal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          title="Ask AI Architect to Revise Blueprint"
        >
          <div className="space-y-4">
            <p className="text-xs font-mono text-smoke">
              Describe the adjustments you'd like. The AI will preserve existing specifications while revising affected sections.
            </p>
            <Textarea
              rows={4}
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              placeholder="e.g. Add offline mobile sync for rural users, replace Stripe with UPI gateway, or add an emergency SMS alert milestone..."
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRevisionModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAskAiRevise}
                disabled={loading || !revisionPrompt.trim()}
              >
                Apply AI Revision
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    );
  }

  // ----------------------------------------------------
  // RENDER: CLASSIC MANUAL FORM (Fallback)
  // ----------------------------------------------------

  return (
    <Container className="py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-hairline gap-4">
        <div>
          <h1 className="text-2xl font-bold text-paper">Manual Project Creation</h1>
          <p className="text-xs font-mono text-smoke mt-1">Standard form entry without AI discovery</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setMode("discovery");
            setStage(STAGES.IDEA);
          }}
        >
          <FiCpu className="w-3.5 h-3.5 text-lime" />
          <span>Switch to AI Discovery Flow</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-button bg-red-950/30 border border-red-500/40 text-red-300 font-mono text-xs flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleClassicSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              label="Project Title"
              required
              value={classicTitle}
              onChange={(e) => setClassicTitle(e.target.value)}
              placeholder="e.g. Rural Healthcare Tracker"
            />
            <Textarea
              label="Detailed Description"
              rows={4}
              required
              value={classicDesc}
              onChange={(e) => setClassicDesc(e.target.value)}
              placeholder="Detailed description of the community problem and requirements..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category"
                value={classicCategory}
                onChange={(e) => setClassicCategory(e.target.value)}
                placeholder="e.g. Healthcare, Education, Environment"
              />
              <Input
                label="Required Skills (comma-separated)"
                value={classicSkills}
                onChange={(e) => setClassicSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB"
              />
            </div>

            {/* Budget & Compensation Section */}
            <div className="pt-3 border-t border-hairline/60">
              <h4 className="text-xs font-mono font-bold text-smoke uppercase tracking-wider mb-3">
                Budget & Compensation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Budget Model"
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value)}
                >
                  <option value="Volunteer">Volunteer / Civic (Free)</option>
                  <option value="Fixed">Fixed Grant / Stipend</option>
                  <option value="Negotiable">Negotiable</option>
                </Select>

                {budgetType !== "Volunteer" ? (
                  <>
                    <Input
                      label="Budget Amount"
                      type="number"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="e.g. 50000"
                    />
                    <Select
                      label="Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </Select>
                  </>
                ) : (
                  <div className="sm:col-span-2 flex items-center pt-6 text-xs text-smoke font-mono">
                    Non-profit / open-source volunteer challenge
                  </div>
                )}
              </div>
            </div>

            {/* Timeline, Deadline & Team Capacity Section */}
            <div className="pt-3 border-t border-hairline/60">
              <h4 className="text-xs font-mono font-bold text-smoke uppercase tracking-wider mb-3">
                Timeline & Team Capacity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Expected Duration"
                  value={classicDuration}
                  onChange={(e) => setClassicDuration(e.target.value)}
                  placeholder="e.g. 30 Days, 6 Weeks"
                />
                <Input
                  label="Deadline Date"
                  type="date"
                  value={classicDeadline}
                  onChange={(e) => setClassicDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <Input
                  label="Max Team Size"
                  type="number"
                  min="1"
                  max="20"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default CreateProblem;
