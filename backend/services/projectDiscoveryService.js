const Groq = require("groq-sdk");
const axios = require("axios");

const MAX_DISCOVERY_TURNS = 7;

/**
 * Safely parse JSON from LLM response text or object.
 */
function safeParseJson(data) {
  if (typeof data === "object" && data !== null) {
    return data;
  }
  let str = String(data || "").trim();
  if (str.startsWith("```")) {
    str = str.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    str = str.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(str);
  } catch (err) {
    console.warn("safeParseJson failed, raw string length:", str.length, err.message);
    return null;
  }
}

/**
 * Call Groq official API if GROQ_API_KEY is configured in backend/.env.
 */
async function callGroqChat(prompt, systemPrompt, maxTokens = 2500) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return null;
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "";
    return safeParseJson(content);
  } catch (err) {
    console.warn("Groq API call error, will attempt fallback:", err.message);
    return null;
  }
}

/**
 * Call Pollinations AI fallback via reliable GET/POST request.
 */
async function callOnlineLLMJson(promptText, systemPrompt = "") {
  try {
    const combined = `${systemPrompt}\n\nStrict instruction: Return ONLY raw JSON without markdown formatting or code blocks.\n\n${promptText}`;
    const encoded = encodeURIComponent(combined.substring(0, 4000));
    const url = `https://text.pollinations.ai/${encoded}?json=true`;
    const res = await axios.get(url, {
      timeout: 25000,
      headers: {
        "User-Agent": "SolveX-Platform/2.0",
        Accept: "application/json, text/plain",
      },
    });

    return safeParseJson(res.data);
  } catch (err) {
    console.warn("Online LLM pipeline notice:", err.message);
    return null;
  }
}

/**
 * Returns specific system instructions based on selected language.
 */
function getLanguageInstruction(language = "en") {
  const lang = String(language || "en").toLowerCase();
  if (lang === "hi" || lang === "hindi") {
    return `TARGET LANGUAGE: HINDI (हिन्दी).
- You MUST generate the question, options, reason, and all conversational output in authentic, clear Hindi written in Devanagari script (हिन्दी).
- CRITICAL: Technical terms, frameworks, and architecture names (e.g. React, Node.js, Express, MongoDB, Socket.IO, API, JWT, GitHub, REST, PWA, Docker, AWS) MUST REMAIN in standard English alphabet without translation.
- You must understand answers provided in Hindi, English, or Hinglish, but your output MUST BE in Hindi.`;
  }
  if (lang === "hinglish") {
    return `TARGET LANGUAGE: HINGLISH (Conversational Hindi in Latin/English script).
- You MUST generate the question, options, reason, and all conversational output in modern, natural Hinglish (Hindi written using English letters, e.g. "Is platform ko primarily kaun use karega?", "Kya payment gateway integration chahiye?").
- CRITICAL: Technical terms, frameworks, and architecture names (e.g. React, Node.js, Express, MongoDB, Socket.IO, API, JWT, GitHub, REST, PWA) MUST REMAIN in standard technical English notation.
- You must understand answers provided in English, Hindi, or Hinglish, but your output MUST BE in conversational Hinglish.`;
  }
  return `TARGET LANGUAGE: ENGLISH.
- Generate all questions, options, and reasons in professional, clear English.
- You must understand answers provided in English, Hindi, or Hinglish.`;
}

/**
 * Returns specific blueprint language instructions.
 */
function getBlueprintLanguageInstruction(language = "en") {
  const lang = String(language || "en").toLowerCase();
  if (lang === "hi" || lang === "hindi") {
    return `TARGET LANGUAGE: HINDI (हिन्दी).
- Generate the project title, overview, problem statement, objectives, user flows, functional requirements, non-functional requirements, milestones, risks, and descriptions in clear, professional Hindi (हिन्दी).
- CRITICAL: Keep all technical stacks, framework names, database names, developer skills (e.g. React, Node.js, Express.js, MongoDB, Socket.IO, JWT, REST API, Tailwind CSS, Docker) in standard English notation without translating them.`;
  }
  if (lang === "hinglish") {
    return `TARGET LANGUAGE: HINGLISH.
- Generate the overview, problem statement, user flows, requirements, and milestone descriptions in conversational, professional Hinglish (Hindi written in Latin script).
- CRITICAL: Keep all technical stacks, framework names, database names, developer skills (e.g. React, Node.js, Express.js, MongoDB, Socket.IO, JWT, REST API, Tailwind CSS, Docker) in standard technical notation.`;
  }
  return `TARGET LANGUAGE: ENGLISH.
- Generate the technical blueprint in comprehensive, professional English.`;
}

/**
 * Prompt builder: Question Generation and Readiness Evaluation.
 */
