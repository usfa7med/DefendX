export type Severity = "low" | "medium" | "high" | "critical";
export type BlockType = "temporary" | "permanent";
export type RequestFieldSource = "query" | "body" | "form";
export type ActionTaken = "log" | "warning" | "soft_rate_limit" | "temporary_ban" | "permanent_ban";

export interface DetectorResult {
  detector_name: string;
  severity: Severity;
  score: number;
  source: string;
  field_name: string;
  matched_value: string;
}

export interface NormalizedRequest {
  ip: string;
  method: string;
  path: string;
  query_string: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body: Record<string, string> | null;
  form_data: Record<string, string> | null;
  query_params: Record<string, string>;
  user_agent: string;
  host: string;
  request_size: number;
  status_code?: number;
  response_size?: number;
  response_time_ms?: number;
  country?: string;
  city?: string;
}

export interface ProcessedRequest {
  request_id: string;
  detections: DetectorResult[];
  total_score: number;
  action_taken: ActionTaken;
}

export interface RateLimitEntry {
  count: number;
  window_start: number;
}

export interface IPStats {
  total_requests: number;
  failed_logins: number;
  successful_logins: number;
  total_score: number;
  total_blocks: number;
  first_seen: Date;
  last_seen: Date;
}
