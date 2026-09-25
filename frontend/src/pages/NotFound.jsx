import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiCompass } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { getDashboardRoute } from "../components/PublicOnlyRoute";

const NotFound = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const homeTarget = isAuthenticated && user ? getDashboardRoute(user.role) : "/";
  const homeLabel = isAuthenticated
    ? user?.role === "DEVELOPER"
      ? "Explore Problems"
      : "Return to Workspace"
    : "Return Home";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="glass-card max-w-md p-10 space-y-6">
        <div className="text-6xl font-extrabold font-display bg-gradient-to-r from-primary-400 via-accent-400 to-neon-green bg-clip-text text-transparent">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Page Not Found</h2>
          <p className="text-xs text-gray-400">
            The workspace or resource you are looking for has been moved or does not exist.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to={homeTarget} className="btn-primary btn-sm flex items-center justify-center gap-1.5">
            <FiHome className="w-3.5 h-3.5" /> {homeLabel}
          </Link>
          <Link to="/explore" className="btn-secondary btn-sm flex items-center justify-center gap-1.5">
            <FiCompass className="w-3.5 h-3.5" /> Explore Problems
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
