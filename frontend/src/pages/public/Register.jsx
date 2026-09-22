import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheckCircle, FiCode, FiHeart } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";

const Register = () => {
  const { register } = useContext(AuthContext);
  const [role, setRole] = useState("DEVELOPER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, role);
    setLoading(false);

    if (result.success) {
      if (role === "DEVELOPER") {
        navigate("/developer/dashboard");
      } else {
        navigate("/provider/dashboard");
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-glow-sm">
            S
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Create Your Account
          </h2>
          <p className="text-xs text-gray-400">
            Join the developer network or publish a community challenge.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 space-y-6">
          {/* Role Picker Tabs */}
          <div className="space-y-1.5">
            <label className="input-label text-xs">I want to join as a:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("DEVELOPER")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  role === "DEVELOPER"
                    ? "bg-primary-600/20 border-primary-500 text-primary-300 shadow-glow-sm"
                    : "bg-dark-900/60 border-dark-700 text-gray-400 hover:bg-dark-800"
                }`}
              >
                <FiCode className="w-4 h-4" />
                <span>Developer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("PROBLEM_PROVIDER")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  role === "PROBLEM_PROVIDER"
                    ? "bg-accent-600/20 border-accent-500 text-accent-300 shadow-glow-accent"
                    : "bg-dark-900/60 border-dark-700 text-gray-400 hover:bg-dark-800"
                }`}
              >
                <FiHeart className="w-4 h-4" />
                <span>Problem Provider</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 pt-1">
              {role === "DEVELOPER"
                ? "💡 Discover problems, apply to solve, lead projects, and earn reputation badges."
                : "💡 Submit problems, receive AI analysis, recruit developer teams, and approve delivery."}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label text-xs">
                {role === "DEVELOPER" ? "Full Name" : "Organization or Provider Name"}
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder={role === "DEVELOPER" ? "e.g. Ashish Lohar" : "e.g. Clean Canopy NGO"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="input-label text-xs">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="input-label text-xs">Password (6+ chars)</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="spinner w-4 h-4 border-2" />
              ) : (
                <>
                  <span>Create {role === "DEVELOPER" ? "Developer" : "Provider"} Account</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
