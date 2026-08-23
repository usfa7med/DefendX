import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onfocus\s*=/i,
  /onmouseover\s*=/i,
  /onsubmit\s*=/i,
  /onchange\s*=/i,
  /onkeyup\s*=/i,
  /onkeydown\s*=/i,
  /onmouseout\s*=/i,
  /<iframe[\s>]/i,
  /<embed[\s>]/i,
  /<object[\s>]/i,
  /<svg[\s/]/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /document\.write/i,
  /document\.location/i,
  /window\.location/i,
  /alert\s*\(/i,
  /confirm\s*\(/i,
  /prompt\s*\(/i,
  /<img[^>]+onerror/i,
  /<body[^>]+onload/i,
  /expression\s*\(/i,
  /-moz-binding\s*:/i,
  /data\s*:\s*text\/html/i,
];

function getXssTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  const fullUrl = `${req.path}?${req.query_string || ""}`;
  targets.push({ value: fullUrl, field: "url", source: "query" });
  for (const [key, val] of Object.entries(req.headers)) {
    targets.push({ value: val, field: key, source: "header" });
  }
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
  for (const [key, val] of Object.entries(req.cookies)) {
    targets.push({ value: val, field: key, source: "cookie" });
  }
  return targets;
}

export function detectXss(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getXssTargets(req);

  for (const target of targets) {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "XSS",
          severity: "critical",
          score: 50,
          source: target.source,
          field_name: target.field,
          matched_value: pattern.source.substring(0, 50),
        });
        break;
      }
    }
  }

  return results;
}
