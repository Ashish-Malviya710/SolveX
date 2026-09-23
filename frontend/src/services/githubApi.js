import api from "./api";

// ─── GitHub Issues ───────────────────────────────────────────
export const getGithubIssues = (projectId) =>
  api.get(`/github/projects/${projectId}/issues`);

export const createGithubIssue = (projectId, data) =>
  api.post(`/github/projects/${projectId}/issues`, data);

// ─── GitHub Pull Requests ────────────────────────────────────
export const getGithubPulls = (projectId) =>
  api.get(`/github/projects/${projectId}/pulls`);

export const getPRReviews = (projectId, prNumber) =>
  api.get(`/github/projects/${projectId}/pulls/${prNumber}/reviews`);

// ─── GitHub Milestones ───────────────────────────────────────
export const getGithubMilestones = (projectId) =>
  api.get(`/github/projects/${projectId}/milestones`);

// ─── Contribution Analysis ───────────────────────────────────
export const getContributions = (projectId) =>
  api.get(`/github/projects/${projectId}/contributions`);

// ─── Project Progress ────────────────────────────────────────
export const getProjectProgress = (projectId) =>
  api.get(`/github/projects/${projectId}/progress`);

// ─── Activity Timeline ──────────────────────────────────────
export const getActivityTimeline = (projectId, limit = 30) =>
  api.get(`/github/projects/${projectId}/activity`, { params: { limit } });

// ─── Backup Developer Matching ──────────────────────────────
export const markMemberVacant = (projectId, userId) =>
  api.put(`/teams/${projectId}/members/${userId}/vacant`);

export const findReplacements = (projectId, userId) =>
  api.get(`/teams/${projectId}/members/${userId}/replacements`);

export const inviteReplacement = (projectId, userId, data) =>
  api.post(`/teams/${projectId}/members/${userId}/invite-replacement`, data);

// ─── Milestone Linking ──────────────────────────────────────
export const linkGithubMilestone = (proposalId, milestoneIdx, githubMilestoneNumber) =>
  api.put(`/proposals/${proposalId}/milestones/${milestoneIdx}/github-link`, { githubMilestoneNumber });
