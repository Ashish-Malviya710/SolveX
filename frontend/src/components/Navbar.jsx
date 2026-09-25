import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDashboardRoute } from "./PublicOnlyRoute";
import NotificationBell from "./NotificationBell";
import { Button, Badge } from "./ui";
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
  FiSend,
  FiMail,
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

  // Primary brand destination
  const brandDestination = isAuthenticated && user ? getDashboardRoute(user.role) : "/";

  return (
    <nav className="sticky top-0 z-40 bg-void/95 backdrop-blur-md border-b border-iron">
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to={brandDestination} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-inputs bg-carbon border border-iron text-lime font-mono font-bold text-sm flex items-center justify-center shadow-glow-sm group-hover:border-steel transition-colors">
                S
              </div>
              <span className="text-lg font-bold font-sans tracking-tight text-white">
                Solve<span className="text-lime">X</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {user?.role === "PROBLEM_PROVIDER" ? (
                <>
                  <Link
                    to="/provider/find"
                    className={`px-3 py-1.5 rounded-buttons text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive("/provider/find")
                        ? "bg-carbon text-white border border-iron"
                        : "text-smoke hover:text-white"
                    }`}
                  >
                    <FiUsers className="w-4 h-4 text-lime" />
                    Find Developers
                  </Link>
                  <Link
                    to="/provider/dashboard"
                    className={`px-3 py-1.5 rounded-buttons text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive("/provider/dashboard")
                        ? "bg-carbon text-white border border-iron"
                        : "text-smoke hover:text-white"
                    }`}
                  >
                    <FiFolder className="w-4 h-4 text-smoke" />
                    My Projects
                  </Link>
                </>
              ) : (
                <Link
                  to="/explore"
                  className={`px-3 py-1.5 rounded-buttons text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/explore")
                      ? "bg-carbon text-white border border-iron"
                      : "text-smoke hover:text-white"
                  }`}
                >
                  <FiCompass className="w-4 h-4 text-lime" />
                  Explore
                </Link>
              )}
              <Link
                to="/showcase"
                className={`px-3 py-1.5 rounded-buttons text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/showcase")
                    ? "bg-carbon text-white border border-iron"
                    : "text-smoke hover:text-white"
                }`}
              >
                <FiLayers className="w-4 h-4 text-smoke" />
                Showcase
              </Link>
              <Link
                to="/developers"
                className={`px-3 py-1.5 rounded-buttons text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/developers")
                    ? "bg-carbon text-white border border-iron"
                    : "text-smoke hover:text-white"
                }`}
              >
                <FiAward className="w-4 h-4 text-smoke" />
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
                  <Button
                    to="/provider/create"
                    variant="primary"
                    size="sm"
                    icon={FiPlusCircle}
                  >
                    Post Problem
                  </Button>
                )}

                {user?.role === "DEVELOPER" && (
                  <Button
                    to="/developer/dashboard"
                    variant="secondary"
                    size="sm"
                    icon={FiFolder}
                  >
                    My Workspace
                  </Button>
                )}

                {user?.role === "ADMIN" && (
                  <Button
                    to="/admin/dashboard"
                    variant="secondary"
                    size="sm"
                    icon={FiShield}
                  >
                    Admin Console
                  </Button>
                )}

                {/* Notifications Bell */}
                <NotificationBell />

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-buttons hover:bg-carbon border border-transparent hover:border-iron transition-all"
                  >
                    <div className="w-7 h-7 rounded-inputs bg-graphite border border-iron text-lime font-mono font-bold text-xs flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="text-xs font-medium text-bone max-w-[110px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-carbon border border-iron rounded-cards shadow-2xl z-50 overflow-hidden py-1 animate-scale-in">
                      <div className="px-4 py-3 border-b border-iron/60 bg-void/50">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-smoke truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="lime" size="sm">
                            {user?.role?.replace("_", " ")}
                          </Badge>
                          {user?.role === "DEVELOPER" && (
                            <Badge variant="neutral" size="sm">
                              {user?.reputation || 0} pts
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        {user?.role === "DEVELOPER" && (
                          <>
                            <Link
                              to="/developer/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiFolder className="w-4 h-4 text-lime" />
                              Developer Dashboard
                            </Link>
                            <Link
                              to="/developer/portfolio"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiUser className="w-4 h-4 text-smoke" />
                              My Portfolio
                            </Link>
                            <Link
                              to="/developer/requests"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiSend className="w-4 h-4 text-smoke" />
                              Join &amp; Team Requests
                            </Link>
                            <Link
                              to="/developer/invitations"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiMail className="w-4 h-4 text-smoke" />
                              My Invitations
                            </Link>
                          </>
                        )}

                        {user?.role === "PROBLEM_PROVIDER" && (
                          <>
                            <Link
                              to="/provider/find"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiUsers className="w-4 h-4 text-lime" />
                              Find Developers
                            </Link>
                            <Link
                              to="/provider/dashboard"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiFolder className="w-4 h-4 text-smoke" />
                              My Posted Projects
                            </Link>
                            <Link
                              to="/provider/requests"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiUsers className="w-4 h-4 text-smoke" />
                              Developer Requests
                            </Link>
                            <Link
                              to="/provider/proposals"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                            >
                              <FiLayers className="w-4 h-4 text-smoke" />
                              Review Proposals
                            </Link>
                          </>
                        )}

                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone hover:text-white hover:bg-graphite transition-colors"
                        >
                          <FiSettings className="w-4 h-4 text-smoke" />
                          Profile &amp; Settings
                        </Link>
                      </div>

                      <div className="border-t border-iron/60 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-graphite transition-colors text-left"
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
                <Button to="/login" variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button to="/register" variant="primary" size="sm">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-inputs text-smoke hover:text-white hover:bg-graphite"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-carbon border-t border-iron px-4 pt-2 pb-6 space-y-2">
          {user?.role === "PROBLEM_PROVIDER" ? (
            <>
              <Link
                to="/provider/find"
                className="flex items-center gap-2 px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
              >
                <FiUsers className="w-4 h-4 text-lime" />
                Find Developers
              </Link>
              <Link
                to="/provider/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
              >
                <FiFolder className="w-4 h-4 text-smoke" />
                My Projects
              </Link>
            </>
          ) : (
            <Link
              to="/explore"
              className="flex items-center gap-2 px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
            >
              <FiCompass className="w-4 h-4 text-lime" />
              Explore Problems
            </Link>
          )}
          <Link
            to="/showcase"
            className="flex items-center gap-2 px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
          >
            <FiLayers className="w-4 h-4 text-smoke" />
            Showcase
          </Link>
          <Link
            to="/developers"
            className="flex items-center gap-2 px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
          >
            <FiAward className="w-4 h-4 text-smoke" />
            Top Developers
          </Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-iron space-y-2">
              <div className="px-3 py-1">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <span className="text-[10px] text-lime font-mono">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
              {user?.role === "DEVELOPER" && (
                <>
                  <Link
                    to="/developer/dashboard"
                    className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
                  >
                    Developer Dashboard
                  </Link>
                  <Link
                    to="/developer/portfolio"
                    className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
                  >
                    My Portfolio
                  </Link>
                  <Link
                    to="/developer/requests"
                    className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
                  >
                    Join &amp; Team Requests
                  </Link>
                  <Link
                    to="/developer/invitations"
                    className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
                  >
                    My Invitations
                  </Link>
                </>
              )}
              {user?.role === "PROBLEM_PROVIDER" && (
                <>
                  <Link
                    to="/provider/find"
                    className="block px-3 py-2 rounded-inputs text-sm text-lime hover:bg-graphite"
                  >
                    Find Developers
                  </Link>
                  <Link
                    to="/provider/dashboard"
                    className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
                  >
                    Provider Dashboard
                  </Link>
                  <Link
                    to="/provider/requests"
                    className="block px-3 py-2 rounded-inputs text-sm text-smoke hover:bg-graphite"
                  >
                    Developer Requests
                  </Link>
                  <Link
                    to="/provider/proposals"
                    className="block px-3 py-2 rounded-inputs text-sm text-smoke hover:bg-graphite"
                  >
                    Review Proposals
                  </Link>
                  <Link
                    to="/provider/create"
                    className="block px-3 py-2 rounded-inputs text-sm text-lime hover:bg-graphite font-semibold"
                  >
                    + Post Problem
                  </Link>
                </>
              )}
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin/dashboard"
                  className="block px-3 py-2 rounded-inputs text-sm text-lime hover:bg-graphite"
                >
                  Admin Console
                </Link>
              )}
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-inputs text-sm text-bone hover:bg-graphite"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-inputs text-sm text-red-400 hover:bg-graphite"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-iron flex flex-col gap-2">
              <Button to="/login" variant="secondary" size="md" className="w-full">
                Sign In
              </Button>
              <Button to="/register" variant="primary" size="md" className="w-full">
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
