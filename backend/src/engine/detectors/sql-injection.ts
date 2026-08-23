import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const SQL_PATTERNS = [
  { pattern: /union\s+(all\s+)?select/i, name: "UNION SELECT" },
  { pattern: /or\s+[\d'"]+=\s*[\d'"]/i, name: "OR 1=1" },
  { pattern: /and\s+[\d'"]+=\s*[\d'"]/i, name: "AND 1=1" },
  { pattern: /waitfor\s+delay/i, name: "WAITFOR DELAY" },
  { pattern: /sleep\s*\(/i, name: "SLEEP()" },
  { pattern: /xp_cmdshell/i, name: "xp_cmdshell" },
  { pattern: /information_schema/i, name: "information_schema" },
  { pattern: /load_file\s*\(/i, name: "load_file()" },
  { pattern: /into\s+outfile/i, name: "INTO OUTFILE" },
  { pattern: /drop\s+table/i, name: "DROP TABLE" },
  { pattern: /delete\s+from/i, name: "DELETE FROM" },
  { pattern: /insert\s+into/i, name: "INSERT INTO" },
  { pattern: /update\s+\w+\s+set/i, name: "UPDATE SET" },
  { pattern: /select\s+.*\s+from/i, name: "SELECT FROM" },
  { pattern: /\*.*\*\/\//i, name: "SQL comment" },
  { pattern: /benchmark\s*\(/i, name: "BENCHMARK()" },
  { pattern: /extractvalue\s*\(/i, name: "EXTRACTVALUE()" },
  { pattern: /updatexml\s*\(/i, name: "UPDATEXML()" },
  { pattern: /floor\s*\(\s*rand/i, name: "FLOOR(RAND)" },
  { pattern: /order\s+by\s+\d+/i, name: "ORDER BY" },
  { pattern: /;\s*drop/i, name: "; DROP" },
  { pattern: /;\s*delete/i, name: "; DELETE" },
  { pattern: /;\s*update/i, name: "; UPDATE" },
  { pattern: /;\s*insert/i, name: "; INSERT" },
  { pattern: /char\s*\(/i, name: "CHAR()" },
  { pattern: /concat\s*\(/i, name: "CONCAT()" },
];

function getInjectionTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
  const targets: Array<{ value: string; field: string; source: string }> = [];
  const fullUrl = `${req.path}?${req.query_string || ""}`;
  targets.push({ value: fullUrl, field: "url", source: "query" });
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

export function detectSqlInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getInjectionTargets(req);

  for (const target of targets) {
    for (const { pattern, name } of SQL_PATTERNS) {
      if (pattern.test(target.value)) {
        results.push({
          detector_name: "SQL Injection",
          severity: "critical",
          score: 50,
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
