import { Activity, CircleDollarSign, Database, Gauge, KeyRound, Wallet } from "lucide-react";
import type { AuthState, DashboardData } from "../../shared/dashboardTypes";
import { formatCost, formatInteger, formatPercent, formatTokenWan } from "../formatters";

interface MiniDashboardProps {
  authState: AuthState;
  data: DashboardData | null;
  errorMessage: string | null;
  loading: boolean;
  onRefresh: () => void;
}

export function MiniDashboard({ authState, data, errorMessage, loading, onRefresh }: MiniDashboardProps) {
  const lastUpdated = data?.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleTimeString("zh-CN") : "-";
  const isLoggedIn = authState === "authenticated";

  return (
    <main className="mini-shell">
      <header className="mini-header">
        <div>
          <p className="mini-kicker">AIXW 实时看板</p>
          <h1>{isLoggedIn ? "当前账号" : "未登录"}</h1>
        </div>
        <button className="mini-refresh" type="button" onClick={onRefresh} disabled={loading} title="刷新">
          <Activity size={18} className={loading ? "spin" : ""} />
        </button>
      </header>

      <section className="mini-balance">
        <div className="mini-balance-icon">
          <Wallet size={24} />
        </div>
        <div>
          <p>余额</p>
          <strong>{formatCost(data?.balance)}</strong>
        </div>
      </section>

      <section className="mini-metrics">
        <MiniMetric icon={<KeyRound size={17} />} label="API 密钥" value={formatInteger(data?.apiKeyCount)} />
        <MiniMetric icon={<Activity size={17} />} label="今日请求" value={formatInteger(data?.todayRequests)} />
        <MiniMetric icon={<CircleDollarSign size={17} />} label="今日消费" value={formatCost(data?.todayActualCost)} />
        <MiniMetric icon={<Database size={17} />} label="今日 Token" value={formatTokenWan(data?.todayTokens)} />
        <MiniMetric icon={<Database size={17} />} label="累计 Token" value={formatTokenWan(data?.totalTokens)} />
        <MiniMetric icon={<Gauge size={17} />} label="缓存命中" value={formatPercent(data?.cacheHitRate)} />
      </section>

      <footer className="mini-footer">
        <span className={`mini-dot mini-dot-${authState}`} />
        <span>{isLoggedIn ? `最近刷新 ${lastUpdated}` : errorMessage ?? "请打开主窗口登录 AIXW"}</span>
      </footer>
    </main>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="mini-metric">
      <div className="mini-metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
