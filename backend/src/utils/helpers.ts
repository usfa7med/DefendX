import { v4 as uuidv4 } from "uuid";

export function generateId(): string {
  return uuidv4();
}

export function now(): Date {
  return new Date();
}

export function sanitizeString(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export function parseQueryString(qs: string): Record<string, string> {
  if (!qs) return {};
  const params: Record<string, string> = {};
  const pairs = qs.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  }
  return params;
}

export function parseHeaders(headers: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

export function calculateBanDuration(offenseCount: number): number | null {
  if (offenseCount >= 4) return null;
  const durations = [10 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
  return durations[offenseCount - 1] ?? durations[durations.length - 1];
}

export function getActionFromScore(score: number): string {
  if (score >= 81) return "permanent_ban";
  if (score >= 61) return "temporary_ban";
  if (score >= 41) return "soft_rate_limit";
  if (score >= 21) return "warning";
  return "log";
}
