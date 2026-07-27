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

export const HealthDistributionChart: React.FC<HealthDistributionChartProps> = ({
  summary,
  dailyTrend,
  onSelectBucket,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 h-72 animate-pulse" />
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 h-72 animate-pulse" />
      </div>
    );
  }

  const { distribution } = summary;

  const pieData = [
    { name: 'Healthy (≥70)', value: distribution.healthy, color: '#10b981', bucket: 'healthy' as const },
    { name: 'At Risk (40-69)', value: distribution.atRisk, color: '#f59e0b', bucket: 'at-risk' as const },
    { name: 'Critical (<40)', value: distribution.critical, color: '#f43f5e', bucket: 'critical' as const },
  ].filter((item) => item.value > 0);

  // Format trend line dates safely
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Health distribution</h3>
          </div>
          <span className="text-xs text-slate-500">Click a slice to filter</span>
        </div>

        <div className="h-52 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                onClick={(_data, index) => {
                  const item = pieData[index];
                  if (item) onSelectBucket?.(item.bucket);
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: number) => [`${value} Accounts`, 'Count']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900">{summary.totalAccounts}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Accounts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
          <button
            onClick={() => onSelectBucket?.('healthy')}
            className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-left hover:scale-[1.02] transition-transform"
          >
            <div className="font-bold">{distribution.healthy}</div>
            <div className="text-[10px] opacity-80">Healthy (≥70)</div>
          </button>
          <button
            onClick={() => onSelectBucket?.('at-risk')}
            className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-left hover:scale-[1.02] transition-transform"
          >
            <div className="font-bold">{distribution.atRisk}</div>
            <div className="text-[10px] opacity-80">At risk (40–69)</div>
          </button>
          <button
            onClick={() => onSelectBucket?.('critical')}
            className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-left hover:scale-[1.02] transition-transform"
          >
            <div className="font-bold">{distribution.critical}</div>
            <div className="text-[10px] opacity-80">Critical (&lt;40)</div>
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Portfolio trend</h3>
          </div>
          <span className="text-xs text-slate-500">Last 14 days</span>
        </div>

        <div className="h-56 w-full">
          {formattedTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'avgHealthScore' ? `${value}/100` : `${value}%`,
                    name === 'avgHealthScore' ? 'Avg health' : 'Engagement',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgHealthScore"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgStickinessPct"
                  stroke="#0d9488"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-1 px-4 text-center">
              <span>No daily trend snapshots yet</span>
              <span className="text-xs">
                Trends appear after the daily health job runs. Account pages still show live scores.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-sky-600" />
              <span>Avg health</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-teal-600 border border-dashed border-teal-600" />
              <span>Engagement (DAU/MAU)</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>UTC daily snapshots</span>
          </div>
        </div>
      </div>
    </div>
  );
};
