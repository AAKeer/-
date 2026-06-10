import type {
  AixwKeysResponse,
  AixwProfileResponse,
  AixwUsageStatsResponse,
  DashboardData,
} from "../shared/dashboardTypes.js";

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isActiveKeyStatus(status: unknown): boolean {
  return status === 1 || status === true || status === "active" || status === "enabled";
}

function calculateCacheHitRate(stats: AixwUsageStatsResponse | null | undefined): number | null {
  if (!stats) {
    return null;
  }

  const directRate = numberOrNull(stats.cache_hit_rate);
  if (directRate !== null) {
    return directRate;
  }

  const input = numberOrNull(stats.total_input_tokens) ?? 0;
  const cacheCreate = numberOrNull(stats.total_cache_creation_tokens) ?? 0;
  const cacheRead = numberOrNull(stats.total_cache_read_tokens) ?? 0;
  const denominator = input + cacheCreate + cacheRead;

  if (denominator <= 0) {
    return null;
  }

  return (cacheRead / denominator) * 100;
}

export function mapDashboardData(
  profile: AixwProfileResponse,
  keys: AixwKeysResponse,
  dashboardStats: AixwUsageStatsResponse,
  usageStats?: AixwUsageStatsResponse | null,
): DashboardData {
  const keyItems = keys.items ?? [];
  const keyTotal = typeof keys.total === "number" ? keys.total : keyItems.length;
  const activeCount = keyItems.filter((item) => isActiveKeyStatus(item.status)).length;
  const cacheSource = dashboardStats.cache_hit_rate !== undefined ? dashboardStats : usageStats ?? dashboardStats;

  return {
    balance: numberOrNull(profile.balance),
    apiKeyCount: keyTotal,
    activeApiKeyCount: activeCount,
    todayRequests: numberOrNull(dashboardStats.today_requests),
    totalRequests: numberOrNull(dashboardStats.total_requests),
    todayActualCost: numberOrNull(dashboardStats.today_actual_cost),
    totalActualCost: numberOrNull(dashboardStats.total_actual_cost),
    todayTokens: numberOrNull(dashboardStats.today_tokens),
    totalTokens: numberOrNull(dashboardStats.total_tokens),
    cacheHitRate: calculateCacheHitRate(cacheSource),
    averageDurationMs: numberOrNull(dashboardStats.average_duration_ms),
    rpm: numberOrNull(dashboardStats.rpm),
    tpm: numberOrNull(dashboardStats.tpm),
    lastUpdatedAt: new Date().toISOString(),
  };
}
