import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { processRequest } from "../engine/processor.js";
import { isBlocked, isWhitelisted } from "../engine/action-handler.js";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import type { NormalizedRequest } from "../utils/types.js";
import { parseQueryString } from "../utils/helpers.js";
import { isValidIp, isEmptyIp, isLocalhost, normalizeIp } from "../utils/ip-utils.js";
import { lookupGeo } from "../utils/geo.js";
import {
  REQUIRED_LOG_FIELDS,
  EXCLUDED_PATHS,
  SKIP_METHODS,
  STATIC_FILE_EXTENSIONS,
} from "../config/protection.js";

const logs = new Hono();



function parseJsonField(val: any): Record<string, string> {
  if (typeof val === "object" && val !== null) return val;
  if (typeof val === "string") try { return JSON.parse(val); } catch { return {}; }
  return {};
}

function isStaticFile(path: string): boolean {
  const idx = path.lastIndexOf(".");
  if (idx === -1) return false;
  return STATIC_FILE_EXTENSIONS.has(path.slice(idx).toLowerCase());
}


function parseBody(raw: any): Record<string, string> | null {
  if (typeof raw === "object" && raw !== null) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try { return JSON.parse(raw); } catch {  }

    return { __raw_payload__: raw };
  }
  return null;
}


logs.post("/", async (c) => {
  const body = await c.req.json();


  const missing = REQUIRED_LOG_FIELDS.filter((f) => {
    const v = body[f];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });
  if (missing.length > 0) {
    return c.json({ error: "Bad Request", missing_fields: missing }, 400);
  }


  const rawIp = body.ip || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const cleanIp = normalizeIp(rawIp);

  if (!cleanIp || isEmptyIp(rawIp)) {
    return c.json({ error: "Bad Request", message: "Invalid or empty source IP" }, 400);
  }
  if (!isValidIp(cleanIp) && cleanIp !== "localhost") {
    return c.json({ error: "Bad Request", message: `Malformed IP address: ${cleanIp}` }, 400);
  }


  if (isLocalhost(cleanIp)) {
    const reqId = await storeRequestOnly(cleanIp, body, 200);
    return c.json({ success: true, request_id: reqId, localhost: true, risk_score: 0, action_taken: "log", detections_count: 0, status_code: 200 }, 200);
  }


  const whitelisted = await isWhitelisted(cleanIp);
  if (whitelisted) {

    return c.json({ success: true, request_id: "whitelisted-no-log", whitelisted: true, risk_score: 0, action_taken: "none", detections_count: 0, status_code: 200 }, 200);
  }


  const blocked = await isBlocked(cleanIp);
  if (blocked) {
    const reqId = await storeRequestOnly(cleanIp, body, 403, "permanent_ban");
    return c.json({ error: "IP is blocked", ip: cleanIp, request_id: reqId }, 403);
  }


  const skipAnalysis =
    EXCLUDED_PATHS.some((p) => body.path === p || body.path?.startsWith(p + "/")) ||
    SKIP_METHODS.has((body.method || "").toUpperCase()) ||
    isStaticFile(body.path || "");

  if (skipAnalysis) {
    const reqId = await storeRequestOnly(cleanIp, body, 200);
    return c.json({ success: true, request_id: reqId, skipped: true, risk_score: 0, action_taken: "log", detections_count: 0, status_code: 200 }, 200);
  }


  const parsedHeaders = parseJsonField(body.headers);
  const geo = await lookupGeo(cleanIp);
  const normalized: NormalizedRequest = {
    ip: cleanIp,
    method: (body.method || "GET").toUpperCase(),
    path: body.path || "/",
    query_string: body.query_string || "",
    headers: parsedHeaders,
    cookies: parseJsonField(body.cookies),
    body: parseBody(body.body),
    form_data: typeof body.form_data === "object" && body.form_data !== null ? body.form_data : null,
    query_params: body.query_params || (body.query_string ? parseQueryString(body.query_string) : {}),
    user_agent: body.user_agent ?? (parsedHeaders["User-Agent"] || parsedHeaders["user-agent"] || c.req.header("user-agent") || ""),
    host: body.host ?? (parsedHeaders["Host"] || parsedHeaders["host"] || c.req.header("host") || ""),
    request_size: body.request_size || 0,
    status_code: body.status_code ?? undefined,
    response_size: body.response_size ?? undefined,
    response_time_ms: body.response_time_ms ?? undefined,
    country: geo.country || body.country || null,
    city: geo.city || body.city || null,
  };


  const result = await processRequest(normalized);

  const httpStatus = result.action_taken === "temporary_ban" || result.action_taken === "permanent_ban" ? 403 : 200;


  await db.update(schema.requests)
    .set({ statusCode: httpStatus })
    .where(eq(schema.requests.id, result.request_id));

  return c.json({
    success: true,
    request_id: result.request_id,
    risk_score: result.total_score,
    action_taken: result.action_taken,
    detections_count: result.detections.length,
    status_code: httpStatus,
    detections: result.detections.map((d) => ({
      detector_name: d.detector_name,
      severity: d.severity,
      score: d.score,
      source: d.source,
      field_name: d.field_name,
      matched_value: d.matched_value,
    })),
  }, httpStatus);
});


