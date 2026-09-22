const axios = require("axios");

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
 * Fetch basic stats from a public GitHub repo.
 * Best-effort — returns null fields if repo is private or API fails.
 */
async function getRepoStats(repoUrl) {
  try {
    if (!repoUrl) return null;

    const parsed = normalizeGithubUrl(repoUrl);
    if (!parsed || !parsed.owner || !parsed.repo) return null;

    const response = await axios.get(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SolveX-Platform",
        },
        timeout: 5000,
      }
    );

    const data = response.data;

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

module.exports = { getRepoStats, normalizeGithubUrl };
