const Groq = require("groq-sdk");
const axios = require("axios");

/**
 * Parses raw JSON string or object safely.
 */
function parseJsonResponse(data) {
  if (typeof data === "object" && data !== null) {
    return data;
  }
  let str = String(data).trim();
  if (str.startsWith("```")) {
    str = str.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    str = str.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(str);
}

/**
 * Parses delimited section format (---HEADER---) from LLM text responses.
 */
function parseDelimitedSpec(rawText, title) {
  if (!rawText || typeof rawText !== "string") return null;

  const getSection = (name) => {
    const regex = new RegExp(`---${name}---([\\s\\S]*?)(?=---[A-Z_]+---|$)`, "i");
    const match = rawText.match(regex);
    return match ? match[1].trim() : "";
  };

  const category = getSection("CATEGORY");
  const description = getSection("DESCRIPTION");
  const featuresRaw = getSection("FEATURES");
  const skillsRaw = getSection("SKILLS");
  const techRaw = getSection("TECH");
  const complexityRaw = getSection("COMPLEXITY");
  const summary = getSection("SUMMARY");

  const suggestedFeatures = featuresRaw
    ? featuresRaw
        .split(/\n+/)
        .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter((line) => line.length > 5)
    : [];

  const suggestedSkills = skillsRaw
    ? skillsRaw
        .split(/[,;\n]+/)
        .map((s) => s.trim().replace(/^[-*•\s]+/, ""))
        .filter((s) => s.length > 1)
    : [];

  let complexity = "Moderate";
  if (/complex/i.test(complexityRaw)) complexity = "Complex";
  else if (/simple/i.test(complexityRaw)) complexity = "Simple";

  return {
    title,
    summary,
    category: category || "",
    description: description || "",
    requiredFeatures: suggestedFeatures.join("\n"),
    suggestedFeatures,
    suggestedSkills,
    preferredTechnologies: techRaw || "",
    complexity,
    expectedDuration: "45 Days",
  };
}

/**
 * Call Groq official API if GROQ_API_KEY is configured in backend/.env.
 */
async function callGroqLLM(prompt, systemPrompt) {
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
      temperature: 0.8,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "";
    return parseJsonResponse(content);
  } catch (err) {
    console.warn("Groq API notice, falling back to online LLM pipeline:", err.message);
    return null;
  }
}

/**
 * Call Pollinations AI via fast reliable GET request.
 */
async function callOnlineLLM(promptText) {
  try {
    const encoded = encodeURIComponent(promptText);
    const url = `https://text.pollinations.ai/${encoded}`;
    const res = await axios.get(url, {
      timeout: 25000,
      headers: {
        "User-Agent": "SolveX-Platform/2.0",
        Accept: "text/plain",
      },
    });

    if (res.data && typeof res.data === "string" && res.data.length > 30) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn("Online LLM pipeline notice:", err.message);
    return null;
  }
}

/**
 * Generate a complete, authentic problem description narrative and feature blueprint
 * from a given title/heading and optional category.
 */