function buildDiscoveryQuestionPrompt({ initialIdea, conversation, collectedRequirements, turn, language = "en" }) {
  const languageDirective = getLanguageInstruction(language);

  const systemPrompt = `You are an expert software product analyst and principal solution architect at SolveX.
Your task is to conduct an interactive discovery session with a Problem Provider (e.g. NGO, social entrepreneur, or community leader) who has a project idea.

${languageDirective}

You must analyze their initial idea, prior questions, and user answers to:
1. Identify critical missing dimensions of the project (e.g. target users, core workflow, monetization/pricing, integrations, notifications, technical scale, mobile vs web).
2. Formulate ONE highly relevant, adaptive question tailored strictly to this project domain in the specified TARGET LANGUAGE.
3. Decide appropriate question type: "single_choice", "multiple_choice", "text", "textarea", "boolean", or "number". If "single_choice" or "multiple_choice", provide 3-5 realistic options in the TARGET LANGUAGE plus "Other" (or "अन्य / Other").
4. Evaluate readiness score (0 to 100) indicating how complete the specification is. If readiness >= 80 or turn >= ${MAX_DISCOVERY_TURNS}, mark status "ready".
5. Update collected internal requirements based on all information available.

CRITICAL RULES:
- The question MUST be specific to their domain and generated in the requested TARGET LANGUAGE.
- Keep technical terms (React, Node.js, MongoDB, API, JWT, GitHub, REST, Socket.IO) in English alphabet.
- Never ask a question that has already been answered.
- Return ONLY valid JSON matching the exact schema below.`;

  const previousDialogue = conversation
    .filter((c) => c.content)
    .map((c) => `${c.role.toUpperCase()} (${c.type}): ${c.content}`)
    .join("\n");

  const prompt = `SELECTED LANGUAGE: ${language.toUpperCase()}

INITIAL PROJECT IDEA:
"${initialIdea}"

CONVERSATION HISTORY SO FAR:
${previousDialogue || "No previous questions yet. This is turn 1."}

CURRENT KNOWN REQUIREMENTS:
${JSON.stringify(collectedRequirements || {}, null, 2)}

CURRENT TURN: ${turn} of max ${MAX_DISCOVERY_TURNS}

Generate the analysis and next question in the TARGET LANGUAGE in this exact JSON format:
{
  "status": "needs_more_information", // or "ready" if enough details exist to build a complete engineering blueprint
  "readinessScore": 35, // integer 0-100 reflecting specification maturity
  "reason": "Brief reason in target language why this question is being asked or why we are ready",
  "updatedRequirements": {
    "projectGoal": "Summary of primary goal",
    "targetUsers": ["User group 1", "User group 2"],
    "userRoles": ["Role 1", "Role 2"],
    "features": ["Discovered feature 1", "Discovered feature 2"],
    "technologyPreferences": [],
    "constraints": []
  },
  "question": {
    "id": "q_${turn}",
    "text": "The dynamic question text specifically tailored to their domain in TARGET LANGUAGE",
    "type": "single_choice", // "single_choice" | "multiple_choice" | "text" | "textarea" | "boolean" | "number"
    "options": ["Option A", "Option B", "Option C", "Other / Custom"],
    "required": true,
    "reason": "Why this info is necessary for system architecture in TARGET LANGUAGE"
  }
}`;

  return { systemPrompt, prompt };
}

/**
 * Intelligent domain fallback for question generation if external LLMs are unreachable.
 */
