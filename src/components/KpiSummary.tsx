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
  engagementWindow: 'daily' | 'weekly' | 'monthly';
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  summary,
  filteredCount,
  totalPaidCount,
  onlyPaidOrgs,
  onFilterClick,
  engagementWindow,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
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

  // AH-2 States: Health >= 70 (Healthy), 40-69 (Watch), <40 (Action)
  const healthColor = avgHealthScore >= 70 ? '#10b981' : avgHealthScore >= 40 ? '#f59e0b' : '#f43f5e';
  const healthBg = avgHealthScore >= 70 ? 'rgba(16,185,129,0.06)' : avgHealthScore >= 40 ? 'rgba(245,158,11,0.06)' : 'rgba(244,63,94,0.06)';
  const healthStatusLabel = avgHealthScore >= 70 ? 'Healthy' : avgHealthScore >= 40 ? 'Watch' : 'Action needed';

  // NF-3 States (Need Focus as % of book): Watch >= 10%, Action >= 20%, else Healthy
  const focusPercentage = totalAccounts > 0 ? (accountsNeedingAttention / totalAccounts) * 100 : 0;
  const focusColor = focusPercentage >= 20 ? '#f43f5e' : focusPercentage >= 10 ? '#f59e0b' : '#10b981';
  const focusBg = focusPercentage >= 20 ? 'rgba(244,63,94,0.06)' : focusPercentage >= 10 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)';

  // EN-3 Engagement states: >= 50% Healthy, 20-49% Watch, < 20% Action
  const engagementColor = stickinessPercent >= 50 ? '#10b981' : stickinessPercent >= 20 ? '#f59e0b' : '#f43f5e';
  const engagementBg = stickinessPercent >= 50 ? 'rgba(16,185,129,0.06)' : stickinessPercent >= 20 ? 'rgba(245,158,11,0.06)' : 'rgba(244,63,94,0.06)';

  // IR-4 Inactive Risk states: Red if >= 1 flagged, else Green
  const inactiveColor = churnRiskOrgs > 0 ? '#f43f5e' : '#10b981';
  const inactiveBg = churnRiskOrgs > 0 ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)';

  // CA-3 Critical Alerts states: Red if 3+, Yellow if 1-2, Green if 0
  const alertsColor = totalCriticalAlerts >= 3 ? '#f43f5e' : totalCriticalAlerts >= 1 ? '#f59e0b' : '#10b981';
  const alertsBg = totalCriticalAlerts >= 3 ? 'rgba(244,63,94,0.06)' : totalCriticalAlerts >= 1 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)';

  const cards = [
    {
      key: 'total',
      label: 'Accounts',
      value: filteredCount,
      suffix: onlyPaidOrgs ? 'paid' : `of ${totalAccounts}`,
      hint: totalPaidCount > 0 ? `${totalPaidCount} All-in-One` : 'Portfolio total',
      icon: Users,
      accent: '#0ea5e9',
      accentBg: 'rgba(14,165,233,0.06)',
      onClick: () => onFilterClick?.('all'),
    },
    {
      key: 'health',
      label: 'Avg Health',
      // AH-1: Mean of all paid-active org Health Scores, 1 decimal place.
      value: Number(avgHealthScore).toFixed(1),
      suffix: '/ 100',
      hint: `State: ${healthStatusLabel}`,
      icon: HeartPulse,
      accent: healthColor,
      accentBg: healthBg,
    },
    {
      key: 'attention',
      label: 'Need Focus',
      // NF-1: count(At-Risk) + count(Critical)
      value: accountsNeedingAttention,
      suffix: 'accounts',
      // NF-2: Display "X critical • Y at-risk"; Critical listed first.
      hint: `${distribution.critical} critical · ${distribution.atRisk} at-risk`,
      icon: AlertTriangle,
      accent: focusColor,
      accentBg: focusBg,
      onClick: () => onFilterClick?.('attention'),
    },
    {
      key: 'churn',
      label: 'Inactive Risk',
      // IR-4: Card = count of flagged (30+) orgs
      value: churnRiskOrgs,
      suffix: 'orgs',
      hint: 'Silent for 30+ days',
      icon: Flame,
      accent: inactiveColor,
      accentBg: inactiveBg,
    },
    {
      key: 'stickiness',
      label: 'Engagement',
      // EN-4 & EN-5: average of per-org stickiness (WAU/MAU) shown as %, fixed weekly/monthly
      value: `${stickinessPercent}%`,
      suffix: 'WAU/MAU',
      hint: 'Fixed engagement ratio',
      icon: Activity,
      accent: engagementColor,
      accentBg: engagementBg,
    },
    {
      key: 'alerts',
      label: 'Critical Alerts',
      // CA-1: Count of open ALERT-severity issues
      value: totalCriticalAlerts,
      suffix: 'open',
      hint: 'AECAutopilot alerts',
      icon: Bell,
      accent: alertsColor,
      accentBg: alertsBg,
      onClick: totalCriticalAlerts > 0 ? () => onFilterClick?.('attention') : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={card.onClick}
            className={`relative rounded-2xl p-4 border transition-all duration-200 animate-fade-in overflow-hidden ${
              card.onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''
            } bg-white border-slate-200 shadow-sm`}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl pointer-events-none"
              style={{ background: card.accent }}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div className="p-1.5 rounded-lg border border-slate-100" style={{ background: card.accentBg }}>
                <Icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-extrabold tracking-tight" style={{ color: card.accent }}>
                {card.value}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{card.suffix}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">{card.hint}</div>
          </div>
        );
      })}
    </div>
  );
};
