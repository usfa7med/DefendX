import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const REDIRECT_PARAMS = [
  "redirect", "redirect_uri", "redirect_url", "return", "return_to",
  "next", "next_url", "url", "go", "goto", "continue", "target",
  "dest", "destination", "redir", "return_url", "checkout_url",
];

const SUSPICIOUS_DOMAINS = [
  /evil\.com/i,
  /attacker\.com/i,
  /malicious/i,
  /phishing/i,
];

function getRedirectTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      if (REDIRECT_PARAMS.includes(key.toLowerCase())) {
        targets.push({ value: val, field: key, source: "query" });
      }
    }
  }
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      if (REDIRECT_PARAMS.includes(key.toLowerCase())) {
        targets.push({ value: val, field: key, source: "body" });
      }
    }
  }
  return targets;
}

export function detectOpenRedirect(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getRedirectTargets(req);

  for (const target of targets) {
    const url = target.value;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const host = req.host || "";
        if (parsed.hostname !== host && !host.endsWith(parsed.hostname)) {
          results.push({
            detector_name: "Open Redirect",
            severity: "high",
            score: 40,
            source: target.source,
            field_name: target.field,
            matched_value: url,
          });
        }
      }
    } catch {

      for (const pattern of SUSPICIOUS_DOMAINS) {
        if (pattern.test(url)) {
          results.push({
            detector_name: "Open Redirect",
            severity: "high",
            score: 40,
            source: target.source,
            field_name: target.field,
            matched_value: url,
          });
          break;
        }
      }
    }
  }

  return results;
}
