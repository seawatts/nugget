'use client';

import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type ActivityStats,
  getActivityStatsAction,
} from './activity-stats.actions';

interface QuickActionCardProps {
  activityType: 'pumping' | 'solids' | 'potty' | 'tummy_time';
  icon: LucideIcon;
  label: string;
  color: string;
  textColor: string;
  fullWidth?: boolean;
  onCardClick?: () => void;
  refreshTrigger?: number;
}

export function QuickActionCard({
  activityType,
  icon: Icon,
  label,
  color,
  textColor,
  fullWidth = false,
  onCardClick,
  refreshTrigger = 0,
}: QuickActionCardProps) {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActivityStatsAction({ activityType });

      if (result?.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load activity stats:', err);
    } finally {
      setLoading(false);
    }
  }, [activityType]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger reloads from parent
  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  // Format time since last activity
  const timeAgo = stats?.lastActivity
    ? formatDistanceToNow(new Date(stats.lastActivity.startTime), {
        addSuffix: false,
      }).replace(/^about\s+/, '')
    : 'No activity';

  // Format amount/duration for display
  const formatMetric = () => {
    if (!stats?.lastActivity) return null;

    const { lastDuration, lastAmount } = stats;

    // Duration-based activities (tummy_time)
    if (lastDuration && lastDuration > 0) {
      const hours = Math.floor(lastDuration / 60);
      const minutes = lastDuration % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    }

    // Amount-based activities (pumping - ml to oz)
    if (activityType === 'pumping' && lastAmount && lastAmount > 0) {
      const amountOz = Math.round(lastAmount / 30);
      return `${amountOz}oz`;
    }

    return null;
  };

  const metric = formatMetric();

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
        color,
        fullWidth && 'col-span-2',
        loading && 'opacity-70 pointer-events-none',
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('opacity-30', textColor)}>
            {loading ? (
              <Icons.Spinner className="h-12 w-12 animate-spin" />
            ) : (
              <Icon className="h-12 w-12" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <h2 className={cn('text-2xl font-bold', textColor)}>{label}</h2>
            {!loading && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn('text-sm font-medium', textColor, 'opacity-70')}
                >
                  {timeAgo}
                </span>
                {stats && stats.todayCount > 0 && (
                  <>
                    <span className={cn(textColor, 'opacity-40')}>•</span>
                    <span className={cn('text-sm', textColor, 'opacity-60')}>
                      {stats.todayCount} today
                    </span>
                  </>
                )}
                {metric && (
                  <>
                    <span className={cn(textColor, 'opacity-40')}>•</span>
                    <span className={cn('text-sm', textColor, 'opacity-60')}>
                      {metric}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
