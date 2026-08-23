import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";
import { BRUTE_FORCE_THRESHOLD, CREDENTIAL_STUFFING_THRESHOLD, ACCOUNT_ENUM_THRESHOLD, PASSWORD_SPRAY_THRESHOLD } from "../../config/detectors.js";

const loginAttempts = new Map<string, { paths: Map<string, number>; timestamps: number[] }>();

export function detectAuthAttacks(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();
  const ip = req.ip;

  const loginPaths = ["/login", "/signin", "/auth", "/api/login", "/api/auth", "/api/signin", "/wp-login.php"];
  const isLoginAttempt = loginPaths.some((p) => path.includes(p)) && method === "POST";

  if (!isLoginAttempt) return results;

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { paths: new Map(), timestamps: [] });
  }

  const entry = loginAttempts.get(ip)!;
  entry.timestamps.push(Date.now());
  entry.paths.set(path, (entry.paths.get(path) || 0) + 1);

  const recentTimestamps = entry.timestamps.filter((t) => Date.now() - t < 15 * 60 * 1000);
  entry.timestamps = recentTimestamps;


  if (recentTimestamps.length >= BRUTE_FORCE_THRESHOLD) {
    results.push({
      detector_name: "Brute Force",
      severity: "high",
      score: 40,
      source: "auth_attacks",
      field_name: "ip",
      matched_value: `${recentTimestamps.length} login attempts in 15min`,
    });
  }


  if (entry.paths.size >= 3 && recentTimestamps.length >= CREDENTIAL_STUFFING_THRESHOLD) {
    results.push({
      detector_name: "Credential Stuffing",
      severity: "high",
      score: 40,
      source: "auth_attacks",
      field_name: "ip",
      matched_value: `${recentTimestamps.length} attempts across ${entry.paths.size} paths`,
    });
  }


  const uniquePaths = new Set(entry.paths.keys());
  if (recentTimestamps.length >= ACCOUNT_ENUM_THRESHOLD && entry.paths.size >= 2) {
    results.push({
      detector_name: "Account Enumeration",
      severity: "medium",
      score: 30,
      source: "auth_attacks",
      field_name: "ip",
      matched_value: `Multiple login paths accessed: ${[...uniquePaths].join(", ")}`,
    });
  }


  if (recentTimestamps.length >= PASSWORD_SPRAY_THRESHOLD && recentTimestamps.length < BRUTE_FORCE_THRESHOLD * 2) {
    const timeSpread = recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0];
    if (timeSpread > 5 * 60 * 1000) {
      results.push({
        detector_name: "Password Spraying",
        severity: "high",
        score: 35,
        source: "auth_attacks",
        field_name: "ip",
        matched_value: `${recentTimestamps.length} attempts over ${Math.round(timeSpread / 60000)}min`,
      });
    }
  }

  return results;
}
