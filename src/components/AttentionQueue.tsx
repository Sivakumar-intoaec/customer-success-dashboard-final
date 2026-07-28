import React from 'react';
import { AccountSummary } from '../types';
import { getSuggestedCsAction, moduleLabel } from '../utils/cs';
import { AlertTriangle, ChevronRight, ClipboardList, Flame } from 'lucide-react';

interface AttentionQueueProps {
  accounts: AccountSummary[];
  onSelectAccount: (account: AccountSummary) => void;
  onShowAllAttention: () => void;
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({
  accounts,
  onSelectAccount,
  onShowAllAttention,
}) => {
  const priority = accounts
    .filter(
      (a) =>
        a.healthBucket === 'critical' ||
        a.healthBucket === 'at-risk' ||
        (a.openAlertsCritical ?? 0) > 0 ||
        a.healthTrend === 'declining'
    )
    .sort((a, b) => {
      const rank = (x: AccountSummary) => {
        let r = x.healthScore;
        if ((x.openAlertsCritical ?? 0) > 0) r -= 20;
        if (x.healthTrend === 'declining') r -= 10;
        return r;
      };
      return rank(a) - rank(b);
    })
    .slice(0, 5);

  if (priority.length === 0) {
    return (
      <div className="rounded-2xl p-4 flex items-start gap-3 border bg-emerald-50 border-emerald-200 animate-fade-in shadow-sm">
        <div className="p-2 rounded-xl shrink-0 bg-emerald-100/60 border border-emerald-200/50">
          <ClipboardList className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-800">Today's focus queue looks clear 🎉</h3>
          <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">
            No critical, at-risk, or declining accounts right now. Keep nurturing healthy customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl p-4 sm:p-5 border bg-amber-50/20 border-amber-200/50 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0 bg-amber-50 border border-amber-200">
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Needs your attention today</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Highest-priority paid accounts — open one to see what to do next
            </p>
          </div>
        </div>
        <button
          onClick={onShowAllAttention}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors self-start sm:self-auto cursor-pointer"
        >
          View all needing focus →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {priority.map((account) => {
          const score = Math.round(account.healthScore || 0);
          const isCritical = account.healthBucket === 'critical';
          return (
            <button
              key={account.organizationId}
              type="button"
              onClick={() => onSelectAccount(account)}
              className="text-left p-3.5 rounded-xl border bg-white shadow-sm hover:shadow transition-all group hover:scale-[1.01] duration-200 cursor-pointer block w-full"
              style={{
                borderColor: isCritical ? '#fecdd3' : '#fde68a',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = isCritical ? '#f43f5e' : '#f59e0b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isCritical ? '#fecdd3' : '#fde68a'; }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                    {account.organizationName || 'Unnamed organization'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                    {account.accountNumber || account.countryCode || 'Paid customer'}
                    {account.lastModuleUsed ? ` · ${moduleLabel(account.lastModuleUsed)}` : ''}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                  style={{
                    background: isCritical ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)',
                    borderColor: isCritical ? 'rgba(244,63,94,0.18)' : 'rgba(245,158,11,0.18)',
                    color: isCritical ? '#be123c' : '#b45309',
                  }}>
                  {score}
                </span>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug line-clamp-2">{getSuggestedCsAction(account)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end text-[10px] font-bold text-sky-600 group-hover:text-sky-700 transition-colors">
                Open account
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
