const axios = require("axios");

/**
 * In-memory cache with TTL (5 minutes default).
 * Key: string, Value: { data, expiry }
 */
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

/**
 * Rate limit tracking from GitHub API response headers.
 */
let rateLimitInfo = { remaining: null, limit: null, reset: null };

function updateRateLimit(headers) {
  if (headers["x-ratelimit-remaining"] !== undefined) {
    rateLimitInfo = {
      remaining: parseInt(headers["x-ratelimit-remaining"], 10),
      limit: parseInt(headers["x-ratelimit-limit"], 10),
      reset: parseInt(headers["x-ratelimit-reset"], 10),
    };
  }
}

function getRateLimitInfo() {
  return rateLimitInfo;
}

/**
 * Build default headers for GitHub API requests.
 * Uses GITHUB_TOKEN from env if available for higher rate limits and private repo access.
 */
function getHeaders() {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SolveX-Platform",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Generic GitHub API GET helper with caching and rate-limit tracking.
 */
async function githubGet(url, cacheKey, params = {}) {
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const response = await axios.get(url, {
    headers: getHeaders(),
    params,
    timeout: 15000,
  });

  updateRateLimit(response.headers);

  const data = response.data;
  if (cacheKey) setCache(cacheKey, data);
  return data;
}

/**
 * Paginated GitHub API GET — fetches all pages (up to maxPages).
 */
async function githubGetAll(url, cacheKey, params = {}, maxPages = 10) {
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  let allData = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await axios.get(url, {
      headers: getHeaders(),
      params: { ...params, per_page: 100, page },
      timeout: 15000,
    });

    updateRateLimit(response.headers);
    allData = allData.concat(response.data);

    // Check if there are more pages via Link header
    const linkHeader = response.headers.link || "";
    if (!linkHeader.includes('rel="next"') || response.data.length < 100) {
      break;
    }
    page++;
  }

  if (cacheKey) setCache(cacheKey, allData);
  return allData;
}

/**
 * Normalizes any GitHub URL format into standard https://github.com/owner/repo
 * Supports:
 *  - github.com/owner/repo.git
 *  - https://github.com/owner/repo.git
 *  - http://github.com/owner/repo
 *  - git@github.com:owner/repo.git
 *  - owner/repo
 */
function normalizeGithubUrl(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Match git@github.com:owner/repo or https?://github.com/owner/repo or github.com/owner/repo
  const fullMatch = trimmed.match(/(?:(?:https?:\/\/)?github\.com[/:]|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/)?$/i);
  if (fullMatch) {
    const owner = fullMatch[1];
    const repo = fullMatch[2].replace(/\.git$/i, "");
    return {
      owner,
      repo,
      normalizedUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  return {
    owner: "",
    repo: "",
    normalizedUrl: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
  };
}

/**
 * Fetch basic stats from a GitHub repo.
 * Best-effort — returns null fields if repo is private or API fails.
 */
async function getRepoStats(repoUrl) {
  try {
    if (!repoUrl) return null;

    const parsed = normalizeGithubUrl(repoUrl);
    if (!parsed || !parsed.owner || !parsed.repo) return null;

    const data = await githubGet(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      `repo-stats:${parsed.owner}/${parsed.repo}`
    );

    return {
      openIssues: data.open_issues_count || 0,
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      language: data.language,
      updatedAt: data.pushed_at,
      description: data.description,
      owner: parsed.owner,
      repo: parsed.repo,
      htmlUrl: data.html_url || parsed.normalizedUrl,
    };
  } catch (err) {
    // Best-effort: return null if private or API fails
    console.warn("GitHub stats fetch notice:", err.message);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// GitHub Issues
// ───────────────────────────────────────────────────────────────

/**
 * Fetch all issues for a repo (not PRs — GitHub includes PRs in issues endpoint).
 */
async function getRepoIssues(owner, repo) {
  const cacheKey = `issues:${owner}/${repo}`;

  // Fetch open issues
  const openIssues = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    null,
    { state: "open", sort: "updated", direction: "desc" }
  );

  // Fetch closed issues
  const closedIssues = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    null,
    { state: "closed", sort: "updated", direction: "desc" }
  );

  // Filter out pull requests (GitHub API includes PRs in issues endpoint)
  const filterIssues = (items) =>
    items.filter((item) => !item.pull_request).map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user?.login || "unknown",
      authorAvatar: issue.user?.avatar_url,
      labels: (issue.labels || []).map((l) => ({ name: l.name, color: l.color })),
      assignee: issue.assignee?.login || null,
      assigneeAvatar: issue.assignee?.avatar_url || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      url: issue.html_url,
      body: issue.body ? issue.body.substring(0, 200) : "",
    }));

  const open = filterIssues(openIssues);
  const closed = filterIssues(closedIssues);
  const all = [...open, ...closed];

  const result = {
    issues: all,
    counts: {
      open: open.length,
      closed: closed.length,
      total: all.length,
    },
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Create a new issue in a GitHub repo.
 */
async function createRepoIssue(owner, repo, title, body, labels = [], assignees = []) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GitHub token required to create issues. Set GITHUB_TOKEN in .env");
  }

  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    { title, body, labels, assignees },
    { headers: getHeaders(), timeout: 15000 }
  );

  updateRateLimit(response.headers);

  // Invalidate issues cache
  cache.delete(`issues:${owner}/${repo}`);

  return {
    number: response.data.number,
    title: response.data.title,
    state: response.data.state,
    url: response.data.html_url,
  };
}

