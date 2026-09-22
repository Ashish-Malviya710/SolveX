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

### 🧠 1. AI-Powered Problem Blueprinting
- **Groq LLaMA 3.3 Engine**: Automatically turns non-technical problem descriptions into structured software engineering specifications.
- **Automated Blueprint Generation**: Produces an executive summary, modular feature breakdown, required technology stack, and complexity estimation.
- **Smart Heuristic Fallback**: An intelligent local parsing engine ensures seamless operation even if third-party AI APIs are unavailable.

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
| **Invitations** | `/api/invitations` | Provider/Leader invites to developers |
| **Proposals** | `/api/proposals` | Leader milestone proposals and client acceptance workflows |
| **Teams** | `/api/teams` | Team roster management, role assignments, removals |
| **Messages** | `/api/messages` | Channel chat history retrieval |
| **GitHub** | `/api/github` | Repository statistics and commit activity polling |
| **Impact** | `/api/impact` | Metrics, completed project showcase data, ratings |
| **Notifications** | `/api/notifications` | User notifications and read status updates |
| **Admin** | `/api/admin` | Platform statistics, moderation, and user management |

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
