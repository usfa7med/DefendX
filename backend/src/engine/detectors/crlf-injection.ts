import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const CRLF_PATTERNS = [
  /%0d%0a/i,
  /%0d/i,
  /%0a/i,
  /\r\n/,
  /\r/,
  /\n/,
  /%0D%0A/i,
  /\\r\\n/,
];

function getCrlfTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  targets.push({ value: req.path, field: "path", source: "request" });
  if (req.query_string) {
    targets.push({ value: req.query_string, field: "query_string", source: "query" });
  }
  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      targets.push({ value: val, field: key, source: "query" });
    }
  }
  for (const [key, val] of Object.entries(req.headers)) {
    targets.push({ value: val, field: key, source: "header" });
  }
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      targets.push({ value: val, field: key, source: "body" });
    }
  }
  return targets;
}

export function detectCrlfInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getCrlfTargets(req);

  for (const target of targets) {
    for (const pattern of CRLF_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "CRLF Injection",
          severity: "high",
          score: 40,
          source: target.source,
          field_name: target.field,
          matched_value: pattern.source.substring(0, 30),
        });
        break;
      }
    }
  }

  return results;
}
