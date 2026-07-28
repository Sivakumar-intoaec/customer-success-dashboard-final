import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

interface PaymasterBannerProps {
  paidOrgsCount: number;
  totalOrgsCount: number;
  onlyPaidOrgs: boolean;
  onToggleOnlyPaidOrgs: () => void;
  isLoading?: boolean;
}

export const PaymasterBanner: React.FC<PaymasterBannerProps> = ({
  paidOrgsCount,
  totalOrgsCount,
  onlyPaidOrgs,
  onToggleOnlyPaidOrgs,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl p-4 border bg-amber-50/10 border-amber-200/40 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0 bg-amber-50 border border-amber-200">
            <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-850 text-slate-800">Paid All-in-One customers</h2>
              <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded-full border"
                style={{
                  background: isLoading ? 'rgba(100,116,139,0.06)' : 'rgba(16,185,129,0.06)',
                  color: isLoading ? '#64748b' : '#047857',
                  borderColor: isLoading ? 'rgba(100,116,139,0.18)' : 'rgba(16,185,129,0.18)'
                }}>
                {isLoading ? 'Syncing…' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Focused on paying customers so your team can prioritize real renewal and adoption risk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block font-bold">In portfolio</span>
            <span className="text-lg font-black text-amber-600">
              {paidOrgsCount || totalOrgsCount}{' '}
              <span className="text-xs text-slate-400 font-normal">paid accounts</span>
            </span>
          </div>

          <button
            onClick={onToggleOnlyPaidOrgs}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow"
            style={onlyPaidOrgs
              ? { background: '#f59e0b', color: '#ffffff' }
              : { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{onlyPaidOrgs ? 'Paid only (on)' : 'Show paid only'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
