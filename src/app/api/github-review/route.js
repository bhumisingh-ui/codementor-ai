import { runRepoSummary } from "../../../../services/review/runCodeReview.js";
import { fetchRepoFiles } from "../../../../services/github/fetchRepoFiles.js";
import { securityAgent } from "../../../../services/agents/securityAgent.js";

function parseGithubUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.hostname !== "github.com") return null;

    const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl || typeof repoUrl !== "string") {
      return Response.json({ error: "Repository URL is required." }, { status: 400 });
    }

    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) {
      return Response.json({ error: "Invalid GitHub repository URL." }, { status: 400 });
    }

    const { owner, repo } = parsed;
    const repoFiles = await fetchRepoFiles(owner, repo);

    // Handle rate-limit signal from fetchRepoFiles and return a helpful
    // message to the user. fetchRepoFiles returns an object like
    // { rateLimit: true, message: "..." } when the GitHub API returns 403.
    if (repoFiles && repoFiles.rateLimit) {
      return Response.json(
        { error: "GitHub API rate limit exceeded. Add a GitHub token for higher limits.", details: repoFiles.message },
        { status: 429 }
      );
    }

    if (!Array.isArray(repoFiles) || repoFiles.length === 0) {
      return Response.json(
        { error: "No supported code files found in this repository." },
        { status: 404 }
      );
    }

    // Limit to the first 5 supported files to reduce Gemini API usage.
    const selectedFiles = repoFiles.slice(0, 5);
    console.log("Files selected:", selectedFiles.length);

    const securityFindings = [];
    const bugFindings = [];
    const performanceFindings = [];
    const fileSummaries = [];
    let totalSecurityIssues = 0;

    for (const file of selectedFiles) {
      const findings = await securityAgent(file.content, file.language);
      totalSecurityIssues += Array.isArray(findings) ? findings.length : 0;

      // Collect security findings for each file in the multi-agent pipeline.
      securityFindings.push(...(findings || []));
      fileSummaries.push({
        file: file.path,
        securityFindings: findings,
      });
    }

    // Placeholder agents keep the pipeline shape intact while avoiding
    // extra work and API calls until they are implemented.
    console.log("Running single Gemini summary...");
    const finalReview = await runRepoSummary(`${owner}/${repo}`, {
      filesAnalyzed: selectedFiles.length,
      securityFindings,
      bugFindings,
      performanceFindings,
      fileSummaries,
      totalSecurityIssues,
    });

    return Response.json({
      repoName: `${owner}/${repo}`,
      filesAnalyzed: selectedFiles.length,
      securityFindings,
      bugFindings,
      performanceFindings,
      finalReview,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to analyze repository.", details: err.message },
      { status: 500 }
    );
  }
}
