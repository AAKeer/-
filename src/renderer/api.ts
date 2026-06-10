import type { DashboardEnvelope } from "../shared/dashboardTypes";

declare global {
  interface Window {
    aixwDashboard: {
      refreshDashboard: () => Promise<DashboardEnvelope>;
      login: () => Promise<DashboardEnvelope>;
      logout: () => Promise<DashboardEnvelope>;
    };
  }
}

export function refreshDashboard(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.refreshDashboard();
}

export function login(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.login();
}

export function logout(): Promise<DashboardEnvelope> {
  return window.aixwDashboard.logout();
}
