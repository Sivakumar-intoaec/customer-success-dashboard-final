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
  if (!moduleUsageSummary || moduleUsageSummary.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 border bg-white border-slate-200 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border border-slate-100 bg-violet-50">
              <Layers className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Module adoption</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Where teams spend time — and where you can coach unused products
          </p>
        </div>
        <div className="text-xs text-violet-700 font-bold">
          {moduleUsageSummary.length}
          <span className="text-slate-500 font-medium"> modules in use</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleUsageSummary.map((mod) => {
          const adoptionPct = totalAccountsCount > 0 ? Math.round((mod.orgCount / totalAccountsCount) * 100) : 0;
          const barColor = adoptionPct >= 60 ? '#10b981' : adoptionPct >= 30 ? '#f59e0b' : '#0ea5e9';
          const badgeStyle = adoptionPct >= 60
            ? { background: 'rgba(16,185,129,0.06)', color: '#047857', border: '1px solid rgba(16,185,129,0.18)' }
            : adoptionPct >= 30
            ? { background: 'rgba(245,158,11,0.06)', color: '#b45309', border: '1px solid rgba(245,158,11,0.18)' }
            : { background: 'rgba(14,165,233,0.06)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.18)' };

          return (
            <div key={mod.logSource}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all hover:scale-[1.01] duration-200"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-slate-800 truncate">{mod.label || mod.logSource}</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full shrink-0" style={badgeStyle}>
                  {adoptionPct}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2 bg-slate-200/50 border border-slate-200/30">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(adoptionPct, 4)}%`, background: barColor }}
                />
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between mb-3">
                <span>Used by <strong className="text-slate-700">{mod.orgCount}</strong> accounts</span>
                <span style={{ color: adoptionPct >= 50 ? '#047857' : '#64748b' }} className="font-semibold">
                  {adoptionPct >= 50 ? 'Popular' : 'Growth potential'}
                </span>
              </div>

              {mod.topFeatures?.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Top features</span>
                  {mod.topFeatures.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[160px] text-slate-500" title={feat.label || feat.logEvent}>
                        {feat.label || feat.logEvent}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">{feat.activityCount.toLocaleString()}</span>
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
