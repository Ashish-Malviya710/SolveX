import React from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiHeart, FiCode, FiCpu } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-800/80 mt-auto py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="text-lg font-bold font-display text-white">
                Solve<span className="text-accent-400">X</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connect real-world community challenges with top engineering talent through AI-structured requirements and verified milestones.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <Link to="/explore" className="hover:text-primary-400 transition">
                  Explore Problems
                </Link>
              </li>
              <li>
                <Link to="/showcase" className="hover:text-primary-400 transition">
                  Completed Projects
                </Link>
              </li>
              <li>
                <Link to="/developers" className="hover:text-primary-400 transition">
                  Top Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* User Guides */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Get Involved</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <Link to="/register" className="hover:text-primary-400 transition">
                  Join as Developer
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-400 transition">
                  Submit a Problem
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-400 transition">
                  Partner NGOs
                </Link>
              </li>
            </ul>
          </div>

          {/* AI & GitHub Tech */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Powered By</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <FiCpu className="w-4 h-4 text-accent-400" />
                <span>Groq AI (Llama 3.3)</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCode className="w-4 h-4 text-primary-400" />
                <span>Socket.io Real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <FiGithub className="w-4 h-4 text-emerald-400" />
                <span>GitHub Development Grid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-dark-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} SolveX Platform. Built for high-impact social software engineering.</p>
          <div className="flex items-center gap-1">
            <span>Designed with</span>
            <FiHeart className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
            <span>for open collaboration</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
