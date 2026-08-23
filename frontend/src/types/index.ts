

export interface RequestLog {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  queryString: string | null;
  statusCode: number | null;
  userAgent: string | null;
  host: string | null;
  country: string | null;
  city: string | null;
  requestSize: number | null;
  responseSize: number | null;
  responseTimeMs: number | null;
  riskScore: number | null;
  actionTaken: string | null;
}

export interface RequestLogDetail extends RequestLog {
  headers: Record<string, string>;
  cookies: Record<string, string>;
  fields: Array<{ id: string; requestId: string; source: "query" | "body" | "form"; key: string; value: string | null }>;
  detections: Detection[];
}

export interface Detection {
  id: string;
  requestId: string;
  detectorName: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  source: string | null;
  fieldName: string | null;
  matchedValue: string | null;
  createdAt: string;
  requestIp?: string;
  requestPath?: string;
  requestMethod?: string;
  requestTimestamp?: string;
}

export interface DetectionListEntry extends Detection {
  requestMethod: string;
  requestTimestamp: string;
}

export interface Incident {
  id: string;
  ip: string;
  incidentType: string;
  severity: string;
  score: number | null;
  actionTaken: string | null;
  statusCode: number | null;
  startedAt: string;
  endedAt: string | null;
}

export interface BlockedIP {
  ip: string;
  reason: string | null;
  blockType: "temporary" | "permanent";
  blockedAt: string;
  expiresAt: string | null;
  totalOffenses: number | null;
  createdBy: string | null;
}

export interface WhitelistEntry {
  ip: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}



export interface StatsSummary {
  total_requests: number;
  requests_24h: number;
  requests_hour: number;
  total_detections: number;
  blocked_ips: number;
  total_incidents: number;
  active_incidents: number;
  avg_score_24h: number;
  max_score_24h: number;
}

export interface DashboardData {
  summary: {
    total_requests: number;
    detections_count: number;
    blocked_count: number;
  };
  top_ips: Array<{ ip: string; count: number; max_score: number }>;
  top_attacks: Array<{ name: string; count: number }>;
  action_distribution: Array<{ action: string; count: number }>;
  hourly_traffic: Array<{ hour: string; total: number; malicious: number }>;
}

export interface TopIP {
  ip: string;
  total_requests: number;
  avg_score: number;
  max_score: number;
  blocked: boolean;
}

export interface TopAttack {
  detector_name: string;
  count: number;
  avg_score: number;
  max_severity: string;
}


export interface LogIngestResponse {
  success: boolean;
  request_id?: string;
  risk_score: number;
  action_taken: string;
  detections_count: number;
  status_code: number;
  localhost?: boolean;
  whitelisted?: boolean;
  skipped?: boolean;
  detections?: Array<{
    detector_name: string;
    severity: string;
    score: number;
    source: string;
    field_name: string;
    matched_value: string;
  }>;
  error?: string;
  missing_fields?: string[];
  ip?: string;
}


export interface ApiError {
  error: string;
  message?: string;
  missing_fields?: string[];
  ip?: string;
  updated?: string[];
}


export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
