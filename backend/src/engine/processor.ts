import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { runAllDetectors } from "./detectors/index.js";
import { calculateRiskScore } from "./risk-scorer.js";
import { handleAction, applyBan, isBlocked } from "./action-handler.js";
import type { NormalizedRequest, ProcessedRequest } from "../utils/types.js";
import { generateId } from "../utils/helpers.js";
import {
  IGNORE_KNOWN_BOTS, KNOWN_BOT_PATTERNS,
  ACCUMULATED_SCORE_BAN_THRESHOLD, ACCUMULATED_PERMANENT_MULTIPLIER,
} from "../config/protection.js";


export async function processRequest(req: NormalizedRequest): Promise<ProcessedRequest> {
  const requestId = generateId();


  if (IGNORE_KNOWN_BOTS && req.user_agent) {
    const isKnownBot = KNOWN_BOT_PATTERNS.some((p) => p.test(req.user_agent));
    if (isKnownBot) {
      await storeRequest(req, requestId, 0, "log");
      return { request_id: requestId, detections: [], total_score: 0, action_taken: "log" };
    }
  }


  const detections = runAllDetectors(req);


  const { totalScore, action } = calculateRiskScore(detections);


  await storeRequest(req, requestId, totalScore, action);
  await storeRequestDetails(req, requestId);


  if (detections.length > 0) {
    await db.insert(schema.detections).values(
      detections.map((d) => ({
        requestId,
        detectorName: d.detector_name,
        severity: d.severity,
        score: d.score,
        source: d.source,
        fieldName: d.field_name,
        matchedValue: d.matched_value,
      }))
    );
  }


  const reasons = "Repeat offender";
  const effectiveAction = totalScore > 0
    ? await handleAction(req.ip, action, totalScore, reasons)
    : action;


  if (effectiveAction !== action) {
    await db
      .update(schema.requests)
      .set({ actionTaken: effectiveAction })
      .where(eq(schema.requests.id, requestId));
  }


  const isLoginAttempt = isLoginRequest(req.path, req.method);
  const loginFailed = isLoginAttempt && (req.status_code !== 200 && req.status_code !== undefined);
  const loginSuccess = isLoginAttempt && req.status_code === 200;
  await updateIpStats(req.ip, totalScore, loginFailed, loginSuccess);

  return {
    request_id: requestId,
    detections,
    total_score: totalScore,
    action_taken: effectiveAction,
  };
}


async function storeRequest(
  req: NormalizedRequest,
  requestId: string,
  riskScore: number,
  actionTaken: string,
): Promise<void> {
  await db.insert(schema.requests).values({
    id: requestId,
    ip: req.ip,
    method: req.method,
    path: req.path,
    queryString: req.query_string || null,
    statusCode: req.status_code ?? null,
    userAgent: req.user_agent || null,
    host: req.host || null,
    country: req.country || null,
    city: req.city || null,
    requestSize: req.request_size || 0,
    responseSize: req.response_size ?? null,
    responseTimeMs: req.response_time_ms ?? null,
    riskScore,
    actionTaken,
  });
}


async function storeRequestDetails(
  req: NormalizedRequest,
  requestId: string,
): Promise<void> {
  const inserts: Promise<any>[] = [];


  const headerEntries = Object.entries(req.headers);
  if (headerEntries.length > 0) {
    inserts.push(
      db.insert(schema.requestHeaders).values(
        headerEntries.map(([key, value]) => ({ requestId, key, value }))
      )
    );
  }


  const cookieEntries = Object.entries(req.cookies);
  if (cookieEntries.length > 0) {
    inserts.push(
      db.insert(schema.requestCookies).values(
        cookieEntries.map(([key, value]) => ({ requestId, key, value }))
      )
    );
  }


  const queryEntries = Object.entries(req.query_params);
  if (queryEntries.length > 0) {
    inserts.push(
      db.insert(schema.requestFields).values(
        queryEntries.map(([key, value]) => ({ requestId, source: "query" as const, key, value }))
      )
    );
  }


  if (req.body && typeof req.body === "object") {
    const bodyEntries = Object.entries(req.body);
    if (bodyEntries.length > 0) {
      inserts.push(
        db.insert(schema.requestFields).values(
          bodyEntries.map(([key, value]) => ({ requestId, source: "body" as const, key, value }))
        )
      );
    }
  }


  if (req.form_data) {
    const formEntries = Object.entries(req.form_data);
    if (formEntries.length > 0) {
      inserts.push(
        db.insert(schema.requestFields).values(
          formEntries.map(([key, value]) => ({ requestId, source: "form" as const, key, value }))
        )
      );
    }
  }

  if (inserts.length > 0) {
    await Promise.all(inserts);
  }
}


function isLoginRequest(path: string, method: string): boolean {
  const loginPaths = ["/login", "/signin", "/auth", "/api/login", "/api/auth", "/api/signin", "/wp-login.php"];
  return method.toUpperCase() === "POST" && loginPaths.some((p) => path.toLowerCase().includes(p));
}

async function updateIpStats(
  ip: string,
  score: number,
  loginFailed = false,
  loginSuccess = false,
): Promise<void> {
  const existing = await db
    .select()
    .from(schema.ipStatistics)
    .where(eq(schema.ipStatistics.ip, ip))
    .limit(1);

  let newTotalScore = score;

  if (existing.length > 0) {
    const updates: Record<string, any> = {
      totalRequests: (existing[0].totalRequests ?? 0) + 1,
      totalScore: (existing[0].totalScore ?? 0) + score,
      lastSeen: new Date(),
    };
    if (loginFailed) updates.failedLogins = (existing[0].failedLogins ?? 0) + 1;
    if (loginSuccess) updates.successfulLogins = (existing[0].successfulLogins ?? 0) + 1;
    await db.update(schema.ipStatistics).set(updates).where(eq(schema.ipStatistics.ip, ip));
    newTotalScore = (existing[0].totalScore ?? 0) + score;
  } else {
    await db.insert(schema.ipStatistics).values({
      ip,
      totalRequests: 1,
      totalScore: score,
      failedLogins: loginFailed ? 1 : 0,
      successfulLogins: loginSuccess ? 1 : 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  }


  if (
    ACCUMULATED_SCORE_BAN_THRESHOLD > 0 &&
    newTotalScore >= ACCUMULATED_SCORE_BAN_THRESHOLD
  ) {
    const alreadyBlocked = await isBlocked(ip);
    if (!alreadyBlocked) {
      const isPermanent = newTotalScore >= ACCUMULATED_SCORE_BAN_THRESHOLD * ACCUMULATED_PERMANENT_MULTIPLIER;
      const reason = "Repeat offender";
      await applyBan(ip, isPermanent ? "permanent_ban" : "temporary_ban", newTotalScore, reason);
      console.log(`[AUTO-BLOCK] ${ip} ${isPermanent ? "permanent" : "temporary"} ban (acc. score ${newTotalScore})`);
    }
  }
}
