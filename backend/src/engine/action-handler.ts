import { eq, lte, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import type { ActionTaken } from "../utils/types.js";
import { isLocalhost, isPrivateNetwork } from "../utils/ip-utils.js";
import {
  HARD_CODED_TRUSTED_IPS,
  PROTECT_PRIVATE_NETWORKS,
  MAX_BAN_DURATION_MS,
  EXPIRED_BLOCK_CLEANUP_INTERVAL_MS,
} from "../config/protection.js";


const BAN_DURATIONS = [
  10 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
];


export async function handleAction(
  ip: string,
  action: ActionTaken,
  totalScore: number,
  reason: string,
): Promise<ActionTaken> {

  if (isLocalhost(ip)) return "log";
  if (PROTECT_PRIVATE_NETWORKS && isPrivateNetwork(ip)) return "log";
  if (HARD_CODED_TRUSTED_IPS.includes(ip)) return "log";


  if (action === "warning" || action === "soft_rate_limit") {
    await db.insert(schema.incidents).values({
      ip,
      incidentType: action,
      severity: totalScore >= 41 ? "high" : "medium",
      score: totalScore,
      actionTaken: action,
      statusCode: 200,
    });
    return action;
  }

  if (action === "log") return action;


  const alreadyBlocked = await isBlocked(ip);
  if (alreadyBlocked) return "log";


  await applyBan(ip, action, totalScore, reason);

  return action;
}


export async function applyBan(
  ip: string,
  action: ActionTaken,
  totalScore: number,
  reason: string,
): Promise<void> {

  const stats = await db
    .select()
    .from(schema.ipStatistics)
    .where(eq(schema.ipStatistics.ip, ip))
    .limit(1);

  const currentBlocks = stats[0]?.totalBlocks ?? 0;
  const offenseCount = currentBlocks + 1;


  const isPermanent = offenseCount >= 4;

  if (isPermanent) {
    await db
      .insert(schema.blockedIps)
      .values({
        ip,
        reason,
        blockType: "permanent",
        totalOffenses: offenseCount,
        expiresAt: null,
      })
      .onConflictDoUpdate({
        target: schema.blockedIps.ip,
        set: {
          reason,
          blockType: "permanent",
          totalOffenses: offenseCount,
          expiresAt: null,
        },
      });
  } else {
    const idx = Math.min(offenseCount - 1, BAN_DURATIONS.length - 1);
    let durationMs = BAN_DURATIONS[Math.max(0, idx)];


    if (durationMs > MAX_BAN_DURATION_MS) {
      durationMs = MAX_BAN_DURATION_MS;
    }

    const expiresAt = new Date(Date.now() + durationMs);

    await db
      .insert(schema.blockedIps)
      .values({
        ip,
        reason,
        blockType: "temporary",
        totalOffenses: offenseCount,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: schema.blockedIps.ip,
        set: {
          reason,
          blockType: "temporary",
          totalOffenses: offenseCount,
          expiresAt,
        },
      });
  }


  if (stats.length > 0) {
    await db
      .update(schema.ipStatistics)
      .set({
        totalBlocks: currentBlocks + 1,
        totalScore: (stats[0].totalScore ?? 0) + totalScore,
        lastSeen: new Date(),
      })
      .where(eq(schema.ipStatistics.ip, ip));
  } else {
    await db.insert(schema.ipStatistics).values({
      ip,
      totalBlocks: 1,
      totalScore,
      totalRequests: 0,
      failedLogins: 0,
      successfulLogins: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  }


  await db.insert(schema.incidents).values({
    ip,
    incidentType: action,
    severity: totalScore >= 81 ? "critical" : totalScore >= 61 ? "high" : "medium",
    score: totalScore,
    actionTaken: action,
    statusCode: action === "temporary_ban" || action === "permanent_ban" ? 403 : 200,
  });
}


export async function isBlocked(ip: string): Promise<boolean> {
  if (HARD_CODED_TRUSTED_IPS.includes(ip)) return false;
  if (isLocalhost(ip)) return false;

  const result = await db
    .select()
    .from(schema.blockedIps)
    .where(eq(schema.blockedIps.ip, ip))
    .limit(1);

  if (result.length === 0) return false;

  const blocked = result[0];
  if (blocked.blockType === "permanent") return true;


  if (blocked.expiresAt && new Date(blocked.expiresAt) <= new Date()) {
    await db.delete(schema.blockedIps).where(eq(schema.blockedIps.ip, ip));
    return false;
  }

  return true;
}


export async function isWhitelisted(ip: string): Promise<boolean> {
  if (HARD_CODED_TRUSTED_IPS.includes(ip)) return true;
  if (isLocalhost(ip)) return true;

  try {
    const result = await db
      .select()
      .from(schema.whitelist)
      .where(eq(schema.whitelist.ip, ip))
      .limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function addToWhitelist(ip: string, reason?: string, createdBy?: string): Promise<void> {
  try {
    await db
      .insert(schema.whitelist)
      .values({
        ip,
        reason: reason || "Manual whitelist",
        createdBy: createdBy || "admin",
      })
      .onConflictDoNothing();


    await db
      .update(schema.ipStatistics)
      .set({ totalScore: 0 })
      .where(eq(schema.ipStatistics.ip, ip));


    await db.delete(schema.requests).where(eq(schema.requests.ip, ip));
    await db.delete(schema.incidents).where(eq(schema.incidents.ip, ip));
  } catch {
    throw new Error("Whitelist table not available. Run database migration first.");
  }
}

export async function removeFromWhitelist(ip: string): Promise<void> {
  try {
    await db.delete(schema.whitelist).where(eq(schema.whitelist.ip, ip));
  } catch {
    throw new Error("Whitelist table not available. Run database migration first.");
  }
}


export async function cleanupExpiredBlocks(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(schema.blockedIps)
    .where(lte(schema.blockedIps.expiresAt, now))
    .returning({ ip: schema.blockedIps.ip });

  return result.length;
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startExpiredBlockCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(async () => {
    try {
      const count = await cleanupExpiredBlocks();
      if (count > 0) {
        console.log(`[CLEANUP] Unblocked ${count} expired IP(s)`);
      }
    } catch (err) {
      console.error("[CLEANUP] Error cleaning expired blocks:", err);
    }
  }, EXPIRED_BLOCK_CLEANUP_INTERVAL_MS);
}

export function stopExpiredBlockCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