function synthesizeDomainDiscoveryQuestion(initialIdea, conversation, collectedRequirements, turn) {
  const ideaLower = (initialIdea || "").toLowerCase();
  const answeredTexts = conversation
    .filter((c) => c.type === "answer")
    .map((c) => String(c.content).toLowerCase())
    .join(" ");

  const askedQuestions = conversation
    .filter((c) => c.type === "question")
    .map((c) => String(c.content).toLowerCase());

  const hasAsked = (keyword) => askedQuestions.some((q) => q.includes(keyword));

  let question;
  let status = turn >= 4 ? "ready" : "needs_more_information";
  let readinessScore = Math.min(15 + turn * 22, 90);

  if (!hasAsked("target user") && !hasAsked("who will use") && turn === 1) {
    if (ideaLower.includes("farmer") || ideaLower.includes("agri")) {
      question = {
        id: `q_${turn}`,
        text: "Who are the primary participants interacting on this agricultural platform?",
        type: "multiple_choice",
        options: ["Local Farmers / Producers", "Wholesale Buyers / Retailers", "Consumers / Households", "Agronomists / Field Advisors", "Platform Administrators"],
        required: true,
        reason: "User roles determine access boundaries and authentication hierarchies.",
      };
    } else if (ideaLower.includes("hospital") || ideaLower.includes("health") || ideaLower.includes("doctor")) {
      question = {
        id: `q_${turn}`,
        text: "Which user groups will be accessing this healthcare portal?",
        type: "multiple_choice",
        options: ["Patients & Families", "Doctors & Specialists", "Nurses & Triage Staff", "Pharmacy & Lab Technicians", "Hospital Administrators"],
        required: true,
        reason: "Essential for role-based permissions, HIPAA-grade security, and record confidentiality.",
      };
    } else if (ideaLower.includes("ride") || ideaLower.includes("cab") || ideaLower.includes("driver")) {
      question = {
        id: `q_${turn}`,
        text: "What interfaces do different user types need in this ride mobility system?",
        type: "multiple_choice",
        options: ["Passenger Booking App", "Driver Navigation & Trip App", "Fleet / Dispatch Management Console", "City Operations / Admin Dashboard"],
        required: true,
        reason: "Determines whether separate mobile and administrative web clients are required.",
      };
    } else if (ideaLower.includes("learning") || ideaLower.includes("course") || ideaLower.includes("student") || ideaLower.includes("school")) {
      question = {
        id: `q_${turn}`,
        text: "Who will engage on this educational platform?",
        type: "multiple_choice",
        options: ["Students / Learners", "Teachers / Course Instructors", "Institutions / School Admins", "Parents / Guardians"],
        required: true,
        reason: "Identifies whether multi-tenant grading, course management, or assessment engines are needed.",
      };
    } else {
      question = {
        id: `q_${turn}`,
        text: "Who are the primary end users and beneficiaries of this platform?",
        type: "multiple_choice",
        options: ["Direct Consumers / Community Members", "Staff & Field Workers", "Service Providers / Partners", "System Administrators"],
        required: true,
        reason: "User roles establish the core user journeys and authorization model.",
      };
    }
  } else if (!hasAsked("payment") && !hasAsked("monetiz") && (ideaLower.includes("market") || ideaLower.includes("e-commerce") || ideaLower.includes("store") || ideaLower.includes("book") || ideaLower.includes("sell"))) {
    question = {
      id: `q_${turn}`,
      text: "How should transactions or payments be handled on the platform?",
      type: "single_choice",
      options: ["Direct Online Payments (Razorpay/Stripe/UPI)", "Cash on Delivery / Offline Escrow", "Subscription / Membership Model", "Free / Non-monetary Community Exchange"],
      required: true,
      reason: "Defines checkout workflows, payment gateway integrations, and financial ledger requirements.",
    };
  } else if (!hasAsked("real-time") && !hasAsked("live") && !hasAsked("track") && (ideaLower.includes("delivery") || ideaLower.includes("ride") || ideaLower.includes("chat") || ideaLower.includes("consultation"))) {
    question = {
      id: `q_${turn}`,
      text: "What level of live, real-time tracking or updates does this solution require?",
      type: "single_choice",
      options: ["Live GPS map location tracking (WebSockets/Socket.io)", "Real-time in-app chat & instant push alerts", "Status updates on page refresh only", "SMS / Email notification alerts only"],
      required: true,
      reason: "Dictates the necessity of persistent WebSocket connections, map APIs, and background queue workers.",
    };
  } else if (!hasAsked("platform") && !hasAsked("device") && !hasAsked("web")) {
    question = {
      id: `q_${turn}`,
      text: "What primary devices or platforms should be targeted for launch?",
      type: "single_choice",
      options: ["Responsive Web Application (Desktop + Mobile browser)", "Cross-Platform Mobile App (React Native/Flutter)", "Mobile-First PWA (Progressive Web App)", "Web Dashboard for Admins + Mobile App for Users"],
      required: true,
      reason: "Guides the frontend architecture, viewport styling, and native device capability decisions.",
    };
  } else {
    status = "ready";
    readinessScore = 88;
    question = {
      id: `q_${turn}`,
      text: "Do you have any specific security, data privacy, or third-party API requirements?",
      type: "textarea",
      options: [],
      required: false,
      reason: "Final technical constraints before blueprint synthesis.",
    };
  }

  return {
    status,
    readinessScore,
    reason: "Dynamic domain analysis completed with current requirements context.",
    updatedRequirements: {
      projectGoal: initialIdea.substring(0, 150),
      targetUsers: collectedRequirements?.targetUsers || [],
      userRoles: collectedRequirements?.userRoles || [],
      features: collectedRequirements?.features || [],
    },
    question,
  };
}

/**
 * Prompt builder: Complete Technical Project Blueprint.
 */
