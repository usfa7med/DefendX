import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";
import { detectInvalidHttpMethod, detectLargeRequestSize, detectMissingUserAgent, detectSuspiciousUserAgent, detectSuspiciousHost, detectTooManyHeaders, detectDuplicateHeaders } from "./request-layer.js";
import { detectRateLimit } from "./rate-limiter.js";
import { detectAuthAttacks } from "./auth-attacks.js";
import { detectPathTraversal, detectSensitiveFiles, detectAdminPanel, detectBackupFiles, detectConfigFiles } from "./path-analysis.js";
import { detectSqlInjection } from "./sql-injection.js";
import { detectXss } from "./xss.js";
import { detectCommandInjection } from "./command-injection.js";
import { detectSsrf } from "./ssrf.js";
import { detectLdapInjection } from "./ldap-injection.js";
import { detectNoSqlInjection } from "./nosql-injection.js";
import { detectTemplateInjection } from "./template-injection.js";
import { detectXxe } from "./xxe.js";
import { detectCrlfInjection } from "./crlf-injection.js";
import { detectOpenRedirect } from "./open-redirect.js";
import { detectCookieTampering } from "./cookie-tampering.js";
import { detectSessionAbuse } from "./session-abuse.js";
import { detectBotScanning } from "./bot-scanning.js";

export function runAllDetectors(req: NormalizedRequest): DetectorResult[] {
  const allResults: DetectorResult[] = [];

  const detectors = [

    detectInvalidHttpMethod,
    detectLargeRequestSize,
    detectMissingUserAgent,
    detectSuspiciousUserAgent,
    detectSuspiciousHost,
    detectTooManyHeaders,
    detectDuplicateHeaders,

    detectRateLimit,

    detectAuthAttacks,

    detectPathTraversal,
    detectSensitiveFiles,
    detectAdminPanel,
    detectBackupFiles,
    detectConfigFiles,

    detectSqlInjection,
    detectXss,
    detectCommandInjection,
    detectSsrf,
    detectLdapInjection,
    detectNoSqlInjection,
    detectTemplateInjection,
    detectXxe,
    detectCrlfInjection,
    detectOpenRedirect,

    detectCookieTampering,
    detectSessionAbuse,
    detectBotScanning,
  ];

  for (const detector of detectors) {
    try {
      const results = detector(req);
      allResults.push(...results);
    } catch {

    }
  }

  return allResults;
}
