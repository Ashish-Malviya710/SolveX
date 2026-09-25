import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Maps a user's role to their designated home/entry URL.
 * - DEVELOPER: /explore
 * - PROBLEM_PROVIDER: /provider/find
 * - ADMIN: /admin/dashboard
 */
export const getDashboardRoute = (role) => {
  switch (role) {
    case "PROBLEM_PROVIDER":
      return "/provider/find";
    case "ADMIN":
      return "/admin/dashboard";
    case "DEVELOPER":
    default:
      return "/explore";
  }
};

/**
 * PublicOnlyRoute ensures that routes intended solely for unauthenticated visitors
 * (Landing Page, Login, Register) redirect authenticated users directly to their
 * respective role-based dashboard/workspace, preventing public landing/login pages
 * from loading when already authenticated.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, token, loading, isAuthenticated } = useContext(AuthContext);

  // If token is present in storage and profile sync is in-flight, show clean branded loader
  if (loading && token) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="spinner border-t-primary-500"></div>
        <p className="text-sm text-gray-400 font-medium">Entering SolveX Workspace...</p>
      </div>
    );
  }

  // If user is authenticated, redirect straight to their role's workspace
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