function buildBlueprintPrompt({ initialIdea, conversation, collectedRequirements, language = "en" }) {
  const languageDirective = getBlueprintLanguageInstruction(language);

  const systemPrompt = `You are a Principal Software Architect and Solutions Engineer at SolveX.
Generate a COMPLETE, UNIQUE, PRODUCTION-READY SOFTWARE PROJECT BLUEPRINT.
The blueprint must be strictly tailored to the user's project idea, conversation history, and gathered requirements.

${languageDirective}

Do NOT use generic boilerplate. Synthesize an authentic, domain-specific architecture.

Return strictly a JSON object with this exact structure:
{
  "title": "Clear, professional project title in selected language",
  "overview": "Comprehensive 2-3 paragraph overview of the software product in selected language",
  "problemStatement": "Detailed description of the core problem, existing operational bottlenecks, and affected stakeholders in selected language",
  "objectives": ["Specific objective 1", "Specific objective 2", "Specific objective 3"],
  "targetUsers": ["Target user demographic 1", "Target user demographic 2"],
  "userRoles": [
    { "role": "Role Name", "description": "Responsibilities and capabilities on the platform" }
  ],
  "userFlows": [
    { "flowName": "Primary Onboarding & Action", "steps": ["Step 1", "Step 2", "Step 3"] }
  ],
  "functionalRequirements": ["FR1: ...", "FR2: ...", "FR3: ...", "FR4: ..."],
  "nonFunctionalRequirements": ["Scalability: ...", "Performance: ...", "Security: ..."],
  "features": {
    "core": ["Core feature 1 with rationale", "Core feature 2 with rationale", "Core feature 3 with rationale"],
    "advanced": ["Advanced feature 1", "Advanced feature 2"]
  },
  "technology": {
    "frontend": ["React", "Tailwind CSS", "Vite/Axios"],
    "backend": ["Node.js", "Express.js"],
    "database": ["MongoDB / Mongoose"],
    "authentication": ["JWT", "Bcrypt"],
    "realtime": ["Socket.IO (if required)"],
    "deployment": ["Docker", "Render / AWS"],
    "userPreferences": ["Technologies user requested or None specified"],
    "aiRecommendations": ["Key architectural tech choices with rationale"]
  },
  "architecture": {
    "type": "Client-Server Monolith / Microservices / Event-Driven",
    "description": "Clear architectural narrative describing data flow, API layer, and state management"
  },
  "apiRequirements": [
    { "endpoint": "/api/...", "method": "POST", "purpose": "..." }
  ],
  "databaseRequirements": [
    { "collection": "CollectionName", "keyFields": ["field1", "field2", "field3"] }
  ],
  "securityRequirements": ["CORS policy", "JWT token expiry", "Input sanitization"],
  "integrations": ["Payment gateway, SMS, Maps, or external APIs tailored to the problem"],
  "developerRoles": [
    {
      "role": "Frontend Specialist",
      "skills": ["React", "Tailwind CSS", "State Management", "Responsive UI"],
      "responsibilities": ["Develop user-facing screens", "Integrate REST APIs"]
    },
    {
      "role": "Backend Architect",
      "skills": ["Node.js", "Express.js", "MongoDB", "REST APIs", "JWT"],
      "responsibilities": ["Implement database models", "Design and secure endpoints"]
    }
  ],
  "requiredSkills": ["React", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],
  "modules": [
    { "name": "Authentication & Access Control", "scope": "..." },
    { "name": "Core Domain Engine", "scope": "..." }
  ],
  "milestones": [
    { "title": "Phase 1: Architecture & Scaffolding", "duration": "10 Days", "deliverables": ["Data models", "Auth setup"] },
    { "title": "Phase 2: Core Workflows & Logic", "duration": "15 Days", "deliverables": ["Main user actions", "API integration"] },
    { "title": "Phase 3: Integration & Testing", "duration": "10 Days", "deliverables": ["Security audit", "Third-party APIs"] },
    { "title": "Phase 4: Deployment & Handover", "duration": "5 Days", "deliverables": ["CI/CD", "Documentation"] }
  ],
  "testingRequirements": ["Unit tests with Jest", "Integration testing for critical endpoints"],
  "deploymentRequirements": ["Environment configuration", "Database indexing"],
  "risks": ["Potential operational or technical risk 1", "Risk 2"],
  "assumptions": ["Key operational assumption 1", "Assumption 2"],
  "openQuestions": ["Unresolved question 1"],
  "complexity": "Moderate" // "Simple", "Moderate", or "Complex"
}`;

  const dialogue = conversation
    .filter((c) => c.content)
    .map((c) => `${c.role.toUpperCase()}: ${c.content}`)
    .join("\n");

  const prompt = `SELECTED BLUEPRINT LANGUAGE: ${language.toUpperCase()}

PROJECT IDEA:
"${initialIdea}"

FULL DISCOVERY INTERVIEW & ANSWERS:
${dialogue}

COLLECTED REQUIREMENTS SO FAR:
${JSON.stringify(collectedRequirements || {}, null, 2)}

Generate the complete, unique, structured JSON blueprint in ${language.toUpperCase()} now.`;

  return { systemPrompt, prompt };
}

