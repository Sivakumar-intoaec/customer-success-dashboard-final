import React, { useMemo, useState } from 'react';
import { AccountSummary, DashboardFilter, PaymasterOrganization } from '../types';
import {
  formatRelativeTime,
  getSuggestedCsAction,
  healthToneClasses,
  moduleLabel,
} from '../utils/cs';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Zap,
  Mail,
  Copy,
  Check,
  Building,
  HeartPulse,
} from 'lucide-react';

interface AccountsTableProps {
  accounts: AccountSummary[];
  filter: DashboardFilter;
  onFilterChange: (updated: Partial<DashboardFilter>) => void;
  onSelectAccount: (account: AccountSummary) => void;
  onDraftEmailForAccount: (account: AccountSummary) => void;
  paidOrgsMap: Map<string, PaymasterOrganization>;
  engagementWindow: 'daily' | 'weekly' | 'monthly';
}

const CARD_STYLE: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(148, 163, 184, 0.08)',
};

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  filter,
  onFilterChange,
  onSelectAccount,
  onDraftEmailForAccount,
  paidOrgsMap,
  engagementWindow,
}) => {
  const [sortField, setSortField] = useState<'healthScore' | 'organizationName' | 'lastActivityAt' | 'riskScore'>('healthScore');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => { if (a.countryCode) set.add(a.countryCode); });
    return Array.from(set).sort();
  }, [accounts]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filter.onlyPaidOrgs && paidOrgsMap.size > 0) {
      const isPaid = paidOrgsMap.has(acc.organizationId) || Boolean(acc.isPaidPlan);
      if (!isPaid) return false;
    }
    if (filter.healthBucket === 'attention') {
      if (acc.healthBucket !== 'at-risk' && acc.healthBucket !== 'critical') return false;
    } else if (filter.healthBucket !== 'all' && acc.healthBucket !== filter.healthBucket) {
      return false;
    }
    if (filter.healthTrend !== 'all' && acc.healthTrend !== filter.healthTrend) return false;
    if (filter.countryFilter && (acc.countryCode || '') !== filter.countryFilter) return false;
    if (filter.moduleFilter !== 'all' && filter.moduleFilter) {
      if (!(acc.modulesUsed || []).includes(filter.moduleFilter)) return false;
    }
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      const name = (acc.organizationName || '').toLowerCase();
      const id = acc.organizationId.toLowerCase();
      const email = (acc.emailAddress || '').toLowerCase();
      const number = (acc.accountNumber || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q) && !email.includes(q) && !number.includes(q)) return false;
    }
    return true;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let valA: string | number = a[sortField] as string | number;
    let valB: string | number = b[sortField] as string | number;
    if (sortField === 'organizationName') {
      valA = (a.organizationName || a.organizationId).toLowerCase();
      valB = (b.organizationName || b.organizationId).toLowerCase();
    } else if (sortField === 'lastActivityAt') {
      valA = a.lastActivityAt || 0;
      valB = b.lastActivityAt || 0;
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'healthScore' | 'organizationName' | 'lastActivityAt' | 'riskScore') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === 'organizationName'); }
  };

  const bucketCounts = {
    all: accounts.length,
    healthy: accounts.filter((a) => a.healthBucket === 'healthy').length,
    atRisk: accounts.filter((a) => a.healthBucket === 'at-risk').length,
    critical: accounts.filter((a) => a.healthBucket === 'critical').length,
    attention: accounts.filter((a) => a.healthBucket === 'at-risk' || a.healthBucket === 'critical').length,
  };

  const pills = [
    { id: 'all' as const, label: `All (${bucketCounts.all})`, activeColor: '#0284c7', activeBg: 'rgba(14,165,233,0.06)' },
    { id: 'attention' as const, label: `Focus (${bucketCounts.attention})`, activeColor: '#b45309', activeBg: 'rgba(245,158,11,0.06)' },
    { id: 'healthy' as const, label: `Healthy (${bucketCounts.healthy})`, activeColor: '#047857', activeBg: 'rgba(16,185,129,0.06)' },
    { id: 'at-risk' as const, label: `At risk (${bucketCounts.atRisk})`, activeColor: '#b45309', activeBg: 'rgba(245,158,11,0.06)' },
    { id: 'critical' as const, label: `Critical (${bucketCounts.critical})`, activeColor: '#b91c1c', activeBg: 'rgba(244,63,94,0.06)' },
  ] as const;

  return (
    <div style={CARD_STYLE} className="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl animate-fade-in">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg border border-slate-100 bg-sky-50">
                <Building className="w-4 h-4 text-sky-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Customer accounts</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-8">
              Showing <strong className="text-slate-700">{sortedAccounts.length}</strong> of {accounts.length} · click a row for details
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filter.healthTrend}
              onChange={(e) => onFilterChange({ healthTrend: e.target.value as DashboardFilter['healthTrend'] })}
              className="text-xs rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none bg-slate-50 border border-slate-200 cursor-pointer"
            >
              <option value="all">All trends</option>
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>

            {countries.length > 0 && (
              <select
                value={filter.countryFilter}
                onChange={(e) => onFilterChange({ countryFilter: e.target.value })}
                className="text-xs rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <option value="">All countries</option>
                {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-xl w-fit bg-slate-100 border border-slate-200/60">
          {pills.map((pill) => {
            const isActive = filter.healthBucket === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onFilterChange({ healthBucket: pill.id })}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                style={isActive
                  ? { background: '#ffffff', color: pill.activeColor, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }
                  : { color: '#64748b', border: '1px solid transparent' }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="text-[10px] uppercase tracking-wider font-bold border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th onClick={() => handleSort('organizationName')} className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors">
                <div className="flex items-center gap-1">Customer <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th onClick={() => handleSort('healthScore')} className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors">
                <div className="flex items-center gap-1">Health <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-4">Engagement</th>
              <th className="py-3 px-4">Modules</th>
              <th className="py-3 px-4">Suggested next step</th>
              <th onClick={() => handleSort('lastActivityAt')} className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors">
                <div className="flex items-center gap-1">Last active <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedAccounts.length > 0 ? (
              sortedAccounts.map((account) => {
                const paidOrg = paidOrgsMap.get(account.organizationId);
                const isPaid = paidOrgsMap.size === 0 || paidOrg != null || account.isPaidPlan;
                const healthScore = Math.round(account.healthScore || 0);

                // Setup dynamic active users metrics format:
                const engagementLabel = engagementWindow === 'daily' ? 'DAU' : engagementWindow === 'weekly' ? 'WAU' : 'MAU';
                const activeCount = engagementWindow === 'daily' ? (account.dau || 0) : engagementWindow === 'weekly' ? (account.wau || 0) : (account.mau || 0);
                const userCountLimit = account.userCount || 1;
                const utilizationPercent = Math.min(100, Math.round((activeCount / userCountLimit) * 100));

                return (
                  <tr
                    key={account.organizationId}
                    onClick={() => onSelectAccount(account)}
                    className="hover:bg-slate-50/60 transition-all cursor-pointer group"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)' }}>
                          {(account.organizationName || 'O')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors text-[13px]">
                              {account.organizationName || 'Unnamed organization'}
                            </span>
                            {isPaid && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 border border-amber-200 text-amber-800">
                                <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Paid
                              </span>
                            )}
                            {account.countryCode && (
                              <span className="text-[9px] font-bold px-1 py-0.25 bg-slate-100 rounded text-slate-500">{account.countryCode}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-slate-400 font-mono text-[10px]">
                            <span className="truncate max-w-[120px]">{account.accountNumber || account.organizationId}</span>
                            <button
                              onClick={(e) => handleCopyId(e, account.organizationId)}
                              title="Copy ID"
                              className="p-0.5 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              {copiedId === account.organizationId ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </div>
                          {account.renewalDate && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 bg-slate-50 border border-slate-100 w-fit px-1.5 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: account.renewalState === 'action' ? '#ef4444' : account.renewalState === 'watch' ? '#f59e0b' : '#10b981' }}
                              />
                              <span>Renews {new Date(account.renewalDate).toLocaleDateString()}</span>
                              <span className="opacity-60 border-l border-slate-200 pl-1 ml-1 font-bold">
                                {account.daysToRenewal != null ? `${account.daysToRenewal}d left` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Health */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 border"
                          style={{
                            background: healthScore >= 70 ? 'rgba(16,185,129,0.06)' : healthScore >= 40 ? 'rgba(245,158,11,0.06)' : 'rgba(244,63,94,0.06)',
                            borderColor: healthScore >= 70 ? 'rgba(16,185,129,0.25)' : healthScore >= 40 ? 'rgba(245,158,11,0.25)' : 'rgba(244,63,94,0.25)',
                            color: healthScore >= 70 ? '#047857' : healthScore >= 40 ? '#b45309' : '#b91c1c',
                          }}>
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>{healthScore}</span>
                        </div>
                        {account.healthTrend === 'improving' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" title="Improving" />
                        ) : account.healthTrend === 'declining' ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-500" title="Declining" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-300" title="Stable" />
                        )}
                        {(account.openAlertsCritical ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {account.openAlertsCritical}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Engagement */}
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-semibold text-slate-700">{engagementLabel} {activeCount}/{account.userCount || 0}</span>
                          <span className="text-slate-400 font-bold">{utilizationPercent}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${utilizationPercent}%`,
                              background: 'linear-gradient(90deg, #0ea5e9, #0d9488)',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Modules */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {account.modulesUsed?.length ? (
                          account.modulesUsed.slice(0, 3).map((mod) => (
                            <span key={mod} className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/50 rounded-md">
                              {moduleLabel(mod)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">No modules yet</span>
                        )}
                        {(account.modulesUsed?.length || 0) > 3 && (
                          <span className="px-1 py-0.5 text-[9px] font-bold bg-sky-50 border border-sky-100 text-sky-700 rounded-md">
                            +{account.modulesUsed.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Suggested next step */}
                    <td className="py-3 px-4 max-w-[180px]">
                      <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {getSuggestedCsAction(account)}
                      </span>
                    </td>

                    {/* Last active */}
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                      {formatRelativeTime(account.lastActivityAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDraftEmailForAccount(account)}
                          title="Draft a check-in email"
                          className="p-1.5 rounded-lg border border-sky-100 text-sky-700 bg-sky-50 hover:bg-sky-100/80 transition-all cursor-pointer active:scale-95"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectAccount(account)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-0.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all cursor-pointer active:scale-95"
                        >
                          Open
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No accounts match these filters</p>
                    <button
                      onClick={() => onFilterChange({ healthBucket: 'all', healthTrend: 'all', countryFilter: '', moduleFilter: 'all', searchQuery: '' })}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
