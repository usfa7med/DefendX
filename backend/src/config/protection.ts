
export const LOCALHOST_IPS = new Set(["127.0.0.1", "::1", "localhost", "0.0.0.0"]);


export const PROTECT_PRIVATE_NETWORKS = true;
export const PRIVATE_CIDRS = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
];


export const HARD_CODED_TRUSTED_IPS: string[] = ["127.0.0.1", "::1"];


export const EMPTY_IP_VALUES = new Set(["", "unknown", "none", "null", "undefined"]);


export const REQUIRED_LOG_FIELDS = ["method", "path", "ip"] as const;


export const EXCLUDED_PATHS = [
  "/health",
  "/metrics",
  "/docs",
  "/openapi.json",
  "/favicon.ico",
  "/api/logs",
  "/api/ml/train",
];


export const STATIC_FILE_EXTENSIONS = new Set([
  ".css", ".js", ".png", ".jpg", ".jpeg",
  ".gif", ".ico", ".svg", ".webp", ".woff",
  ".woff2", ".ttf", ".eot", ".pdf", ".zip",
]);


export const MAX_BAN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;


export const ALLOWED_BLOCK_TYPES = new Set(["temporary", "permanent"]);



export const ACCUMULATED_SCORE_BAN_THRESHOLD = 100;


export const ACCUMULATED_PERMANENT_MULTIPLIER = 3;



export const MIN_SCORE_FOR_BLOCK = 21;


export const COOLDOWN_ENABLED = true;


export const EXPIRED_BLOCK_CLEANUP_INTERVAL_MS = 60_000;


export const SKIP_METHODS = new Set(["OPTIONS", "HEAD"]);


export const HEALTH_CHECK_UA_PATTERNS = [
  /kube-probe/i,
  /docker/i,
  /health.?check/i,
  /ELB-HealthChecker/i,
  /GoogleHC/i,
  /AWS-LB/i,
];


export const IGNORE_KNOWN_BOTS = true;
export const KNOWN_BOT_PATTERNS = [
  /Googlebot/i,
  /Bingbot/i,
  /Slurp/i,
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
];



export const BAN_ESCALATION_MS = [
  10 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
];
