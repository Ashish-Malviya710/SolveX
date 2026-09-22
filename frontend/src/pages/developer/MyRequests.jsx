import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiFolder, FiExternalLink, FiClock } from "react-icons/fi";
import api from "../../services/api";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get("/requests/my");
        setRequests(res.data.requests || []);
      } catch (err) {
        console.error("Failed to load my requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="page-container max-w-4xl space-y-6">
      <div className="section-header">
        <span className="badge badge-primary mb-2">My Applications</span>
        <h1 className="section-title">Sent Problem Requests</h1>
        <p className="section-subtitle">
          Track the status of your requests to lead or join open problem development teams.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-2">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state glass-card p-12">
          <FiSend className="empty-state-icon" />
          <h3 className="text-base font-bold text-white mb-1">No Requests Sent</h3>
          <p className="empty-state-text text-xs mb-4">
            You haven't requested to solve any problems yet.
          </p>
          <Link to="/explore" className="btn-primary btn-sm">
            Browse Open Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r._id}
              className="glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge text-[10px] ${
                      r.status === "ACCEPTED"
                        ? "badge-success"
                        : r.status === "REJECTED"
                        ? "badge-danger"
                        : "badge-warning"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Sent on {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white hover:text-primary-400 transition">
                  <Link to={`/projects/${r.project?._id}`}>{r.project?.title}</Link>
                </h3>

                {r.message && (
                  <p className="text-xs text-gray-300 italic line-clamp-2">
                    "{r.message}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                <Link
                  to={`/projects/${r.project?._id}`}
                  className="btn-secondary btn-sm flex items-center gap-1 text-xs"
                >
                  <FiFolder className="w-3.5 h-3.5" />
                  <span>Open Project</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
