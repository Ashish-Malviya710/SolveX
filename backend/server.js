require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socket");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const developerRoutes = require("./routes/developerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const teamRoutes = require("./routes/teamRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const githubRoutes = require("./routes/githubRoutes");
const messageRoutes = require("./routes/messageRoutes");
const impactRoutes = require("./routes/impactRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.io
initSocket(server);

// Security & utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/impact", impactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route handler for unknown API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`SolveX backend server running on port ${PORT}`);
  console.log(`Allowing frontend requests from: ${clientUrl}`);
});

module.exports = { app, server };