async function generateProblemDraft({ title, category = "", keywords = "" }) {
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    throw new Error("Title or heading is required to generate description");
  }

  // 1. Try Groq LLaMA 3.3 if API key configured
  const groqSystemPrompt = `You are a principal software architect and social impact strategist.
Generate an authentic, creative, 100% unique problem specification for a real-world software project.
Do NOT use repetitive templates or boilerplate text. Tailor everything to the title. Return strictly JSON.`;

  const groqUserPrompt = `Project Title: "${cleanTitle}"
${category ? `Category: "${category}"` : ""}
${keywords ? `Context/Keywords: "${keywords}"` : ""}

Generate a complete, unique software project specification.
JSON keys:
{
  "title": "${cleanTitle}",
  "category": "Specific domain category",
  "description": "3 rich, detailed, authentic paragraphs explaining the real-world operational problems, impacted stakeholders, manual bottlenecks, and proposed digital software solution.",
  "requiredFeatures": "Bulleted list of 5-6 core functional requirements",
  "suggestedFeatures": [
    "Feature Name: detailed explanation tailored specifically to ${cleanTitle}",
    "Feature Name: detailed explanation tailored specifically to ${cleanTitle}",
    "Feature Name: detailed explanation tailored specifically to ${cleanTitle}",
    "Feature Name: detailed explanation tailored specifically to ${cleanTitle}",
    "Feature Name: detailed explanation tailored specifically to ${cleanTitle}"
  ],
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "preferredTechnologies": "Modern tech stack recommendation",
  "complexity": "Simple, Moderate, or Complex",
  "expectedDuration": "30 Days, 45 Days, or 60 Days"
}`;

  let result = await callGroqLLM(groqUserPrompt, groqSystemPrompt);
  if (result && result.description && result.suggestedFeatures?.length > 0) {
    return {
      title: result.title || cleanTitle,
      category: result.category || category || "Software Engineering",
      description: result.description,
      requiredFeatures: typeof result.requiredFeatures === "string"
        ? result.requiredFeatures
        : result.suggestedFeatures.join("\n"),
      suggestedFeatures: result.suggestedFeatures,
      suggestedSkills: result.suggestedSkills || [],
      preferredTechnologies: result.preferredTechnologies || "React, Node.js, Express, MongoDB, Tailwind CSS",
      complexity: result.complexity || "Moderate",
      expectedDuration: result.expectedDuration || "45 Days",
    };
  }

  // 2. Try fast online LLM pipeline with delimited structure
  const onlinePrompt = `Act as an expert software architect. A user entered the project title: "${cleanTitle}".
${category ? `Category: "${category}".` : ""}
${keywords ? `Keywords: "${keywords}".` : ""}

Generate a completely original, authentic project specification specifically for "${cleanTitle}".
Do not use generic fill-in-the-blank placeholders. Write natural, professional software engineering text.
Format your output strictly using these headers:

---CATEGORY---
[Provide an appropriate real-world domain category, e.g. Predictive Healthcare Analytics, Civic AI, Smart Logistics]

---DESCRIPTION---
[Write 2 to 3 detailed, original paragraphs describing the real-world problem, who suffers from current limitations, why existing manual or legacy systems fail, and how this software platform solves it]

---FEATURES---
- [Feature 1 Name]: [detailed description of functionality]
- [Feature 2 Name]: [detailed description of functionality]
- [Feature 3 Name]: [detailed description of functionality]
- [Feature 4 Name]: [detailed description of functionality]
- [Feature 5 Name]: [detailed description of functionality]

---SKILLS---
[5-6 comma-separated developer skills needed, e.g. Python, PyTorch, React, Node.js, MongoDB, FastAPI]

---TECH---
[Recommended modern tech stack string]

---COMPLEXITY---
[Simple, Moderate, or Complex]`;

  const rawOnlineText = await callOnlineLLM(onlinePrompt);
  if (rawOnlineText) {
    const parsed = parseDelimitedSpec(rawOnlineText, cleanTitle);
    if (parsed && parsed.description && parsed.suggestedFeatures.length > 0) {
      return {
        title: cleanTitle,
        category: parsed.category || category || deriveCategoryFromTitle(cleanTitle),
        description: parsed.description,
        requiredFeatures: parsed.requiredFeatures,
        suggestedFeatures: parsed.suggestedFeatures,
        suggestedSkills: parsed.suggestedSkills.length > 0 ? parsed.suggestedSkills : ["Python", "React", "Node.js", "MongoDB"],
        preferredTechnologies: parsed.preferredTechnologies || "React, Node.js, Express, MongoDB, Tailwind CSS",
        complexity: parsed.complexity || "Moderate",
        expectedDuration: "45 Days",
      };
    }
  }

  // 3. Dynamic Creative Synthesis (Deep varied fallback)
  return synthesizeDeepOriginalDraft(cleanTitle, category, keywords);
}

/**
 * Analyze an existing problem statement and generate a technical blueprint.
 */
