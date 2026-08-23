import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const SSRF_PATTERNS = [
  { pattern: /169\.254\.169\.254/, name: "AWS metadata endpoint" },
  { pattern: /metadata\.google\.internal/, name: "GCP metadata endpoint" },
  { pattern: /localhost/i, name: "localhost" },
  { pattern: /127\.0\.0\.1/, name: "127.0.0.1" },
  { pattern: /0\.0\.0\.0/, name: "0.0.0.0" },
  { pattern: /\[::1\]/, name: "::1 (IPv6 loopback)" },
  { pattern: /10\.\d+\.\d+\.\d+/, name: "10.x.x.x (private)" },
  { pattern: /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/, name: "172.16-31.x.x (private)" },
  { pattern: /192\.168\.\d+\.\d+/, name: "192.168.x.x (private)" },
  { pattern: /file:\/\//i, name: "file protocol" },
  { pattern: /gopher:\/\//i, name: "gopher protocol" },
  { pattern: /dict:\/\//i, name: "dict protocol" },
  { pattern: /ftp:\/\//i, name: "ftp protocol" },
  { pattern: /internal\./i, name: "internal domain" },
  { pattern: /\.local\b/i, name: ".local domain" },
  { pattern: /\.corp\b/i, name: ".corp domain" },
];

function getSsrfTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  const fullUrl = `${req.path}?${req.query_string || ""}`;
  targets.push({ value: fullUrl, field: "url", source: "query" });
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      if (/url|link|href|redirect|callback|webhook|feed|src|dest|target|proxy/i.test(key)) {
        targets.push({ value: val, field: key, source: "body" });
      }
    }
  }
  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      if (/url|link|href|redirect|callback|webhook|feed|src|dest|target|proxy/i.test(key)) {
        targets.push({ value: val, field: key, source: "query" });
      }
    }
  }
  return targets;
}

export function detectSsrf(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getSsrfTargets(req);

  for (const target of targets) {
    for (const { pattern, name } of SSRF_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "SSRF",
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
