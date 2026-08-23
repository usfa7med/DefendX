import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const CMD_PATTERNS = [
  { pattern: /;\s*\w+/, name: "Command chaining (;)" },
  { pattern: /\|\s*\w+/, name: "Pipe (|)" },
  { pattern: /&&\s*\w+/, name: "AND (&&)" },
  { pattern: /\|\|\s*\w+/, name: "OR (||)" },
  { pattern: /\$\([^)]+\)/, name: "Command substitution $()" },
  { pattern: /`[^`]+`/, name: "Backtick substitution" },
  { pattern: /\$\{[^}]+\}/, name: "Variable expansion ${}" },
  { pattern: />\s*\/dev\/null/, name: "Redirect to /dev/null" },
  { pattern: /\b(cat|ls|pwd|id|whoami|uname|wget|curl|nc|ncat|bash|sh|python|perl|ruby|php)\b\s/i, name: "Linux command" },
  { pattern: /\b(type|echo|dir|copy|del|net|reg|powershell|cmd)\b\s/i, name: "Windows command" },
];

function getCmdTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  const fullUrl = `${req.path}?${req.query_string || ""}`;
  targets.push({ value: fullUrl, field: "url", source: "query" });
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      targets.push({ value: val, field: key, source: "body" });
    }
  }
  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      targets.push({ value: val, field: key, source: "query" });
    }
  }
  if (req.form_data) {
    for (const [key, val] of Object.entries(req.form_data)) {
      targets.push({ value: val, field: key, source: "form" });
    }
  }
  return targets;
}

export function detectCommandInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getCmdTargets(req);

  for (const target of targets) {
    for (const { pattern, name } of CMD_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "Command Injection",
          severity: "critical",
          score: 60,
          source: target.source,
          field_name: target.field,
          matched_value: name,
        });
        break;
      }
    }
  }

  return results;
}
