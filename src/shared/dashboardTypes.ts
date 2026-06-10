export type AuthState = "unknown" | "authenticated" | "unauthenticated";

export interface DashboardMetric {
  label: string;
  value: string;
  helper?: string;
  tone: "green" | "blue" | "amber" | "purple" | "rose" | "cyan";
  icon: "wallet" | "key" | "activity" | "dollar" | "box" | "database" | "gauge" | "clock";
}

export interface DashboardData {
  balance: number | null;
  apiKeyCount: number | null;
  activeApiKeyCount: number | null;
  todayRequests: number | null;
  totalRequests: number | null;
  todayActualCost: number | null;
  totalActualCost: number | null;
  todayTokens: number | null;
  totalTokens: number | null;
  cacheHitRate: number | null;
  averageDurationMs: number | null;
  rpm: number | null;
  tpm: number | null;
  lastUpdatedAt: string | null;
}

export interface DashboardEnvelope {
  authState: AuthState;
  data: DashboardData | null;
  errorMessage: string | null;
}

export interface AixwProfileResponse {
  id?: number;
  email?: string;
  username?: string;
  balance?: number;
}

export interface AixwKeysResponse {
  items?: Array<{ id: number; name?: string; status?: number | string | boolean }>;
  total?: number;
}

export interface AixwUsageStatsResponse {
  total_requests?: number;
  today_requests?: number;
  total_actual_cost?: number;
  today_actual_cost?: number;
  total_cost?: number;
  today_cost?: number;
  total_tokens?: number;
  today_tokens?: number;
  total_input_tokens?: number;
  today_input_tokens?: number;
  total_output_tokens?: number;
  today_output_tokens?: number;
  total_cache_read_tokens?: number;
  total_cache_creation_tokens?: number;
  average_duration_ms?: number;
  rpm?: number;
  tpm?: number;
  cache_hit_rate?: number;
}
