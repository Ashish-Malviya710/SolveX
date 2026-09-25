import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-void border-t border-iron mt-auto py-12">
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[4px] bg-carbon border border-iron flex items-center justify-center text-lime font-mono font-bold text-xs">
                S
              </div>
              <span className="text-base font-bold font-sans text-white">
                Solve<span className="text-lime">X</span>
              </span>
            </div>
            <p className="text-xs text-smoke leading-relaxed max-w-sm">
              Connect real-world community challenges with top engineering talent through AI-structured requirements and verified milestone delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-semibold text-lime uppercase tracking-[0.1em]">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs text-smoke">
              <li>
                <Link to="/explore" className="hover:text-lime transition-colors">
                  Explore Problems
                </Link>
              </li>
              <li>
                <Link to="/showcase" className="hover:text-lime transition-colors">
                  Completed Projects
                </Link>
              </li>
              <li>
                <Link to="/developers" className="hover:text-lime transition-colors">
                  Top Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* User Guides */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-semibold text-lime uppercase tracking-[0.1em]">
              Get Involved
            </h4>
            <ul className="space-y-1.5 text-xs text-smoke">
              <li>
                <Link to="/register" className="hover:text-lime transition-colors">
                  Join as Developer
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-lime transition-colors">
                  Submit a Problem
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-lime transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-iron/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-smoke font-mono">
          <p>© {new Date().getFullYear()} SolveX Platform. Phosphor terminal interface for open collaboration.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
