const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

/**
 * POST /api/auth/register
 * Register a new user (DEVELOPER or PROBLEM_PROVIDER only — Admin is seeded).
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide name, email, password, and role" });
    }

    // Only allow DEVELOPER and PROBLEM_PROVIDER during registration
    if (!["DEVELOPER", "PROBLEM_PROVIDER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be DEVELOPER or PROBLEM_PROVIDER" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const user = await User.create({ name, email, password, role });

    const token = signToken(user._id);

    // Return user data without password
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/**
 * POST /api/auth/login
 * Login with email and password.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Need to explicitly select password since it's select: false
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/auth/profile
 * Update current user's profile.
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name", "mobileNumber", "address", "linkedinOrPortfolio",
      "githubProfile", "isProfilePublic", "bio", "skills",
      "experience", "availability",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
