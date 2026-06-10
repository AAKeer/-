import type { DashboardData, DashboardMetric } from "../../shared/dashboardTypes";
import { formatCost, formatDuration, formatInteger, formatPercent, formatTokenWan } from "../formatters";
import { MetricCard } from "./MetricCard";

function toMetrics(data: DashboardData | null): DashboardMetric[] {
  return [
    {
      label: "余额",
      value: formatCost(data?.balance),
      helper: "可用",
      tone: "green",
      icon: "wallet",
    },
    {
      label: "API 密钥",
      value: formatInteger(data?.apiKeyCount),
      helper: `${formatInteger(data?.activeApiKeyCount)} 启用`,
      tone: "blue",
      icon: "key",
    },
    {
      label: "今日请求",
      value: formatInteger(data?.todayRequests),
      helper: `总计：${formatInteger(data?.totalRequests)}`,
      tone: "green",
      icon: "activity",
    },
    {
      label: "今日消费",
      value: formatCost(data?.todayActualCost),
      helper: `总计：${formatCost(data?.totalActualCost)}`,
      tone: "purple",
      icon: "dollar",
    },
    {
      label: "今日 Token",
      value: formatTokenWan(data?.todayTokens),
      helper: "单位：万",
      tone: "amber",
      icon: "box",
    },
    {
      label: "累计 Token",
      value: formatTokenWan(data?.totalTokens),
      helper: "单位：万",
      tone: "blue",
      icon: "database",
    },
    {
      label: "缓存命中率",
      value: formatPercent(data?.cacheHitRate),
      helper: "按缓存读取 Token 计算",
      tone: "cyan",
      icon: "gauge",
    },
    {
      label: "平均响应",
      value: formatDuration(data?.averageDurationMs),
      helper: data?.rpm !== null && data?.rpm !== undefined ? `${formatInteger(data.rpm)} RPM` : "平均时间",
      tone: "rose",
      icon: "clock",
    },
  ];
}

export function DashboardGrid({ data }: { data: DashboardData | null }) {
  return (
    <main className="dashboard-grid">
      {toMetrics(data).map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </main>
  );
}