async function storeRequestOnly(ip: string, body: any, statusCode: number = 200, actionTaken: string = "log"): Promise<string> {
  const requestId = crypto.randomUUID();
  const parsedHeaders = parseJsonField(body.headers);
  const parsedCookies = parseJsonField(body.cookies);
  const parsedQuery = body.query_params || (body.query_string ? parseQueryString(body.query_string) : {});
  const bodyField = parseBody(body.body);
  const formField = typeof body.form_data === "object" && body.form_data !== null ? body.form_data : null;


  const geo = await lookupGeo(ip);

  await db.insert(schema.requests).values({
    id: requestId,
    ip,
    method: (body.method || "GET").toUpperCase(),
    path: body.path || "/",
    queryString: body.query_string || null,
    statusCode: statusCode,
    userAgent: body.user_agent || null,
    host: body.host || null,
    country: geo.country || body.country || null,
    city: geo.city || body.city || null,
    requestSize: body.request_size || 0,
    responseSize: body.response_size ?? null,
    responseTimeMs: body.response_time_ms ?? null,
    riskScore: 0,
    actionTaken,
  });


  const detailInserts: Promise<any>[] = [];

  const toStr = (v: unknown): string => v == null ? "" : String(v);

  const headerEntries = Object.entries(parsedHeaders);
  if (headerEntries.length > 0) {
    detailInserts.push(
      db.insert(schema.requestHeaders).values(
        headerEntries.map(([key, value]) => ({ requestId, key, value: toStr(value) }))
      )
    );
  }

  const cookieEntries = Object.entries(parsedCookies);
  if (cookieEntries.length > 0) {
    detailInserts.push(
      db.insert(schema.requestCookies).values(
        cookieEntries.map(([key, value]) => ({ requestId, key, value: toStr(value) }))
      )
    );
  }

  const queryEntries = Object.entries(parsedQuery);
  if (queryEntries.length > 0) {
    detailInserts.push(
      db.insert(schema.requestFields).values(
        queryEntries.map(([key, value]) => ({ requestId, source: "query" as const, key, value: toStr(value) }))
      )
    );
  }

  if (bodyField && typeof bodyField === "object") {
    const bodyEntries = Object.entries(bodyField);
    if (bodyEntries.length > 0) {
      detailInserts.push(
        db.insert(schema.requestFields).values(
          bodyEntries.map(([key, value]) => ({ requestId, source: "body" as const, key, value: toStr(value) }))
        )
      );
    }
  }

  if (detailInserts.length > 0) {
    await Promise.all(detailInserts);
  }

  return requestId;
}


logs.get("/", async (c) => {
  const ip = c.req.query("ip");
  const action = c.req.query("action");
  const method = c.req.query("method");
  const minScore = c.req.query("min_score") ? parseInt(c.req.query("min_score")!) : undefined;
  const maxScore = c.req.query("max_score") ? parseInt(c.req.query("max_score")!) : undefined;
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const search = c.req.query("search");
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (ip) conditions.push(eq(schema.requests.ip, ip));
  if (action) conditions.push(eq(schema.requests.actionTaken, action));
  if (method) conditions.push(eq(schema.requests.method, method.toUpperCase()));
  if (minScore !== undefined) conditions.push(gte(schema.requests.riskScore, minScore));
  if (maxScore !== undefined) conditions.push(lte(schema.requests.riskScore, maxScore));
  if (startDate) conditions.push(gte(schema.requests.timestamp, new Date(startDate)));
  if (endDate) conditions.push(lte(schema.requests.timestamp, new Date(endDate)));
  if (search) conditions.push(like(schema.requests.path, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(schema.requests).where(where)
      .orderBy(desc(schema.requests.timestamp))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.requests).where(where),
  ]);

  return c.json({
    data,
    pagination: {
      page, limit,
      total: countResult[0]?.count || 0,
      pages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});


logs.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [request, headers, cookies, fields, requestDetections] = await Promise.all([
    db.select().from(schema.requests).where(eq(schema.requests.id, id)).limit(1),
    db.select().from(schema.requestHeaders).where(eq(schema.requestHeaders.requestId, id)),
    db.select().from(schema.requestCookies).where(eq(schema.requestCookies.requestId, id)),
    db.select().from(schema.requestFields).where(eq(schema.requestFields.requestId, id)),
    db.select().from(schema.detections).where(eq(schema.detections.requestId, id)),
  ]);

  if (request.length === 0) {
    return c.json({ error: "Request not found" }, 404);
  }

  return c.json({
    ...request[0],
    headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
    cookies: cookies.reduce((acc, ck) => ({ ...acc, [ck.key]: ck.value }), {}),
    fields,
    detections: requestDetections,
  });
});

export default logs;
