import { serve } from "@hono/node-server";
import { config } from "dotenv";
import app from "./app.js";
import { startExpiredBlockCleanup } from "./engine/action-handler.js";
import { startRateLimitCleanup } from "./engine/detectors/rate-limiter.js";

config();

const port = parseInt(process.env.PORT!, 10);

console.log(`
╔══════════════════════════════════════════╗
║       Mini WAF + SIEM + IDS             ║
║       Log Analyzer Server               ║
╠══════════════════════════════════════════╣
║  Port:  ${port}                            ║
║  Mode:  ${process.env.NODE_ENV || "development"}                  ║
╚══════════════════════════════════════════╝
`);


startExpiredBlockCleanup();


startRateLimitCleanup();

serve({
  fetch: app.fetch,
  port,
});
