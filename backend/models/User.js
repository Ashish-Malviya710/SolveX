const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Model — covers Problem Provider, Developer, and Admin (role field distinguishes).
 * See prompt Sections 2-4 (Profile Fields) and Section 27.
 */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["PROBLEM_PROVIDER", "DEVELOPER", "ADMIN"],
      required: true,
    },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    mobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    linkedinOrPortfolio: { type: String, trim: true },
    githubProfile: { type: String, trim: true },
    isProfilePublic: { type: Boolean, default: true },

    bio: { type: String, maxlength: 500 },

    // Developer-specific
    skills: [{ type: String, trim: true }],
    experience: { type: String, trim: true },
    availability: { type: Boolean, default: true },
    projectsCompleted: { type: Number, default: 0 },
    projectsLed: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    badges: [String],
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
