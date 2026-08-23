import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { requireApiKey } from "./middleware/api-key.js";
import logsRoutes from "./routes/logs.js";
import detectionsRoutes from "./routes/detections.js";
import incidentsRoutes from "./routes/incidents.js";
import blockedIpsRoutes from "./routes/blocked-ips.js";
import whitelistRoutes from "./routes/whitelist.js";
import statsRoutes from "./routes/stats.js";
import healthRoutes from "./routes/health.js";

const app = new Hono();


app.use("*", cors());
app.use("*", securityHeaders());
app.use("*", logger);
app.use("*", requireApiKey);
app.onError(errorHandler);


app.route("/api/logs", logsRoutes);
app.route("/api/detections", detectionsRoutes);
app.route("/api/incidents", incidentsRoutes);
app.route("/api/blocked-ips", blockedIpsRoutes);
app.route("/api/whitelist", whitelistRoutes);
app.route("/api/stats", statsRoutes);
app.route("/health", healthRoutes);


app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

export default app;
