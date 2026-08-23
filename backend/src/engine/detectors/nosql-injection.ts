import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const NOSQL_PATTERNS = [
  /\$ne/,
  /\$gt/,
  /\$lt/,
  /\$gte/,
  /\$lte/,
  /\$in/,
  /\$nin/,
  /\$exists/,
  /\$regex/,
  /\$where/i,
  /\$and/,
  /\$or/,
  /\$not/,
  /\$nor/,
  /\$expr/,
  /\$elemMatch/,
  /\$all/,
];

function getNoSqlTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  if (req.body) {
    for (const [key, val] of Object.entries(req.body)) {
      const strVal = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val);
      targets.push({ value: `${key}:${strVal}`, field: key, source: "body" });
    }
  }
  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      const strVal = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val);
      targets.push({ value: `${key}:${strVal}`, field: key, source: "query" });
    }
  }
  return targets;
}

export function detectNoSqlInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getNoSqlTargets(req);

  for (const target of targets) {
    for (const pattern of NOSQL_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "NoSQL Injection",
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
