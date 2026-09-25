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

async function seedDatabase(customUri) {
  let memoryServer = null;
  try {
    const mongoUri = customUri || process.env.MONGO_URI || "mongodb://localhost:27017/solvex";
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`Connected to MongoDB at ${mongoUri} for seeding...`);
      } catch (connErr) {
        console.log(`Could not connect to ${mongoUri}. Starting embedded MongoDB server...`);
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`Connected to embedded MongoDB at ${memUri} for seeding...`);
      }
    } else {
      console.log("Using existing MongoDB connection for seeding...");
    }

    // Clear existing data across all collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await DeveloperRequest.deleteMany({});
    await DeveloperInvitation.deleteMany({});
    await ProjectProposal.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await Team.deleteMany({});
    console.log("Existing collections cleared.");

    // 1. Create Admin
    await User.create({
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

    // 2. Create 2 Problem Providers
    await User.create({
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

    await User.create({
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
    console.log("2 Problem Providers seeded successfully.");

    // 3. Create 2 Developers
    await User.create({
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
      reputation: 100,
      projectsCompleted: 0,
      projectsLed: 0,
      badges: [],
      isProfilePublic: true,
    });

    await User.create({
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
      reputation: 100,
      projectsCompleted: 0,
      projectsLed: 0,
      badges: [],
      isProfilePublic: true,
    });
    console.log("2 Developers seeded successfully.");

    console.log("--------------------------------------------------");
    console.log("Database seeded successfully with clean accounts!");
    console.log("--------------------------------------------------");
    console.log("Default Accounts:");
    console.log("Admin:       admin@solvex.com / adminPassword123!");
    console.log("Provider 1:  aarav.ngo@example.org / password123");
    console.log("Provider 2:  maya.sen@rhi-care.org / password123");
    console.log("Developer 1: ashish@developer.io / password123");
    console.log("Developer 2: priya.frontend@developer.io / password123");
    console.log("--------------------------------------------------");

    if (memoryServer && require.main === module) {
      await memoryServer.stop();
    }

    return true;
  } catch (err) {
    console.error("Seeding error:", err);
    if (memoryServer) {
      await memoryServer.stop();
    }
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
