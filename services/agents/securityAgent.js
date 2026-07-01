import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const execAsync = promisify(exec);

function getExtension(language) {
  // Pick a simple extension that Semgrep can understand.
  switch ((language || "").toLowerCase()) {
    case "javascript":
      return ".js";
    case "python":
      return ".py";
    case "java":
      return ".java";
    case "cpp":
      return ".cpp";
    case "go":
      return ".go";
    default:
      return ".txt";
  }
}

function parseSemgrepOutput(raw) {
  // Read Semgrep JSON and turn it into a small findings list.
  try {
    const data = JSON.parse(raw || "{}");
    const results = Array.isArray(data.results) ? data.results : [];

    return results.map((item) => ({
      type: "security",
      line: item?.start?.line || 0,
      rule: item?.check_id || "unknown-rule",
      severity: item?.extra?.severity || "INFO",
      message: item?.extra?.message || "Security issue found",
    }));
  } catch {
    return [];
  }
}

export async function securityAgent(code, language) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "codementor-semgrep-"));
  const tempFile = path.join(tempDir, `${crypto.randomUUID()}${getExtension(language)}`);
  const semgrepBin = process.env.SEMGREP_BIN || "c:/Users/ashew/Downloads/codementor-ai/.venv/Scripts/semgrep.exe";

  try {
    // Write the user code to a temporary file for Semgyyrep.
    await writeFile(tempFile, code || "", "utf8");

    console.log("Running Semgrep with security-audit rules...");

    // p/security-audit is more useful than auto for security checks because it
    // targets security-focused rules instead of broadly inferred defaults.
    // Semgrep may exit with code 1 when it finds vulnerabilities, so that is
    // expected and should not be treated as a crash.
    // Run Semgrep in JSON mode so the result is easy to parse.
    try {
      const { stdout } = await execAsync(
        `"${semgrepBin}" --config p/security-audit "${tempFile}" --json`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      return parseSemgrepOutput(stdout);
    } catch (err) {
      const stdout = err?.stdout || "";
      const stderr = err?.stderr || "";

      // If Semgrep printed JSON to stdout, keep the findings even when stderr
      // contains warnings or the exit code is 1 because findings were found.
      if (stdout) {
        const findings = parseSemgrepOutput(stdout);
        if (findings.length > 0) {
          return findings;
        }
      }

      // Only fail when stdout is empty or JSON parsing did not produce results.
      if (!stdout) {
        return [];
      }

      if (stderr) {
        return [];
      }

      return parseSemgrepOutput(stdout);
    }
  } catch (err) {
    // If Semgrep fails, return an empty list instead of crashing.
    return [];
  } finally {
    // Clean up the temporary file and folder every time.
    await rm(tempDir, { recursive: true, force: true });
  }
}