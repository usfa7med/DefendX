import type { DetectorResult, ActionTaken } from "../utils/types.js";


const ACTION_TABLE: { max: number; action: ActionTaken }[] = [
  { max: 20, action: "log" },
  { max: 40, action: "warning" },
  { max: 60, action: "soft_rate_limit" },
  { max: 80, action: "temporary_ban" },
  { max: Infinity, action: "permanent_ban" },
];

export function calculateRiskScore(detections: DetectorResult[]): {
  totalScore: number;
  action: ActionTaken;
} {
  if (detections.length === 0) {
    return { totalScore: 0, action: "log" };
  }

  const totalScore = detections.reduce((sum, d) => sum + d.score, 0);


  const action = ACTION_TABLE.find((e) => totalScore <= e.max)!.action;

  return { totalScore, action };
}

export function getMostSevereDetection(detections: DetectorResult[]): DetectorResult | null {
  if (detections.length === 0) return null;
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 } as const;
  return detections.reduce((most, current) => {
    if (severityOrder[current.severity] > severityOrder[most.severity]) return current;
    return most;
  });
}


