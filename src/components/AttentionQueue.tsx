import React from 'react';
import { AccountSummary } from '../types';
import { getSuggestedCsAction, healthToneClasses, moduleLabel } from '../utils/cs';
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
          <ClipboardList className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-900">Today&apos;s focus queue looks clear</h3>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            No critical, at-risk, or declining accounts right now. Keep nurturing healthy customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Needs your attention today</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Highest-priority paid accounts — open one to see what to do next
            </p>
          </div>
        </div>
        <button
          onClick={onShowAllAttention}
          className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline-offset-2 hover:underline self-start sm:self-auto"
        >
          View all needing focus →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {priority.map((account) => {
          const score = Math.round(account.healthScore || 0);
          return (
            <button
              key={account.organizationId}
              type="button"
              onClick={() => onSelectAccount(account)}
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-700">
                    {account.organizationName || 'Unnamed organization'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {account.accountNumber || account.countryCode || 'Paid customer'}
                    {account.lastModuleUsed ? ` · Last used ${moduleLabel(account.lastModuleUsed)}` : ''}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold border ${healthToneClasses(score)}`}
                >
                  {score}
                </span>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{getSuggestedCsAction(account)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800">
                Open account
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
