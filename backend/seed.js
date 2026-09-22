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
