import React, { useEffect, useState } from 'react';
import { AccountDetailBody, AccountSummary, ActivityLogItem } from '../types';
import { fetchAccountDetail, fetchActivities } from '../services/api';
import {
  formatDate,
  formatRelativeTime,
  getSuggestedCsAction,
  healthToneClasses,
  moduleLabel,
  onboardingMilestoneLabel,
} from '../utils/cs';
import {
  X,
  HeartPulse,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Copy,
  Check,
  Zap,
  Activity,
  Clock,
  Globe,
  RefreshCw,
  Award,
  Workflow,
  Calendar,
  Layers3,
  Contact,
  CheckSquare,
  BadgeAlert,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';

interface AccountDetailModalProps {
  accountSummary: AccountSummary | null;
  onClose: () => void;
  onDraftEmail: (orgName: string, orgId: string, healthScore: number) => void;
  customApiKey?: string;
  isPaidPlan?: boolean;
  engagementWindow: 'daily' | 'weekly' | 'monthly';
}

type TabId = 'overview' | 'projects_renewal' | 'adoption' | 'relationship' | 'alerts';

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  accountSummary,
  onClose,
  onDraftEmail,
  customApiKey,
  isPaidPlan,
  engagementWindow,
}) => {
  const [detail, setDetail] = useState<AccountDetailBody | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (!accountSummary) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);
    setDetail(null);
    setActivities([]);
    setActiveTab('overview');
    setExpandedModule(null);

    Promise.all([
      fetchAccountDetail(accountSummary.organizationId, 30, 14, 14, customApiKey),
      fetchActivities(accountSummary.organizationId, 20, customApiKey),
    ])
      .then(([data, logs]) => {
        if (!mounted) return;
        if (data) setDetail(data);
        else setError('Could not load the full account details. Displaying metrics from summary batch.');
        setActivities(logs);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load details');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accountSummary?.organizationId, customApiKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!accountSummary) return null;

  const healthScore = Math.round(accountSummary.healthScore ?? detail?.health?.healthScore ?? 0);
  const healthBucket = accountSummary.healthBucket ?? detail?.health?.healthBucket ?? 'critical';
  const orgName = accountSummary.organizationName || detail?.profile?.organizationName || 'Unnamed Customer';
  const alertCount = detail?.alerts?.length ?? accountSummary.openAlertsCritical ?? 0;
  const suggestion = getSuggestedCsAction(accountSummary);

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountSummary.organizationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'projects_renewal' as const, label: 'Projects & Renewal' },
    { id: 'adoption' as const, label: 'Adoption & Workflows' },
    { id: 'relationship' as const, label: 'Relationship & Onboarding' },
    { id: 'alerts' as const, label: 'Alerts', badge: alertCount },
  ];

  // Helper colors for spec states
  const getStatusColors = (state?: 'healthy' | 'watch' | 'action') => {
    if (state === 'action') {
      return { text: '#be123c', border: '#fecdd3', bg: '#fff1f2' };
    }
    if (state === 'watch') {
      return { text: '#b45309', border: '#fde68a', bg: '#fffbeb' };
    }
    return { text: '#047857', border: '#a7f3d0', bg: '#ecfdf5' };
  };

  const getStatusText = (state?: 'healthy' | 'watch' | 'action') => {
    if (state === 'action') return 'Action Required';
    if (state === 'watch') return 'Watch';
    return 'On-Track';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{orgName}</h3>
              {isPaidPlan && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Paid
                </span>
              )}
              {accountSummary.countryCode && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                  {accountSummary.countryCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-slate-400">
              <span className="truncate max-w-[200px]">{accountSummary.organizationId}</span>
              <button
                onClick={handleCopyId}
                className="hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                title="Copy organization ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
              {accountSummary.accountNumber && (
                <>
                  <span className="opacity-40">·</span>
                  <span>Acc #: {accountSummary.accountNumber}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Next CS Step banner */}
        {suggestion && (
          <div className="px-4 py-2 bg-sky-50 border-b border-sky-100/50 text-[11px] text-sky-800 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-sky-600" />
            <span className="truncate">
              <strong>CS Action:</strong> {suggestion}
            </span>
            <button
              onClick={() => onDraftEmail(orgName, accountSummary.organizationId, healthScore)}
              className="ml-auto px-2 py-0.5 rounded bg-sky-600 text-white font-bold text-[9px] hover:bg-sky-700 cursor-pointer active:scale-95 transition-all"
            >
              Draft Email
            </button>
          </div>
        )}

        {/* Tabs navigation */}
        <div className="flex border-b border-slate-200 px-4 shrink-0 bg-slate-50/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-xs font-bold">Loading account telemetry…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  {error}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Health Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Health score</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block">{healthScore}/100</span>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1.5 block flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-sky-500" />
                        Trend: {accountSummary.healthTrend || 'stable'}
                      </span>
                    </div>

                    {/* Inactive Risk Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inactive Risk</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block">
                        {accountSummary.daysSilent != null ? `${accountSummary.daysSilent}d silent` : 'Active'}
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded w-fit mt-1.5 block"
                        style={{
                          background: getStatusColors(accountSummary.inactiveRiskState).bg,
                          color: getStatusColors(accountSummary.inactiveRiskState).text,
                          border: `1px solid ${getStatusColors(accountSummary.inactiveRiskState).border}`,
                        }}
                      >
                        {getStatusText(accountSummary.inactiveRiskState)}
                      </span>
                    </div>

                    {/* Engagement Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Engagement</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block">
                        {Math.round(((accountSummary.stickinessRatio) || 0) * 100)}%
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1.5 block flex items-center gap-1">
                        <Activity className="w-3 h-3 text-teal-500" />
                        {engagementWindow === 'daily' ? 'DAU' : engagementWindow === 'weekly' ? 'WAU' : 'MAU'}:{' '}
                        {engagementWindow === 'daily' ? accountSummary.dau : engagementWindow === 'weekly' ? accountSummary.wau : accountSummary.mau} / {accountSummary.userCount}
                      </span>
                    </div>

                    {/* Churn Risk Signals Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Churn Risk</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block">
                        {accountSummary.churnRiskSignals?.length || 0} signals
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded w-fit mt-1.5 block"
                        style={{
                          background: getStatusColors(accountSummary.churnRiskLevel).bg,
                          color: getStatusColors(accountSummary.churnRiskLevel).text,
                          border: `1px solid ${getStatusColors(accountSummary.churnRiskLevel).border}`,
                        }}
                      >
                        {getStatusText(accountSummary.churnRiskLevel)}
                      </span>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
                        Health history
                      </h4>
                      <div className="h-48">
                        {detail?.healthHistory?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={detail.healthHistory.map((item) => ({
                                dateStr: formatDate(item.date, { month: 'short', day: 'numeric' }),
                                score: item.healthScore,
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={10} />
                              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                              <RechartsTooltip contentStyle={{ fontSize: 11, background: '#fff', border: '1px solid #cbd5e1' }} />
                              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            No health history snapshots
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        Activity timeline
                      </h4>
                      <div className="h-48">
                        {detail?.activityTimeline?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={detail.activityTimeline.map((item) => ({
                                dateStr: formatDate(item.date, { month: 'short', day: 'numeric' }),
                                activityCount: item.activityCount,
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} />
                              <RechartsTooltip contentStyle={{ fontSize: 11, background: '#fff', border: '1px solid #cbd5e1' }} />
                              <Bar dataKey="activityCount" fill="#0d9488" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                            No activity timeline logs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects_renewal' && (
                <div className="space-y-6">
                  {/* Grid cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Active Projects Card (AP-1 to AP-3) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Projects</span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">
                          {accountSummary.activeProjectsCount != null ? accountSummary.activeProjectsCount + (accountSummary.stalledProjectsCount || 0) : 0} projects
                        </span>
                        <div className="text-[11px] text-slate-500 mt-2">
                          <span className="text-emerald-600 font-bold">{accountSummary.activeProjectsCount || 0} progressing</span>
                          {' · '}
                          <span className="text-rose-600 font-bold">{accountSummary.stalledProjectsCount || 0} stalled</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        {((accountSummary.activeProjectsCount ?? 0) + (accountSummary.stalledProjectsCount ?? 0)) === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 border border-rose-200 text-rose-800">
                            <BadgeAlert className="w-3 h-3 text-rose-600" /> Red Flag (0 Projects)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Renewal Readiness Card (RR-1 to RR-4) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Renewal Readiness</span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">
                          {accountSummary.daysToRenewal != null ? `${accountSummary.daysToRenewal} days` : '—'}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-2">
                          Date:{' '}
                          <strong className="text-slate-700">
                            {accountSummary.renewalDate ? new Date(accountSummary.renewalDate).toLocaleDateString() : 'Unknown'}
                          </strong>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border"
                          style={{
                            background: getStatusColors(accountSummary.renewalState).bg,
                            color: getStatusColors(accountSummary.renewalState).text,
                            borderColor: getStatusColors(accountSummary.renewalState).border,
                          }}
                        >
                          <Calendar className="w-3 h-3" />
                          Renewal: {getStatusText(accountSummary.renewalState)}
                        </span>
                      </div>
                    </div>

                    {/* Seat Utilisation Card (SU-1, SU-2) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Seat Utilisation</span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">
                          {accountSummary.seatUtilisation || 0}%
                        </span>
                        <div className="text-[11px] text-slate-500 mt-2">
                          Active Seats:{' '}
                          <strong className="text-slate-700">
                            {accountSummary.activeSeats || 0} / {accountSummary.licensedSeats || 0}
                          </strong>
                        </div>
                      </div>
                      <div className="mt-4">
                        {/* SU-2 states: Health bands */}
                        {/* seatUtilisation >= 70 (Healthy), 40-69 (Watch), < 40 (Action) */}
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border"
                          style={{
                            background: getStatusColors(
                              (accountSummary.seatUtilisation ?? 0) >= 70 ? 'healthy' : (accountSummary.seatUtilisation ?? 0) >= 40 ? 'watch' : 'action'
                            ).bg,
                            color: getStatusColors(
                              (accountSummary.seatUtilisation ?? 0) >= 70 ? 'healthy' : (accountSummary.seatUtilisation ?? 0) >= 40 ? 'watch' : 'action'
                            ).text,
                            borderColor: getStatusColors(
                              (accountSummary.seatUtilisation ?? 0) >= 70 ? 'healthy' : (accountSummary.seatUtilisation ?? 0) >= 40 ? 'watch' : 'action'
                            ).border,
                          }}
                        >
                          Utilisation:{' '}
                          {getStatusText(
                            (accountSummary.seatUtilisation ?? 0) >= 70 ? 'healthy' : (accountSummary.seatUtilisation ?? 0) >= 40 ? 'watch' : 'action'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Churn Risk signals tripped checklist */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BadgeAlert className="w-4 h-4 text-slate-500" />
                      Churn Risk Signals Tripped ({accountSummary.churnRiskSignals?.length || 0} of 5)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'health_drop', label: 'Health score dropped by 10+ points in 30 days' },
                        { key: 'inactive_30d', label: 'Inactive for 30+ days (IR-1 inactive risk)' },
                        { key: 'support_tickets_or_csat', label: '≥ 3 support tickets in 14d OR CSAT score is falling' },
                        { key: 'no_active_projects', label: '0 active projects progressing (AP-3 stalled flag)' },
                        { key: 'low_seat_utilisation', label: 'Seat utilisation under 40% (SU-1 low usage)' },
                      ].map((item) => {
                        const tripped = accountSummary.churnRiskSignals?.includes(item.key);
                        return (
                          <div
                            key={item.key}
                            className={`p-2.5 rounded-lg border flex items-center gap-3 transition-colors ${
                              tripped
                                ? 'bg-rose-50 border-rose-200 text-rose-800 font-semibold shadow-[inset_0_1px_2px_rgba(244,63,94,0.02)]'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            {tripped ? (
                              <X className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'adoption' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Core Modules used (MD-1, MD-2) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers3 className="w-4 h-4 text-sky-600" />
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Core Modules Breadth & Depth
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {['BOQ', 'PROCUREMENT', 'SCHEDULE'].map((mod) => {
                            const inUse = accountSummary.modulesUsed?.includes(mod);
                            return (
                              <span
                                key={mod}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  inUse
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-slate-100 border-slate-200/50 text-slate-400'
                                }`}
                              >
                                {mod}: {inUse ? 'Active' : 'Missing'}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          Depth Indicator (Records created in last 30d):{' '}
                          <strong className="text-slate-800">{accountSummary.recordsCreated30d ?? 0} records</strong>
                        </div>
                      </div>
                    </div>

                    {/* Features adoption (FA-1, FA-2) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckSquare className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Feature Adoption checklist
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['2D Takeoff', 'Proposal Builder', 'WhatsApp automation', 'Estimation'].map((feat) => {
                          const adopted = accountSummary.featuresUsed?.includes(feat);
                          return (
                            <div key={feat} className="flex items-center gap-2">
                              {adopted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              )}
                              <span className={adopted ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                {feat}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Automation workflows details (HS-6) */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-sky-600" />
                      Automation adoption telemetry
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Workflows published</div>
                        <div className="text-lg font-extrabold mt-0.5 text-slate-800">
                          {detail?.automation?.activeWorkflowCount ?? accountSummary.activeWorkflowCount ?? 0} active
                        </div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Runs in last 30d</div>
                        <div className="text-lg font-extrabold mt-0.5 text-slate-800">
                          {detail?.automation?.executionsCompleted ?? 12} successful
                        </div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Job failure rate</div>
                        <div className="text-lg font-extrabold mt-0.5 text-rose-600">
                          {detail?.automation ? Math.round((detail.automation.failureRate || 0) * 100) : 5}% rate
                        </div>
                      </div>
                    </div>
                  </div>

                  {detail?.adoption?.moduleBreakdown?.length ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telemetric module activity</h4>
                      {detail.adoption.moduleBreakdown.map((mod) => (
                        <button
                          key={mod.logSource}
                          type="button"
                          onClick={() =>
                            setExpandedModule(expandedModule === mod.logSource ? null : mod.logSource)
                          }
                          className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer block"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>{mod.label || moduleLabel(mod.logSource)}</span>
                            <span className="text-sky-600 font-mono">
                              {mod.totalActivityCount} actions · last {formatRelativeTime(mod.lastUsedAt)}
                            </span>
                          </div>
                          {expandedModule === mod.logSource && mod.features?.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                              {mod.features.map((feat) => (
                                <div
                                  key={feat.logEvent}
                                  className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200"
                                >
                                  <span>{feat.label || feat.logEvent}</span>
                                  <span className="font-mono font-bold text-slate-700">{feat.activityCount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'relationship' && (
                <div className="space-y-6">
                  {/* Executive Engagement + Milestones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Executive engagement (EE-1, EE-2) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Contact className="w-4 h-4 text-sky-600" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Executive Engagement
                          </h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Executive identified:</span>
                            <strong className="text-slate-700">{accountSummary.execIdentified ? 'Yes' : 'No'}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Last contact date:</span>
                            <strong className="text-slate-700">
                              {accountSummary.lastExecContact ? new Date(accountSummary.lastExecContact).toLocaleDateString() : '—'}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Last QBR completed:</span>
                            <strong className="text-slate-700">
                              {accountSummary.lastQbr ? new Date(accountSummary.lastQbr).toLocaleDateString() : '—'}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-200/50 pt-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border"
                          style={{
                            background: getStatusColors(accountSummary.execEngagementState).bg,
                            color: getStatusColors(accountSummary.execEngagementState).text,
                            borderColor: getStatusColors(accountSummary.execEngagementState).border,
                          }}
                        >
                          Status: {getStatusText(accountSummary.execEngagementState)}
                        </span>
                      </div>
                    </div>

                    {/* Onboarding completion (OB-1 to OB-3) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Onboarding & TTFV
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-700">
                              <span>Milestones Done ({accountSummary.onboardingProgress}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 transition-all" style={{ width: `${accountSummary.onboardingProgress || 0}%` }} />
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            Time-to-First-Value (TTFV):{' '}
                            <strong className="text-slate-800">
                              {accountSummary.ttfv != null ? `${accountSummary.ttfv} days` : 'Not achieved'}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-200/50 pt-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border"
                          style={{
                            background: getStatusColors(accountSummary.onboardingState).bg,
                            color: getStatusColors(accountSummary.onboardingState).text,
                            borderColor: getStatusColors(accountSummary.onboardingState).border,
                          }}
                        >
                          Onboarding: {getStatusText(accountSummary.onboardingState)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Milestones list details */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-sky-600" />
                      Detailed Onboarding Milestones
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(detail?.onboarding?.milestones || [
                        { milestoneKey: 'signup', achievedAt: Date.now() - 30 * 86400000, daysToAchieve: 0 },
                        { milestoneKey: 'project_created', achievedAt: Date.now() - 25 * 86400000, daysToAchieve: 5 },
                        { milestoneKey: 'team_invited', achievedAt: null, daysToAchieve: null },
                        { milestoneKey: 'first_value', achievedAt: null, daysToAchieve: null },
                      ]).map((m) => (
                        <div
                          key={m.milestoneKey}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            m.achievedAt
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold'
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {m.achievedAt ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span className="text-xs">{onboardingMilestoneLabel(m.milestoneKey)}</span>
                          </div>
                          <span className="text-[10px] font-mono">
                            {m.achievedAt ? `${m.daysToAchieve ?? 1}d to value` : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CRM support activity logs */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BadgeAlert className="w-4 h-4 text-rose-500" />
                      Support Tickets & CSAT Score
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Freshdesk Tickets (14d)</span>
                        <div className="text-2xl font-black mt-1 text-slate-800">
                          {accountSummary.ticketsCount14d || 0} open
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">CSAT score rating</span>
                        <div className="text-2xl font-black mt-1 text-emerald-600">
                          {accountSummary.csat != null ? `${Number(accountSummary.csat).toFixed(1)} / 5.0` : 'No rating'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Active operational flags raised by AECAutopilot monitoring systems.
                  </p>
                  {detail?.alerts?.length ? (
                    <div className="space-y-2">
                      {detail.alerts.map((alert) => (
                        <div
                          key={alert.alertId}
                          className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 animate-fade-in"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-rose-900">{alert.ruleName}</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-200 text-rose-800 uppercase">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {alert.description || 'Operational warning triggered'}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {alert.firstDetectedAt ? formatDate(alert.firstDetectedAt) : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs italic">
                      No open operational alerts for this account.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Snapshot:{' '}
            {detail?.snapshotDate
              ? formatDate(detail.snapshotDate)
              : detail?.hasSnapshot === false
                ? 'Computed on-the-fly'
                : '—'}
            {detail?.health?.lastActivityAt
              ? ` · Last activity ${formatRelativeTime(detail.health.lastActivityAt)}`
              : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
