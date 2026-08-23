import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const SESSION_COOKIE_NAMES = [
  /^session/i,
  /^sid/i,
  /^token/i,
  /^jwt/i,
  /^auth/i,
  /^connect\.sid/i,
  /^PHPSESSID/i,
  /^JSESSIONID/i,
  /^ASP\.NET_SessionId/i,
  /^laravel_session/i,
  /^ci_session/i,
  /^symfony/i,
  /^wordpress_logged_in/i,
  /^wp.?session/i,
];

const JWT_PATTERN = /^eyJ[A-Za-z0-9+/=_-]+\.eyJ[A-Za-z0-9+/=_-]+\.[A-Za-z0-9+/=_-]+$/;

const SUSPICIOUS_TOKEN_PATTERNS = [
  /^admin$/i,
  /^root$/i,
  /^test$/i,
  /^12345/,
  /^abcde/,
  /^aaaaaa/,
  /^(0+)$/,
];

const AUTH_PATHS = [
  "/admin", "/dashboard", "/account", "/profile",
  "/api/user", "/api/admin", "/settings", "/checkout",
  "/orders", "/payment",
];

export function detectSessionAbuse(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const cookies = req.cookies;
  const cookieEntries = Object.entries(cookies);

  if (cookieEntries.length === 0) {

    const isAuthPath = AUTH_PATHS.some((p) => req.path.toLowerCase().startsWith(p));
    if (isAuthPath) {
      results.push({
        detector_name: "Session Abuse",
        severity: "low",
        score: 5,
        source: "session",
        field_name: "cookies",
        matched_value: "No session cookies on authenticated path",
      });
    }
    return results;
  }

  const isAuthPath = AUTH_PATHS.some((p) => req.path.toLowerCase().startsWith(p));

  for (const [key, value] of cookieEntries) {
    const isSessionCookie = SESSION_COOKIE_NAMES.some((p) => p.test(key));

    if (!isSessionCookie) continue;


    if (JWT_PATTERN.test(value)) {
      const parts = value.split(".");
      let decodedPayload = "";
      try {
        decodedPayload = Buffer.from(parts[1], "base64url").toString("utf-8");
      } catch {
        decodedPayload = "";
      }


      if (decodedPayload.includes('"role":"admin"') || decodedPayload.includes('"admin":true')) {
        results.push({
          detector_name: "Session Abuse",
          severity: "critical",
          score: 60,
          source: "session",
          field_name: key,
          matched_value: "JWT privilege escalation attempt",
        });
      }


      const header = Buffer.from(parts[0], "base64url").toString("utf-8");
      if (header.includes('"alg":"none"') || header.includes('"alg":"None"')) {
        results.push({
          detector_name: "Session Abuse",
          severity: "critical",
          score: 60,
          source: "session",
          field_name: key,
          matched_value: "JWT none-algorithm attack",
        });
      }

      continue;
    }


    for (const pattern of SUSPICIOUS_TOKEN_PATTERNS) {
      if (pattern.test(value)) {
        results.push({
          detector_name: "Session Abuse",
          severity: "high",
          score: 40,
          source: "session",
          field_name: key,
          matched_value: `Weak session token: ${value.substring(0, 20)}`,
        });
        break;
      }
    }


    if (value.length < 8) {
      results.push({
        detector_name: "Session Abuse",
        severity: "high",
        score: 35,
        source: "session",
        field_name: key,
        matched_value: `Short session token (${value.length} chars)`,
      });
    }


    if (value.length > 2048) {
      results.push({
        detector_name: "Session Abuse",
        severity: "high",
        score: 30,
        source: "session",
        field_name: key,
        matched_value: `Oversized session token (${value.length} chars)`,
      });
    }


    if (/[<>"'\\;()&|]/.test(value)) {

      results.push({
        detector_name: "Session Abuse",
        severity: "high",
        score: 40,
        source: "session",
        field_name: key,
        matched_value: "Session token with injection characters",
      });
    }


    if (isAuthPath && (!value || value.trim() === "")) {
      results.push({
        detector_name: "Session Abuse",
        severity: "medium",
        score: 20,
        source: "session",
        field_name: key,
        matched_value: "Empty session on authenticated path",
      });
    }
  }

  return results;
}
