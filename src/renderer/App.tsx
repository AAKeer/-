import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthState, DashboardData, DashboardEnvelope } from "../shared/dashboardTypes";
import { login, logout, refreshDashboard } from "./api";
import { DashboardGrid } from "./components/DashboardGrid";
import { HeaderBar } from "./components/HeaderBar";
import { MiniDashboard } from "./components/MiniDashboard";
import { StatusBanner } from "./components/StatusBanner";

const REFRESH_INTERVAL_SECONDS = 15;
const IS_MINI_MODE = new URLSearchParams(window.location.search).get("mini") === "1";

export function App() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>("未登录时不会自动读取数据，请先登录 AIXW。");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const refreshInFlight = useRef(false);

  const applyEnvelope = useCallback((envelope: DashboardEnvelope) => {
    setAuthState(envelope.authState);
    setErrorMessage(envelope.errorMessage);
    if (envelope.data) {
      setData(envelope.data);
    }
  }, []);

  const doRefresh = useCallback(async () => {
    if (refreshInFlight.current) {
      return;
    }
    refreshInFlight.current = true;
    setLoading(true);
    try {
      const envelope = await refreshDashboard();
      applyEnvelope(envelope);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  }, [applyEnvelope]);

  const doLogin = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await login();
      applyEnvelope(envelope);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      setLoading(false);
    }
  }, [applyEnvelope]);

  const doLogout = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await logout();
      applyEnvelope(envelope);
      setData(null);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } finally {
      setLoading(false);
    }
  }, [applyEnvelope]);

  useEffect(() => {
    void doRefresh();
  }, [doRefresh]);

  useEffect(() => {
    document.body.classList.toggle("mini-mode", IS_MINI_MODE);
    return () => document.body.classList.remove("mini-mode");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (authState !== "authenticated") {
          return REFRESH_INTERVAL_SECONDS;
        }
        if (value <= 1) {
          void doRefresh();
          return REFRESH_INTERVAL_SECONDS;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [authState, doRefresh]);

  if (IS_MINI_MODE) {
    return <MiniDashboard authState={authState} data={data} errorMessage={errorMessage} loading={loading} onRefresh={doRefresh} />;
  }

  return (
    <div className="app-shell">
      <HeaderBar
        authState={authState}
        loading={loading}
        countdown={countdown}
        lastUpdatedAt={data?.lastUpdatedAt ?? null}
        onRefresh={doRefresh}
        onLogin={doLogin}
        onLogout={doLogout}
      />
      <StatusBanner message={errorMessage} />
      <DashboardGrid data={data} />
    </div>
  );
}
