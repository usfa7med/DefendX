import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const TEMPLATE_PATTERNS = [
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  /#\{.*\}/,
  /<%=.*%>/,
  /\[\[.*\]\]/,
];

function getTemplateTargets(req: NormalizedRequest): Array<{ value: string; field: string; source: string }> {
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
  return targets;
}

export function detectTemplateInjection(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const targets = getTemplateTargets(req);

  for (const target of targets) {
    for (const pattern of TEMPLATE_PATTERNS) {
      const match = target.value.match(pattern);
      if (match) {
        const expr = match[0];


        results.push({
          detector_name: "Template Injection",
          severity: "critical",
          score: 50,
          source: target.source,
          field_name: target.field,
          matched_value: expr.substring(0, 60),
        });
        break;
      }
    }
  }

  return results;
}
