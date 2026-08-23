import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { addToWhitelist, removeFromWhitelist } from "../engine/action-handler.js";

const whitelist = new Hono();

whitelist.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.whitelist)
      .orderBy(desc(schema.whitelist.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.whitelist),
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

whitelist.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.ip) {
    return c.json({ error: "IP is required" }, 400);
  }
  await addToWhitelist(body.ip, body.reason, body.created_by);
  return c.json({ success: true, ip: body.ip });
});

whitelist.delete("/:ip", async (c) => {
  const ip = c.req.param("ip");
  await removeFromWhitelist(ip);
  return c.json({ success: true, ip });
});

export default whitelist;