/**
 * Intelligent domain fallback for complete blueprint synthesis if AI is unavailable.
 */
function synthesizeDomainBlueprint(initialIdea, conversation, collectedRequirements) {
  const ideaLower = (initialIdea || "").toLowerCase();
  const title = initialIdea.split(/[.?!:\n]/)[0].trim().substring(0, 60) || "Civic Innovation Project";

  let category = "Web Platform";
  let techFrontend = ["React", "Tailwind CSS", "Axios"];
  let techBackend = ["Node.js", "Express.js"];
  let techDatabase = ["MongoDB", "Mongoose"];
  let techRealtime = ["Socket.IO"];
  let developerRoles = [];
  let coreFeatures = [];
  let milestones = [];

  if (ideaLower.includes("farmer") || ideaLower.includes("agri") || ideaLower.includes("harvest")) {
    category = "AgriTech & Rural Marketplace";
    techRealtime = ["Socket.IO (Live negotiation & inventory alerts)"];
    coreFeatures = [
      "Farmer Crop & Produce Listing with regional pricing indicators",
      "Direct Wholesale Buyer Inquiry and Price Bidding System",
      "Multilingual Voice/Text Accessibility for non-technical rural farmers",
      "Logistics and Pickup Route Coordination Dashboard",
    ];
    developerRoles = [
      {
        role: "Full-Stack Web Developer",
        skills: ["React", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],
        responsibilities: ["Build marketplace catalog and farmer produce management dashboard"],
      },
      {
        role: "Real-Time / Mobile Specialist",
        skills: ["Socket.IO", "PWA", "Responsive UI", "REST API"],
        responsibilities: ["Implement real-time price updates and mobile-friendly offline-first views"],
      },
    ];
  } else if (ideaLower.includes("hospital") || ideaLower.includes("clinic") || ideaLower.includes("health") || ideaLower.includes("doctor")) {
    category = "Healthcare & Hospital Management";
    coreFeatures = [
      "Patient Electronic Health Record (EHR) & Triage Intake Portal",
      "Doctor Appointment Scheduling and Real-Time Ward Bed Allocation",
      "Encrypted Prescription & Diagnostic Test Results Sharing",
      "Role-Based Audit Logging and HIPAA-Compliant Data Access Controls",
    ];
    developerRoles = [
      {
        role: "Backend & Security Engineer",
        skills: ["Node.js", "Express.js", "MongoDB", "JWT", "Encryption / HTTPS"],
        responsibilities: ["Design secure patient data storage and granular role-based access controllers"],
      },
      {
        role: "Frontend UI/UX Specialist",
        skills: ["React", "Tailwind CSS", "Data Tables", "Accessibility"],
        responsibilities: ["Build doctor scheduling interface and patient triage intake workflow"],
      },
    ];
  } else if (ideaLower.includes("ride") || ideaLower.includes("cab") || ideaLower.includes("delivery") || ideaLower.includes("transport")) {
    category = "Mobility & Logistics";
    coreFeatures = [
      "Real-Time Geolocation Vehicle / Delivery Tracking via WebSockets",
      "Automated Fare Calculation and Route Optimization",
      "Driver Shift Management and Trip Acceptance Dispatcher",
      "Emergency SOS and In-App Incident Reporting",
    ];
    developerRoles = [
      {
        role: "Full-Stack Node/React Engineer",
        skills: ["Node.js", "Express.js", "Socket.IO", "MongoDB", "Leaflet / Maps API"],
        responsibilities: ["Implement live tracking coordinates and trip dispatch state machine"],
      },
      {
        role: "Frontend Specialist",
        skills: ["React", "Tailwind CSS", "Mapbox / Leaflet", "WebSockets"],
        responsibilities: ["Build interactive live tracking maps and passenger trip booking screen"],
      },
    ];
  } else {
    category = "Digital Community Solutions";
    coreFeatures = [
      "Secure User Authentication and Multi-Role Access Control",
      "Dynamic Resource Catalog with Full-Text Search and Category Filters",
      "Interactive Review and Status Feedback Loop",
      "Administrative Reporting and Platform Analytics Dashboard",
    ];
    developerRoles = [
      {
        role: "Frontend Developer",
        skills: ["React", "Tailwind CSS", "REST API Integration", "State Management"],
        responsibilities: ["Build responsive user interfaces and modular component hierarchy"],
      },
      {
        role: "Backend Developer",
        skills: ["Node.js", "Express.js", "MongoDB", "REST APIs", "JWT"],
        responsibilities: ["Implement business logic, database schemas, and REST endpoints"],
      },
    ];
  }

  milestones = [
    {
      title: "Phase 1: Project Scaffolding & Authentication",
      duration: "10 Days",
      deliverables: ["Database schema design", "User registration, login, and role-based permissions"],
    },
    {
      title: "Phase 2: Core Domain Workflows & API Implementation",
      duration: "15 Days",
      deliverables: ["Primary business feature implementation", "Data entry and management endpoints"],
    },
    {
      title: "Phase 3: Integration, Real-Time Feedback & Testing",
      duration: "12 Days",
      deliverables: ["External integrations", "Input validation and automated test suites"],
    },
    {
      title: "Phase 4: Deployment & Final Acceptance Review",
      duration: "8 Days",
      deliverables: ["Production environment setup", "User testing and documentation handover"],
    },
  ];

  const allSkills = Array.from(new Set(developerRoles.flatMap((r) => r.skills)));

  return {
    title,
    overview: `This software solution transforms the initial vision—"${initialIdea}"—into an accessible, robust digital platform engineered for reliability and usability. It incorporates targeted workflows for key users, high-performance data processing, and transparent administrative control.`,
    problemStatement: `Current manual, fragmented, or legacy systems handling "${initialIdea}" suffer from communication delays, lack of transparency, and operational bottlenecks. This platform centralizes interaction, guarantees real-time visibility, and simplifies core tasks.`,
    objectives: [
      "Streamline end-to-end interactions with zero manual paperwork.",
      "Provide real-time visibility and status tracking for all participants.",
      "Ensure robust security, role-based authorization, and high data integrity.",
    ],
    targetUsers: ["Primary Community Users", "Operational Staff", "System Administrators"],
    userRoles: [
      { role: "Standard User", description: "Creates requests, searches resources, and engages in transactions" },
      { role: "Service Provider / Operator", description: "Processes requests, updates fulfillment status, and communicates with users" },
      { role: "Administrator", description: "Manages platform health, oversees moderation, and audits system logs" },
    ],
    userFlows: [
      { flowName: "Primary Workflow", steps: ["User creates an account and logs in", "User initiates action through dashboard", "System routes action to matching provider", "Status updates in real-time until completion"] },
    ],
    functionalRequirements: [
      "The system shall authenticate users with encrypted credentials and JWT tokens.",
      "The system shall provide searchable catalogs and filterable data tables.",
      "The system shall trigger notifications upon significant status transitions.",
      "The system shall maintain audit logs for sensitive operations.",
    ],
    nonFunctionalRequirements: [
      "Response Time: Sub-200ms API response time under normal operational loads.",
      "Availability: 99.9% uptime target with automated error logging.",
      "Security: End-to-end encrypted transport (HTTPS) and parameterized database queries.",
    ],
    features: {
      core: coreFeatures,
      advanced: [
        "Automated Activity Feed and Event Timeline",
        "Exportable PDF / CSV Data Reports",
        "Granular Notification Preferences (In-App + Email)",
      ],
    },
    technology: {
      frontend: techFrontend,
      backend: techBackend,
      database: techDatabase,
      authentication: ["JWT (JSON Web Tokens)", "Bcrypt password hashing"],
      realtime: techRealtime,
      deployment: ["Docker Containerization", "Node.js Process Manager (PM2 / Cloud)"],
      userPreferences: ["Tailored to natural language requirements provided"],
      aiRecommendations: ["MongoDB for flexible document modeling", "Express REST architecture for fast iteration"],
    },
    architecture: {
      type: "MERN Stack Client-Server Architecture",
      description: "React single-page application communicating with an Express.js REST API layer backed by MongoDB. Real-time updates push via WebSocket event handlers.",
    },
    apiRequirements: [
      { endpoint: "/api/auth/login", method: "POST", purpose: "Authenticate user and issue JWT" },
      { endpoint: "/api/resources", method: "GET", purpose: "Fetch and filter core entities" },
      { endpoint: "/api/resources", method: "POST", purpose: "Create a new resource submission" },
    ],
    databaseRequirements: [
      { collection: "Users", keyFields: ["email", "password", "role", "profile"] },
      { collection: "Projects", keyFields: ["title", "description", "status", "blueprint"] },
      { collection: "Activities", keyFields: ["userId", "action", "timestamp"] },
    ],
    securityRequirements: [
      "Role-Based Access Control (RBAC) enforced on all private API endpoints",
      "Helmet HTTP security header protections and CORS whitelist",
      "Bcrypt password hashing with minimum salt rounds of 10",
    ],
    integrations: ["SolveX Real-Time Chat Engine", "GitHub Repository Integration", "External REST Services"],
    developerRoles,
    requiredSkills: allSkills,
    modules: [
      { name: "Authentication & User Management", scope: "Profiles, roles, and session tokens" },
      { name: "Core Application Engine", scope: "Primary business workflows and entity lifecycle" },
      { name: "Dashboard & Analytics", scope: "Reporting, summary metrics, and activity logs" },
    ],
    milestones,
    testingRequirements: [
      "Unit testing for core domain utility functions",
      "API route integration testing with mock database connections",
    ],
    deploymentRequirements: [
      "Environment variable validation on server startup",
      "MongoDB replica set or Atlas connection with connection pooling",
    ],
    risks: [
      "Rapid user adoption could increase WebSocket connection load (mitigated by horizontal scaling)",
      "Varying user device bandwidth (mitigated by optimized asset bundling and responsive UI)",
    ],
    assumptions: [
      "Users have modern web browser access on mobile or desktop devices",
      "Initial deployment operates within standard cloud tier limits",
    ],
    openQuestions: [
      "Preferred external SMS/Email provider for outbound notifications",
    ],
    complexity: "Moderate",
  };
}

