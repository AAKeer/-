import { Activity, Box, Clock, Database, DollarSign, Gauge, KeyRound, WalletCards } from "lucide-react";
import { formatCost, formatDuration, formatInteger, formatPercent, formatTokenWan } from "./formatters";

const previewData = {
  balance: 47.25,
  apiKeyCount: 1,
  activeApiKeyCount: 1,
  todayRequests: 125,
  totalRequests: 1227,
  todayActualCost: 4.0157,
  totalActualCost: 52.7462,
  todayTokens: 4100000,
  totalTokens: 44000000,
  cacheHitRate: 35.7,
  averageDurationMs: 13710,
};

const metrics = [
  {
    label: "余额",
    value: formatCost(previewData.balance),
    helper: "可用",
    icon: WalletCards,
    tone: "green",
  },
  {
    label: "API 密钥",
    value: formatInteger(previewData.apiKeyCount),
    helper: `${formatInteger(previewData.activeApiKeyCount)} 启用`,
    icon: KeyRound,
    tone: "blue",
  },
  {
    label: "今日请求",
    value: formatInteger(previewData.todayRequests),
    helper: `总计：${formatInteger(previewData.totalRequests)}`,
    icon: Activity,
    tone: "green",
  },
  {
    label: "今日消费",
    value: formatCost(previewData.todayActualCost),
    helper: `总计：${formatCost(previewData.totalActualCost)}`,
    icon: DollarSign,
    tone: "purple",
  },
  {
    label: "今日 Token",
    value: formatTokenWan(previewData.todayTokens),
    helper: "单位：万",
    icon: Box,
    tone: "amber",
  },
  {
    label: "累计 Token",
    value: formatTokenWan(previewData.totalTokens),
    helper: "单位：万",
    icon: Database,
    tone: "blue",
  },
  {
    label: "缓存命中率",
    value: formatPercent(previewData.cacheHitRate),
    helper: "等待接入真实接口",
    icon: Gauge,
    tone: "cyan",
  },
  {
    label: "平均响应",
    value: formatDuration(previewData.averageDurationMs),
    helper: "平均时间",
    icon: Clock,
    tone: "rose",
  },
];

export function App() {
  return (
    <div className="app-shell">
      <header className="header-bar">
        <div>
          <h1>AIXW 桌面实时看板</h1>
          <p>预览界面 · 后续接入登录和 15 秒实时刷新</p>
        </div>
        <div className="header-actions">
          <span className="status-pill">未连接</span>
          <button className="primary-button" type="button">
            登录 AIXW
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`metric-card tone-${metric.tone}`} key={metric.label}>
              <div className="metric-icon">
                <Icon size={28} strokeWidth={2.2} />
              </div>
              <div className="metric-copy">
                <p className="metric-label">{metric.label}</p>
                <p className="metric-value">{metric.value}</p>
                <p className="metric-helper">{metric.helper}</p>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
