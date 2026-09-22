import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "react-router-dom";
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMinus,
  FiMaximize2,
  FiMinimize2,
  FiTrash2,
  FiCpu,
  FiZap,
  FiHelpCircle,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const AIAgentWidget = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick suggestions based on role
  const quickSuggestions = user?.role === "PROBLEM_PROVIDER"
    ? [
        "How do I post a new problem with AI?",
        "How do I invite skilled developers?",
        "How do proposals and milestones work?",
        "How does the private 3-channel chat work?",
      ]
    : user?.role === "DEVELOPER"
    ? [
        "How do I earn +15 reputation & badges?",
        "Tips for writing an approved milestone proposal",
        "How does the developer 3-channel chat work?",
        "How can I join or lead a project team?",
      ]
    : [
        "What is SolveX and how does it work?",
        "How do NGOs and developers collaborate?",
        "How does the AI problem blueprinting work?",
        "How do I get started?",
      ];

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = user
        ? `👋 **Hello ${user.name}!** I am **SolvexAI**, your intelligent platform assistant.

I'm here on your dashboard to help you:
- Draft and refine problem statements with AI
- Structure phased milestone proposals
- Explain project workflows, 3-channel chat, and reputation points
- Suggest modern tech stacks and solve technical challenges

What can I help you with right now?`
        : `👋 **Welcome to SolveX!** I'm **SolvexAI**, your platform assistant.

Ask me anything about how SolveX connects non-profits with developers, how our AI problem generator works, or how to get started on the platform!`;

      setMessages([
        {
          id: "welcome",
          sender: "assistant",
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [user]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const payload = {
        message: text,
        conversationHistory: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
        context: {
          role: user?.role || "GUEST",
          userName: user?.name || "Guest",
          path: location.pathname,
        },
      };

      const res = await api.post("/ai/assistant", payload);
      const aiReplyText = res.data.reply || "I apologize, but I could not generate a response right now. Please try asking again!";

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Assistant communication error:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "⚠️ **Connection Notice**: I encountered a brief issue reaching the server. Please try asking again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([
        {
          id: "welcome-cleared",
          sender: "assistant",
          text: `Chat cleared! How can I assist you now, ${user?.name || "friend"}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 100);
  };

  // Helper for simple formatting (bold, code, lists)
  const renderFormattedText = (content) => {
    if (!content) return null;

    // Split paragraphs
    const paragraphs = content.split("\n\n");

    return paragraphs.map((para, pIdx) => {
      // Check for bullet lists
      if (para.includes("\n- ") || para.startsWith("- ") || para.includes("\n* ") || para.startsWith("* ")) {
        const items = para.split(/\n[-*]\s+/).filter(Boolean);
        return (
          <ul key={pIdx} className="space-y-1.5 my-2 list-disc list-inside">
            {items.map((item, iIdx) => (
              <li key={iIdx} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }

      // Check for headers (### or ##)
      if (para.startsWith("### ")) {
        return (
          <h4 key={pIdx} className="font-bold text-primary-300 text-xs mt-3 mb-1 uppercase tracking-wider">
            {renderInlineMarkdown(para.replace(/^###\s+/, ""))}
          </h4>
        );
      }
      if (para.startsWith("## ")) {
        return (
          <h3 key={pIdx} className="font-bold text-white text-sm mt-3 mb-1">
            {renderInlineMarkdown(para.replace(/^##\s+/, ""))}
          </h3>
        );
      }

      return (
        <p key={pIdx} className="leading-relaxed my-1">
          {renderInlineMarkdown(para)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="bg-dark-800 text-accent-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 1. FLOATING ACTION TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-full shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-950"
          title="Open SolvexAI"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-dark-900"></span>
          </span>

          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <FiZap className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>

          <span className="text-xs font-bold tracking-wide">SolvexAI</span>
        </button>
      )}

      {/* 2. CHAT MODAL WINDOW */}
      {isOpen && (
        <div
          className={`flex flex-col bg-dark-950/95 backdrop-blur-2xl border border-primary-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-fadeIn ${
            isExpanded
              ? "w-[92vw] sm:w-[680px] h-[86vh] max-h-[850px]"
              : "w-[92vw] sm:w-[420px] h-[560px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-dark-900 via-primary-950/40 to-dark-900 border-b border-dark-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white shadow-md">
                  <FiCpu className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-dark-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">SolvexAI</h3>
                  <span className="badge badge-accent text-[9px] py-0 px-1.5">Live Agent</span>
                </div>
                <p className="text-[10px] text-gray-400">Platform Guide & Requirements Specialist</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-800/60 rounded-lg transition"
                title="Clear chat history"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-800/60 rounded-lg transition hidden sm:block"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-800/60 rounded-lg transition"
                title="Close SolvexAI"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Horizontal Scroll */}
          <div className="px-3 py-2 bg-dark-900/60 border-b border-dark-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            <span className="text-[10px] font-semibold text-primary-400 flex items-center gap-1 flex-shrink-0 pl-1">
              <FiZap className="w-3 h-3" /> Quick:
            </span>
            {quickSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(suggestion)}
                className="text-[10px] bg-dark-800/80 hover:bg-primary-900/30 hover:border-primary-500/40 border border-dark-700/70 text-gray-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition flex-shrink-0"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Message Thread Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-dark-950/80 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-primary-600/30 border border-primary-500/40 text-primary-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiCpu className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-none"
                      : "bg-dark-900/90 border border-dark-800 text-gray-200 rounded-bl-none shadow-inner"
                  }`}
                >
                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                  <span
                    className={`block text-[9px] mt-1.5 ${
                      msg.sender === "user" ? "text-white/70 text-right" : "text-gray-500"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiUser className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-primary-600/30 border border-primary-500/40 text-primary-400 flex items-center justify-center flex-shrink-0">
                  <FiCpu className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-dark-900/90 border border-dark-800 rounded-2xl rounded-bl-none p-3.5 text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-gray-400 pl-1">SolveX AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-dark-900/90 border-t border-dark-800 flex-shrink-0 space-y-1.5">
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about problems, proposals, code, or chat..."
                className="w-full bg-dark-950 border border-dark-700/80 focus:border-primary-500 rounded-xl px-3.5 py-2.5 pr-11 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none transition"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 text-white rounded-lg transition"
                title="Send Message"
              >
                <FiSend className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
              <span>Press Enter to send</span>
              <span className="flex items-center gap-1 text-primary-400/80">
                <FiZap className="w-2.5 h-2.5" /> Powered by SolvexAI Engine
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentWidget;