/**
 * Service API: Start a discovery session.
 */
exports.startDiscoverySession = async ({ initialIdea, userId, language = "en" }) => {
  const cleanIdea = (initialIdea || "").trim();
  if (!cleanIdea || cleanIdea.length < 5) {
    throw new Error("Please provide a descriptive project idea (at least 5 characters).");
  }

  const { systemPrompt, prompt } = buildDiscoveryQuestionPrompt({
    initialIdea: cleanIdea,
    conversation: [],
    collectedRequirements: {},
    turn: 1,
    language,
  });

  // 1. Try Groq official API
  let aiResponse = await callGroqChat(prompt, systemPrompt);

  // 2. Try Online LLM Fallback
  if (!aiResponse || !aiResponse.question) {
    aiResponse = await callOnlineLLMJson(prompt, systemPrompt);
  }

  // 3. Fallback to domain synthesis if both unavailable
  if (!aiResponse || !aiResponse.question) {
    aiResponse = synthesizeDomainDiscoveryQuestion(cleanIdea, [], {}, 1);
  }

  const firstQuestion = aiResponse.question;
  const conversation = [
    {
      role: "assistant",
      type: "question",
      content: firstQuestion.text,
      questionId: firstQuestion.id,
      questionType: firstQuestion.type || "text",
      options: firstQuestion.options || [],
      reason: firstQuestion.reason || "",
      createdAt: new Date(),
    },
  ];

  return {
    initialIdea: cleanIdea,
    language,
    status: aiResponse.status || "needs_more_information",
    readinessScore: aiResponse.readinessScore || 20,
    currentQuestion: firstQuestion,
    conversation,
    collectedRequirements: aiResponse.updatedRequirements || {
      projectGoal: cleanIdea.substring(0, 150),
    },
    aiSummary: aiResponse.reason || "AI Discovery session initiated.",
    turnsCount: 1,
  };
};

