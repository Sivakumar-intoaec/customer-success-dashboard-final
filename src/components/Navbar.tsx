import React from 'react';
import {
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  Settings,
  Zap,
  MonitorPlay,
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
  onOpenPresentation: () => void;
  hasPresentationData: boolean;
  engagementWindow: 'daily' | 'weekly' | 'monthly';
  onEngagementWindowChange: (window: 'daily' | 'weekly' | 'monthly') => void;
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
  onOpenPresentation,
  hasPresentationData,
  engagementWindow,
  onEngagementWindowChange,
}) => {
  const refreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold tracking-tight text-slate-800">IntoAEC CS Hub</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                  style={{ background: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.18)', color: '#0284c7' }}>
                  Customer Success
                </span>
                {/* Live indicator */}
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="status-dot" />
                  {isLoading ? 'Syncing…' : refreshedLabel ? `Updated ${refreshedLabel}` : 'Live'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Portfolio health for paid All-in-One accounts
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, account #, email, or ID…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Engagement window toggle */}
          <div className="flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200/60 shrink-0">
            {(['daily', 'weekly', 'monthly'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onEngagementWindowChange(w)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  engagementWindow === w
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {w === 'daily' ? 'Day' : w === 'weekly' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleOnlyPaidOrgs}
              title="Show only paid All-in-One customers"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={onlyPaidOrgs
                ? { background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#b45309' }
                : { background: 'rgba(241,245,249,0.8)', borderColor: 'rgba(226,232,240,0.8)', color: '#475569' }}
            >
              <Zap className={`w-3.5 h-3.5 ${onlyPaidOrgs ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>Paid</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#b45309' }}>
                {paidOrgsCount > 0 ? paidOrgsCount : totalOrgsCount}
              </span>
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Ask CS Copilot</span>
            </button>

            {/* CEO Presentation button */}
            <button
              onClick={onOpenPresentation}
              title={hasPresentationData ? 'Open CEO presentation' : 'Load data first'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 relative group cursor-pointer"
              style={hasPresentationData
                ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.15)' }
                : { background: 'rgba(241,245,249,0.8)', color: '#94a3b8', border: '1px solid rgba(226,232,240,0.8)', cursor: 'not-allowed' }}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Present</span>
              {/* Tooltip */}
              {!hasPresentationData && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-slate-200 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Load data first
                </span>
              )}
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh portfolio"
              className="p-2 rounded-lg text-slate-500 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              title="Connection settings"
              className="p-2 rounded-lg text-slate-500 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-400"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
