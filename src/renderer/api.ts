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
  const bridge = window.aixwDashboard;
  if (!bridge) {
    return Promise.resolve(createBrowserFallbackEnvelope());
  }
  return bridge.refreshDashboard();
}

export function login(): Promise<DashboardEnvelope> {
  const bridge = window.aixwDashboard;
  if (!bridge) {
    return Promise.resolve(createBrowserFallbackEnvelope());
  }
  return bridge.login();
}

export function logout(): Promise<DashboardEnvelope> {
  const bridge = window.aixwDashboard;
  if (!bridge) {
    return Promise.resolve(createBrowserFallbackEnvelope());
  }
  return bridge.logout();
}

function createBrowserFallbackEnvelope(): DashboardEnvelope {
  return {
    authState: "unauthenticated",
    data: null,
    errorMessage: "当前页面不是 Electron 桌面端。请运行安装后的桌面软件，或使用 npm.cmd run dev 启动 Electron。",
  };
}
