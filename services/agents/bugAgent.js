import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { ESLint } from "eslint";
import { GoogleGenAI } from "@google/genai";
import * as espree from "espree";
import * as sonarjs from "eslint-plugin-sonarjs";

import { extractSnippets } from "./extractSnippets.js";

const execAsync = promisify(exec);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getExtension(language) {
  switch ((language || "").toLowerCase()) {
    case "javascript":
    case "typescript":
    case "jsx":
    case "tsx":
      return ".js";
    case "python":
      return ".py";
    case "go":
      return ".go";
    default:
      return ".txt";
  }
}

function normalizeLine(line) {
  const value = Number(line) || 0;
  return value > 0 ? value : 0;
}

function dedupeByLine(items) {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const line = normalizeLine(item?.line);
    if (!line || seen.has(line)) {
      continue;
    }

    seen.add(line);
    deduped.push({
      line,
      rule: item?.rule || "bug-rule",
      message: item?.message || "Possible bug detected.",
    });
  }

  return deduped;
}

function parsePylint(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return (Array.isArray(parsed) ? parsed : []).map((item) => ({
      line: normalizeLine(item?.line),
      rule: item?.symbol || item?.message-id || "pylint",
      message: item?.message || "Possible bug detected.",
    }));
  } catch {
    return [];
  }
}

function parseGoVet(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/:(\d+):(\d+):\s*(.*)$/);
      return {
        line: normalizeLine(match?.[1]),
        rule: "go vet",
        message: match?.[3] || line,
      };
    })
    .filter((item) => item.line > 0);
}

async function runJavaScriptLint(code, language, tempFile) {
  try {
    const parser =
      (language || "").toLowerCase() === "typescript" || (language || "").toLowerCase() === "tsx"
        ? await import("@typescript-eslint/parser")
        : null;

    const eslint = new ESLint({
      overrideConfigFile: true,
      ignore: false,
      overrideConfig: {
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          parser: parser?.default,
          parserOptions: {
            ecmaFeatures: { jsx: true },
          },
        },
        plugins: {
          sonarjs: sonarjs.default || sonarjs,
        },
        rules: {
          ...(sonarjs.default?.configs?.recommended?.rules || sonarjs.configs?.recommended?.rules || {}),
          "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
          "no-unreachable": "error",
          "require-await": "error",
          "consistent-return": "error",
          "no-unsafe-optional-chaining": "error",
        },
      },
    });

    const results = await eslint.lintText(String(code || ""), { filePath: tempFile });
    return results.flatMap((result) =>
      (result.messages || [])
        .filter((message) => message.ruleId && message.line)
        .map((message) => ({
          line: normalizeLine(message.line),
          rule: message.ruleId,
          message: message.message,
        }))
    );
  } catch {
    return [];
  }
}

function traverseAst(root, visitor) {
  const stack = [{ node: root, parent: null }];

  while (stack.length > 0) {
    const current = stack.pop();
    const node = current.node;
    if (!node || typeof node.type !== "string") {
      continue;
    }

    visitor(node, current.parent);

    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) {
        for (let index = value.length - 1; index >= 0; index -= 1) {
          const child = value[index];
          if (child && typeof child.type === "string") {
            stack.push({ node: child, parent: node });
          }
        }
      } else if (value && typeof value.type === "string") {
        stack.push({ node: value, parent: node });
      }
    }
  }
}

function analyzeAst(code) {
  const findings = [];
  let ast;

  try {
    ast = espree.parse(String(code || ""), {
      ecmaVersion: "latest",
      sourceType: "module",
      loc: true,
      range: true,
      ecmaFeatures: { jsx: true },
    });
  } catch {
    return findings;
  }

  const declared = new Map();

  traverseAst(ast, (node, parent) => {
    if (node.type === "VariableDeclarator" && node.id?.type === "Identifier") {
      declared.set(node.id.name, {
        line: normalizeLine(node.id.loc?.start?.line),
        used: false,
      });
    }

    if (node.type === "Identifier") {
      const parentType = parent?.type;
      const isDeclarationName =
        parentType === "VariableDeclarator" && parent.id === node ||
        parentType === "FunctionDeclaration" && parent.id === node ||
        parentType === "FunctionExpression" && parent.id === node ||
        parentType === "ClassDeclaration" && parent.id === node ||
        parentType === "ImportSpecifier" ||
        parentType === "ImportDefaultSpecifier" ||
        parentType === "ImportNamespaceSpecifier";

      const isPropertyName =
        (parentType === "MemberExpression" && parent.property === node && !parent.computed) ||
        (parentType === "Property" && parent.key === node && !parent.computed);

      if (!isDeclarationName && !isPropertyName) {
        const info = declared.get(node.name);
        if (info) {
          info.used = true;
        }
      }
    }

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      if (node.async) {
        let hasAwait = false;
        traverseAst(node.body, (child) => {
          if (child.type === "AwaitExpression") {
            hasAwait = true;
          }
        });

        if (!hasAwait) {
          findings.push({
            line: normalizeLine(node.loc?.start?.line),
            rule: "async-without-await",
            message: "Async function has no await and may be returning too early.",
          });
        }
      }

      if (node.body?.type === "BlockStatement" && Array.isArray(node.body.body)) {
        const bodyStatements = node.body.body;

        for (let index = 0; index < bodyStatements.length; index += 1) {
          if (bodyStatements[index].type === "ReturnStatement" && index < bodyStatements.length - 1) {
            findings.push({
              line: normalizeLine(bodyStatements[index + 1]?.loc?.start?.line),
              rule: "unreachable-code-after-return",
              message: "Code after return will never run.",
            });
            break;
          }
        }

        const hasBranchReturn = bodyStatements.some((statement) => statement.type === "ReturnStatement");
        const lastStatement = bodyStatements[bodyStatements.length - 1];
        if (
          hasBranchReturn &&
          lastStatement &&
          lastStatement.type !== "ReturnStatement" &&
          lastStatement.type !== "ThrowStatement"
        ) {
          findings.push({
            line: normalizeLine(node.loc?.start?.line),
            rule: "missing-return-path",
            message: "Function may miss a return path on some branches.",
          });
        }
      }
    }

    if (node.type === "MemberExpression" && !node.optional) {
      const shouldFlagNestedAccess =
        node.computed ||
        node.object?.type === "MemberExpression" ||
        node.object?.type === "CallExpression";

      if (!shouldFlagNestedAccess) {
        return;
      }

      findings.push({
        line: normalizeLine(node.loc?.start?.line),
        rule: "missing-null-check",
        message: "Object or array access without optional chaining or a null check may crash.",
      });
    }
  });

  for (const [name, info] of declared.entries()) {
    if (!info.used) {
      findings.push({
        line: info.line,
        rule: "unused-variable",
        message: `Variable ${name} is declared but never used.`,
      });
    }
  }

  return findings;
}

