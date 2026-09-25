require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Project = require("./models/Project");
const DeveloperRequest = require("./models/DeveloperRequest");
const DeveloperInvitation = require("./models/DeveloperInvitation");
const ProjectProposal = require("./models/ProjectProposal");
const Message = require("./models/Message");
const Notification = require("./models/Notification");
const Team = require("./models/Team");

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/solvex";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await DeveloperRequest.deleteMany({});
    await DeveloperInvitation.deleteMany({});
    await ProjectProposal.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await Team.deleteMany({});
    console.log("Existing collections cleared.");

    // Helper for password hashing (since User model has pre-save hook, creating via User.create will hash passwords)
    
    // 1. Create Admin
    const admin = await User.create({
      name: "SolveX Platform Admin",
      email: "admin@solvex.com",
      password: "adminPassword123!",
      role: "ADMIN",
      mobileNumber: "+91 9876543210",
      address: "Bengaluru, Karnataka, India",
      linkedinOrPortfolio: "https://solvex.dev",
      githubProfile: "https://github.com/solvex-org",
      isProfilePublic: false,
    });
    console.log("Admin seeded: admin@solvex.com / adminPassword123!");

    // 2. Create Problem Providers
    const provider1 = await User.create({
      name: "Aarav Foundation (NGO)",
      email: "aarav.ngo@example.org",
      password: "password123",
      role: "PROBLEM_PROVIDER",
      mobileNumber: "+91 9811223344",
      address: "New Delhi, India",
      linkedinOrPortfolio: "https://linkedin.com/company/aarav-foundation",
      githubProfile: "https://github.com/aarav-foundation",
      bio: "Non-profit dedicated to reducing urban food waste and distributing surplus nutrition to underserved shelters across North India.",
      isProfilePublic: true,
    });

    const provider2 = await User.create({
      name: "Dr. Maya Sen (Rural Health Initiative)",
      email: "maya.sen@rhi-care.org",
      password: "password123",
      role: "PROBLEM_PROVIDER",
      mobileNumber: "+91 9822334455",
      address: "Pune, Maharashtra, India",
      linkedinOrPortfolio: "https://mayasen-health.org",
      githubProfile: "",
      bio: "Medical researcher and rural health advocate developing affordable telehealth and medicine tracking for primary health centers.",
      isProfilePublic: true,
    });

    const provider3 = await User.create({
      name: "CleanCanopy Environmental Trust",
      email: "contact@cleancanopy.org",
      password: "password123",
      role: "PROBLEM_PROVIDER",
      mobileNumber: "+91 9833445566",
      address: "Dehradun, Uttarakhand, India",
      linkedinOrPortfolio: "https://cleancanopy.org",
      bio: "Grassroots organization monitoring regional tree planting initiatives and community re-wilding drives.",
      isProfilePublic: true,
    });

    // 3. Create Developers
    const dev1 = await User.create({
      name: "Ashish Lohar",
      email: "ashish@developer.io",
      password: "password123",
      role: "DEVELOPER",
      mobileNumber: "+91 9765432109",
      address: "Mumbai, Maharashtra, India",
      linkedinOrPortfolio: "https://linkedin.com/in/ashish-lohar",
      githubProfile: "https://github.com/ashish-lohar",
      bio: "Full Stack Architect specializing in scalable Node.js microservices, React webapps, and real-time collaborative toolings.",
      skills: ["React", "Node.js", "Express.js", "MongoDB", "Socket.io", "TypeScript", "Tailwind CSS"],
      experience: "4+ years building fullstack web platforms and open-source civic tech",
      availability: true,
      reputation: 340,
      projectsCompleted: 8,
      projectsLed: 5,
      badges: ["First Project Completed", "Project Leader", "3 Projects Completed"],
      isProfilePublic: true,
    });

    const dev2 = await User.create({
      name: "Priya Sharma",
      email: "priya.frontend@developer.io",
      password: "password123",
      role: "DEVELOPER",
      mobileNumber: "+91 9754321098",
      address: "Bengaluru, Karnataka, India",
      linkedinOrPortfolio: "https://priyasharma.design",
      githubProfile: "https://github.com/priyasharma-dev",
      bio: "Frontend Engineer & UI/UX Specialist passionate about high-accessibility responsive web interfaces and design systems.",
      skills: ["React", "Next.js", "Tailwind CSS", "JavaScript", "UI/UX Design", "Figma", "Redux"],
      experience: "3 years building accessible design systems and fintech dashboards",
      availability: true,
      reputation: 290,
      projectsCompleted: 6,
      projectsLed: 2,
      badges: ["First Project Completed", "Project Leader", "3 Projects Completed"],
      isProfilePublic: true,
    });

    const dev3 = await User.create({
      name: "Rahul Verma",
      email: "rahul.backend@developer.io",
      password: "password123",
      role: "DEVELOPER",
      mobileNumber: "+91 9743210987",
      address: "Hyderabad, Telangana, India",
      linkedinOrPortfolio: "https://linkedin.com/in/rahulverma-eng",
      githubProfile: "https://github.com/rahulverma-dev",
      bio: "Backend specialist focused on high-throughput RESTful & GraphQL APIs, distributed database indexing, and cloud DevOps.",
      skills: ["Node.js", "Express.js", "MongoDB", "PostgreSQL", "Docker", "Redis", "AWS"],
      experience: "3+ years backend infrastructure and database optimization",
      availability: true,
      reputation: 245,
      projectsCompleted: 5,
      projectsLed: 3,
      badges: ["First Project Completed", "Project Leader", "3 Projects Completed"],
      isProfilePublic: true,
    });

    const dev4 = await User.create({
      name: "Ananya Iyer",
      email: "ananya.ai@developer.io",
      password: "password123",
      role: "DEVELOPER",
      mobileNumber: "+91 9732109876",
      address: "Chennai, Tamil Nadu, India",
      linkedinOrPortfolio: "https://ananyaiyer.tech",
      githubProfile: "https://github.com/ananya-iyer",
      bio: "AI/ML developer integrating LLM workflows, automated data parsing, and conversational AI into civic development platforms.",
      skills: ["Python", "FastAPI", "React", "Groq AI", "LangChain", "MongoDB", "Tailwind CSS"],
      experience: "2 years in applied LLM tooling and full-stack integration",
      availability: true,
      reputation: 160,
      projectsCompleted: 3,
      projectsLed: 1,
      badges: ["First Project Completed", "Project Leader", "3 Projects Completed"],
      isProfilePublic: true,
    });

    const dev5 = await User.create({
      name: "Vikram Malhotra",
      email: "vikram@developer.io",
      password: "password123",
      role: "DEVELOPER",
      mobileNumber: "+91 9721098765",
      address: "Chandigarh, India",
      linkedinOrPortfolio: "https://vikram-dev.io",
      githubProfile: "https://github.com/vikram-malhotra",
      bio: "Junior fullstack developer eager to contribute to social impact applications and learn industry-grade architectural patterns.",
      skills: ["React", "JavaScript", "HTML/CSS", "Node.js", "Git"],
      experience: "1 year building responsive React projects",
      availability: true,
      reputation: 45,
      projectsCompleted: 1,
      projectsLed: 0,
      badges: ["First Project Completed"],
      isProfilePublic: true,
    });

    console.log("Users and Developers seeded successfully.");

    // 4. Create Projects in Different Stages
    
    // Project 1: COMPLETED (Showcase Project)
    const project1 = await Project.create({
      title: "Annapurna — Surplus Food Donation & Distribution Grid",
      description: "Our community NGO manages daily surplus food collections from banquet halls, corporate cafeterias, and restaurants across Delhi NCR. We need a live coordination system to route fresh donations to local shelter homes within safe consumption windows before spoilage.",
      problemProvider: provider1._id,
      projectLeader: dev1._id,
      category: "Social Impact & Hunger Relief",
      requiredFeatures: "Donor portal, NGO shelter dashboard, live pickup routing, automated expiry warnings, dispatch logs",
      preferredTechnologies: "React, Node.js, Express, MongoDB, Tailwind CSS",
      requiredSkills: ["React", "Node.js", "MongoDB", "Express.js", "Tailwind CSS"],
      aiSummary: "A specialized logistics and donation coordination portal designed to connect food donors with local shelter kitchens in real-time to minimize wastage and guarantee safe food transit.",
      aiSuggestedFeatures: [
        "Donor Registration & Donation Logging",
        "Shelter Demand & Capacity Dashboard",
        "Real-Time Pickup Dispatch System",
        "Automated Expiry & Quality Checklists",
        "SMS/Email Notifications for Delivery Status",
        "Historical Distribution Reporting",
      ],
      aiSuggestedSkills: ["React", "Node.js", "MongoDB", "Express.js", "Tailwind CSS"],
      aiComplexity: "Moderate",
      teamMembers: [
        { user: dev1._id, role: "Leader", customRole: "Lead System Architect" },
        { user: dev2._id, role: "Contributor", customRole: "UI/UX & Frontend Lead" },
        { user: dev3._id, role: "Contributor", customRole: "Backend & Database Lead" },
      ],
      maxTeamSize: 5,
      budgetType: "Fixed",
      budgetAmount: 45000,
      currency: "INR",
      budgetDescription: "Funded via foundation grant for rapid 45-day development cycle.",
      expectedDuration: "40 Days",
      deadline: new Date(Date.now() - 15 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/annapurna-food-grid",
      liveUrl: "https://annapurna-food-grid.vercel.app",
      solution: {
        completionSummary: "All core milestone requirements deployed with 100% test coverage. Donor workflow, real-time dispatch dashboard, and SMS notifications are live.",
        liveUrl: "https://annapurna-food-grid.vercel.app",
        githubRepoUrl: "https://github.com/solvex-teams/annapurna-food-grid",
        documentation: "https://github.com/solvex-teams/annapurna-food-grid/wiki",
        screenshots: ["https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80"],
        demoVideo: "https://youtube.com/watch?v=sample-demo-annapurna",
        notes: "Use demo account donor@annapurna.test (pass: donor123) and shelter@annapurna.test for full walkthrough.",
        submittedAt: new Date(Date.now() - 20 * 86400000),
      },
      impact: {
        peopleBenefited: 14500,
        organizationsHelped: 22,
        notes: "Over 38,000 meals safely diverted to verified shelter homes across Delhi NCR within the first 60 days of deployment.",
      },
      status: "COMPLETED",
      completionDate: new Date(Date.now() - 14 * 86400000),
    });

    // Project 2: IN_DEVELOPMENT (Active Project with proposal & milestones)
    const project2 = await Project.create({
      title: "Sanjeevani — Rural Health Clinic Patient Tele-Triage",
      description: "Primary health centers in rural Maharashtra lack continuous doctor availability. Community health workers (ASHA workers) need an intuitive tablet-friendly system to record patient vitals, triage critical symptoms, and connect with remote specialist doctors for second opinions.",
      problemProvider: provider2._id,
      projectLeader: dev3._id,
      category: "Healthcare & Telemedicine",
      requiredFeatures: "Offline-first vitals entry, symptom severity scoring, remote doctor tele-consultation queue, digital prescription generator",
      preferredTechnologies: "React, Node.js, MongoDB, WebRTC/Socket.io",
      requiredSkills: ["React", "Node.js", "MongoDB", "Socket.io", "Tailwind CSS"],
      aiSummary: "A lightweight telehealth triage application enabling rural healthcare workers to capture patient diagnostics and collaborate synchronously with offsite medical specialists.",
      aiSuggestedFeatures: [
        "Patient Intake & Vitals Recording",
        "Symptom Checker & Triage Urgency Flagging",
        "Specialist Doctor Queue & Audio/Video Call Rooms",
        "Digital Prescription & Pharmacy Dispatch",
        "Offline Data Syncing Engine",
      ],
      aiSuggestedSkills: ["React", "Node.js", "MongoDB", "Socket.io", "Tailwind CSS"],
      aiComplexity: "Complex",
      teamMembers: [
        { user: dev3._id, role: "Leader", customRole: "Backend & Systems Lead" },
        { user: dev2._id, role: "Contributor", customRole: "Accessible UI Lead" },
        { user: dev4._id, role: "Contributor", customRole: "AI Diagnostic Assistant Lead" },
      ],
      maxTeamSize: 4,
      budgetType: "Negotiable",
      budgetAmount: 60000,
      currency: "INR",
      budgetDescription: "Stipend provided upon successful field testing across 3 pilot clinics.",
      expectedDuration: "60 Days",
      deadline: new Date(Date.now() + 30 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/sanjeevani-rural-telehealth",
      status: "IN_DEVELOPMENT",
    });

    // Create Proposal for Project 2
    await ProjectProposal.create({
      project: project2._id,
      leader: dev3._id,
      teamMembers: [
        { user: dev3._id, role: "Leader", customRole: "Backend & Systems Lead" },
        { user: dev2._id, role: "Contributor", customRole: "Accessible UI Lead" },
        { user: dev4._id, role: "Contributor", customRole: "AI Diagnostic Assistant Lead" },
      ],
      description: "We are developing Sanjeevani as a modern progressive web application with local IndexedDB caching for offline resilience in low-connectivity areas, coupled with a Node/Mongo API for triage sync.",
      technologyStack: ["React 18", "Tailwind CSS", "Node.js", "Express", "MongoDB Atlas", "Socket.io"],
      features: [
        "Multi-lingual patient intake form with auto-save",
        "Offline queue synchronization",
        "Doctor triage board with urgency badges",
        "Digital PDF prescription issuance",
      ],
      estimatedDuration: "60 Days",
      milestones: [
        { title: "Architecture & Patient Data Models", deadline: new Date(Date.now() - 10 * 86400000), status: "Completed" },
        { title: "Offline Storage & Sync Engine", deadline: new Date(Date.now() + 5 * 86400000), status: "In Progress" },
        { title: "Doctor Tele-consult Queue & Chat", deadline: new Date(Date.now() + 20 * 86400000), status: "Pending" },
        { title: "Field Pilot Testing & Security Hardening", deadline: new Date(Date.now() + 30 * 86400000), status: "Pending" },
      ],
      status: "APPROVED",
      providerFeedback: "Approved! Scope looks solid and offline sync is exactly what our remote clinics require.",
    });

    // Project 3: OPEN (Problem Discovery & Requests)
    const project3 = await Project.create({
      title: "VanRakhshak — Community Forest Geo-Tagging & Reforestation Monitor",
      description: "Local Himalayan village councils need a lightweight web dashboard to record sapling survival rates, photograph geo-tagged plantation clusters, and present verified carbon-offset progress to environmental grant makers.",
      problemProvider: provider3._id,
      category: "Environment & Climate Action",
      requiredFeatures: "Map-based geo-cluster viewer, tree plantation logging with photo uploads, survival rate analytics, grant report export",
      preferredTechnologies: "React, Node.js, Leaflet / Mapbox, MongoDB",
      requiredSkills: ["React", "Node.js", "MongoDB", "Leaflet", "Tailwind CSS"],
      aiSummary: "A community geospatial conservation application tracking sapling mortality, growth milestones, and reforestation impact metrics for environmental stewards and donors.",
      aiSuggestedFeatures: [
        "Interactive Plantation Geo-Map",
        "Sapling Inspection & Health Logging",
        "Survival Rate Visual Analytics",
        "Volunteer Tree Tagging Portal",
        "Automated Donor Impact Reports",
      ],
      aiSuggestedSkills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
      aiComplexity: "Moderate",
      maxTeamSize: 4,
      budgetType: "Fixed",
      budgetAmount: 35000,
      currency: "INR",
      budgetDescription: "Budget approved by environmental trust.",
      expectedDuration: "35 Days",
      deadline: new Date(Date.now() + 45 * 86400000),
      status: "OPEN",
    });

    // Project 4: OPEN (Volunteer Problem)
    const project4 = await Project.create({
      title: "MedAlert — Blind & Low-Vision Audio Prescription Reader",
      description: "Visually impaired elders struggle to identify identical pill bottles. We want an accessible web tool where users can scan medicine box QR codes or barcodes to hear synthesized dosage audio instructions and refill reminders in regional Indian languages.",
      problemProvider: provider2._id,
      category: "Accessibility & Assistive Tech",
      requiredFeatures: "High-contrast accessible screen-reader optimized UI, barcode scanner integration, Web Speech API speech synthesis, daily voice schedule",
      preferredTechnologies: "React, Web Speech API, Tailwind CSS, Node.js",
      requiredSkills: ["React", "Accessibility (a11y)", "Web Speech API", "Node.js"],
      aiSummary: "An assistive voice portal enabling low-vision patients to hear spoken medication regimens and schedule auditory reminders with zero complex navigation.",
      aiSuggestedFeatures: [
        "WCAG 2.1 AAA Compliant High-Contrast Interface",
        "Barcode / QR Code Audio Lookup",
        "Voice Prescription Playback in Hindi/Marathi/English",
        "Auditory Daily Dosage Alarms",
      ],
      aiSuggestedSkills: ["React", "JavaScript", "Tailwind CSS"],
      aiComplexity: "Simple",
      maxTeamSize: 3,
      budgetType: "Volunteer",
      budgetAmount: 0,
      currency: "INR",
      budgetDescription: "Open-source non-profit project for social good.",
      expectedDuration: "25 Days",
      deadline: new Date(Date.now() + 50 * 86400000),
      status: "OPEN",
    });

    // Project 5: COMPLETED (Led by Ashish Lohar - Education Tech)
    const project5 = await Project.create({
      title: "ShikshaSetu — Solar Digital Classroom & Regional Curriculum Mesh",
      description: "Tribal and remote government schools in Palghar district face frequent power cuts and nonexistent cellular connectivity. We require an offline-first learning management system running on solar-powered mini servers that syncs local quiz logs and interactive lessons whenever network connectivity is intermittently detected.",
      problemProvider: provider1._id,
      projectLeader: dev1._id,
      category: "Education & Digital Literacy",
      requiredFeatures: "Offline PWA architecture, multi-lingual audio/video lessons, local teacher grading desk, delayed sync engine with conflict resolution",
      preferredTechnologies: "React, Node.js, Express, MongoDB, Progressive Web Apps (PWA), Tailwind CSS",
      requiredSkills: ["React", "Node.js", "PWA", "MongoDB", "Express.js", "Tailwind CSS"],
      aiSummary: "A solar-compatible offline-first educational content mesh delivering uninterrupted curriculum modules and local performance analytics for rural educational institutions.",
      aiSuggestedFeatures: [
        "Interactive Offline Lesson Cache",
        "Teacher Gradebook & Student Attendance Roster",
        "Low-Bandwidth Satellite Sync Queue",
        "Solar Battery State-of-Health Telemetry",
      ],
      aiSuggestedSkills: ["React", "Node.js", "PWA", "MongoDB"],
      aiComplexity: "Complex",
      teamMembers: [
        { user: dev1._id, role: "Leader", customRole: "Lead System Architect" },
        { user: dev4._id, role: "Contributor", customRole: "Curriculum & Interactive Content Lead" },
        { user: dev5._id, role: "Contributor", customRole: "Frontend PWA Specialist" },
      ],
      maxTeamSize: 4,
      budgetType: "Fixed",
      budgetAmount: 55000,
      currency: "INR",
      budgetDescription: "Sponsored by philanthropic education grant for tribal development.",
      expectedDuration: "45 Days",
      deadline: new Date(Date.now() - 40 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/shiksha-setu-classroom",
      liveUrl: "https://shikshasetu.solvex.org",
      solution: {
        completionSummary: "Successfully deployed lightweight PWA bundled into micro-servers across 18 tribal schools with automated periodic syncing and 100% offline lesson playback.",
        liveUrl: "https://shikshasetu.solvex.org",
        githubRepoUrl: "https://github.com/solvex-teams/shiksha-setu-classroom",
        documentation: "https://github.com/solvex-teams/shiksha-setu-classroom/wiki",
        screenshots: ["https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"],
        demoVideo: "https://youtube.com/watch?v=sample-demo-shikshasetu",
        notes: "Won CivicTech Innovation Award. Currently serving 4,200 active rural students daily.",
        submittedAt: new Date(Date.now() - 48 * 86400000),
      },
      impact: {
        peopleBenefited: 4200,
        organizationsHelped: 18,
        notes: "Zero lesson disruptions recorded over 6 months despite 140+ power outage hours in pilot schools.",
      },
      status: "COMPLETED",
      completionDate: new Date(Date.now() - 45 * 86400000),
    });

    // Project 6: COMPLETED (Led by Ashish Lohar - Water Security IoT)
    const project6 = await Project.create({
      title: "JalDrishti — Ground Water Table IoT Sensor Telemetry & Alerts",
      description: "Severe groundwater depletion threatens farming communities across Marathwada. Village panchayats need automated borewell water table depth sensing with real-time solar telemetry and SMS broadcast warnings to prevent catastrophic dry-outs.",
      problemProvider: provider3._id,
      projectLeader: dev1._id,
      category: "Water Security & IoT Telemetry",
      requiredFeatures: "Sensor telemetry ingestion pipeline, live water depth charting, automated SMS threshold alerts, historical aquifer drawdown visualizer",
      preferredTechnologies: "React, Node.js, Express, Socket.io, MongoDB, Leaflet, Tailwind CSS",
      requiredSkills: ["React", "Node.js", "Socket.io", "MongoDB", "Leaflet"],
      aiSummary: "An environmental IoT water monitoring grid aggregating aquifer levels from ultrasonic borewell telemetry and generating proactive water rationing recommendations.",
      aiSuggestedFeatures: [
        "Live Sensor Telemetry Ingestion API",
        "Geospatial Aquifer Heatmap & Depth Contours",
        "Village Broadcast SMS Notification Daemon",
        "Seasonal Drawdown & Recharge Projections",
      ],
      aiSuggestedSkills: ["React", "Node.js", "MongoDB", "Socket.io"],
      aiComplexity: "Moderate",
      teamMembers: [
        { user: dev1._id, role: "Leader", customRole: "Full Stack & IoT Telemetry Lead" },
        { user: dev2._id, role: "Contributor", customRole: "Data Visualization Specialist" },
        { user: dev3._id, role: "Contributor", customRole: "Backend & Timeseries Ingestion Engineer" },
      ],
      maxTeamSize: 5,
      budgetType: "Fixed",
      budgetAmount: 70000,
      currency: "INR",
      budgetDescription: "Funded via State Water Conservation Trust.",
      expectedDuration: "50 Days",
      deadline: new Date(Date.now() - 85 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/jaldrishti-aquifer-monitor",
      liveUrl: "https://jaldrishti.org",
      solution: {
        completionSummary: "Live telemetry dashboard deployed with 40 ultrasonic borewell probes operational. SMS gateway integrated with local telecom partners for farmer alerts.",
        liveUrl: "https://jaldrishti.org",
        githubRepoUrl: "https://github.com/solvex-teams/jaldrishti-aquifer-monitor",
        documentation: "https://github.com/solvex-teams/jaldrishti-aquifer-monitor/wiki",
        screenshots: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"],
        demoVideo: "https://youtube.com/watch?v=sample-demo-jaldrishti",
        notes: "Pilot successfully prevented 3 borewell failures by issuing timely conservation alerts.",
        submittedAt: new Date(Date.now() - 95 * 86400000),
      },
      impact: {
        peopleBenefited: 28000,
        organizationsHelped: 12,
        notes: "Preserved 1.4 million liters of emergency drinking water across 12 village water committees during peak drought season.",
      },
      status: "COMPLETED",
      completionDate: new Date(Date.now() - 90 * 86400000),
    });

    // Project 7: COMPLETED (Led by Priya Sharma - Maternal Healthcare)
    const project7 = await Project.create({
      title: "ArogyaDoot — Maternal Healthcare Nutrition & Vaccination Tracker",
      description: "Maternal mortality rates remain high in underserved peri-urban settlements due to missed immunization dates and nutritional deficits. Community health clinics need a clean mobile web app to track high-risk pregnancies and send scheduled voice call reminders.",
      problemProvider: provider2._id,
      projectLeader: dev2._id,
      category: "Healthcare & Nutrition",
      requiredFeatures: "High-risk pregnancy risk scoring, immunization calendar generator, automated vernacular voice reminders, clinic visit logger",
      preferredTechnologies: "React, Node.js, Express, MongoDB, Tailwind CSS, Twilio",
      requiredSkills: ["React", "UI/UX Design", "Node.js", "MongoDB", "Tailwind CSS"],
      aiSummary: "A patient-centric clinical registry and automated notification engine designed to ensure 100% adherence to prenatal checkups and child immunization calendars.",
      aiSuggestedFeatures: [
        "Patient Intake & Nutritional Risk Calculator",
        "Automated Trimester Immunization Timeline",
        "Multilingual Voice Reminder Scheduler",
        "Clinic Attendance & Growth Chart Export",
      ],
      aiSuggestedSkills: ["React", "Node.js", "Tailwind CSS"],
      aiComplexity: "Moderate",
      teamMembers: [
        { user: dev2._id, role: "Leader", customRole: "Frontend & Design System Lead" },
        { user: dev3._id, role: "Contributor", customRole: "Backend & Scheduling Architect" },
        { user: dev5._id, role: "Contributor", customRole: "Full Stack Contributor" },
      ],
      maxTeamSize: 4,
      budgetType: "Fixed",
      budgetAmount: 48000,
      currency: "INR",
      budgetDescription: "Funded by Community Health Action Council.",
      expectedDuration: "35 Days",
      deadline: new Date(Date.now() - 25 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/arogyadoot-maternal-health",
      liveUrl: "https://arogyadoot.care",
      solution: {
        completionSummary: "Complete responsive web app with WCAG AA compliance, multilingual audio support, and automated reminder queues deployed for 15 health centers.",
        liveUrl: "https://arogyadoot.care",
        githubRepoUrl: "https://github.com/solvex-teams/arogyadoot-maternal-health",
        documentation: "https://github.com/solvex-teams/arogyadoot-maternal-health/wiki",
        screenshots: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"],
        notes: "Zero dropped reminder queue errors across 12,000 automated schedule dispatches.",
        submittedAt: new Date(Date.now() - 32 * 86400000),
      },
      impact: {
        peopleBenefited: 9500,
        organizationsHelped: 15,
        notes: "Increased on-time second-trimester immunization rates by 42% across pilot healthcare clusters.",
      },
      status: "COMPLETED",
      completionDate: new Date(Date.now() - 30 * 86400000),
    });

    // Project 8: COMPLETED (Led by Ananya Iyer - Agritech AI)
    const project8 = await Project.create({
      title: "KrishiMitra — Crop Disease Vision AI Diagnostics & Price Discovery",
      description: "Smallholder farmers suffer devastating yield losses from crop blight and lack fair local market rate transparency. We need a fast progressive web app where farmers can photograph diseased crop leaves to get instant pest remedies and check daily APMC mandi prices.",
      problemProvider: provider1._id,
      projectLeader: dev4._id,
      category: "Agritech & AI for Good",
      requiredFeatures: "Camera photo leaf lesion analysis, disease treatment remedies in regional languages, live wholesale commodity market prices, offline remedy caching",
      preferredTechnologies: "FastAPI, Python, React, Groq AI, Tailwind CSS, MongoDB",
      requiredSkills: ["FastAPI", "Python", "React", "Groq AI", "Tailwind CSS", "MongoDB"],
      aiSummary: "An edge-accessible agro-intelligence web platform utilizing computer vision models to diagnose crop pathogen outbreaks and empower farmers with fair trade market price intelligence.",
      aiSuggestedFeatures: [
        "Instant Leaf Disease Identification Camera Flow",
        "Organic & Chemical Remedy Prescriptions in Regional Dialects",
        "Daily Mandi Wholesale Price Index",
        "Farmer Peer Community Discussion Wall",
      ],
      aiSuggestedSkills: ["Python", "React", "Groq AI", "Tailwind CSS"],
      aiComplexity: "Complex",
      teamMembers: [
        { user: dev4._id, role: "Leader", customRole: "AI / ML & Full Stack Lead" },
        { user: dev1._id, role: "Contributor", customRole: "System Architecture Advisor" },
        { user: dev5._id, role: "Contributor", customRole: "Frontend UI Contributor" },
      ],
      maxTeamSize: 4,
      budgetType: "Fixed",
      budgetAmount: 65000,
      currency: "INR",
      budgetDescription: "National Agro-Innovation Grant stipend.",
      expectedDuration: "45 Days",
      deadline: new Date(Date.now() - 20 * 86400000),
      githubRepoUrl: "https://github.com/solvex-teams/krishimitra-agro-ai",
      liveUrl: "https://krishimitra-agro.org",
      solution: {
        completionSummary: "Integrated computer vision diagnostics trained on 24 common South Asian crop leaf diseases with sub-second inference via Groq AI Llama vision models and mandi price caching.",
        liveUrl: "https://krishimitra-agro.org",
        githubRepoUrl: "https://github.com/solvex-teams/krishimitra-agro-ai",
        documentation: "https://github.com/solvex-teams/krishimitra-agro-ai/wiki",
        screenshots: ["https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80"],
        demoVideo: "https://youtube.com/watch?v=sample-demo-krishimitra",
        notes: "Supported by regional agricultural universities with validated remedy datasets.",
        submittedAt: new Date(Date.now() - 26 * 86400000),
      },
      impact: {
        peopleBenefited: 8200,
        organizationsHelped: 9,
        notes: "Helped over 8,000 farmers prevent tomato early blight and cotton leaf curl disease damage during monsoon planting season.",
      },
      status: "COMPLETED",
      completionDate: new Date(Date.now() - 25 * 86400000),
    });

    // Seed Team Documents for projects
    await Team.create([
      {
        projectId: project1._id,
        leaderId: dev1._id,
        members: [
          { userId: dev1._id, role: "Leader", customRole: "Lead System Architect", status: "ACTIVE" },
          { userId: dev2._id, role: "Contributor", customRole: "UI/UX & Frontend Lead", status: "ACTIVE" },
          { userId: dev3._id, role: "Contributor", customRole: "Backend & Database Lead", status: "ACTIVE" },
        ],
      },
      {
        projectId: project2._id,
        leaderId: dev3._id,
        members: [
          { userId: dev3._id, role: "Leader", customRole: "Backend & Systems Lead", status: "ACTIVE" },
          { userId: dev2._id, role: "Contributor", customRole: "Accessible UI Lead", status: "ACTIVE" },
          { userId: dev4._id, role: "Contributor", customRole: "AI Diagnostic Assistant Lead", status: "ACTIVE" },
        ],
      },
      {
        projectId: project5._id,
        leaderId: dev1._id,
        members: [
          { userId: dev1._id, role: "Leader", customRole: "Lead System Architect", status: "ACTIVE" },
          { userId: dev4._id, role: "Contributor", customRole: "Curriculum & Interactive Content Lead", status: "ACTIVE" },
          { userId: dev5._id, role: "Contributor", customRole: "Frontend PWA Specialist", status: "ACTIVE" },
        ],
      },
      {
        projectId: project6._id,
        leaderId: dev1._id,
        members: [
          { userId: dev1._id, role: "Leader", customRole: "Full Stack & IoT Telemetry Lead", status: "ACTIVE" },
          { userId: dev2._id, role: "Contributor", customRole: "Data Visualization Specialist", status: "ACTIVE" },
          { userId: dev3._id, role: "Contributor", customRole: "Backend & Timeseries Ingestion Engineer", status: "ACTIVE" },
        ],
      },
      {
        projectId: project7._id,
        leaderId: dev2._id,
        members: [
          { userId: dev2._id, role: "Leader", customRole: "Frontend & Design System Lead", status: "ACTIVE" },
          { userId: dev3._id, role: "Contributor", customRole: "Backend & Scheduling Architect", status: "ACTIVE" },
          { userId: dev5._id, role: "Contributor", customRole: "Full Stack Contributor", status: "ACTIVE" },
        ],
      },
      {
        projectId: project8._id,
        leaderId: dev4._id,
        members: [
          { userId: dev4._id, role: "Leader", customRole: "AI / ML & Full Stack Lead", status: "ACTIVE" },
          { userId: dev1._id, role: "Contributor", customRole: "System Architecture Advisor", status: "ACTIVE" },
          { userId: dev5._id, role: "Contributor", customRole: "Frontend UI Contributor", status: "ACTIVE" },
        ],
      },
    ]);

    // 5. Create Developer Requests & Invitations
    const req1 = await DeveloperRequest.create({
      developer: dev1._id,
      project: project3._id,
      message: "I have extensive experience with GIS geo-mapping and building green-tech dashboards. Would love to lead the engineering team for VanRakhshak!",
      status: "PENDING",
    });

    const req2 = await DeveloperRequest.create({
      developer: dev5._id,
      project: project3._id,
      message: "I am passionate about environmental conservation and have built several React frontend maps. Excited to contribute as a frontend engineer.",
      status: "PENDING",
    });

    const inv1 = await DeveloperInvitation.create({
      provider: provider2._id,
      developer: dev4._id,
      project: project4._id,
      message: "Hi Ananya, we noticed your AI and accessible tech background and would be honored if you could lead the MedAlert assistive audio project!",
      status: "PENDING",
    });

    // 6. Create Chat Messages for Active Project (Project 2)
    await Message.create([
      {
        project: project2._id,
        sender: provider2._id,
        content: "Welcome team! Dr. Sen here. The pilot clinics in Satara are eagerly awaiting the prototype testing.",
        chatType: "TEAM_GROUP",
      },
      {
        project: project2._id,
        sender: dev3._id,
        content: "Hi Dr. Sen! Rahul here (Project Leader). We've finalized the IndexedDB offline caching schema and will have the vitals logging form ready for initial review by Friday.",
        chatType: "TEAM_GROUP",
      },
      {
        project: project2._id,
        sender: dev2._id,
        content: "I've drafted the high-contrast UI component library designed for direct outdoor sunlight readability on low-cost Android tablets.",
        chatType: "TEAM_GROUP",
      },
      {
        project: project2._id,
        sender: provider2._id,
        content: "That sounds fantastic Priya! Can we ensure the pulse ox readings allow manual overrides if the sensor fails?",
        chatType: "PROVIDER_LEADER",
      },
      {
        project: project2._id,
        sender: dev3._id,
        content: "Yes absolutely, added a fallback toggle for manual nurse observations.",
        chatType: "PROVIDER_LEADER",
      },
    ]);

    // 7. Seed Notifications
    await Notification.create([
      {
        user: provider3._id,
        type: "NEW_DEVELOPER_REQUEST",
        message: "Ashish Lohar requested to lead \"VanRakhshak — Community Forest Geo-Tagging\"",
        data: { projectId: project3._id, requestId: req1._id },
        read: false,
      },
      {
        user: provider3._id,
        type: "NEW_DEVELOPER_REQUEST",
        message: "Vikram Malhotra requested to join \"VanRakhshak — Community Forest Geo-Tagging\"",
        data: { projectId: project3._id, requestId: req2._id },
        read: false,
      },
      {
        user: dev4._id,
        type: "NEW_INVITATION",
        message: "Dr. Maya Sen invited you to lead \"MedAlert — Blind & Low-Vision Audio Prescription Reader\"",
        data: { projectId: project4._id, invitationId: inv1._id },
        read: false,
      },
      {
        user: dev3._id,
        type: "PROPOSAL_APPROVED",
        message: "Your project proposal for \"Sanjeevani — Rural Health Clinic Patient Tele-Triage\" has been approved!",
        data: { projectId: project2._id },
        read: true,
      },
    ]);

    console.log("Database seeded successfully with rich realistic data!");
    console.log("--------------------------------------------------");
    console.log("Default Accounts:");
    console.log("Admin:     admin@solvex.com / adminPassword123!");
    console.log("Provider:  aarav.ngo@example.org / password123");
    console.log("Provider:  maya.sen@rhi-care.org / password123");
    console.log("Developer: ashish@developer.io / password123 (Top performer)");
    console.log("Developer: priya.frontend@developer.io / password123");
    console.log("Developer: rahul.backend@developer.io / password123");
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seedDatabase();
