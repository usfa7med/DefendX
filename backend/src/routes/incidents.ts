import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, and, sql } from "drizzle-orm";

const incidents = new Hono();

incidents.get("/", async (c) => {
  const ip = c.req.query("ip");
  const type = c.req.query("type");
  const severity = c.req.query("severity");
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (ip) conditions.push(eq(schema.incidents.ip, ip));
  if (type) conditions.push(eq(schema.incidents.incidentType, type));
  if (severity) conditions.push(eq(schema.incidents.severity, severity));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: schema.incidents.id,
        ip: schema.incidents.ip,
        incidentType: schema.incidents.incidentType,
        severity: schema.incidents.severity,
        score: schema.incidents.score,
        actionTaken: schema.incidents.actionTaken,
        statusCode: schema.incidents.statusCode,
        startedAt: schema.incidents.startedAt,
        endedAt: schema.incidents.endedAt,
      })
      .from(schema.incidents)
      .where(whereClause)
      .orderBy(desc(schema.incidents.startedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.incidents)
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

incidents.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await db
    .select()
    .from(schema.incidents)
    .where(eq(schema.incidents.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: "Incident not found" }, 404);
  }

  return c.json(result[0]);
});

export default incidents;
