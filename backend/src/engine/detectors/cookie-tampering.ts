import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const MAX_COOKIE_COUNT = 10;
const MAX_COOKIE_LENGTH = 4096;
const MAX_COOKIE_VALUE_LENGTH = 1024;

const SUSPICIOUS_COOKIE_NAMES = [
  /^admin/i,
  /^user.?role/i,
  /^is.?admin/i,
  /^debug/i,
  /^test/i,
  /^php.?[a-z]+/i,
  /^XDEBUG/i,
  /^wp.?[a-z]+/i,
];

const SUSPICIOUS_COOKIE_VALUES = [
  /^admin$/i,
  /^true$/i,
  /^1$/i,
  /^granted$/i,
  /^root$/i,
  /^debug$/i,
];

export function detectCookieTampering(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const cookies = req.cookies;
  const cookieEntries = Object.entries(cookies);

  if (cookieEntries.length === 0) return results;


  if (cookieEntries.length > MAX_COOKIE_COUNT) {
    results.push({
      detector_name: "Cookie Tampering",
      severity: "medium",
      score: 15,
      source: "cookie",
      field_name: "cookie_count",
      matched_value: `${cookieEntries.length} cookies`,
    });
  }


  const totalCookieLength = cookieEntries.reduce((sum, [, val]) => sum + val.length, 0);
  if (totalCookieLength > MAX_COOKIE_LENGTH) {
    results.push({
      detector_name: "Cookie Tampering",
      severity: "high",
      score: 25,
      source: "cookie",
      field_name: "cookie_size",
      matched_value: `${totalCookieLength} bytes`,
    });
  }

  for (const [key, value] of cookieEntries) {

    for (const pattern of SUSPICIOUS_COOKIE_NAMES) {
      if (pattern.test(key)) {
        results.push({
          detector_name: "Cookie Tampering",
          severity: "high",
          score: 30,
          source: "cookie",
          field_name: key,
          matched_value: `Suspicious cookie name: ${key}`,
        });
        break;
      }
    }


    for (const pattern of SUSPICIOUS_COOKIE_VALUES) {
      if (pattern.test(value)) {
        results.push({
          detector_name: "Cookie Tampering",
          severity: "high",
          score: 30,
          source: "cookie",
          field_name: key,
          matched_value: `Suspicious cookie value: ${value}`,
        });
        break;
      }
    }


    if (value.length > MAX_COOKIE_VALUE_LENGTH) {
      results.push({
        detector_name: "Cookie Tampering",
        severity: "medium",
        score: 15,
        source: "cookie",
        field_name: key,
        matched_value: `Cookie value ${value.length} bytes`,
      });
    }


    if (/^[A-Za-z0-9+/=]{50,}$/.test(value)) {
      results.push({
        detector_name: "Cookie Tampering",
        severity: "medium",
        score: 15,
        source: "cookie",
        field_name: key,
        matched_value: "Base64-encoded cookie value",
      });
    }


    if (/^(\{.*\}|\[.*\])$/.test(value.trim())) {
      results.push({
        detector_name: "Cookie Tampering",
        severity: "low",
        score: 10,
        source: "cookie",
        field_name: key,
        matched_value: "JSON-encoded cookie value",
      });
    }
  }

  return results;
}