async function analyzeProblem(input) {
  let title = "";
  let description = "";
  let category = "";
  let requiredFeatures = "";
  let preferredTechnologies = "";
  let requiredSkills = [];

  if (typeof input === "string") {
    description = input;
  } else if (input && typeof input === "object") {
    title = input.title || "";
    description = input.description || "";
    category = input.category || "";
    requiredFeatures = input.requiredFeatures || "";
    preferredTechnologies = input.preferredTechnologies || "";
    requiredSkills = Array.isArray(input.requiredSkills) ? input.requiredSkills : [];
  }

  const combinedContext = [
    title ? `Problem Title: ${title}` : "",
    category ? `Domain Category: ${category}` : "",
    `Problem Description / Narrative:\n"${description}"`,
    requiredFeatures ? `Provider Raw Features Requested: ${requiredFeatures}` : "",
    preferredTechnologies ? `Preferred Technologies: ${preferredTechnologies}` : "",
    requiredSkills.length > 0 ? `Requested Skills: ${requiredSkills.join(", ")}` : "",
  ].filter(Boolean).join("\n\n");

  // 1. Try Groq SDK
  const groqSystemPrompt = `You are a principal software architect. Clean up and organize requirements into a professional software engineering blueprint. Return strictly JSON.`;
  const groqUserPrompt = `Context:\n${combinedContext}\n\nRespond with valid JSON:
{
  "summary": "Executive 2-3 sentence technical overview of the software to build.",
  "suggestedFeatures": [
    "Feature Name: detailed functional explanation",
    "Feature Name: detailed functional explanation",
    "Feature Name: detailed functional explanation",
    "Feature Name: detailed functional explanation",
    "Feature Name: detailed functional explanation"
  ],
  "suggestedSkills": ["Primary Tech 1", "Primary Tech 2", "Primary Tech 3", "Primary Tech 4"],
  "complexity": "Simple, Moderate, or Complex"
}`;

  let result = await callGroqLLM(groqUserPrompt, groqSystemPrompt);
  if (result && result.summary && result.suggestedFeatures?.length > 0) {
    return {
      summary: result.summary,
      suggestedFeatures: result.suggestedFeatures,
      suggestedSkills: result.suggestedSkills || [],
      complexity: result.complexity || "Moderate",
    };
  }

  // 2. Try Online LLM
  const onlinePrompt = `Act as an expert software architect. Analyze this problem:
${combinedContext}

Format your output strictly using these headers:
---SUMMARY---
[2-3 sentence executive technical summary of the software solution]

---FEATURES---
- [Feature 1 Name]: [detailed description]
- [Feature 2 Name]: [detailed description]
- [Feature 3 Name]: [detailed description]
- [Feature 4 Name]: [detailed description]
- [Feature 5 Name]: [detailed description]

---SKILLS---
[4-6 comma-separated modern tech stack skills required]

---COMPLEXITY---
[Simple, Moderate, or Complex]`;

  const rawText = await callOnlineLLM(onlinePrompt);
  if (rawText) {
    const parsed = parseDelimitedSpec(rawText, title);
    if (parsed && parsed.summary && parsed.suggestedFeatures.length > 0) {
      return {
        summary: parsed.summary,
        suggestedFeatures: parsed.suggestedFeatures,
        suggestedSkills: parsed.suggestedSkills.length > 0 ? parsed.suggestedSkills : ["React", "Node.js", "Express", "MongoDB"],
        complexity: parsed.complexity || "Moderate",
      };
    }
  }

  // 3. Fallback
  return {
    summary: `A purpose-built digital platform engineered for ${title || "the specified project"}. The solution automates operational workflows, provides interactive analytics dashboards, and guarantees reliable real-time coordination across all participating stakeholders.`,
    suggestedFeatures: [
      `${title || "System"} Analytics & Monitoring Dashboard: Live data visualization and metric tracking interface`,
      `Automated Ingestion & Validation Pipeline: Scalable data pipeline for parsing and verifying incoming records`,
      `Intelligent Notification & Alert Center: Event-driven dispatch engine sending critical milestone notifications`,
      `Role-Based Access & Security Governance: Multi-tier permission levels with encrypted authentication`,
      `Audit Logging & Comprehensive Reporting: Historical activity records with exportable PDF/CSV analytics`,
    ],
    suggestedSkills: ["React", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],
    complexity: "Moderate",
  };
}

/* =========================================================================
   DEEP VARIED FALLBACK SYNTHESIZER
   ========================================================================= */

