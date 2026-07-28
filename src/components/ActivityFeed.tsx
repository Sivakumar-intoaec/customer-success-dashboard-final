import React from 'react';
import { ActivityLogItem } from '../types';
import { formatRelativeTime, moduleLabel } from '../utils/cs';
import { Activity, Clock, User, RefreshCw } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLogItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="rounded-2xl p-5 border bg-white border-slate-200 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border border-slate-100 bg-sky-50">
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Recent customer activity</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">Latest product actions across the portfolio</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {activities.length > 0 ? (
          activities.map((act, idx) => (
            <div
              key={act.activityId || idx}
              className="p-3 rounded-xl border border-slate-200/50 bg-slate-50/30 hover:bg-slate-50/70 hover:border-slate-300 transition-all duration-200 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5 border border-slate-100 bg-sky-50">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">
                      {act.logEvent || act.logMessage || 'Customer event'}
                    </span>
                    {act.logSource && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded-md font-bold bg-slate-100 border border-slate-200/50 text-slate-600 uppercase">
                        {moduleLabel(String(act.logSource))}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mt-0.5 truncate">
                    {act.logDescription ||
                      (act.organizationId
                        ? `Org ${String(act.organizationId).slice(0, 8)}…`
                        : 'Portfolio activity')}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-300" />
                {formatRelativeTime(act.createdAt as number | string | null)}
              </span>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">
              {isLoading ? 'Loading activity…' : 'No recent activity yet. Open an account to see its feed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
