import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, and, gte, sql, or, ilike } from "drizzle-orm";

const detections = new Hono();

detections.get("/", async (c) => {
  const severity = c.req.query("severity");
  const detector = c.req.query("detector");
  const ip = c.req.query("ip");
  const search = c.req.query("search");
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (severity) conditions.push(eq(schema.detections.severity, severity as any));
  if (detector) conditions.push(eq(schema.detections.detectorName, detector));
  if (ip) {
    const requestIps = db
      .select({ id: schema.requests.id })
      .from(schema.requests)
      .where(eq(schema.requests.ip, ip))
      .as("request_ips");
    conditions.push(eq(schema.detections.requestId, sql`(SELECT id FROM ${requestIps})`));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.detections.detectorName, pattern),
        ilike(schema.detections.matchedValue, pattern),
        ilike(schema.detections.fieldName, pattern),
        ilike(schema.detections.source, pattern),
        ilike(schema.requests.ip, pattern),
        ilike(schema.requests.path, pattern),
        ilike(schema.requests.method, pattern),
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: schema.detections.id,
        requestId: schema.detections.requestId,
        detectorName: schema.detections.detectorName,
        severity: schema.detections.severity,
        score: schema.detections.score,
        source: schema.detections.source,
        fieldName: schema.detections.fieldName,
        matchedValue: schema.detections.matchedValue,
        createdAt: schema.detections.createdAt,
        requestIp: schema.requests.ip,
        requestPath: schema.requests.path,
        requestMethod: schema.requests.method,
        requestTimestamp: schema.requests.timestamp,
      })
      .from(schema.detections)
      .leftJoin(schema.requests, eq(schema.detections.requestId, schema.requests.id))
      .where(whereClause)
      .orderBy(desc(schema.detections.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.detections)
      .leftJoin(schema.requests, eq(schema.detections.requestId, schema.requests.id))
      .where(whereClause),
  ]);

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total: countResult[0]?.count || 0,
      pages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

detections.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await db
    .select({
      id: schema.detections.id,
      requestId: schema.detections.requestId,
      detectorName: schema.detections.detectorName,
      severity: schema.detections.severity,
      score: schema.detections.score,
      source: schema.detections.source,
      fieldName: schema.detections.fieldName,
      matchedValue: schema.detections.matchedValue,
      createdAt: schema.detections.createdAt,
      requestIp: schema.requests.ip,
      requestPath: schema.requests.path,
      requestMethod: schema.requests.method,
      requestTimestamp: schema.requests.timestamp,
    })
    .from(schema.detections)
    .leftJoin(schema.requests, eq(schema.detections.requestId, schema.requests.id))
    .where(eq(schema.detections.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Detection not found" }, 404);
  }

  return c.json(result[0]);
});

export default detections;
