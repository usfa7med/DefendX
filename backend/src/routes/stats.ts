import { Hono } from "hono";
import { db, schema } from "../db/index.js";
import { eq, desc, sql, gte } from "drizzle-orm";

const stats = new Hono();

stats.get("/", async (c) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  const [totalRequests, requests24h, requestsHour, totalDetections, blockedIps, totalIncidents, activeIncidents] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.requests),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.requests).where(gte(schema.requests.timestamp, last24h)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.requests).where(gte(schema.requests.timestamp, lastHour)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.detections),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.blockedIps),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.incidents),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.incidents).where(sql`${schema.incidents.endedAt} IS NULL`),
  ]);

  const [avgScore] = await db
    .select({ avg: sql<number>`COALESCE(AVG(${schema.requests.riskScore}), 0)::int` })
    .from(schema.requests)
    .where(gte(schema.requests.timestamp, last24h));

  const [maxScore] = await db
    .select({ max: sql<number>`COALESCE(MAX(${schema.requests.riskScore}), 0)::int` })
    .from(schema.requests)
    .where(gte(schema.requests.timestamp, last24h));

  return c.json({
    total_requests: totalRequests[0]?.count || 0,
    requests_24h: requests24h[0]?.count || 0,
    requests_hour: requestsHour[0]?.count || 0,
    total_detections: totalDetections[0]?.count || 0,
    blocked_ips: blockedIps[0]?.count || 0,
    total_incidents: totalIncidents[0]?.count || 0,
    active_incidents: activeIncidents[0]?.count || 0,
    avg_score_24h: avgScore?.avg || 0,
    max_score_24h: maxScore?.max || 0,
  });
});

stats.get("/top-ips", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10");
  const period = c.req.query("period") || "24h";

  let since: Date;
  if (period === "1h") since = new Date(Date.now() - 60 * 60 * 1000);
  else if (period === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db
    .select({
      ip: schema.requests.ip,
      total_requests: sql<number>`count(*)::int`,
      avg_score: sql<number>`COALESCE(AVG(${schema.requests.riskScore}), 0)::int`,
      max_score: sql<number>`COALESCE(MAX(${schema.requests.riskScore}), 0)::int`,
      blocked: sql<boolean>` EXISTS(SELECT 1 FROM ${schema.blockedIps} WHERE ${schema.blockedIps.ip} = ${schema.requests.ip})`,
    })
    .from(schema.requests)
    .where(gte(schema.requests.timestamp, since))
    .groupBy(schema.requests.ip)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return c.json(result);
});

stats.get("/top-attacks", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10");
  const period = c.req.query("period") || "24h";

  let since: Date;
  if (period === "1h") since = new Date(Date.now() - 60 * 60 * 1000);
  else if (period === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await db
    .select({
      detector_name: schema.detections.detectorName,
      count: sql<number>`count(*)::int`,
      avg_score: sql<number>`COALESCE(AVG(${schema.detections.score}), 0)::int`,
      max_severity: sql<string>`MAX(${schema.detections.severity})::text`,
    })
    .from(schema.detections)
    .where(gte(schema.detections.createdAt, since))
    .groupBy(schema.detections.detectorName)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return c.json(result);
});

stats.get("/dashboard", async (c) => {
  const now = new Date();
  const period = c.req.query("period") || "24h";
  const is7d = period === "7d";
  const is1h = period === "1h";
  const since = is7d
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : is1h
      ? new Date(now.getTime() - 60 * 60 * 1000)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [summary, topIps, topAttacks, actionDistribution, hourlyTraffic] = await Promise.all([

    db.select({
      total_requests: sql<number>`count(*)::int`,
      detections_count: sql<number>`COALESCE(SUM(CASE WHEN ${schema.requests.riskScore} > 0 THEN 1 ELSE 0 END), 0)::int`,
      blocked_count: sql<number>`COALESCE(SUM(CASE WHEN ${schema.requests.actionTaken} IN ('temporary_ban', 'permanent_ban') THEN 1 ELSE 0 END), 0)::int`,
    }).from(schema.requests).where(gte(schema.requests.timestamp, since)),


    db.select({
      ip: schema.requests.ip,
      count: sql<number>`count(*)::int`,
      max_score: sql<number>`COALESCE(MAX(${schema.requests.riskScore}), 0)::int`,
    }).from(schema.requests)
      .where(gte(schema.requests.timestamp, since))
      .groupBy(schema.requests.ip)
      .orderBy(desc(sql`count(*)`))
      .limit(5),


    db.select({
      name: schema.detections.detectorName,
      count: sql<number>`count(*)::int`,
    }).from(schema.detections)
      .where(gte(schema.detections.createdAt, since))
      .groupBy(schema.detections.detectorName)
      .orderBy(desc(sql`count(*)`))
      .limit(5),


    db.select({
      action: schema.requests.actionTaken,
      count: sql<number>`count(*)::int`,
    }).from(schema.requests)
      .where(gte(schema.requests.timestamp, since))
      .groupBy(schema.requests.actionTaken),


    ...(is7d
      ? [db.select({
          hour: sql<string>`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD')`,
          total: sql<number>`count(*)::int`,
          malicious: sql<number>`COALESCE(SUM(CASE WHEN ${schema.requests.riskScore} > 20 THEN 1 ELSE 0 END), 0)::int`,
        }).from(schema.requests)
          .where(gte(schema.requests.timestamp, since))
          .groupBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD')`)
          .orderBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD')`)]
      : is1h
        ? [db.select({
            hour: sql<string>`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:MI')`,
            total: sql<number>`count(*)::int`,
            malicious: sql<number>`COALESCE(SUM(CASE WHEN ${schema.requests.riskScore} > 20 THEN 1 ELSE 0 END), 0)::int`,
          }).from(schema.requests)
            .where(gte(schema.requests.timestamp, since))
            .groupBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:MI')`)
            .orderBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:MI')`)]
        : [db.select({
          hour: sql<string>`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:00')`,
          total: sql<number>`count(*)::int`,
          malicious: sql<number>`COALESCE(SUM(CASE WHEN ${schema.requests.riskScore} > 20 THEN 1 ELSE 0 END), 0)::int`,
        }).from(schema.requests)
          .where(gte(schema.requests.timestamp, since))
          .groupBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:00')`)
          .orderBy(sql`TO_CHAR(${schema.requests.timestamp}, 'YYYY-MM-DD HH24:00')`)]
    ),
  ]);

  return c.json({
    summary: summary[0] || { total_requests: 0, detections_count: 0, blocked_count: 0 },
    top_ips: topIps,
    top_attacks: topAttacks,
    action_distribution: actionDistribution,
    hourly_traffic: hourlyTraffic,
  });
});

export default stats;
