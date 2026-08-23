import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const LDAP_PATTERNS = [
  /\*\)/,
  /\(\|/,
  /\(&/,
  /uid=/,
  /cn=/,
  /objectClass=/,
  /adminRole/,
  /\(\!\(/,
];

function getLdapTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
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

export function detectLdapInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getLdapTargets(req);

  for (const target of targets) {
    for (const pattern of LDAP_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "LDAP Injection",
          severity: "critical",
          score: 50,
          source: target.source,
          field_name: target.field,
          matched_value: pattern.source,
        });
        break;
      }
    }
  }

  return results;
}
