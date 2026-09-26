import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiMessageSquare,
  FiUsers,
  FiSend,
  FiFolder,
} from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Select,
} from "../../components/ui";

const DeveloperChat = () => {
  const { user, token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatType, setChatType] = useState(() =>
    user?.role === "PROBLEM_PROVIDER" ? "PROVIDER_LEADER" : "TEAM_GROUP"
  );
  const [targetMember, setTargetMember] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (user?.role === "PROBLEM_PROVIDER") {
      setChatType("PROVIDER_LEADER");
    }
  }, [user]);

  const { isConnected, messages, setMessages, joinRoom, sendMessage } =
    useSocket(token);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects/my-projects");
        const list = res.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0]._id);
          setSelectedProject(list[0]);
        }
      } catch (err) {
        console.error("Failed to load user projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSelectProject = async (id) => {
    setSelectedProjectId(id);
    const prj = projects.find((p) => p._id === id);
    setSelectedProject(prj);
  };

  useEffect(() => {
    if (selectedProjectId) {
      const fetchHistory = async () => {
        try {
          const params = new URLSearchParams({ chatType });
          if (targetMember) params.append("targetUserId", targetMember);
          const res = await api.get(
            `/messages/${selectedProjectId}?${params.toString()}`
          );
          setMessages(res.data.messages || []);
        } catch (err) {
          console.error("Failed to load chat history:", err);
        }
      };
      fetchHistory();
      joinRoom({
        projectId: selectedProjectId,
        chatType,
        targetUserId: targetMember,
      });
    }
  }, [selectedProjectId, chatType, targetMember, joinRoom, setMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProjectId) return;
    sendMessage({
      projectId: selectedProjectId,
      chatType,
      targetUserId: targetMember,
      content: chatInput,
    });
    setChatInput("");
  };

  const isLeader =
    selectedProject?.projectLeader?._id === user?._id ||
    selectedProject?.projectLeader === user?._id;
  const isProvider =
    selectedProject?.problemProvider?._id === user?._id ||
    selectedProject?.problemProvider === user?._id;

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Real-Time Terminal"
        title="Project Collaboration Chat"
        description="Isolated communication channels for problem providers, leaders, and team members."
      />

      {loading ? (
        <Card className="text-center py-16 px-6 font-mono text-xs text-smoke">
          Loading collaboration workspaces...
        </Card>
      ) : projects.length === 0 ? (
        <Card className="text-center py-16 px-6 font-mono text-xs text-smoke space-y-3">
          <p>You are not currently part of any active problem team.</p>
          <Button variant="primary" size="sm" to="/explore">
            Explore Open Challenges
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[620px]">
            {/* Sidebar */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-hairline bg-carbon space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-smoke">
                  Active Problem Workspace
                </label>
                <Select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Channels List */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-smoke uppercase tracking-wider block">
                  Communication Channels
                </span>
                <div className="space-y-1.5">
                  {user?.role !== "PROBLEM_PROVIDER" && (
                    <button
                      type="button"
                      onClick={() => {
                        setChatType("TEAM_GROUP");
                        setTargetMember("");
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-button text-xs font-mono transition flex items-center gap-2 ${
                        chatType === "TEAM_GROUP"
                          ? "bg-void border border-lime text-lime font-semibold"
                          : "text-bone hover:text-paper hover:bg-void border border-transparent"
                      }`}
                    >
                      <FiUsers className="w-3.5 h-3.5" />
                      <span>Team Group Channel</span>
                    </button>
                  )}

                  {(isProvider || isLeader || user?.role === "ADMIN") && (
                    <button
                      type="button"
                      onClick={() => {
                        setChatType("PROVIDER_LEADER");
                        setTargetMember("");
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-button text-xs font-mono transition flex items-center gap-2 ${
                        chatType === "PROVIDER_LEADER"
                          ? "bg-void border border-lime text-lime font-semibold"
                          : "text-bone hover:text-paper hover:bg-void border border-transparent"
                      }`}
                    >
                      <FiMessageSquare className="w-3.5 h-3.5" />
                      <span>Provider ↔ Leader Direct</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-hairline">
                <Button
                  variant="secondary"
                  size="sm"
                  to={`/projects/${selectedProjectId}`}
                  className="w-full"
                >
                  <FiFolder className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </Button>
              </div>
            </div>

            {/* Chat Messages Panel */}
            <div className="md:col-span-3 flex flex-col h-[620px] bg-void">
              {/* Header */}
              <div className="p-4 border-b border-hairline bg-carbon/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-paper">
                    {chatType === "TEAM_GROUP"
                      ? "Team Group Channel"
                      : "Direct Channel: Provider ↔ Leader"}
                  </h4>
                  <p className="text-[11px] font-mono text-smoke truncate max-w-md">
                    {selectedProject?.title}
                  </p>
                </div>
                <Badge variant="lime" size="sm" dot>
                  Live Socket
                </Badge>
              </div>

              {/* Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 font-mono text-xs">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-smoke">
                    No messages in this channel yet. Send a message to start discussion.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      msg.sender?._id === user?._id || msg.sender === user?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-smoke mb-1">
                          <span className="font-semibold text-bone">
                            {isMe ? "You" : msg.sender?.name || "Member"}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-button text-xs leading-relaxed ${
                            isMe
                              ? "bg-lime text-black font-semibold rounded-br-none"
                              : "bg-carbon text-bone border border-hairline rounded-bl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-hairline bg-carbon flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type message to channel..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-void border border-hairline rounded-button px-3.5 py-2 text-xs font-mono text-paper placeholder-smoke focus:outline-none focus:border-lime"
                />
                <Button type="submit" variant="primary" size="sm">
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default DeveloperChat;
