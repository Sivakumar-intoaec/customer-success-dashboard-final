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
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white">Paid All-in-One customers</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isLoading ? 'Syncing…' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              This hub focuses on paying customers so your team can prioritize real renewal and
              adoption risk — not trial or test orgs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">In portfolio</span>
            <span className="text-base font-extrabold text-amber-300">
              {paidOrgsCount || totalOrgsCount}{' '}
              <span className="text-xs text-slate-400 font-normal">paid accounts</span>
            </span>
          </div>

          <button
            onClick={onToggleOnlyPaidOrgs}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              onlyPaidOrgs
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{onlyPaidOrgs ? 'Paid only (on)' : 'Show paid only'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