/**
 * Service API: Process an answer and dynamically generate the next question.
 */
exports.processAnswerAndNextQuestion = async ({
  initialIdea,
  conversation,
  collectedRequirements,
  currentQuestion,
  answer,
  turnsCount,
  language = "en",
}) => {
  const nextTurn = (turnsCount || 1) + 1;

  // Format the user answer
  const answerContent = Array.isArray(answer) ? answer.join(", ") : String(answer || "").trim();
  if (!answerContent) {
    throw new Error("Answer cannot be empty.");
  }

  const updatedConversation = [
    ...conversation,
    {
      role: "user",
      type: "answer",
      content: answerContent,
      questionId: currentQuestion?.id || `q_${turnsCount}`,
      answer,
      createdAt: new Date(),
    },
  ];

  // If maximum turns reached, finalize readiness
  if (nextTurn >= MAX_DISCOVERY_TURNS) {
    return {
      status: "ready",
      readinessScore: 95,
      conversation: updatedConversation,
      currentQuestion: null,
      collectedRequirements: {
        ...collectedRequirements,
        lastAnswer: answerContent,
      },
      aiSummary: "All essential requirements have been gathered. Ready to generate the technical blueprint!",
      turnsCount: nextTurn,
    };
  }

  const { systemPrompt, prompt } = buildDiscoveryQuestionPrompt({
    initialIdea,
    conversation: updatedConversation,
    collectedRequirements,
    turn: nextTurn,
    language,
  });

  // Call AI
  let aiResponse = await callGroqChat(prompt, systemPrompt);
  if (!aiResponse || !aiResponse.question) {
    aiResponse = await callOnlineLLMJson(prompt, systemPrompt);
  }
  if (!aiResponse || !aiResponse.question) {
    aiResponse = synthesizeDomainDiscoveryQuestion(
      initialIdea,
      updatedConversation,
      collectedRequirements,
      nextTurn
    );
  }

  const isReady = aiResponse.status === "ready" || aiResponse.readinessScore >= 80;

  if (isReady) {
    return {
      status: "ready",
      readinessScore: Math.max(aiResponse.readinessScore || 85, 80),
      conversation: updatedConversation,
      currentQuestion: null,
      collectedRequirements: {
        ...collectedRequirements,
        ...(aiResponse.updatedRequirements || {}),
      },
      aiSummary: aiResponse.reason || "Sufficient requirements collected to construct a complete blueprint.",
      turnsCount: nextTurn,
    };
  }

  const nextQuestion = aiResponse.question;
  const finalConversation = [
    ...updatedConversation,
    {
      role: "assistant",
      type: "question",
      content: nextQuestion.text,
      questionId: nextQuestion.id,
      questionType: nextQuestion.type || "text",
      options: nextQuestion.options || [],
      reason: nextQuestion.reason || "",
      createdAt: new Date(),
    },
  ];

  return {
    status: "needs_more_information",
    readinessScore: Math.min(Math.max(aiResponse.readinessScore || 20 + nextTurn * 15, 20), 90),
    conversation: finalConversation,
    currentQuestion: nextQuestion,
    collectedRequirements: {
      ...collectedRequirements,
      ...(aiResponse.updatedRequirements || {}),
    },
    aiSummary: aiResponse.reason || `Turn ${nextTurn} question generated.`,
    turnsCount: nextTurn,
  };
};

