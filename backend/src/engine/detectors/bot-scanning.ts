import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const SCANNER_PATHS = [
  /\/admin/i,
  /\/phpmyadmin/i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/xmlrpc/i,
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/\.aws/i,
  /\/\.htaccess/i,
  /\/backup/i,
  /\/dump/i,
  /\/sql/i,
  /\/config/i,
  /\/test/i,
  /\/debug/i,
  /\/api\/docs/i,
  /\/swagger/i,
  /\/api\/v[12]/i,
];

const SCANNER_QUERY_PARAMS = [
  /debug\s*=/i,
  /test\s*=/i,
  /cmd\s*=/i,
  /exec\s*=/i,
  /command\s*=/i,
  /db\s*=/i,
  /pass\s*=/i,
  /pw\s*=/i,
  /sql\s*=/i,
  /phpinfo/i,
];

const SCANNER_USER_AGENTS = [
  /\b(acunetix|appscan|arachni|burp|grendel|havij|netsparker|paros|vega|w3af|zap)\b/i,
  /\b(nessus|openvas|qualys|retina|coreimpact|nexpose)\b/i,
  /\b(webinspect|fortify|checkmarx|veracode)\b/i,
  /\b(siteimprove|majestic|archive\.org|heritrix)\b/i,
  /\b(scan|scanner|audit|crawl|spider|robot)\b/i,
  /\b(Ahrefs|SEMrush|Moz|Majestic|Screaming\s*Frog|DeepCrawl)\b/i,
  /\b(Baiduspider|YandexBot|Sogou|Exabot)\b/i,
];

const COMMON_SCANNER_METHODS = ["OPTIONS", "TRACE", "CONNECT", "PATCH"];

export function detectBotScanning(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const path = req.path.toLowerCase();
  const fullUrl = `${req.path}?${req.query_string || ""}`;


  for (const pattern of SCANNER_PATHS) {
    if (pattern.test(path)) {
      results.push({
        detector_name: "Bot Scanning",
        severity: "medium",
        score: 20,
        source: "path_analysis",
        field_name: "path",
        matched_value: `Scanner path: ${pattern.source.substring(0, 40)}`,
      });
      break;
    }
  }


  if (req.query_string) {
    for (const pattern of SCANNER_QUERY_PARAMS) {
      if (pattern.test(req.query_string)) {
        results.push({
          detector_name: "Bot Scanning",
          severity: "medium",
          score: 20,
          source: "query",
          field_name: "query_string",
          matched_value: `Scanner param: ${pattern.source.substring(0, 30)}`,
        });
        break;
      }
    }
  }


  const ua = (req.user_agent || "").toLowerCase();
  for (const pattern of SCANNER_USER_AGENTS) {
    if (pattern.test(ua)) {
      results.push({
        detector_name: "Bot Scanning",
        severity: "medium",
        score: 20,
        source: "user_agent",
        field_name: "user_agent",
        matched_value: `Scanner UA: ${pattern.source.substring(0, 40)}`,
      });
      break;
    }
  }


  if (COMMON_SCANNER_METHODS.includes(req.method.toUpperCase())) {
    results.push({
      detector_name: "Bot Scanning",
      severity: "low",
      score: 10,
      source: "request_layer",
      field_name: "method",
      matched_value: `Scanner method: ${req.method}`,
    });
  }


  const numericSegmentPattern = /\/\d{3,}(\/|$)/;
  if (numericSegmentPattern.test(path)) {
    results.push({
      detector_name: "Bot Scanning",
      severity: "low",
      score: 10,
      source: "path_analysis",
      field_name: "path",
      matched_value: "Numeric enumeration pattern",
    });
  }


  const scannerExtensions = /\.(asp|aspx|jsp|cgi|pl|py|rb|php\d?|do|action)$/i;
  if (scannerExtensions.test(path) && !path.includes(".")) {
    const extMatch = path.match(scannerExtensions);
    if (extMatch) {
      results.push({
        detector_name: "Bot Scanning",
        severity: "low",
        score: 10,
        source: "path_analysis",
        field_name: "path",
        matched_value: `Scanner extension: ${extMatch[0]}`,
      });
    }
  }


  const hasReferer = Object.keys(req.headers).some((k) => k.toLowerCase() === "referer");
  if (!hasReferer && req.path !== "/" && !req.path.startsWith("/api/")) {


  }

  return results;
}
