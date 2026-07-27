import React, { useMemo, useState } from 'react';
import { AccountSummary, DashboardFilter } from '../types';
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
  paidOrgsSet: Set<string>;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  filter,
  onFilterChange,
  onSelectAccount,
  onDraftEmailForAccount,
  paidOrgsSet,
}) => {
  const [sortField, setSortField] = useState<'healthScore' | 'organizationName' | 'lastActivityAt' | 'riskScore'>('healthScore');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      if (a.countryCode) set.add(a.countryCode);
    });
    return Array.from(set).sort();
  }, [accounts]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAccounts = accounts.filter((acc) => {
    // Portfolio APIs are already paid-only. Only apply Paymaster filter when we have IDs.
    if (filter.onlyPaidOrgs && paidOrgsSet.size > 0) {
      const isPaid = paidOrgsSet.has(acc.organizationId) || Boolean(acc.isPaidPlan);
      if (!isPaid) return false;
    }

    if (filter.healthBucket === 'attention') {
      if (acc.healthBucket !== 'at-risk' && acc.healthBucket !== 'critical') return false;
    } else if (filter.healthBucket !== 'all' && acc.healthBucket !== filter.healthBucket) {
      return false;
    }

    if (filter.healthTrend !== 'all' && acc.healthTrend !== filter.healthTrend) {
      return false;
    }

    if (filter.countryFilter && (acc.countryCode || '') !== filter.countryFilter) {
      return false;
    }

    if (filter.moduleFilter !== 'all' && filter.moduleFilter) {
      if (!(acc.modulesUsed || []).includes(filter.moduleFilter)) return false;
    }

    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      const name = (acc.organizationName || '').toLowerCase();
      const id = acc.organizationId.toLowerCase();
      const email = (acc.emailAddress || '').toLowerCase();
      const number = (acc.accountNumber || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q) && !email.includes(q) && !number.includes(q)) {
        return false;
      }
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
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'organizationName');
    }
  };

  const bucketCounts = {
    all: accounts.length,
    healthy: accounts.filter((a) => a.healthBucket === 'healthy').length,
    atRisk: accounts.filter((a) => a.healthBucket === 'at-risk').length,
    critical: accounts.filter((a) => a.healthBucket === 'critical').length,
    attention: accounts.filter((a) => a.healthBucket === 'at-risk' || a.healthBucket === 'critical').length,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">Customer accounts</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {sortedAccounts.length} of {accounts.length} · click a row for the full account picture
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filter.healthTrend}
              onChange={(e) =>
                onFilterChange({
                  healthTrend: e.target.value as DashboardFilter['healthTrend'],
                })
              }
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
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
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
          {(
            [
              { id: 'all' as const, label: `All (${bucketCounts.all})` },
              { id: 'attention' as const, label: `Needs focus (${bucketCounts.attention})`, active: 'bg-amber-500 text-white' },
              { id: 'healthy' as const, label: `Healthy (${bucketCounts.healthy})`, active: 'bg-emerald-500 text-white' },
              { id: 'at-risk' as const, label: `At risk (${bucketCounts.atRisk})`, active: 'bg-amber-500 text-white' },
              { id: 'critical' as const, label: `Critical (${bucketCounts.critical})`, active: 'bg-rose-500 text-white' },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              onClick={() => onFilterChange({ healthBucket: pill.id })}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                filter.healthBucket === pill.id
                  ? 'active' in pill && pill.active
                    ? pill.active
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
            <tr>
              <th onClick={() => handleSort('organizationName')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">
                  Customer <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th onClick={() => handleSort('healthScore')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">
                  Health <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Engagement</th>
              <th className="py-3 px-4">Modules</th>
              <th className="py-3 px-4">Suggested next step</th>
              <th onClick={() => handleSort('lastActivityAt')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1">
                  Last active <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedAccounts.length > 0 ? (
              sortedAccounts.map((account) => {
                const isPaid = paidOrgsSet.size === 0 || paidOrgsSet.has(account.organizationId) || account.isPaidPlan;
                const healthScore = Math.round(account.healthScore || 0);

                return (
                  <tr
                    key={account.organizationId}
                    onClick={() => onSelectAccount(account)}
                    className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-sky-50 text-sky-700 font-bold shrink-0 mt-0.5">
                          {(account.organizationName || 'O')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 group-hover:text-sky-700 text-sm">
                              {account.organizationName || 'Unnamed organization'}
                            </span>
                            {isPaid && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300/40">
                                <Zap className="w-2.5 h-2.5 fill-amber-500" /> Paid
                              </span>
                            )}
                            {account.countryCode && (
                              <span className="text-[10px] font-semibold text-slate-400">{account.countryCode}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-400 font-mono text-[11px]">
                            <span className="truncate max-w-[160px]">
                              {account.accountNumber || account.organizationId}
                            </span>
                            <button
                              onClick={(e) => handleCopyId(e, account.organizationId)}
                              title="Copy organization ID"
                              className="p-1 hover:text-slate-700"
                            >
                              {copiedId === account.organizationId ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${healthToneClasses(healthScore)}`}>
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>{healthScore}</span>
                        </div>
                        {account.healthTrend === 'improving' ? (
                          <span title="Improving">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          </span>
                        ) : account.healthTrend === 'declining' ? (
                          <span title="Declining">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        ) : (
                          <span title="Stable">
                            <Minus className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        )}
                        {(account.openAlertsCritical ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {account.openAlertsCritical}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">
                            {Math.round((account.stickinessRatio || 0) * 100)}%
                          </span>
                          <span className="text-slate-400">DAU {account.dau || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full"
                            style={{ width: `${Math.min(Math.round((account.stickinessRatio || 0) * 100), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {account.modulesUsed?.length ? (
                          account.modulesUsed.slice(0, 3).map((mod) => (
                            <span
                              key={mod}
                              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700"
                            >
                              {moduleLabel(mod)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No modules yet</span>
                        )}
                        {(account.modulesUsed?.length || 0) > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-700">
                            +{account.modulesUsed.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <span className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {getSuggestedCsAction(account)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatRelativeTime(account.lastActivityAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDraftEmailForAccount(account)}
                          title="Draft a check-in email"
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectAccount(account)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 text-xs font-semibold flex items-center gap-1"
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
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No accounts match these filters</p>
                    <button
                      onClick={() =>
                        onFilterChange({
                          healthBucket: 'all',
                          healthTrend: 'all',
                          countryFilter: '',
                          moduleFilter: 'all',
                          searchQuery: '',
                        })
                      }
                      className="text-xs font-semibold text-sky-700 hover:underline"
                    >
                      Clear filters
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
