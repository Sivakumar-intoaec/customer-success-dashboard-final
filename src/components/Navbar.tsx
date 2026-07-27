import React from 'react';
import {
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  Settings,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  paidOrgsCount: number;
  totalOrgsCount: number;
  lastRefreshedAt: number | null;
  onOpenAiAssistant: () => void;
  onOpenSettings: () => void;
  onlyPaidOrgs: boolean;
  onToggleOnlyPaidOrgs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  paidOrgsCount,
  totalOrgsCount,
  lastRefreshedAt,
  onOpenAiAssistant,
  onOpenSettings,
  onlyPaidOrgs,
  onToggleOnlyPaidOrgs,
}) => {
  const refreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white">IntoAEC CS Hub</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-500/20 text-sky-200 border border-sky-500/30">
                  Customer Success
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Portfolio health for paid All-in-One accounts
                {refreshedLabel ? ` · Updated ${refreshedLabel}` : ''}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, account #, email, or ID…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onToggleOnlyPaidOrgs}
              title="Show only paid All-in-One customers"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                onlyPaidOrgs
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${onlyPaidOrgs ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span>Paid</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-900/60 font-semibold text-amber-200">
                {paidOrgsCount > 0 ? paidOrgsCount : totalOrgsCount}
              </span>
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Ask CS Copilot</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh portfolio"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              title="Connection settings"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
