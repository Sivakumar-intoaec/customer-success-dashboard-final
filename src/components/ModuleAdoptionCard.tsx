import React from 'react';
import { ModuleUsageSummaryItem } from '../types';
import { Layers } from 'lucide-react';

interface ModuleAdoptionCardProps {
  moduleUsageSummary: ModuleUsageSummaryItem[];
  totalAccountsCount: number;
}

export const ModuleAdoptionCard: React.FC<ModuleAdoptionCardProps> = ({
  moduleUsageSummary,
  totalAccountsCount,
}) => {
  if (!moduleUsageSummary || moduleUsageSummary.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Module adoption across customers</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Where teams spend time — and where you can coach unused products
          </p>
        </div>
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-sky-700">{moduleUsageSummary.length} modules</span> in use
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleUsageSummary.map((mod) => {
          const adoptionPct =
            totalAccountsCount > 0 ? Math.round((mod.orgCount / totalAccountsCount) * 100) : 0;

          return (
            <div
              key={mod.logSource}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{mod.label || mod.logSource}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                    adoptionPct >= 60
                      ? 'bg-emerald-100 text-emerald-800'
                      : adoptionPct >= 30
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {adoptionPct}%
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full my-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    adoptionPct >= 60 ? 'bg-emerald-500' : adoptionPct >= 30 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.max(adoptionPct, 4)}%` }}
                />
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between mb-3">
                <span>
                  Used by <strong>{mod.orgCount}</strong> accounts
                </span>
                <span>{adoptionPct >= 50 ? 'Popular' : 'Growth potential'}</span>
              </div>

              {mod.topFeatures?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Top features
                  </span>
                  {mod.topFeatures.slice(0, 3).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-slate-600"
                    >
                      <span className="truncate max-w-[170px]" title={feat.label || feat.logEvent}>
                        {feat.label || feat.logEvent}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {feat.activityCount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
