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

interface AixwAuthTokens {
  authToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
}

interface AixwEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
}

let authTokens: AixwAuthTokens = {
  authToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
};

function hasUsableAuthToken(): boolean {
  return typeof authTokens.authToken === "string" && authTokens.authToken.trim().length > 0;
}

function unwrapResponse<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "code" in payload) {
    const envelope = payload as AixwEnvelope<T>;
    if (envelope.code === 0) {
      return envelope.data as T;
    }
    throw new Error(envelope.message || `AIXW_API_CODE_${envelope.code}`);
  }

  return payload as T;
}

function buildGetUrl(path: string): string {
  const url = new URL(`${API_PREFIX}${path}`);
  if (!url.searchParams.has("timezone")) {
    url.searchParams.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }
  return url.toString();
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "zh",
  };

  if (hasUsableAuthToken()) {
    headers.Authorization = `Bearer ${authTokens.authToken}`;
  }

  return headers;
}

async function refreshAuthToken(): Promise<boolean> {
  if (!authTokens.refreshToken) {
    return false;
  }

  const response = await session.defaultSession.fetch(`${API_PREFIX}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: authTokens.refreshToken }),
  });

  if (!response.ok) {
    clearStoredAixwAuthTokens();
    return false;
  }

  const payload = unwrapResponse<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  }>(await response.json());

  if (!payload.access_token) {
    clearStoredAixwAuthTokens();
    return false;
  }

  setAixwAuthTokens({
    authToken: payload.access_token,
    refreshToken: payload.refresh_token ?? authTokens.refreshToken,
    tokenExpiresAt:
      typeof payload.expires_in === "number" ? String(Date.now() + payload.expires_in * 1000) : authTokens.tokenExpiresAt,
  });
  return true;
}

async function requestJson<T>(path: string, retried = false): Promise<T> {
  const response = await session.defaultSession.fetch(buildGetUrl(path), {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });

  if (response.status === 401 || response.status === 403) {
    if (!retried && (await refreshAuthToken())) {
      return requestJson<T>(path, true);
    }
    throw new Error("AUTH_EXPIRED");
  }

  if (!response.ok) {
    throw new Error(`AIXW_REQUEST_FAILED_${response.status}`);
  }

  return unwrapResponse<T>(await response.json());
}

export function setAixwAuthTokens(tokens: AixwAuthTokens): void {
  authTokens = {
    authToken: tokens.authToken,
    refreshToken: tokens.refreshToken,
    tokenExpiresAt: tokens.tokenExpiresAt,
  };
}

export function clearStoredAixwAuthTokens(): void {
  authTokens = {
    authToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
  };
}

export async function hasAuthenticatedAixwSession(): Promise<boolean> {
  if (!hasUsableAuthToken()) {
    return false;
  }

  try {
    await requestJson<AixwProfileResponse>("/auth/me");
    return true;
  } catch {
    return false;
  }
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayRangeQuery(): string {
  const today = localDateString(new Date());
  return `start_date=${today}&end_date=${today}`;
}

export async function getDashboardEnvelope(): Promise<DashboardEnvelope> {
  try {
    const [profile, keys, dashboardStats, usageStats] = await Promise.all([
      requestJson<AixwProfileResponse>("/auth/me"),
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
  clearStoredAixwAuthTokens();
  await session.defaultSession.clearStorageData({
    origin: AIXW_ORIGIN,
    storages: ["cookies", "localstorage", "indexdb", "cachestorage"],
  });
}
