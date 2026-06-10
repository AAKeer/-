import { describe, expect, it } from "vitest";
import { mapDashboardData } from "../src/main/dashboardMapper";
import type { AixwKeysResponse, AixwProfileResponse, AixwUsageStatsResponse } from "../src/shared/dashboardTypes";

describe("mapDashboardData", () => {
  it("合并用户、密钥和用量统计", () => {
    const profile: AixwProfileResponse = { balance: 47.25 };
    const keys: AixwKeysResponse = {
      items: [
        { id: 1, status: 1 },
        { id: 2, status: 0 },
        { id: 3, status: "active" },
      ],
      total: 3,
    };
    const dashboardStats: AixwUsageStatsResponse = {
      today_requests: 125,
      total_requests: 1227,
      today_actual_cost: 4.0157,
      total_actual_cost: 52.7462,
      today_tokens: 41000,
      total_tokens: 440000,
      average_duration_ms: 13710,
      rpm: 4,
      tpm: 41700,
    };
    const usageStats: AixwUsageStatsResponse = {
      total_input_tokens: 1000,
      total_cache_creation_tokens: 500,
      total_cache_read_tokens: 500,
    };

    const result = mapDashboardData(profile, keys, dashboardStats, usageStats);

    expect(result.balance).toBe(47.25);
    expect(result.apiKeyCount).toBe(3);
    expect(result.activeApiKeyCount).toBe(2);
    expect(result.todayRequests).toBe(125);
    expect(result.totalRequests).toBe(1227);
    expect(result.todayActualCost).toBe(4.0157);
    expect(result.totalActualCost).toBe(52.7462);
    expect(result.todayTokens).toBe(41000);
    expect(result.totalTokens).toBe(440000);
    expect(result.averageDurationMs).toBe(13710);
    expect(result.rpm).toBe(4);
    expect(result.tpm).toBe(41700);
    expect(result.cacheHitRate).toBe(25);
  });

  it("优先使用接口直接返回的缓存命中率", () => {
    const result = mapDashboardData(
      { balance: 1 },
      { items: [], total: 0 },
      { cache_hit_rate: 88.8 },
      { total_input_tokens: 100, total_cache_read_tokens: 20, total_cache_creation_tokens: 10 },
    );

    expect(result.cacheHitRate).toBe(88.8);
  });

  it("缓存命中率分母为 0 时返回 null", () => {
    const result = mapDashboardData(
      { balance: 1 },
      { items: [], total: 0 },
      {},
      { total_input_tokens: 0, total_cache_read_tokens: 0, total_cache_creation_tokens: 0 },
    );

    expect(result.cacheHitRate).toBeNull();
  });
});
