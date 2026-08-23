import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";
import { RATE_LIMIT_RPM, RATE_LIMIT_RPS, BURST_THRESHOLD, BURST_WINDOW_MS } from "../../config/detectors.js";

const requestCounts = new Map<string, { rps: number[]; rpm: number[]; timestamps: number[] }>();

function cleanupOldEntries(entries: number[], windowMs: number): number[] {
  const now = Date.now();
  return entries.filter((t) => now - t < windowMs);
}

export function detectRateLimit(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { rps: [], rpm: [], timestamps: [] });
  }

  const entry = requestCounts.get(ip)!;
  entry.timestamps.push(now);


  entry.rps = cleanupOldEntries(entry.rps, 1000);
  entry.rps.push(now);
  if (entry.rps.length > RATE_LIMIT_RPS) {
    results.push({
      detector_name: "Rate Limit - RPS",
      severity: "medium",
      score: 20,
      source: "rate_limiter",
      field_name: "ip",
      matched_value: `${entry.rps.length} req/s`,
    });
  }


  entry.rpm = cleanupOldEntries(entry.rpm, 60000);
  entry.rpm.push(now);
  if (entry.rpm.length > RATE_LIMIT_RPM) {
    results.push({
      detector_name: "Rate Limit - RPM",
      severity: "medium",
      score: 20,
      source: "rate_limiter",
      field_name: "ip",
      matched_value: `${entry.rpm.length} req/min`,
    });
  }


  const recentTimestamps = cleanupOldEntries(entry.timestamps, BURST_WINDOW_MS);
  if (recentTimestamps.length > BURST_THRESHOLD) {
    results.push({
      detector_name: "Burst Traffic",
      severity: "high",
      score: 25,
      source: "rate_limiter",
      field_name: "ip",
      matched_value: `${recentTimestamps.length} requests in ${BURST_WINDOW_MS}ms`,
    });
  }

  return results;
}

export function cleanupRateLimitData(): void {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    entry.rps = cleanupOldEntries(entry.rps, 1000);
    entry.rpm = cleanupOldEntries(entry.rpm, 60000);
    entry.timestamps = cleanupOldEntries(entry.timestamps, 60000);
    if (entry.timestamps.length === 0 && entry.rps.length === 0 && entry.rpm.length === 0) {
      requestCounts.delete(ip);
    }
  }
}


export function startRateLimitCleanup(intervalMs = 60_000): ReturnType<typeof setInterval> {
  return setInterval(cleanupRateLimitData, intervalMs);
}
