import { LogIn, LogOut, RefreshCw } from "lucide-react";
import type { AuthState } from "../../shared/dashboardTypes";

interface HeaderBarProps {
  authState: AuthState;
  loading: boolean;
  countdown: number;
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function HeaderBar({
  authState,
  loading,
  countdown,
  lastUpdatedAt,
  onRefresh,
  onLogin,
  onLogout,
}: HeaderBarProps) {
  const lastUpdated = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString("zh-CN") : "-";
  const isLoggedIn = authState === "authenticated";

  return (
    <header className="header-bar">
      <div>
        <h1>AIXW 桌面实时看板</h1>
        <p>每 15 秒刷新一次 · 最近刷新：{lastUpdated}</p>
      </div>
      <div className="header-actions">
        <span className={`status-pill status-${authState}`}>{isLoggedIn ? "已登录" : "未登录"}</span>
        <button className="icon-button" type="button" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin" : ""} />
          {loading ? "刷新中" : `刷新 ${countdown}s`}
        </button>
        {isLoggedIn ? (
          <button className="icon-button" type="button" onClick={onLogout} disabled={loading}>
            <LogOut size={18} />
            退出
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onLogin} disabled={loading}>
            <LogIn size={18} />
            登录 AIXW
          </button>
        )}
      </div>
    </header>
  );
}
