import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiAward, FiSearch, FiUser } from "react-icons/fi";
import api from "../../services/api";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
} from "../../components/ui";

const DeveloperShowcase = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = search
        ? `/developers/search?search=${encodeURIComponent(search)}&page=${page}&limit=15`
        : `/developers/top-performers?page=${page}&limit=15`;
      const res = await api.get(endpoint);
      setDevelopers(res.data.developers || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error("Failed to fetch top performers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <span className="w-7 h-7 rounded-inputs bg-lime text-void flex items-center justify-center font-mono font-black text-xs shadow-glow-sm">
          #1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-7 h-7 rounded-inputs bg-graphite border border-iron text-white flex items-center justify-center font-mono font-bold text-xs">
          #2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-7 h-7 rounded-inputs bg-graphite border border-iron text-bone flex items-center justify-center font-mono font-bold text-xs">
          #3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-inputs bg-void border border-iron/80 flex items-center justify-center text-smoke font-mono font-medium text-xs">
        #{index + 1}
      </span>
    );
  };

  return (
    <Container className="space-y-8 py-8">
      {/* Header */}
      <PageHeader
        eyebrow="PLATFORM LEADERBOARD"
        title="Top Performing Developers"
        description="Ranked by verified milestone delivery, leadership achievements, and community reputation points."
      />

      {/* Search Bar */}
      <Card className="p-4">
        <Input
          icon={FiSearch}
          placeholder="Search developers by name, skills (e.g. React, Node.js, Python)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Card>

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5 animate-pulse flex items-center gap-4">
              <div className="w-7 h-7 rounded-inputs bg-graphite" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-graphite rounded-inputs w-1/4" />
                <div className="h-3 bg-graphite rounded-inputs w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : developers.length === 0 ? (
        <Card className="p-12 text-center text-smoke space-y-3">
          <FiAward className="w-8 h-8 text-iron mx-auto" />
          <h3 className="text-base font-bold text-white">No Developers Found</h3>
          <p className="text-xs text-smoke">Try searching for other skills or keywords.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {developers.map((dev, idx) => (
            <Card
              key={dev._id}
              hoverable
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Side: Rank + Name & Bio */}
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="flex-shrink-0 pt-0.5 sm:pt-0">
                  {getRankBadge(idx + (page - 1) * 15)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/developers/${dev._id}`}
                      className="text-base font-bold text-white hover:text-lime transition-colors truncate"
                    >
                      {dev.name}
                    </Link>
                    {dev.availability && (
                      <Badge variant="success" size="sm" dot>
                        Available
                      </Badge>
                    )}
                  </div>

                  {dev.bio && (
                    <p className="text-xs text-smoke line-clamp-1 max-w-xl">
                      {dev.bio}
                    </p>
                  )}

                  {/* Skills preview */}
                  {dev.skills && dev.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dev.skills.slice(0, 5).map((sk, sIdx) => (
                        <Badge key={sIdx} variant="neutral" size="sm" pill={false}>
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Stats & Badges */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-iron/60 flex-shrink-0">
                <div className="text-left sm:text-right font-mono">
                  <div className="text-lg font-extrabold text-lime">
                    {dev.reputation || 0}{" "}
                    <span className="text-xs font-normal text-smoke">pts</span>
                  </div>
                  <div className="text-[11px] text-smoke">
                    {dev.projectsCompleted || 0} completed • {dev.projectsLed || 0} led
                  </div>
                </div>

                {/* Badges preview */}
                {dev.badges && dev.badges.length > 0 && (
                  <div className="hidden lg:flex items-center gap-1">
                    {dev.badges.slice(0, 2).map((b, bIdx) => (
                      <Badge key={bIdx} variant="lime" size="sm" title={b}>
                        🏆 {b}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  to={`/developers/${dev._id}`}
                  variant="secondary"
                  size="sm"
                  icon={FiUser}
                >
                  Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-xs text-smoke font-mono px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
};

export default DeveloperShowcase;
