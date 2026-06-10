import { session } from "electron";
import { mapDashboardData } from "./dashboardMapper.js";
import type {
  AixwKeysResponse,
  AixwProfileResponse,
  AixwUsageStatsResponse,
  DashboardEnvelope,
} from "../shared/dashboardTypes.js";

const AIXW_ORIGIN = "https://aixw.org";
const API_PREFIX = `${AIXW_ORIGIN}/api/v1`;

async function requestJson<T>(path: string): Promise<T> {
  const response = await session.defaultSession.fetch(`${API_PREFIX}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    throw new Error(`AIXW_REQUEST_FAILED_${response.status}`);
  }

  return (await response.json()) as T;
}

function todayRangeQuery(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `start_date=${today}&end_date=${today}`;
}

export async function getDashboardEnvelope(): Promise<DashboardEnvelope> {
  try {
    const [profile, keys, dashboardStats, usageStats] = await Promise.all([
      requestJson<AixwProfileResponse>("/user/profile"),
      requestJson<AixwKeysResponse>("/keys?page=1&page_size=100"),
      requestJson<AixwUsageStatsResponse>("/usage/dashboard/stats"),
      requestJson<AixwUsageStatsResponse>(`/usage/stats?${todayRangeQuery()}`),
    ]);

    return {
      authState: "authenticated",
      data: mapDashboardData(profile, keys, dashboardStats, usageStats),
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const authState = message === "AUTH_EXPIRED" ? "unauthenticated" : "unknown";

    return {
      authState,
      data: null,
      errorMessage: message === "AUTH_EXPIRED" ? "登录已过期，请重新登录。" : `读取 AIXW 数据失败：${message}`,
    };
  }
}

export async function clearAixwSession(): Promise<void> {
  await session.defaultSession.clearStorageData({
    origin: AIXW_ORIGIN,
    storages: ["cookies", "localstorage", "indexdb", "cachestorage"],
  });
}
