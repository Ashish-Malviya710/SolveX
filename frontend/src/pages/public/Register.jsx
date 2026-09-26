import React, { useState, useContext } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCode, FiHeart } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { getDashboardRoute } from "../../components/PublicOnlyRoute";
import {
  Container,
  Card,
  Button,
  Input,
} from "../../components/ui";

const Register = () => {
  const { register, user, isAuthenticated } = useContext(AuthContext);
  const [role, setRole] = useState("DEVELOPER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

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
      navigate(getDashboardRoute(role), { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <Container size="narrow" className="max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-inputs bg-carbon border border-iron text-lime font-mono font-bold text-xl flex items-center justify-center mx-auto shadow-glow-sm">
            S
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-smoke">
            Join the developer network or publish a community challenge.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 space-y-6">
          {/* Role Picker Tabs */}
          <div className="space-y-2">
            <label className="input-label">I want to join as a:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("DEVELOPER")}
                className={`p-3 rounded-buttons border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === "DEVELOPER"
                    ? "bg-lime-dark border-lime/40 text-lime"
                    : "bg-void border-iron text-smoke hover:bg-graphite"
                }`}
              >
                <FiCode className="w-4 h-4" />
                <span>Developer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("PROBLEM_PROVIDER")}
                className={`p-3 rounded-buttons border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === "PROBLEM_PROVIDER"
                    ? "bg-lime-dark border-lime/40 text-lime"
                    : "bg-void border-iron text-smoke hover:bg-graphite"
                }`}
              >
                <FiHeart className="w-4 h-4" />
                <span>Problem Provider</span>
              </button>
            </div>
            <p className="text-[11px] text-smoke pt-0.5">
              {role === "DEVELOPER"
                ? "💡 Discover problems, apply to lead/join teams, and build verified reputation."
                : "💡 Submit real challenges, receive AI scoping, and collaborate with skilled developers."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-inputs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={role === "DEVELOPER" ? "Full Name" : "Organization or Provider Name"}
              type="text"
              required
              placeholder={role === "DEVELOPER" ? "e.g. Ashish Lohar" : "e.g. Clean Canopy NGO"}
              icon={FiUser}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="name@example.com"
              icon={FiMail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password (6+ chars)"
              type="password"
              required
              placeholder="••••••••"
              icon={FiLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
              icon={FiArrowRight}
              iconPosition="right"
            >
              Create {role === "DEVELOPER" ? "Developer" : "Provider"} Account
            </Button>
          </form>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-smoke font-mono">
          Already have an account?{" "}
          <Link to="/login" className="text-lime hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </Container>
    </div>
  );
};

export default Register;
