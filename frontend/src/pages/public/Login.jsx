import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { getDashboardRoute } from "../../components/PublicOnlyRoute";
import {
  Container,
  Card,
  Button,
  Input,
} from "../../components/ui";

const Login = () => {
  const { login, user, isAuthenticated } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().replace(/^["']|["']$/g, "").toLowerCase();
    const cleanPassword = password.trim().replace(/^["']|["']$/g, "");

    const result = await login(cleanEmail, cleanPassword);
    setLoading(false);

    if (result.success) {
      const redirectTarget =
        location.state?.from?.pathname && location.state.from.pathname !== "/"
          ? location.state.from.pathname
          : getDashboardRoute(result.user.role);
      navigate(redirectTarget, { replace: true });
    } else {
      setError(result.error);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
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
            Welcome Back
          </h1>
          <p className="text-xs text-smoke">
            Sign in to coordinate teams, manage challenges, and submit solutions.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-inputs flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              icon={FiLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-smoke hover:text-white transition p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              }
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
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="pt-4 border-t border-iron/60 space-y-2.5">
            <span className="text-[11px] text-smoke block font-mono uppercase tracking-wider text-center">
              ⚡ One-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("ashish@developer.io", "password123")}
                className="text-[10px] py-1.5 px-2"
                title="ashish@developer.io"
              >
                Dev: Ashish
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("aarav.ngo@example.org", "password123")}
                className="text-[10px] py-1.5 px-2"
                title="aarav.ngo@example.org"
              >
                Provider: Aarav
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("maya.sen@rhi-care.org", "password123")}
                className="text-[10px] py-1.5 px-2 text-emerald-400 border-emerald-500/30"
                title="maya.sen@rhi-care.org"
              >
                Provider: Maya
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin("admin@solvex.com", "adminPassword123!")}
                className="text-[10px] py-1.5 px-2 text-amber-400 border-amber-500/30"
                title="admin@solvex.com"
              >
                Admin
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-smoke font-mono">
          Don't have an account yet?{" "}
          <Link to="/register" className="text-lime hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </Container>
    </div>
  );
};

export default Login;
