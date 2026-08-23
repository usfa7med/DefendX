import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const XXE_PATTERNS = [
  /<!DOCTYPE/i,
  /<!ENTITY/i,
  /SYSTEM\s+["']/i,
  /file:\/\//i,
  /<!ELEMENT/i,
  /<!ATTLIST/i,
  /<!NOTATION/i,
  /&\w+;/,
];

function getXxeTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      targets.push({ value: val, field: key, source: "body" });
    }
  }
  if (req.headers["content-type"]?.includes("xml")) {
    targets.push({ value: JSON.stringify(req.body), field: "xml_body", source: "body" });
  }
  return targets;
}

export function detectXxe(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getXxeTargets(req);

  for (const target of targets) {
    for (const pattern of XXE_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "XXE",
          severity: "critical",
          score: 60,
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