/**
 * Service API: Regenerate current question when language is switched mid-session.
 */
exports.regenerateCurrentQuestionInLanguage = async ({
  initialIdea,
  conversation,
  collectedRequirements,
  turn = 1,
  language = "en",
}) => {
  const { systemPrompt, prompt } = buildDiscoveryQuestionPrompt({
    initialIdea,
    conversation,
    collectedRequirements,
    turn,
    language,
  });

  let aiResponse = await callGroqChat(prompt, systemPrompt);
  if (!aiResponse || !aiResponse.question) {
    aiResponse = await callOnlineLLMJson(prompt, systemPrompt);
  }
  if (!aiResponse || !aiResponse.question) {
    aiResponse = synthesizeDomainDiscoveryQuestion(
      initialIdea,
      conversation,
      collectedRequirements,
      turn
    );
  }

  return aiResponse.question;
};

/**
 * Service API: Generate a full unique technical blueprint from session context.
 */
exports.generateBlueprint = async ({ initialIdea, conversation, collectedRequirements, language = "en" }) => {
  const { systemPrompt, prompt } = buildBlueprintPrompt({
    initialIdea,
    conversation,
    collectedRequirements,
    language,
  });

  let blueprint = await callGroqChat(prompt, systemPrompt, 3500);

  if (!blueprint || !blueprint.overview || !blueprint.developerRoles) {
    blueprint = await callOnlineLLMJson(prompt, systemPrompt);
  }

  if (!blueprint || !blueprint.overview || !blueprint.developerRoles) {
    blueprint = synthesizeDomainBlueprint(initialIdea, conversation, collectedRequirements);
  }

  // Ensure required arrays exist
  blueprint.requiredSkills = Array.isArray(blueprint.requiredSkills) && blueprint.requiredSkills.length > 0
    ? blueprint.requiredSkills
    : Array.from(new Set((blueprint.developerRoles || []).flatMap((r) => r.skills || [])));

  if (!blueprint.requiredSkills.length) {
    blueprint.requiredSkills = ["React", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"];
  }

  return blueprint;
};

/**
 * Service API: Revise an existing blueprint based on user instructions.
 */
exports.reviseBlueprint = async ({ currentBlueprint, instruction }) => {
  const systemPrompt = `You are a Principal Software Architect.
Revise the following software blueprint based on the user's specific instruction: "${instruction}".
Modify ONLY the sections affected by the instruction. Preserve existing confirmed requirements and technical consistency.
Return strictly a valid JSON object matching the blueprint schema.`;

  const prompt = `CURRENT BLUEPRINT:
${JSON.stringify(currentBlueprint, null, 2)}

USER REVISION INSTRUCTION:
"${instruction}"

Output the revised blueprint JSON now.`;

  let revised = await callGroqChat(prompt, systemPrompt, 3500);
  if (!revised || !revised.overview) {
    revised = await callOnlineLLMJson(prompt, systemPrompt);
  }

  if (!revised || !revised.overview) {
    // Graceful fallback: append instruction to notes/overview
    revised = {
      ...currentBlueprint,
      overview: `${currentBlueprint.overview}\n\n[User Revision Note]: ${instruction}`,
    };
  }

  return revised;
};