// ───────────────────────────────────────────────────────────────
// GitHub Pull Requests
// ───────────────────────────────────────────────────────────────

/**
 * Fetch all pull requests for a repo.
 */
async function getRepoPullRequests(owner, repo) {
  const cacheKey = `pulls:${owner}/${repo}`;

  const openPRs = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    null,
    { state: "open", sort: "updated", direction: "desc" }
  );

  const closedPRs = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    null,
    { state: "closed", sort: "updated", direction: "desc" }
  );

  const mapPR = (pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login || "unknown",
    authorAvatar: pr.user?.avatar_url,
    state: pr.merged_at ? "merged" : pr.state,
    sourceBranch: pr.head?.ref || "",
    targetBranch: pr.base?.ref || "",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    closedAt: pr.closed_at,
    url: pr.html_url,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
  });

  const open = openPRs.map(mapPR);
  const closed = closedPRs.map(mapPR);
  const all = [...open, ...closed];

  const merged = all.filter((pr) => pr.state === "merged");
  const closedNotMerged = all.filter((pr) => pr.state === "closed");

  const result = {
    pullRequests: all,
    counts: {
      open: open.length,
      merged: merged.length,
      closed: closedNotMerged.length,
      total: all.length,
    },
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch reviews for a specific pull request.
 */
async function getPRReviews(owner, repo, prNumber) {
  const cacheKey = `pr-reviews:${owner}/${repo}/${prNumber}`;

  const reviews = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    cacheKey
  );

  const reviewSummary = {
    approved: 0,
    changesRequested: 0,
    commented: 0,
  };

  const reviewList = reviews.map((r) => {
    if (r.state === "APPROVED") reviewSummary.approved++;
    else if (r.state === "CHANGES_REQUESTED") reviewSummary.changesRequested++;
    else if (r.state === "COMMENTED") reviewSummary.commented++;

    return {
      id: r.id,
      author: r.user?.login || "unknown",
      authorAvatar: r.user?.avatar_url,
      state: r.state,
      body: r.body ? r.body.substring(0, 300) : "",
      submittedAt: r.submitted_at,
    };
  });

  return { reviews: reviewList, summary: reviewSummary };
}

// ───────────────────────────────────────────────────────────────
// GitHub Milestones
// ───────────────────────────────────────────────────────────────

/**
 * Fetch all milestones for a repo.
 */