function deriveCategoryFromTitle(title) {
  const t = title.toLowerCase();
  if (/predict|forecast|ml|ai|vision|detect/i.test(t)) return "AI & Machine Learning Systems";
  if (/food|hunger|meal|ration/i.test(t)) return "Food Security & Hunger Relief";
  if (/health|clinic|patient|doctor|medicine|tele/i.test(t)) return "Healthcare & Telemedicine";
  if (/forest|tree|eco|climate|carbon/i.test(t)) return "Environmental Sustainability";
  if (/school|student|learn|educat/i.test(t)) return "Education & Digital Inclusion";
  if (/water|clean|sanitat/i.test(t)) return "Water & Clean Sanitation";
  if (/traffic|ambulance|transit|commute/i.test(t)) return "Smart Urban Mobility";
  return "Civic Technology & Social Impact";
}

function synthesizeDeepOriginalDraft(title, category, keywords) {
  const cat = category || deriveCategoryFromTitle(title);
  const cleanTitle = title.trim();

  const p1 = `In modern operational environments, managing ${cleanTitle.toLowerCase()} poses immense complexity. Stakeholders currently face steep hurdles in collecting timely signals, standardizing disparate data inputs, and forecasting outcomes with dependable accuracy before bottlenecks emerge.`;

  const p2 = `Existing practices are dominated by fragmented point solutions, retrospective spreadsheets, and manual review loops that introduce costly latency. Without an automated, intelligent framework, decision-makers are forced into a reactive posture—missing critical preventative windows and risking operational inefficiencies across the entire pipeline.`;

  const p3 = `"${cleanTitle}" resolves these friction points by delivering a centralized, scalable platform for ${cat.toLowerCase()}. Featuring automated telemetry ingestion, predictive modeling, intuitive administrative dashboards, and real-time alerts, the platform empowers teams to anticipate demand, optimize resource allocation, and measure verifiable outcomes.`;

  const features = [
    `Predictive Modeling & Inference Engine: Deploys specialized algorithms to generate high-confidence forecasts tailored for ${cleanTitle.toLowerCase()}`,
    `Live Operations Telemetry Dashboard: Interactive visual workspace in React displaying real-time metrics and anomalous threshold alerts`,
    `Automated Ingestion & Cleaning Pipeline: Ingests raw data streams from external APIs, CSV uploads, and sensors with automated normalization`,
    `Custom Scenario Simulator: Interactive interface enabling managers to stress-test variables and compare simulated outcomes`,
    `Role-Based Stakeholder Governance: Granular permission controls protecting sensitive datasets while offering tailored views for field and executive users`,
    `Automated Export & Compliance Suite: Generates downloadable performance audit reports, CSV telemetry logs, and executive PDF summaries`,
  ];

  const skills = ["Python", "FastAPI", "React", "Node.js", "MongoDB / PostgreSQL", "Tailwind CSS"];

  return {
    title: cleanTitle,
    category: cat,
    description: `${p1}\n\n${p2}\n\n${p3}`,
    requiredFeatures: features.join("\n"),
    suggestedFeatures: features,
    suggestedSkills: skills,
    preferredTechnologies: "Python, FastAPI, React, Node.js, MongoDB, Tailwind CSS",
    complexity: "Moderate",
    expectedDuration: "45 Days",
  };
}

