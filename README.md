# SolveX — AI-Powered Problem-to-Solution Development Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://mongoosejs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101.svg)](https://socket.io/)
[![Groq AI](https://img.shields.io/badge/Groq-Llama--3.3--70b-f55036.svg)](https://groq.com/)

**SolveX** bridges the gap between real-world community problem providers (NGOs, non-profits, civic organizations) and talented developers. By pairing an **AI requirement-scoping engine** with a **collaborative project lifecycle**, SolveX transforms vague problem narratives into production-ready software solutions built by vetted, reputation-ranked developer teams.

---

## 🚀 Key Features

### 🧠 1. AI Project Discovery & Dynamic Blueprinting
- **Multilingual Discovery Support**: Supports **English**, **Hindi** (`हिंदी`), and **Hinglish** dynamically. Users can select their preferred language before starting discovery or switch languages anytime mid-session while preserving all answers and context.
- **Multilingual Understanding**: The AI accepts and understands mixed-language responses (e.g. answering in English/Hinglish to Hindi prompts) and responds consistently in the active session language.
- **Technical Term Preservation**: Standard technical terminology (React, Node.js, MongoDB, API, JWT, GitHub, REST, Socket.IO, Docker, etc.) is preserved without awkward literal translation.
- **Conversational AI Product Analyst**: Transforms natural language problem ideas into complete, production-ready engineering blueprints through an adaptive multi-turn interview.
- **100% Dynamic, Non-Hardcoded Questioning**: Context-aware questions (single-choice, multi-select chips, text, boolean) generated dynamically per domain with zero hardcoded templates in any language.
- **Adaptive Follow-Ups & Readiness Engine**: Progressive readiness scoring tracking specification completeness and turning limits.
- **Automated Unique Technical Blueprint**: Synthesizes architecture narratives, modular features, technology stack recommendations, developer roles with required skills, phased milestones, and risk evaluations in the selected language.
- **Interactive Review & AI Revision**: Problem providers can edit sections directly or prompt the AI to revise specific requirements before confirming.
- **Automated Developer Matching**: Extracted developer skills and roles automatically integrate with SolveX's developer recommendation and replacement engine.

### 👥 2. Multi-Role Ecosystem
- **Problem Providers (NGOs & Organizations)**:
  - Submit and refine civic problem statements with instant AI feedback.
  - Browse developer profiles by reputation, badges, and skill sets.
  - Dispatch direct invitations and review join requests.
  - Review milestone proposals and track live implementation progress.
  - Submit completion reviews and ratings.
- **Developers & Team Leaders**:
  - Discover high-impact civic and open-source challenges.
  - Apply as Project Leader or Contributor with custom roles (e.g., *Frontend Lead*, *Database Architect*).
  - Draft comprehensive project proposals with phase-based deliverables and milestones.
  - Collaborate through real-time isolated chat channels.
  - Earn reputation points and automated achievement badges.
  - Showcase completed work in a public developer portfolio.
- **Platform Admins**:
  - Centralized dashboard to oversee users, projects, and platform analytics.
  - Manage project states and ensure community guidelines are upheld.

### 💬 3. Isolated Real-Time 3-Channel Chat (Socket.io)
Secure, context-aware project communication:
1. **Provider ↔ Leader Channel**: Private channel between the NGO/client and the Lead Architect for requirements, progress demos, and milestone approvals.
2. **Leader ↔ Member Channel**: One-on-one direct communication between the Project Leader and specific developers for focused task delegation.
3. **Team Group Room**: Team-only workspace chat for technical collaboration, code reviews, and standups (isolated from the problem provider).

### 📋 4. Milestone & Proposal Management
- Project leaders submit phased proposals containing scopes, timelines, budgets, and milestone deliverables.
- Problem providers review, accept, or reject proposals before development commences.
- Milestone tracking reflects live project progress directly on the dashboard.

### 🏆 5. Gamification, Badges & Leaderboard
- **Reputation Scoring**:
  - `+15 Reputation` for Project Leaders upon successful delivery.
  - `+10 Reputation` for active Contributors upon project completion.
  - `+5 Reputation` for developers accepted into a project team.
- **Automated Badges**: Unlock milestones such as *"First Project Completed"*, *"Project Leader"*, and *"3 Projects Completed"*.
- **Top Performers Showcase**: Public leaderboard highlighting the community's most active and skilled contributors.

### 🔗 6. GitHub Integration & Impact Showcase
- **Repository Metadata Sync**: Fetches real-time GitHub repository statistics (stars, forks, open issues, primary language, latest commit timestamp).
- **GitHub Issues Integration**: Live view of GitHub repository issues with status badges, assignees, labels, and issue creation directly from SolveX.
- **Pull Requests & Review Tracking**: Live PR feed showing branches, status (Open/Merged/Closed), and review statuses (Approved, Changes Requested, Commented).
- **GitHub Milestones**: Track GitHub milestones, progress percentages, and optionally link them directly to SolveX project proposal milestones.
- **Contribution Analysis & Scoring**: Quantified contributor breakdown with transparent scoring:
  $$\text{Score} = (\text{Commits} \times 1) + (\text{PRs} \times 3) + (\text{Merged PRs} \times 5) + (\text{Issues} \times 2) + (\text{Reviews} \times 2)$$
- **Backup Developer Matching**: When a team member becomes inactive or leaves, project leaders can mark the slot as `VACANT` (preserving historic contributions), search AI/skill-ranked candidate replacements, and dispatch direct replacement invitations.
- **Combined Progress & Activity Timeline**: Unified dashboard comparing SolveX and GitHub milestone delivery, commit velocity, and chronological activity feed.
- **Public Impact Showcase**: Highlights completed solutions with live demo links, repository links, solution summaries, and client feedback.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS, Axios, Socket.io Client, React Icons |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose 8, Socket.io, JWT, Helmet, CORS, Morgan |
| **AI / LLM** | Groq SDK (`llama-3.3-70b-versatile`) with built-in heuristic fallback engine |
| **Monorepo Tools** | Concurrently, NPM scripts |

---

## 📁 Project Structure

```
SolveX/
├── backend/
│   ├── config/             # MongoDB connection configuration (db.js)
│   ├── controllers/        # 13 REST controllers (auth, project, developer, ai, team, proposal, etc.)
│   ├── middleware/         # auth, role, projectAccess, central error handler
│   ├── models/             # Mongoose schemas:
│   │                       #   User, Project, DeveloperRequest, DeveloperInvitation,
│   │                       #   ProjectProposal, Team, Message, Notification
│   ├── routes/             # Express API routes matching controllers
│   │                       #   /api/auth, /api/projects, /api/developers, /api/ai, etc.
│   ├── services/           # groqService, githubService, projectService, notificationService
│   ├── sockets/            # Socket.io JWT auth & 3-channel isolated messaging logic
│   ├── utils/              # Token generator, async handler helpers
│   ├── seed.js             # Comprehensive database seeder with realistic test data
│   ├── server.js           # Express + HTTP server & Socket.io entry point
│   ├── package.json
│   └── .env                # Backend environment configuration
│
├── frontend/
│   ├── public/             # Static HTML, favicon, and assets
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Footer, ProtectedRoute, etc.)
│   │   ├── context/        # Global AuthContext & state management
│   │   ├── hooks/          # Custom hooks (useSocket for real-time channels)
│   │   ├── pages/
│   │   │   ├── public/     # LandingPage, ExploreProblems, ProjectDetails,
│   │   │   │               # DeveloperShowcase, DeveloperProfile, Showcase, Login, Register
│   │   │   ├── developer/  # DeveloperDashboard, MyRequests, MyInvitations,
│   │   │   │               # Portfolio, DeveloperChat, Settings
│   │   │   ├── provider/   # ProviderDashboard, CreateProblem, FindDevelopers,
│   │   │   │               # DeveloperRequests, ProposalReview
│   │   │   └── admin/      # AdminDashboard
│   │   ├── services/       # api.js (Axios instance), socket.js (Socket.io client)
│   │   ├── App.jsx         # App router and layout definitions
│   │   ├── index.css       # Tailwind CSS styles and custom themes
│   │   └── index.js
│   ├── tailwind.config.js  # Dark mode & brand color tokens
│   ├── package.json
│   └── .env                # Frontend environment configuration
│
├── package.json            # Root workspace scripts (run both frontend & backend together)
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** 18+ installed
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI
- *(Optional)* **Groq API Key** (for live LLaMA 3.3 problem analysis)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Ashish-Malviya710/Amazon-clone.git solvex
cd solvex
```

### 2. Install Dependencies
Install dependencies for both backend and frontend using the root script:
```bash
npm run install-all
```
*(Alternatively, run `npm install` inside both `backend/` and `frontend/` directories.)*

---

### 3. Configure Environment Variables

#### **Backend** (`backend/.env`):
Create or verify `backend/.env`:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/solvex
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000

# GitHub Personal Access Token (PAT) with 'repo' scope
# Required for GitHub Issues, PRs, Milestones, and Contribution Analysis
GITHUB_TOKEN=your_github_pat_here

# Optional: Groq LLM API Key (if omitted, smart local heuristic engine will be used)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

#### **Frontend** (`frontend/.env`):
Create or verify `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

### 4. Seed the Database (Recommended)
Populate your database with rich, realistic sample data (admin, problem providers, developers, active & completed projects, proposals, chat messages, and notifications):

```bash
cd backend
npm run seed
```

---

### 5. Run the Application

#### **Option A: Run Both Concurrently (From Root)**
From the root directory, start both the Express backend and React frontend with a single command:
```bash
npm run dev
```

#### **Option B: Run Separately**
```bash
# Terminal 1 — Backend (Port 8000)
npm run dev:backend
# or: cd backend && npm run dev

# Terminal 2 — Frontend (Port 3000)
npm run dev:frontend
# or: cd frontend && npm start
```

Once running:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🔑 Pre-Seeded Demo Credentials

After running `npm run seed`, you can immediately sign in with any of the following accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@solvex.com` | `adminPassword123!` | System administrator with full oversight |
| **Problem Provider** | `aarav.ngo@example.org` | `password123` | Aarav Foundation (Hunger relief NGO) |
| **Problem Provider** | `maya.sen@rhi-care.org` | `password123` | Rural Health Initiative |
| **Developer (Leader)** | `ashish@developer.io` | `password123` | Lead Architect (High reputation, badges) |
| **Developer (Frontend)** | `priya.frontend@developer.io` | `password123` | Frontend & UI/UX Specialist |
| **Developer (Backend)** | `rahul.backend@developer.io` | `password123` | Backend & Database Specialist |
| **Developer (AI/ML)** | `ananya.ai@developer.io` | `password123` | AI/ML Integration Engineer |
| **Developer (Junior)** | `vikram@developer.io` | `password123` | Junior Full-Stack Contributor |

---

## 📡 API Reference Overview

| Resource | Route Base | Description |
|---|---|---|
| **Auth** | `/api/auth` | User registration, login, profile retrieval, password updates |
| **Projects** | `/api/projects` | CRUD projects, status updates, solution submissions, ratings |
| **AI** | `/api/ai/analyze-problem` | Groq LLaMA requirement analysis and blueprint generation |
| **Developers** | `/api/developers` | Developer directory, leaderboards, top performers |
| **Requests** | `/api/requests` | Developer project join applications and status management |
| **Invitations** | `/api/invitations` | Provider/Leader invites to developers (including vacant slot replacements) |
| **Proposals** | `/api/proposals` | Leader milestone proposals, client acceptance, and GitHub milestone linking |
| **Teams** | `/api/teams` | Team roster management, vacant slot marking, replacement candidate search |
| **Messages** | `/api/messages` | Channel chat history retrieval |
| **GitHub** | `/api/github` | Issues, PRs & reviews, milestones, contributions, progress, activity |
| **Impact** | `/api/impact` | Metrics, completed project showcase data, ratings |
| **Notifications** | `/api/notifications` | User notifications and read status updates |
| **Admin** | `/api/admin` | Platform statistics, moderation, and user management |

#### Key AI Project Discovery Endpoints
- `POST /api/projects/discovery/start` — Start an AI discovery interview with an initial problem idea & language (`en`, `hi`, `hinglish`)
- `GET /api/projects/discovery/:id` — Retrieve discovery session state, interview history & blueprint
- `PATCH /api/projects/discovery/:id/language` — Update discovery session language mid-session and regenerate current question
- `POST /api/projects/discovery/:id/answer` — Submit answer to dynamic question and receive adaptive follow-up
- `POST /api/projects/discovery/:id/generate-blueprint` — Synthesize full technical project blueprint
- `PUT /api/projects/discovery/:id/blueprint` — Edit blueprint or request AI natural language revision
- `POST /api/projects/discovery/:id/regenerate` — Regenerate fresh blueprint version
- `POST /api/projects/discovery/:id/complete` — Confirm blueprint and create/launch SolveX project
- `GET /api/github/projects/:projectId/issues` — Fetch project GitHub issues with summary counts
- `POST /api/github/projects/:projectId/issues` — Create a new GitHub issue
- `GET /api/github/projects/:projectId/pulls` — Fetch pull requests with merge/open/closed stats
- `GET /api/github/projects/:projectId/pulls/:prNumber/reviews` — Fetch PR reviews (Approved/Changes Requested/Commented)
- `GET /api/github/projects/:projectId/milestones` — Fetch GitHub milestones and progress
- `PUT /api/proposals/:id/milestones/:idx/github-link` — Link a SolveX milestone to a GitHub milestone
- `GET /api/github/projects/:projectId/contributions` — Per-developer contribution analysis & scores
- `GET /api/github/projects/:projectId/progress` — Combined health & milestone delivery metrics
- `GET /api/github/projects/:projectId/activity` — Chronological GitHub activity timeline
- `PUT /api/teams/:id/members/:userId/vacant` — Mark team member slot as VACANT
- `GET /api/teams/:id/members/:userId/replacements` — Find ranked replacement developer candidates
- `POST /api/teams/:id/members/:userId/invite-replacement` — Dispatch replacement invitation

---

## 🔒 Real-Time Chat Architecture

```
                 ┌─────────────────────────────┐
                 │        Problem Provider     │
                 └──────────────┬──────────────┘
                                │
               PROVIDER_LEADER  │ (Private channel)
                                ▼
                 ┌─────────────────────────────┐
                 │       Project Leader        │
                 └──────┬───────────────┬──────┘
                        │               │
        LEADER_MEMBER   │               │  TEAM_GROUP
     (Private 1-on-1)   │               │  (Team only, provider excluded)
                        ▼               ▼
                 ┌──────────────┐ ┌──────────────┐
                 │ Team Member  │ │ Team Member  │
                 └──────────────┘ └──────────────┘
```

- Every chat socket event verifies the user's JWT token and validates role-level authorization for the requested project channel before granting room access.

---

## 📜 Available NPM Scripts

### Root Directory
- `npm run install-all`: Install all dependencies for both backend and frontend.
- `npm run dev`: Launch backend and frontend concurrently.
- `npm run dev:backend`: Launch backend dev server with hot reload (`nodemon`).
- `npm run dev:frontend`: Launch React development server.
- `npm run build:frontend`: Generate production React build in `frontend/build/`.

### Backend Directory (`backend/`)
- `npm run dev`: Start backend server with `nodemon`.
- `npm start`: Start backend server with `node`.
- `npm run seed`: Reset and seed MongoDB with test users, projects, proposals, and chats.

### Frontend Directory (`frontend/`)
- `npm start`: Run React dev server.
- `npm run build`: Compile production bundle.
- `npm test`: Run tests with Jest.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