async function runPythonLint(tempFile) {
  try {
    const { stdout } = await execAsync(`pylint "${tempFile}" --output-format=json`, {
      maxBuffer: 10 * 1024 * 1024,
    });
    return parsePylint(stdout);
  } catch (err) {
    return parsePylint(err?.stdout || "");
  }
}

async function runGoVet(tempFile) {
  try {
    const { stdout } = await execAsync(`go vet "${tempFile}"`, {
      maxBuffer: 10 * 1024 * 1024,
    });
    return parseGoVet(stdout);
  } catch (err) {
    return parseGoVet(`${err?.stdout || ""}\n${err?.stderr || ""}`);
  }
}

function parseGeminiBugJson(raw) {
  const match = String(raw || "").match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeFindings(staticReport, geminiReport) {
  const merged = new Map();

  for (const item of staticReport) {
    if (!item?.line) {
      continue;
    }

    merged.set(item.line, {
      line: item.line,
      severity: "medium",
      message: item.message,
      suggestion: "Review this logic and confirm the branch is correct.",
    });
  }

  for (const item of geminiReport) {
    if (!item?.line) {
      continue;
    }

    merged.set(item.line, {
      line: item.line,
      severity: item.severity || "medium",
      message: item.message || "Possible logical bug detected.",
      suggestion: item.suggestion || "Review edge cases and control flow.",
    });
  }

  return Array.from(merged.values());
}

async function askGemini(language, bugStaticReport, snippets) {
  if (!process.env.GEMINI_API_KEY || bugStaticReport.length === 0 || snippets.length === 0) {
    return [];
  }

  const prompt = `Analyze these suspicious code snippets for logical bugs only.

Focus on:
- wrong conditions
- off-by-one errors
- async/await misuse
- assignment vs comparison mistakes
- edge cases (empty arrays, zero, negatives)
- race conditions

Return ONLY JSON:
[{
  "line": number,
  "severity": "low" | "medium" | "high",
  "message": string,
  "suggestion": string
}]

Language: ${language}

bugStaticReport:
${JSON.stringify(bugStaticReport, null, 2)}

suspicious snippets:
${JSON.stringify(snippets, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return parseGeminiBugJson(response.text);
  } catch {
    return [];
  }
}

export async function bugAgent(code, language) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "codementor-bug-"));
  const tempFile = path.join(tempDir, `${crypto.randomUUID()}${getExtension(language)}`);

  try {
    await writeFile(tempFile, String(code || ""), "utf8");

    let staticReport = [];
    const normalizedLanguage = (language || "").toLowerCase();

    if (normalizedLanguage === "javascript" || normalizedLanguage === "typescript" || normalizedLanguage === "jsx" || normalizedLanguage === "tsx") {
      const [lintReport, astReport] = await Promise.all([
        runJavaScriptLint(code, language, tempFile),
        Promise.resolve(analyzeAst(code)),
      ]);
      staticReport = dedupeByLine([...lintReport, ...astReport]);
    } else if (normalizedLanguage === "python") {
      staticReport = dedupeByLine(await runPythonLint(tempFile));
    } else if (normalizedLanguage === "go") {
      staticReport = dedupeByLine(await runGoVet(tempFile));
    } else {
      staticReport = dedupeByLine(analyzeAst(code));
    }

    const snippets = extractSnippets(code, staticReport);
    const geminiReport = await askGemini(language, staticReport, snippets);

    return mergeFindings(staticReport, geminiReport);
  } catch {
    return [];
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}