import React from 'react';
import { ActivityLogItem } from '../types';
import { formatRelativeTime, moduleLabel } from '../utils/cs';
import { Activity, Clock, User } from 'lucide-react';

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
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent customer activity</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest product actions across the portfolio
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs text-sky-700 font-semibold hover:underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {activities.length > 0 ? (
          activities.map((act, idx) => (
            <div
              key={act.activityId || idx}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded bg-sky-100 text-sky-700 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">
                      {act.logEvent || act.logMessage || 'Customer event'}
                    </span>
                    {act.logSource && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 text-slate-600 font-medium">
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
                <Clock className="w-3 h-3" />
                {formatRelativeTime(act.createdAt as number | string | null)}
              </span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            {isLoading
              ? 'Loading activity…'
              : 'No recent activity yet. Open an account to see its feed.'}
          </div>
        )}
      </div>
    </div>
  );
};