function synthesizeAssistantFallback(message, role, name) {
  const m = message.toLowerCase();

  if (/chat|channel|message|room/i.test(m)) {
    return `### 💬 SolveX 3-Channel Isolated Chat System
SolveX provides strict, context-isolated communication channels for every active project:
1. **Provider ↔ Leader**: Private channel for the Problem Provider (NGO) and the Lead Architect to review milestones and design direction.
2. **Leader ↔ Member**: Private 1-on-1 direct channel for task delegation and individual code reviews.
3. **Team Group**: Collaborative workspace for developers only—the Problem Provider is intentionally excluded to preserve technical team freedom.`;
  }

  if (/reputation|badge|score|points/i.test(m)) {
    return `### 🏆 Reputation & Achievement Badges
SolveX gamifies verified real-world impact:
- **Project Leader**: Earns **+15 points** upon successful project delivery.
- **Team Contributor**: Earns **+10 points** upon project completion.
- **Accepted Request**: Earns **+5 points** when accepted into a project team.

**Automated Badges**:
- 🎖️ *First Project Completed*
- 👑 *Project Leader*
- 🚀 *3 Projects Completed*

Higher reputation ranks you directly on the **Developer Showcase** leaderboard!`;
  }

  if (/post|create|problem|ngo/i.test(m)) {
    return `### 📝 Posting a Problem on SolveX
1. Navigate to **Post a Problem** from your dashboard.
2. Enter your project title (e.g. *"Solar Powered Water Filtration Monitor"*).
3. Click **✨ Generate Description with AI** — our AI will automatically compose a full 3-paragraph problem narrative, technical feature breakdown, and developer skills.
4. Set your budget and expected duration, then submit to publish it for developer teams to discover!`;
  }

  if (/proposal|milestone/i.test(m)) {
    return `### 📋 Proposals & Milestones
- Once a project has a **Project Leader**, the leader drafts a formal proposal.
- The proposal breaks down deliverables into phased milestones with clear deadlines.
- The Problem Provider reviews and accepts the proposal before development begins.
- As milestones are completed, the team updates progress directly in the project hub.`;
  }

  return `### 👋 Hello ${name}! I'm SolvexAI
I'm your AI assistant across the SolveX ecosystem. Here is how I can assist you today:

- **Problem Creation**: Help brainstorm and draft high-impact civic challenges with AI requirements.
- **Proposal Writing**: Guide you on structuring winning milestone proposals.
- **Collaboration**: Explain our 3-channel isolated chat, team roles, and milestone tracking.
- **Reputation**: Advise on earning points and unlocking badges on the leaderboard.

Feel free to ask any specific question or tell me what you're working on!`;
}

/**
 * Generate a conversational reply from SolvexAI.
 */
async function generateAssistantReply({ message, conversationHistory = [], userContext = {} }) {
  const role = userContext.role || "User";
  const name = userContext.userName || "Friend";
  const path = userContext.path || "/";

  const systemPrompt = `You are "SolvexAI", the friendly, highly intelligent AI assistant and agent embedded across the SolveX platform.
SolveX connects Problem Providers (NGOs, communities) with skilled Developers and Teams to build software solutions.

User Context:
- User Name: ${name}
- User Role: ${role}
- Current Page: ${path}

Key Platform Features you know deeply:
1. Problem Providers can post challenges, review AI-generated blueprints, invite developers, review proposals, manage milestones, and rate completed solutions.
2. Developers can browse challenges, apply as Project Leader or Contributor, write proposals with milestones, chat in isolated rooms, earn +15/+10 reputation and badges, and showcase portfolios.
3. 3-Channel Isolated Chat: Provider<->Leader, Leader<->Member, Team Group (developers only, provider excluded for technical privacy).
4. Reputation & Gamification: Leader gets +15 upon project completion; team members get +10; accepted requests grant +5. Badges: "First Project Completed", "Project Leader", "3 Projects Completed".
5. Top Performers Leaderboard highlights top contributors based on reputation and verified deliveries.

Guidelines for your response:
- Be warm, encouraging, concise, and direct (2-4 paragraphs or formatted bullet points).
- Provide practical step-by-step guidance whenever the user asks how to do something on SolveX.
- Use markdown formatting (**bold**, lists, backticks) for readability.
- If asked to help draft or refine something (like a problem, proposal, or milestone), provide actionable and realistic suggestions.`;

  // 1. Try Groq if configured
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: message },
      ];

      const completion = await groq.chat.completions.create({
        messages,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch (err) {
      console.warn("Groq assistant call notice:", err.message);
    }
  }

  // 2. Try Online LLM
  try {
    const recentHistory = conversationHistory
      .slice(-4)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");
    const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${recentHistory}\n\nUSER: ${message}\n\nASSISTANT:`;
    const onlineReply = await callOnlineLLM(fullPrompt);
    if (onlineReply && onlineReply.length > 20) {
      return onlineReply.trim();
    }
  } catch (err) {
    console.warn("Online LLM assistant notice:", err.message);
  }

  // 3. Fallback smart contextual assistant response
  return synthesizeAssistantFallback(message, role, name);
}

module.exports = {
  analyzeProblem,
  generateProblemDraft,
  generateAssistantReply,
};
