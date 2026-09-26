import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiCheck, FiX, FiFolder } from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
} from "../../components/ui";

const MyInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/invitations");
      setInvitations(res.data.invitations || []);
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (id) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/invitations/${id}/accept`);
      setActionSuccess("Invitation accepted! You have joined the project team.");
      fetchInvitations();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to accept invitation."
      );
    }
  };

  const handleReject = async (id) => {
    setActionError("");
    setActionSuccess("");
    try {
      await api.put(`/invitations/${id}/reject`);
      setActionSuccess("Invitation declined.");
      fetchInvitations();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to decline invitation."
      );
    }
  };

  return (
    <Container className="py-8 max-w-4xl">
      <PageHeader
        eyebrow="Direct Invitations"
        title="Received Project Invitations"
        description="Review problem providers who have invited you directly to lead or contribute to their challenge."
      />

      {actionSuccess && (
        <div className="mb-6 p-3.5 bg-lime/10 border border-lime/30 text-lime text-xs font-mono rounded-button flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess("")}
            className="text-smoke hover:text-paper"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-3.5 bg-red-950/30 border border-red-500/40 text-red-300 text-xs font-mono rounded-button flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError("")}
            className="text-smoke hover:text-paper"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-4 bg-graphite rounded w-1/3 mb-2" />
              <div className="h-3 bg-graphite rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <Card className="text-center py-16 px-6">
          <FiMail className="w-10 h-10 text-iron mx-auto mb-3" />
          <h3 className="text-base font-semibold text-paper mb-1">
            No Invitations Yet
          </h3>
          <p className="text-xs text-smoke font-mono">
            When problem providers discover your profile, direct invitations will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <Card key={inv._id} hoverable>
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        inv.status === "ACCEPTED"
                          ? "success"
                          : inv.status === "REJECTED"
                          ? "danger"
                          : "warning"
                      }
                      size="sm"
                    >
                      {inv.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-smoke">
                      Invited by{" "}
                      <strong className="text-paper">
                        {inv.provider?.name || "Provider"}
                      </strong>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-paper hover:text-lime transition">
                    <Link to={`/projects/${inv.project?._id}`}>
                      {inv.project?.title}
                    </Link>
                  </h3>

                  {inv.message && (
                    <p className="text-xs font-mono text-smoke italic line-clamp-2 bg-void p-3 rounded-button border border-hairline">
                      "{inv.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {inv.status === "PENDING" ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(inv._id)}
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(inv._id)}
                      >
                        <FiX className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      to={`/projects/${inv.project?._id}`}
                    >
                      <FiFolder className="w-3.5 h-3.5" />
                      <span>Open Problem</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default MyInvitations;
