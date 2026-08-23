export interface DetectorConfig {
  name: string;
  enabled: boolean;
  score: number;
  severity: "low" | "medium" | "high" | "critical";
}

export const DETECTOR_CONFIGS: Record<string, DetectorConfig> = {

  invalid_http_method: { name: "Invalid HTTP Method", enabled: true, score: 10, severity: "low" },
  large_request_size: { name: "Large Request Size", enabled: true, score: 10, severity: "low" },
  suspicious_user_agent: { name: "Suspicious User-Agent", enabled: true, score: 20, severity: "medium" },
  missing_user_agent: { name: "Missing User-Agent", enabled: true, score: 5, severity: "low" },
  suspicious_host_header: { name: "Suspicious Host Header", enabled: true, score: 15, severity: "medium" },
  too_many_headers: { name: "Too Many Headers", enabled: true, score: 10, severity: "low" },
  duplicate_headers: { name: "Duplicate Headers", enabled: true, score: 10, severity: "low" },


  rate_limit_rpm: { name: "Rate Limit - RPM", enabled: true, score: 20, severity: "medium" },
  rate_limit_rps: { name: "Rate Limit - RPS", enabled: true, score: 20, severity: "medium" },
  burst_traffic: { name: "Burst Traffic", enabled: true, score: 25, severity: "high" },


  brute_force: { name: "Brute Force", enabled: true, score: 40, severity: "high" },
  credential_stuffing: { name: "Credential Stuffing", enabled: true, score: 40, severity: "high" },
  account_enumeration: { name: "Account Enumeration", enabled: true, score: 30, severity: "medium" },
  password_spraying: { name: "Password Spraying", enabled: true, score: 35, severity: "high" },


  path_traversal: { name: "Path Traversal", enabled: true, score: 50, severity: "critical" },
  sensitive_files: { name: "Sensitive Files Access", enabled: true, score: 30, severity: "high" },
  admin_panel: { name: "Admin Panel Discovery", enabled: true, score: 25, severity: "medium" },
  backup_files: { name: "Backup File Discovery", enabled: true, score: 25, severity: "medium" },
  config_files: { name: "Configuration File Discovery", enabled: true, score: 25, severity: "medium" },


  sql_injection: { name: "SQL Injection", enabled: true, score: 50, severity: "critical" },
  xss: { name: "XSS", enabled: true, score: 50, severity: "critical" },
  command_injection: { name: "Command Injection", enabled: true, score: 60, severity: "critical" },
  ssrf: { name: "SSRF", enabled: true, score: 60, severity: "critical" },
  ldap_injection: { name: "LDAP Injection", enabled: true, score: 50, severity: "critical" },
  nosql_injection: { name: "NoSQL Injection", enabled: true, score: 50, severity: "critical" },
  template_injection: { name: "Template Injection", enabled: true, score: 50, severity: "critical" },
  xxe: { name: "XXE", enabled: true, score: 60, severity: "critical" },
  crlf_injection: { name: "CRLF Injection", enabled: true, score: 40, severity: "high" },
  open_redirect: { name: "Open Redirect", enabled: true, score: 40, severity: "high" },


  cookie_abuse: { name: "Cookie Tampering", enabled: true, score: 25, severity: "high" },
  session_abuse: { name: "Session Abuse", enabled: true, score: 30, severity: "high" },
  bot_scanning: { name: "Bot Scanning", enabled: true, score: 15, severity: "medium" },
};

export const VALID_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
export const MAX_HEADERS = 50;
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024;

export const RATE_LIMIT_RPM = 100;
export const RATE_LIMIT_RPS = 20;
export const BURST_THRESHOLD = 50;
export const BURST_WINDOW_MS = 1000;

export const BRUTE_FORCE_THRESHOLD = 5;
export const CREDENTIAL_STUFFING_THRESHOLD = 10;
export const ACCOUNT_ENUM_THRESHOLD = 3;
export const PASSWORD_SPRAY_THRESHOLD = 8;
