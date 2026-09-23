import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  FiCompass,
  FiAward,
  FiUsers,
  FiPlusCircle,
  FiFolder,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiLayers,
  FiShield,
} from "react-icons/fi";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-dark-700/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-accent-500 to-neon-green flex items-center justify-center text-white font-black text-lg shadow-glow-sm group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-accent-400 transition-all">
                Solve<span className="text-accent-400">X</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {user?.role === "PROBLEM_PROVIDER" ? (
                <>
                  <Link
                    to="/provider/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive("/provider/dashboard")
                        ? "bg-dark-800 text-white border border-dark-600/60 shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                    }`}
                  >
                    <FiFolder className="w-4 h-4 text-primary-400" />
                    My Projects
                  </Link>
                  <Link
                    to="/provider/find"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive("/provider/find")
                        ? "bg-dark-800 text-white border border-dark-600/60 shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                    }`}
                  >
                    <FiUsers className="w-4 h-4 text-emerald-400" />
                    Find Developers
                  </Link>
                </>
              ) : (
                <Link
                  to="/explore"
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive("/explore")
                      ? "bg-dark-800 text-white border border-dark-600/60 shadow-sm"
                      : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                  }`}
                >
                  <FiCompass className="w-4 h-4 text-primary-400" />
                  Explore
                </Link>
              )}
              <Link
                to="/showcase"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive("/showcase")
                    ? "bg-dark-800 text-white border border-dark-600/60 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                }`}
              >
                <FiLayers className="w-4 h-4 text-emerald-400" />
                Showcase
              </Link>
              <Link
                to="/developers"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive("/developers")
                    ? "bg-dark-800 text-white border border-dark-600/60 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                }`}
              >
                <FiAward className="w-4 h-4 text-accent-400" />
                Top Developers
              </Link>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Role Specific Shortcuts */}
                {user?.role === "PROBLEM_PROVIDER" && (
                  <Link
                    to="/provider/create"
                    className="btn-accent btn-sm flex items-center gap-1.5"
                  >
                    <FiPlusCircle className="w-4 h-4" />
                    Post Problem
                  </Link>
                )}

                {user?.role === "DEVELOPER" && (
                  <Link
                    to="/developer/dashboard"
                    className="btn-secondary btn-sm flex items-center gap-1.5"
                  >
                    <FiFolder className="w-4 h-4 text-primary-400" />
                    My Workspace
                  </Link>
                )}

                {user?.role === "ADMIN" && (
                  <Link
                    to="/admin/dashboard"
                    className="btn-secondary btn-sm flex items-center gap-1.5 border-amber-500/30 text-amber-300"
                  >
                    <FiShield className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                {/* Notifications Bell */}
                <NotificationBell />

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-dark-800/80 transition border border-transparent hover:border-dark-600/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-xs shadow-glow-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 glass-card border border-dark-600/60 rounded-2xl shadow-glass z-50 overflow-hidden py-1.5 animate-scale-in">
                      <div className="px-4 py-3 border-b border-dark-700/60 bg-dark-900/60">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="badge badge-primary text-[10px] py-0.5 px-2">
                            {user?.role?.replace("_", " ")}
                          </span>
                          {user?.role === "DEVELOPER" && (
                            <span className="badge badge-accent text-[10px] py-0.5 px-2">
                              {user?.reputation || 0} pts
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        {user?.role === "DEVELOPER" && (
                          <>
                            <Link
                              to="/developer/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiFolder className="w-4 h-4 text-primary-400" />
                              Developer Dashboard
                            </Link>
                            <Link
                              to="/developer/portfolio"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiUser className="w-4 h-4 text-accent-400" />
                              My Portfolio
                            </Link>
                          </>
                        )}

                        {user?.role === "PROBLEM_PROVIDER" && (
                          <>
                            <Link
                              to="/provider/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiFolder className="w-4 h-4 text-primary-400" />
                              Provider Dashboard
                            </Link>
                            <Link
                              to="/provider/requests"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiUsers className="w-4 h-4 text-accent-400" />
                              Developer Requests
                            </Link>
                            <Link
                              to="/provider/proposals"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiLayers className="w-4 h-4 text-amber-400" />
                              Review Proposals
                            </Link>
                            <Link
                              to="/provider/find"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                            >
                              <FiUsers className="w-4 h-4 text-emerald-400" />
                              Find Developers
                            </Link>
                          </>
                        )}

                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-700/50 transition"
                        >
                          <FiSettings className="w-4 h-4 text-gray-400" />
                          Profile & Settings
                        </Link>
                      </div>

                      <div className="border-t border-dark-700/60 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-dark-700/50 transition text-left"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-800"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-dark-700/60 px-4 pt-2 pb-6 space-y-2">
          {user?.role === "PROBLEM_PROVIDER" ? (
            <>
              <Link
                to="/provider/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
              >
                <FiFolder className="w-4 h-4 text-primary-400" />
                My Projects
              </Link>
              <Link
                to="/provider/find"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
              >
                <FiUsers className="w-4 h-4 text-emerald-400" />
                Find Developers
              </Link>
            </>
          ) : (
            <Link
              to="/explore"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
            >
              <FiCompass className="w-4 h-4 text-primary-400" />
              Explore Problems
            </Link>
          )}
          <Link
            to="/showcase"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
          >
            <FiLayers className="w-4 h-4 text-emerald-400" />
            Showcase
          </Link>
          <Link
            to="/developers"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
          >
            <FiAward className="w-4 h-4 text-accent-400" />
            Top Developers
          </Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-dark-700/60 space-y-2">
              <div className="px-3 py-1">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <span className="text-[10px] text-primary-400 font-medium">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
              {user?.role === "DEVELOPER" && (
                <>
                  <Link
                    to="/developer/dashboard"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
                  >
                    Developer Dashboard
                  </Link>
                  <Link
                    to="/developer/portfolio"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
                  >
                    My Portfolio
                  </Link>
                </>
              )}
              {user?.role === "PROBLEM_PROVIDER" && (
                <>
                  <Link
                    to="/provider/dashboard"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
                  >
                    Provider Dashboard
                  </Link>
                  <Link
                    to="/provider/requests"
                    className="block px-3 py-2 rounded-lg text-sm text-accent-400 hover:bg-dark-800"
                  >
                    Developer Requests
                  </Link>
                  <Link
                    to="/provider/proposals"
                    className="block px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-dark-800"
                  >
                    Review Proposals
                  </Link>
                  <Link
                    to="/provider/create"
                    className="block px-3 py-2 rounded-lg text-sm text-primary-400 hover:bg-dark-800"
                  >
                    + Post Problem
                  </Link>
                </>
              )}
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin/dashboard"
                  className="block px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-dark-800"
                >
                  Admin Console
                </Link>
              )}
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-dark-800"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-dark-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-dark-700/60 flex flex-col gap-2">
              <Link to="/login" className="btn-secondary w-full text-center py-2.5">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary w-full text-center py-2.5">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
