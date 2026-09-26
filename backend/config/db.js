const mongoose = require("mongoose");

let memoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || "mongodb://localhost:27017/solvex";
  try {
    // Attempt standard connection with 3s timeout
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected to: ${primaryUri}`);
  } catch (err) {
    console.warn(`Primary MongoDB connection notice (${err.message}).`);
    
    try {
      console.log("Starting embedded MongoDB development server...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      
      await mongoose.connect(memUri);
      console.log(`Connected to embedded MongoDB at: ${memUri}`);
      
      // Auto-seed in-memory database
      const seedDatabase = require("../seed");
      console.log("Auto-seeding database with test accounts and civic projects...");
      await seedDatabase(memUri);
    } catch (memErr) {
      console.error("Failed to start embedded MongoDB:", memErr.message);
      console.error("Please ensure MongoDB is running locally or set MONGO_URI in backend/.env");
      process.exit(1);
    }
  }
};

process.on("SIGINT", async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
