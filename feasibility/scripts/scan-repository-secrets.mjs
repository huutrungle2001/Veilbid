import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const outputPath = resolve(
  repositoryRoot,
  "evidence/local/secret-scan.json",
);

const patterns = [
  {
    code: "PRIVATE_KEY_ASSIGNMENT",
    expression:
      /\b(?:SEPOLIA_(?:VENDOR_)?PRIVATE_KEY|FINALIZER_PRIVATE_KEY|PRIVATE_KEY)\s*[:=]\s*["']?0x?[0-9a-fA-F]{64}\b/,
  },
  {
    code: "SEED_ASSIGNMENT",
    expression:
      /\b(?:MNEMONIC|SEED_PHRASE)\s*[:=]\s*["']?(?!your_|optional_|test_)[^\s"']+(?:\s+[^\s"']+){5,}/i,
  },
  {
    code: "PEM_PRIVATE_KEY",
    expression: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    code: "GITHUB_TOKEN",
    expression: /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}\b/,
  },
  {
    code: "SERVICE_TOKEN",
    expression:
      /\b(?:sk_(?:live|prod)_|sk-proj-|xox[baprs]-)[A-Za-z0-9_-]{16,}\b/,
  },
  {
    code: "CREDENTIAL_IN_URL",
    expression: /\bhttps?:\/\/[^/\s:@]+:[^@\s/]+@/i,
  },
];

const evidence = {
  schemaVersion: 1,
  suite: "repository-secret-scan",
  recordedAt: new Date().toISOString(),
  publicIdentifiers: {
    sourceCommit: null,
    trackedFilesInspected: 0,
  },
  assertions: {
    localEnvironmentUntracked: false,
    noPrivateKeyAssignments: false,
    noSeedOrPemMaterial: false,
    noProviderTokens: false,
    noCredentialUrls: false,
  },
  violations: [],
  notes: [
    "Only Git-tracked regular text files are inspected; ignored local environment files are checked for accidental tracking by path.",
    "Violation output contains rule codes and paths only, never matched secret-like values.",
  ],
};

function git(args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

function saveEvidence() {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
    mode: 0o600,
  });
}

try {
  evidence.publicIdentifiers.sourceCommit = git([
    "rev-parse",
    "HEAD",
  ]).trim();
  const trackedFiles = git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
  evidence.publicIdentifiers.trackedFilesInspected =
    trackedFiles.length;
  evidence.assertions.localEnvironmentUntracked =
    !trackedFiles.includes(".env.local");

  const seen = new Set();
  for (const relativePath of trackedFiles) {
    let source;
    try {
      source = readFileSync(
        resolve(repositoryRoot, relativePath),
        "utf8",
      );
    } catch {
      continue;
    }
    if (source.includes("\0")) continue;
    for (const pattern of patterns) {
      if (pattern.expression.test(source)) {
        const key = `${pattern.code}:${relativePath}`;
        if (!seen.has(key)) {
          seen.add(key);
          evidence.violations.push({
            code: pattern.code,
            path: relativePath,
          });
        }
      }
    }
  }

  const violationCodes = new Set(
    evidence.violations.map((violation) => violation.code),
  );
  evidence.assertions.noPrivateKeyAssignments =
    !violationCodes.has("PRIVATE_KEY_ASSIGNMENT");
  evidence.assertions.noSeedOrPemMaterial =
    !violationCodes.has("SEED_ASSIGNMENT") &&
    !violationCodes.has("PEM_PRIVATE_KEY");
  evidence.assertions.noProviderTokens =
    !violationCodes.has("GITHUB_TOKEN") &&
    !violationCodes.has("SERVICE_TOKEN");
  evidence.assertions.noCredentialUrls =
    !violationCodes.has("CREDENTIAL_IN_URL");

  saveEvidence();
  if (
    !Object.values(evidence.assertions).every(Boolean) ||
    evidence.violations.length > 0
  ) {
    console.error(
      JSON.stringify({
        evidence: "evidence/local/secret-scan.json",
        violations: evidence.violations,
      }),
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify({
        evidence: "evidence/local/secret-scan.json",
        assertions: evidence.assertions,
        trackedFilesInspected:
          evidence.publicIdentifiers.trackedFilesInspected,
      }),
    );
  }
} catch {
  evidence.violations.push({
    code: "SECRET_SCAN_FAILED",
    path: null,
  });
  saveEvidence();
  console.error(
    JSON.stringify({
      evidence: "evidence/local/secret-scan.json",
      violations: evidence.violations,
    }),
  );
  process.exitCode = 1;
}