async function getRepoMilestones(owner, repo) {
  const cacheKey = `milestones:${owner}/${repo}`;

  const openMilestones = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/milestones`,
    null,
    { state: "open", sort: "due_on", direction: "asc" }
  );

  const closedMilestones = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/milestones`,
    null,
    { state: "closed", sort: "due_on", direction: "desc" }
  );

  const mapMilestone = (m) => {
    const total = (m.open_issues || 0) + (m.closed_issues || 0);
    return {
      number: m.number,
      title: m.title,
      description: m.description || "",
      state: m.state,
      dueOn: m.due_on,
      openIssues: m.open_issues || 0,
      closedIssues: m.closed_issues || 0,
      totalIssues: total,
      progress: total > 0 ? Math.round((m.closed_issues / total) * 100) : 0,
      url: m.html_url,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      closedAt: m.closed_at,
    };
  };

  const all = [...openMilestones.map(mapMilestone), ...closedMilestones.map(mapMilestone)];

  const result = {
    milestones: all,
    counts: {
      open: openMilestones.length,
      closed: closedMilestones.length,
      total: all.length,
    },
  };

  setCache(cacheKey, result);
  return result;
}

// ───────────────────────────────────────────────────────────────
// Contribution Analysis
// ───────────────────────────────────────────────────────────────

/**
 * Fetch commit history for a repo, optionally filtered by author.
 */
async function getRepoCommits(owner, repo, author = null) {
  const params = { per_page: 100 };
  if (author) params.author = author;

  const cacheKey = `commits:${owner}/${repo}:${author || "all"}`;
  const commits = await githubGetAll(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    cacheKey,
    params,
    5 // max 5 pages = 500 commits
  );

  return commits.map((c) => ({
    sha: c.sha,
    message: c.commit?.message?.split("\n")[0] || "",
    author: c.author?.login || c.commit?.author?.name || "unknown",
    authorAvatar: c.author?.avatar_url,
    date: c.commit?.author?.date,
    url: c.html_url,
  }));
}

/**
 * Calculate contribution stats for each team member.
 * Returns per-author breakdown with transparent scoring.
 *
 * Score formula: commits*1 + PRs*3 + mergedPRs*5 + issues*2 + reviews*2
 */
async function getContributorStats(owner, repo) {
  const cacheKey = `contributor-stats:${owner}/${repo}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Fetch all data in parallel
  const [commits, issuesData, pullsData] = await Promise.all([
    getRepoCommits(owner, repo),
    getRepoIssues(owner, repo),
    getRepoPullRequests(owner, repo),
  ]);

  // Aggregate per-author stats
  const authorStats = {};

  const getOrCreate = (author) => {
    if (!authorStats[author]) {
      authorStats[author] = {
        author,
        commits: 0,
        prs: 0,
        mergedPrs: 0,
        issues: 0,
        reviews: 0,
        score: 0,
      };
    }
    return authorStats[author];
  };

  // Count commits
  for (const commit of commits) {
    getOrCreate(commit.author).commits++;
  }

  // Count issues created
  for (const issue of issuesData.issues) {
    getOrCreate(issue.author).issues++;
  }

  // Count PRs and merged PRs
  for (const pr of pullsData.pullRequests) {
    const stat = getOrCreate(pr.author);
    stat.prs++;
    if (pr.state === "merged") stat.mergedPrs++;
  }

  // Fetch reviews for all PRs (batch, with limit to avoid rate limits)
  const prNumbers = pullsData.pullRequests.slice(0, 50).map((pr) => pr.number);
  for (const prNumber of prNumbers) {
    try {
      const reviewData = await getPRReviews(owner, repo, prNumber);
      for (const review of reviewData.reviews) {
        if (review.state !== "PENDING") {
          getOrCreate(review.author).reviews++;
        }
      }
    } catch (err) {
      // Skip if review fetch fails for this PR
    }
  }

  // Calculate scores
  for (const author of Object.keys(authorStats)) {
    const s = authorStats[author];
    s.score = s.commits * 1 + s.prs * 3 + s.mergedPrs * 5 + s.issues * 2 + s.reviews * 2;
  }

  // Sort by score descending
  const result = Object.values(authorStats).sort((a, b) => b.score - a.score);

  setCache(cacheKey, result);
  return result;
}

// ───────────────────────────────────────────────────────────────
// Project Progress
// ───────────────────────────────────────────────────────────────

/**
 * Calculate overall project progress by combining multiple signals.
 */
async function getProjectProgress(owner, repo) {
  const cacheKey = `project-progress:${owner}/${repo}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [issuesData, pullsData, milestonesData, commits] = await Promise.all([
    getRepoIssues(owner, repo),
    getRepoPullRequests(owner, repo),
    getRepoMilestones(owner, repo),
    getRepoCommits(owner, repo),
  ]);

  // Issue resolution rate
  const issueResolutionRate =
    issuesData.counts.total > 0
      ? Math.round((issuesData.counts.closed / issuesData.counts.total) * 100)
      : 0;

  // PR merge rate
  const prMergeRate =
    pullsData.counts.total > 0
      ? Math.round((pullsData.counts.merged / pullsData.counts.total) * 100)
      : 0;

  // GitHub milestone progress (average)
  let githubMilestoneProgress = 0;
  if (milestonesData.milestones.length > 0) {
    const totalProgress = milestonesData.milestones.reduce((sum, m) => sum + m.progress, 0);
    githubMilestoneProgress = Math.round(totalProgress / milestonesData.milestones.length);
  }

  // Commit activity (last 30 days vs total)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCommits = commits.filter(
    (c) => new Date(c.date) >= thirtyDaysAgo
  ).length;

  // Overall health score (weighted average)
  const overallProgress = Math.round(
    issueResolutionRate * 0.25 +
      prMergeRate * 0.25 +
      githubMilestoneProgress * 0.35 +
      Math.min(recentCommits * 2, 100) * 0.15
  );

  const result = {
    overallProgress: Math.min(overallProgress, 100),
    issueResolutionRate,
    prMergeRate,
    githubMilestoneProgress,
    commitActivity: {
      total: commits.length,
      last30Days: recentCommits,
    },
    issues: issuesData.counts,
    pullRequests: pullsData.counts,
    milestones: milestonesData.counts,
  };

  setCache(cacheKey, result);
  return result;
}

