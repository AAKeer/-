import {
  Activity,
  Box,
  Clock,
  Database,
  DollarSign,
  Gauge,
  KeyRound,
  WalletCards,
} from "lucide-react";
import type { DashboardMetric } from "../../shared/dashboardTypes";

const icons = {
  wallet: WalletCards,
  key: KeyRound,
  activity: Activity,
  dollar: DollarSign,
  box: Box,
  database: Database,
  gauge: Gauge,
  clock: Clock,
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = icons[metric.icon];

  return (
    <article className={`metric-card tone-${metric.tone}`}>
      <div className="metric-icon">
        <Icon size={28} strokeWidth={2.2} />
      </div>
      <div className="metric-copy">
        <p className="metric-label">{metric.label}</p>
        <p className="metric-value">{metric.value}</p>
        {metric.helper ? <p className="metric-helper">{metric.helper}</p> : null}
      </div>
    </article>
  );
}
