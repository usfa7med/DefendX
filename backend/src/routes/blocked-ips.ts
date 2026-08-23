import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, and, sql } from "drizzle-orm";

const blockedIps = new Hono();

blockedIps.get("/", async (c) => {
  const blockType = c.req.query("type");
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const whereClause = blockType ? eq(schema.blockedIps.blockType, blockType as any) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.blockedIps)
      .where(whereClause)
      .orderBy(desc(schema.blockedIps.blockedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.blockedIps)
      .where(whereClause),
  ]);


  const now = new Date();
  const activeBans = data.filter((ban) => {
    if (ban.blockType === "permanent") return true;
    if (ban.expiresAt && new Date(ban.expiresAt) > now) return true;
    return false;
  });

  return c.json({
    data: activeBans,
    pagination: {
      page,
      limit,
      total: countResult[0]?.count || 0,
      pages: Math.ceil((countResult[0]?.count || 0) / limit),
    },
  });
});

blockedIps.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.ip) {
    return c.json({ error: "IP is required" }, 400);
  }

  await db
    .insert(schema.blockedIps)
    .values({
      ip: body.ip,
      reason: body.reason || "Manual block",
      blockType: body.block_type || "permanent",
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      createdBy: body.created_by || "admin",
    })
    .onConflictDoUpdate({
      target: schema.blockedIps.ip,
      set: {
        reason: body.reason || "Manual block",
        blockType: body.block_type || "permanent",
        expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      },
    });

  return c.json({ success: true, ip: body.ip });
});

blockedIps.delete("/:ip", async (c) => {
  const ip = c.req.param("ip");
  await db.delete(schema.blockedIps).where(eq(schema.blockedIps.ip, ip));

  await db
    .update(schema.ipStatistics)
    .set({ totalScore: 0 })
    .where(eq(schema.ipStatistics.ip, ip));

  await db.delete(schema.requests).where(eq(schema.requests.ip, ip));
  await db.delete(schema.incidents).where(eq(schema.incidents.ip, ip));
  return c.json({ success: true, ip, score_reset: true, logs_deleted: true });
});

blockedIps.patch("/:ip", async (c) => {
  const ip = c.req.param("ip");
  const body = await c.req.json();


  const existing = await db.select().from(schema.blockedIps).where(eq(schema.blockedIps.ip, ip)).limit(1);
  if (existing.length === 0) {
    return c.json({ error: "IP not found in blocked list" }, 404);
  }

  const updates: Record<string, any> = {};
  if (body.reason !== undefined) updates.reason = body.reason;
  if (body.block_type !== undefined) updates.blockType = body.block_type;
  if (body.expires_at !== undefined) updates.expiresAt = body.expires_at ? new Date(body.expires_at) : null;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update. Provide at least one of: reason, block_type, expires_at" }, 400);
  }

  await db.update(schema.blockedIps).set(updates).where(eq(schema.blockedIps.ip, ip));
  return c.json({ success: true, ip, updated: Object.keys(updates) });
});

export default blockedIps;
