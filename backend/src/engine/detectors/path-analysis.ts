import type { NormalizedRequest, DetectorResult } from "../../utils/types.js";

const SENSITIVE_FILES = [
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/etc\/hosts/i,
  /\/proc\/self/i,
  /boot\.ini/i,
  /windows\/system32/i,
  /\.env$/i,
  /\.git\//i,
  /\.svn\//i,
  /\.hg\//i,
  /wp-config/i,
  /web\.config/i,
  /\.htaccess/i,
  /id_rsa/i,
  /shadow\.bak/i,
  /passwd\.bak/i,
];

const ADMIN_PATHS = [
  /\/admin/i,
  /\/administrator/i,
  /\/wp-admin/i,
  /\/phpmyadmin/i,
  /\/cpanel/i,
  /\/dashboard\/admin/i,
  /\/manage/i,
  /\/panel/i,
  /\/backend/i,
];

const BACKUP_FILES = [
  /\.bak$/i,
  /\.backup$/i,
  /\.old$/i,
  /\.orig$/i,
  /\.save$/i,
  /\.swp$/i,
  /\.swo$/i,
  /~/,
  /\.copy$/i,
  /\.tmp$/i,
  /\.sql$/i,
  /\.dump$/i,
  /\.tar\.gz$/i,
  /\.zip$/i,
  /\.rar$/i,
];

const CONFIG_FILES = [
  /config\.\w+$/i,
  /settings\.\w+$/i,
  /\.env\./i,
  /docker-compose/i,
  /Dockerfile/i,
  /\.ini$/i,
  /\.yaml$/i,
  /\.yml$/i,
  /\.toml$/i,
  /\.conf$/i,
  /\.cfg$/i,
];

const TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /%2e%2e\//,
  /%2e%2e%5c/i,
];

export function detectPathTraversal(req: NormalizedRequest): DetectorResult[] {
  const results: DetectorResult[] = [];

  const fullPath = `${req.path}?${req.query_string || ""}`;
  for (const pattern of TRAVERSAL_PATTERNS) {
    const match = fullPath.match(pattern);
    if (match) {
      results.push({
        detector_name: "Path Traversal",
        severity: "critical",
        score: 50,
        source: "path_analysis",
        field_name: "path",
        matched_value: match[0],
      });
      break;
    }
  }

  if (req.query_params) {
    for (const [key, val] of Object.entries(req.query_params)) {
      for (const pattern of TRAVERSAL_PATTERNS) {
        if (pattern.test(val)) {
          results.push({
            detector_name: "Path Traversal",
            severity: "critical",
            score: 50,
            source: "query",
            field_name: key,
            matched_value: pattern.source,
          });
          break;
        }
      }
    }
  }

  return results;
}

export function detectSensitiveFiles(req: NormalizedRequest): DetectorResult[] {
  for (const pattern of SENSITIVE_FILES) {
    const match = req.path.match(pattern);
    if (match) {
      return [{
        detector_name: "Sensitive Files Access",
        severity: "high",
        score: 30,
        source: "path_analysis",
        field_name: "path",
        matched_value: match[0],
      }];
    }
  }
  return [];
}

export function detectAdminPanel(req: NormalizedRequest): DetectorResult[] {
  for (const pattern of ADMIN_PATHS) {
    const match = req.path.match(pattern);
    if (match) {
      return [{
        detector_name: "Admin Panel Discovery",
        severity: "medium",
        score: 25,
        source: "path_analysis",
        field_name: "path",
        matched_value: match[0],
      }];
    }
  }
  return [];
}

export function detectBackupFiles(req: NormalizedRequest): DetectorResult[] {
  for (const pattern of BACKUP_FILES) {
    const match = req.path.match(pattern);
    if (match) {
      return [{
        detector_name: "Backup File Discovery",
        severity: "medium",
        score: 25,
        source: "path_analysis",
        field_name: "path",
        matched_value: match[0],
      }];
    }
  }
  return [];
}

export function detectConfigFiles(req: NormalizedRequest): DetectorResult[] {
  for (const pattern of CONFIG_FILES) {
    const match = req.path.match(pattern);
    if (match) {
      return [{
        detector_name: "Configuration File Discovery",
        severity: "medium",
        score: 25,
        source: "path_analysis",
        field_name: "path",
        matched_value: match[0],
      }];
    }
  }
  return [];
}
