import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
export const blockTypeEnum = pgEnum("block_type", ["temporary", "permanent"]);
export const fieldSourceEnum = pgEnum("field_source", ["query", "body", "form"]);


export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ip: varchar("ip", { length: 45 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  path: text("path").notNull(),
  queryString: text("query_string"),
  statusCode: integer("status_code"),
  userAgent: text("user_agent"),
  host: text("host"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  requestSize: integer("request_size").default(0),
  responseSize: integer("response_size").default(0),
  responseTimeMs: integer("response_time_ms").default(0),
  riskScore: integer("risk_score").default(0),
  actionTaken: varchar("action_taken", { length: 50 }).default("log"),
});


export const requestHeaders = pgTable("request_headers", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
});


export const requestCookies = pgTable("request_cookies", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
});


export const requestFields = pgTable("request_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  source: fieldSourceEnum("source").notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
});


export const detections = pgTable("detections", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  detectorName: varchar("detector_name", { length: 100 }).notNull(),
  severity: severityEnum("severity").notNull(),
  score: integer("score").notNull(),
  source: varchar("source", { length: 100 }),
  fieldName: varchar("field_name", { length: 255 }),
  matchedValue: text("matched_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const blockedIps = pgTable("blocked_ips", {
  ip: varchar("ip", { length: 45 }).primaryKey(),
  reason: text("reason"),
  blockType: blockTypeEnum("block_type").notNull(),
  blockedAt: timestamp("blocked_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  totalOffenses: integer("total_offenses").default(1),
  createdBy: varchar("created_by", { length: 100 }).default("system"),
});


export const ipStatistics = pgTable("ip_statistics", {
  ip: varchar("ip", { length: 45 }).primaryKey(),
  totalRequests: bigint("total_requests", { mode: "number" }).default(0),
  failedLogins: integer("failed_logins").default(0),
  successfulLogins: integer("successful_logins").default(0),
  totalScore: integer("total_score").default(0),
  totalBlocks: integer("total_blocks").default(0),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});


export const whitelist = pgTable("whitelist", {
  ip: varchar("ip", { length: 45 }).primaryKey(),
  reason: text("reason"),
  createdBy: varchar("created_by", { length: 100 }).default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: varchar("ip", { length: 45 }).notNull(),
  incidentType: varchar("incident_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  score: integer("score").default(0),
  actionTaken: varchar("action_taken", { length: 50 }),
  statusCode: integer("status_code"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});
