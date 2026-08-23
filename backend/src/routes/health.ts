import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

const health = new Hono();

health.get("/", async (c) => {
  let dbStatus = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "error";
  }

  return c.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});

export default health;
