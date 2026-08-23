import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

export function detectInvalidHttpMethod(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const valid = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT"];
  if (!valid.includes(req.method.toUpperCase())) {
    results.push({
      detector_name: "Invalid HTTP Method",
      severity: "medium",
      score: 10,
      source: "request_layer",
      field_name: "method",
      matched_value: req.method,
    });
  }
  if (req.method.toUpperCase() === "TRACE" || req.method.toUpperCase() === "CONNECT") {
    results.push({
      detector_name: "Invalid HTTP Method",
      severity: "high",
      score: 20,
      source: "request_layer",
      field_name: "method",
      matched_value: req.method,
    });
  }
  return results;
}

export function detectLargeRequestSize(req: NormalizedRequest): DetectorResult[] {
  if (req.request_size > 10 * 1024 * 1024) {
    return [{
      detector_name: "Large Request Size",
      severity: "high",
      score: 15,
      source: "request_layer",
      field_name: "request_size",
      matched_value: String(req.request_size),
    }];
  }
  if (req.request_size > 1 * 1024 * 1024) {
    return [{
      detector_name: "Large Request Size",
      severity: "medium",
      score: 10,
      source: "request_layer",
      field_name: "request_size",
      matched_value: String(req.request_size),
    }];
  }
  return [];
}

export function detectMissingUserAgent(req: NormalizedRequest): DetectorResult[] {
  if (!req.user_agent || req.user_agent.trim() === "") {
    return [{
      detector_name: "Missing User-Agent",
      severity: "low",
      score: 5,
      source: "request_layer",
      field_name: "user_agent",
      matched_value: "(empty)",
    }];
  }
  return [];
}

export function detectSuspiciousUserAgent(req: NormalizedRequest): DetectorResult[] {
  const ua = (req.user_agent || "").toLowerCase();
  const suspiciousPatterns = [
    /\b(sqlmap|nikto|nmap|masscan|dirbuster|gobuster|wfuzz|ffuf|havij|acunetix|nessus|openvas)\b/,
    /\b(curl|wget|python-requests|go-http|java\/|perl\/|ruby\/|php\/)\b/,
    /\b(headlesschrome|phantomjs|selenium|puppeteer)\b/,
    /\b(scanner|bot|spider|crawler|harvest)\b/,
    /bot.*bot/,
  ];
  for (const pattern of suspiciousPatterns) {
    const match = ua.match(pattern);
    if (match) {
      return [{
        detector_name: "Suspicious User-Agent",
        severity: "medium",
        score: 20,
        source: "request_layer",
        field_name: "user_agent",
        matched_value: match[0],
      }];
    }
  }
  return [];
}

export function detectSuspiciousHost(req: NormalizedRequest): DetectorResult[] {
  const host = (req.host || "").toLowerCase();
  const suspicious = [
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    /localhost/,
    /internal/,
    /\.corp$/,
  ];
  for (const pattern of suspicious) {
    if (pattern.test(host)) {
      return [{
        detector_name: "Suspicious Host Header",
        severity: "medium",
        score: 15,
        source: "request_layer",
        field_name: "host",
        matched_value: req.host,
      }];
    }
  }
  return [];
}

export function detectTooManyHeaders(req: NormalizedRequest): DetectorResult[] {
  const headerCount = Object.keys(req.headers).length;
  if (headerCount > 50) {
    return [{
      detector_name: "Too Many Headers",
      severity: "high",
      score: 15,
      source: "request_layer",
      field_name: "headers",
      matched_value: String(headerCount),
    }];
  }
  if (headerCount > 30) {
    return [{
      detector_name: "Too Many Headers",
      severity: "medium",
      score: 10,
      source: "request_layer",
      field_name: "headers",
      matched_value: String(headerCount),
    }];
  }
  return [];
}

export function detectDuplicateHeaders(req: NormalizedRequest): DetectorResult[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const key of Object.keys(req.headers)) {
    if (seen.has(key)) {
      duplicates.push(key);
    }
    seen.add(key);
  }
  if (duplicates.length > 0) {
    return [{
      detector_name: "Duplicate Headers",
      severity: "medium",
      score: 10,
      source: "request_layer",
      field_name: "headers",
      matched_value: duplicates.join(", "),
    }];
  }
  return [];
}
