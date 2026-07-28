import React from 'react';
import { PortfolioSummary, DailyTrendItem } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Info } from 'lucide-react';

interface HealthDistributionChartProps {
  summary: PortfolioSummary | null;
  dailyTrend: DailyTrendItem[];
  onSelectBucket?: (bucket: 'all' | 'healthy' | 'at-risk' | 'critical') => void;
}

const CARD_STYLE: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(148, 163, 184, 0.08)',
};

export const HealthDistributionChart: React.FC<HealthDistributionChartProps> = ({
  summary,
  dailyTrend,
  onSelectBucket,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 skeleton h-72 rounded-2xl" />
        <div className="lg:col-span-7 skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const { distribution } = summary;

  const pieData = [
    { name: 'Healthy (≥70)', value: distribution.healthy, color: '#10b981', bucket: 'healthy' as const },
    { name: 'At Risk (40–69)', value: distribution.atRisk, color: '#f59e0b', bucket: 'at-risk' as const },
    { name: 'Critical (<40)', value: distribution.critical, color: '#f43f5e', bucket: 'critical' as const },
  ].filter((item) => item.value > 0);

  const formattedTrendData = (dailyTrend || []).map((item) => {
    const d = new Date(item.date);
    const dateStr = !isNaN(d.getTime())
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : 'Day';
    return {
      dateStr,
      avgHealthScore: Math.round(item.avgHealthScore || 0),
      avgStickinessPct: Math.round((item.avgStickiness || 0) * 100),
      orgCount: item.orgCount,
    };
  });

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#1e293b',
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(148, 163, 184, 0.12)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Pie chart */}
      <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm animate-fade-in" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border border-slate-100 bg-sky-50">
              <PieIcon className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Health distribution</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => onSelectBucket?.('all')}>
            Click a slice to filter
          </span>
        </div>

        <div className="h-52 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                dataKey="value"
                onClick={(_data, index) => {
                  const item = pieData[index];
                  if (item) onSelectBucket?.(item.bucket);
                }}
                className="cursor-pointer animate-fade-in"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.95} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: number) => [`${value} Accounts`, 'Count']}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-800">{summary.totalAccounts}</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Accounts</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          {[
            { label: 'Healthy', count: distribution.healthy, color: '#047857', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', bucket: 'healthy' as const },
            { label: 'At Risk', count: distribution.atRisk, color: '#b45309', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', bucket: 'at-risk' as const },
            { label: 'Critical', count: distribution.critical, color: '#b91c1c', bg: 'rgba(244,63,94,0.06)', border: 'rgba(244,63,94,0.18)', bucket: 'critical' as const },
          ].map((b) => (
            <button
              key={b.bucket}
              onClick={() => onSelectBucket?.(b.bucket)}
              className="p-2 rounded-xl text-left transition-all hover:scale-[1.03] cursor-pointer"
              style={{ background: b.bg, border: `1px solid ${b.border}` }}
            >
              <div className="text-base font-black" style={{ color: b.color }}>{b.count}</div>
              <div className="text-[10px] font-bold text-slate-500">{b.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trend line chart */}
      <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm animate-fade-in" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border border-slate-100 bg-sky-50">
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Portfolio trend</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Last {formattedTrendData.length > 0 ? `${formattedTrendData.length} days` : '14 days'}</span>
        </div>

        <div className="h-56 w-full">
          {formattedTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#64748b', marginBottom: 4 }}
                  formatter={(value: number, name: string) => [
                    name === 'avgHealthScore' ? `${value}/100` : `${value}%`,
                    name === 'avgHealthScore' ? 'Avg Health Score' : 'Engagement (DAU/MAU)',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgHealthScore"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 1.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgStickinessPct"
                  stroke="#0d9488"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 2.5, fill: '#0d9488', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-8">
              <div className="p-3 rounded-full bg-slate-50 border border-slate-100">
                <TrendingUp className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">No trend data yet</p>
              <p className="text-xs text-slate-400 max-w-xs leading-normal">
                Trends appear after the daily health snapshot job runs. Account pages still show live scores.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full inline-block bg-sky-500" />
              <span>Avg health</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full inline-block bg-teal-600" style={{ borderTop: '2px dashed #0d9488', height: 0 }} />
              <span>Engagement</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Info className="w-3 h-3 text-slate-300" />
            <span>UTC daily snapshots</span>
          </div>
        </div>
      </div>
    </div>
  );
};
