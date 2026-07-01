import { detectLanguage } from "./detectLanguage.js";

const IGNORED_FOLDERS = new Set(["node_modules", "dist", "build", ".git"]);
const ALLOWED_EXTENSIONS = new Set(["js", "py", "java", "cpp", "cc", "cxx", "go", "hpp", "hh", "hxx"]);

function isAllowedFile(name) {
  if (!name || typeof name !== "string") return false;
  const ext = name.split(".").pop().toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function isIgnoredFolder(name) {
  if (!name || typeof name !== "string") return false;
  return IGNORED_FOLDERS.has(name.toLowerCase());
}

async function fetchJson(url) {
  // Use optional token header to increase rate limits for authenticated requests.
  // Unauthenticated requests are limited to 60/hour; with a personal access
  // token GitHub increases this to ~5,000/hour for most accounts. Recursive
  // traversals can easily use many requests (one per folder + files), so the
  // token is recommended for large repos.
  const headers = {
    Accept: "application/vnd.github.v3+json",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };

  const res = await fetch(url, { headers });

  // If we hit the rate limit, surface a clear error object so callers can
  // provide a friendly message to the user instead of a generic 403.
  if (res.status === 403) {
    const errorText = await res.text().catch(() => "");
    return { rateLimit: true, message: `GitHub API rate limit exceeded. ${errorText}` };
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText} - ${errorText}`);
  }

  return res.json();
}

async function fetchFolderContents(owner, repo, path = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  return fetchJson(url);
}

export async function fetchRepoFiles(owner, repo) {
  const rootItems = await fetchFolderContents(owner, repo);
  const files = [];

  async function traverse(items, basePath = "") {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item || item.type === "symlink") continue;

      if (item.type === "dir") {
        const folderName = item.name;
        if (isIgnoredFolder(folderName)) continue;

        const childItems = await fetchFolderContents(owner, repo, item.path);
        await traverse(childItems, item.path);
        continue;
      }

      if (item.type === "file" && isAllowedFile(item.name)) {
        const language = detectLanguage(item.name);
        if (!language) continue;

        // Use token for downloads too when available to avoid unauthenticated
        // download counts eating the low rate limit. Keep behavior optional
        // so the feature works without configuration.
        const downloadHeaders = process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {};

        const contentRes = await fetch(item.download_url, { headers: downloadHeaders });
        if (contentRes.status === 403) {
          // Propagate a rate-limit signal back to the caller so it can show
          // a helpful message to the user instead of failing silently.
          return { rateLimit: true, message: "GitHub API rate limit exceeded while downloading file." };
        }

        if (!contentRes.ok) {
          continue;
        }
        const content = await contentRes.text();

        files.push({
          name: item.name,
          path: item.path,
          content,
          language,
        });
      }
    }
  }

  await traverse(rootItems);
  return files;
}
