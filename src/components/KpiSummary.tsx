import React from 'react';
import { PortfolioSummary, HealthBucketFilter } from '../types';
import {
  Users,
  HeartPulse,
  AlertTriangle,
  Flame,
  Activity,
  Bell,
} from 'lucide-react';

interface KpiSummaryProps {
  summary: PortfolioSummary | null;
  filteredCount: number;
  totalPaidCount: number;
  onlyPaidOrgs: boolean;
  onFilterClick?: (filter: HealthBucketFilter) => void;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  summary,
  filteredCount,
  totalPaidCount,
  onlyPaidOrgs,
  onFilterClick,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const {
    totalAccounts,
    avgHealthScore,
    avgStickiness,
    accountsNeedingAttention,
    churnRiskOrgs,
    totalCriticalAlerts,
    distribution,
  } = summary;

  const stickinessPercent = Math.round((avgStickiness || 0) * 100);

  const cards = [
    {
      key: 'total',
      label: 'Accounts in view',
      value: filteredCount,
      suffix: onlyPaidOrgs ? 'paid' : `of ${totalAccounts}`,
      hint: totalPaidCount > 0 ? `${totalPaidCount} on All-in-One` : 'Active portfolio',
      icon: Users,
      iconClass: 'bg-sky-50 text-sky-600',
      onClick: () => onFilterClick?.('all'),
    },
    {
      key: 'health',
      label: 'Avg health score',
      value: Math.round(avgHealthScore),
      suffix: '/ 100',
      hint:
        avgHealthScore >= 70
          ? 'Healthy portfolio'
          : avgHealthScore >= 40
            ? 'Needs monitoring'
            : 'Needs CS focus',
      icon: HeartPulse,
      iconClass:
        avgHealthScore >= 70
          ? 'bg-emerald-50 text-emerald-600'
          : avgHealthScore >= 40
            ? 'bg-amber-50 text-amber-600'
            : 'bg-rose-50 text-rose-600',
      valueClass:
        avgHealthScore >= 70
          ? 'text-emerald-700'
          : avgHealthScore >= 40
            ? 'text-amber-700'
            : 'text-rose-700',
    },
    {
      key: 'attention',
      label: 'Needs CS focus',
      value: accountsNeedingAttention,
      suffix: 'accounts',
      hint: `${distribution.critical} critical · ${distribution.atRisk} at risk`,
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-600',
      valueClass: 'text-amber-600',
      borderClass: 'border-amber-200',
      onClick: () => onFilterClick?.('attention'),
    },
    {
      key: 'churn',
      label: 'Inactive-user risk',
      value: churnRiskOrgs,
      suffix: 'orgs',
      hint: 'Users quiet for 14+ days',
      icon: Flame,
      iconClass: 'bg-rose-50 text-rose-600',
      valueClass: 'text-rose-600',
    },
    {
      key: 'stickiness',
      label: 'Daily engagement',
      value: `${stickinessPercent}%`,
      suffix: 'DAU / MAU',
      hint: 'How often teams come back',
      icon: Activity,
      iconClass: 'bg-teal-50 text-teal-600',
    },
    {
      key: 'alerts',
      label: 'Critical alerts',
      value: totalCriticalAlerts,
      suffix: 'open',
      hint: 'Operational issues flagged',
      icon: Bell,
      iconClass: 'bg-violet-50 text-violet-600',
      valueClass: totalCriticalAlerts > 0 ? 'text-rose-600' : undefined,
      onClick: totalCriticalAlerts > 0 ? () => onFilterClick?.('attention') : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={card.onClick}
            className={`bg-white rounded-xl p-4 border shadow-sm transition-all ${
              card.borderClass || 'border-slate-200'
            } ${card.onClick ? 'cursor-pointer hover:shadow-md hover:border-sky-300' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${card.valueClass || 'text-slate-900'}`}>
                {card.value}
              </span>
              <span className="text-xs text-slate-500">{card.suffix}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">{card.hint}</div>
          </div>
        );
      })}
    </div>
  );
};
