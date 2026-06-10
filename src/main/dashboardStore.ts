import type { DashboardEnvelope } from "../shared/dashboardTypes.js";
import { getDashboardEnvelope, hasStoredAixwAuthToken } from "./aixwClient.js";

const REFRESH_INTERVAL_MS = 15_000;

let cachedEnvelope: DashboardEnvelope = {
  authState: "unauthenticated",
  data: null,
  errorMessage: "未登录时不会自动读取数据，请先登录 AIXW。",
};
let refreshTimer: NodeJS.Timeout | null = null;
let refreshInFlight: Promise<DashboardEnvelope> | null = null;

export function getCachedDashboardEnvelope(): DashboardEnvelope {
  return cachedEnvelope;
}

export function resetDashboardCache(): DashboardEnvelope {
  cachedEnvelope = {
    authState: "unauthenticated",
    data: null,
    errorMessage: null,
  };
  return cachedEnvelope;
}

export async function refreshDashboardNow(): Promise<DashboardEnvelope> {
  if (!hasStoredAixwAuthToken()) {
    cachedEnvelope = {
      authState: "unauthenticated",
      data: null,
      errorMessage: "未登录时不会自动读取数据，请先登录 AIXW。",
    };
    return cachedEnvelope;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = getDashboardEnvelope()
    .then((envelope) => {
      cachedEnvelope = envelope;
      return cachedEnvelope;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export function startDashboardPolling(): void {
  if (refreshTimer) {
    return;
  }

  void refreshDashboardNow();
  refreshTimer = setInterval(() => {
    void refreshDashboardNow();
  }, REFRESH_INTERVAL_MS);
}

export function stopDashboardPolling(): void {
  if (!refreshTimer) {
    return;
  }

  clearInterval(refreshTimer);
  refreshTimer = null;
}