// ───────────────────────────────────────────────────────────────
// Activity Timeline
// ───────────────────────────────────────────────────────────────

/**
 * Get recent activity for a repo — commits, PRs, issues, milestone updates.
 * Returns a unified timeline sorted by date (newest first).
 */
async function getRecentActivity(owner, repo, limit = 30) {
  const cacheKey = `activity:${owner}/${repo}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [commits, issuesData, pullsData] = await Promise.all([
    getRepoCommits(owner, repo),
    getRepoIssues(owner, repo),
    getRepoPullRequests(owner, repo),
  ]);

  const timeline = [];

  // Recent commits (last 30)
  for (const commit of commits.slice(0, 30)) {
    timeline.push({
      type: "commit",
      author: commit.author,
      authorAvatar: commit.authorAvatar,
      message: commit.message,
      date: commit.date,
      url: commit.url,
      sha: commit.sha?.substring(0, 7),
    });
  }

  // Recent issues (last 20)
  for (const issue of issuesData.issues.slice(0, 20)) {
    timeline.push({
      type: "issue",
      author: issue.author,
      authorAvatar: issue.authorAvatar,
      message: `#${issue.number} ${issue.title}`,
      state: issue.state,
      date: issue.createdAt,
      url: issue.url,
      labels: issue.labels,
    });
  }

  // Recent PRs (last 20)
  for (const pr of pullsData.pullRequests.slice(0, 20)) {
    timeline.push({
      type: "pull_request",
      author: pr.author,
      authorAvatar: pr.authorAvatar,
      message: `#${pr.number} ${pr.title}`,
      state: pr.state,
      date: pr.createdAt,
      url: pr.url,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
    });
  }

  // Sort by date, newest first
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  const result = timeline.slice(0, limit);
  setCache(cacheKey, result);
  return result;
}

module.exports = {
  normalizeGithubUrl,
  getRepoStats,
  getRepoIssues,
  createRepoIssue,
  getRepoPullRequests,
  getPRReviews,
  getRepoMilestones,
  getRepoCommits,
  getContributorStats,
  getProjectProgress,
  getRecentActivity,
  getRateLimitInfo,
};
