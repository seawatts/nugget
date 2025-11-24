'use client';

import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import {
  formatVolumeDisplay,
  getVolumeUnit,
} from '../activities/shared/volume-utils';

interface ActivityStats {
  lastActivity: typeof Activities.$inferSelect | null;
  todayCount: number;
  lastAmount: number | null;
  lastDuration: number | null;
}

interface QuickActionCardProps {
  activityType: 'pumping' | 'solids' | 'potty' | 'tummy_time';
  icon: LucideIcon;
  label: string;
  color: string;
  textColor: string;
  fullWidth?: boolean;
  onCardClick?: () => void;
  refreshTrigger?: number;
  babyId: string;
}

export function QuickActionCard({
  activityType,
  icon: Icon,
  label,
  color,
  textColor,
  fullWidth = false,
  onCardClick,
  refreshTrigger: _refreshTrigger = 0,
  babyId: _babyId,
}: QuickActionCardProps) {
  // Get data from dashboard store (already fetched in DashboardContainer)
  const activitiesData = useDashboardDataStore.use.activities();
  const user = useDashboardDataStore.use.user();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');

  // Compute stats from store data (no API call needed!)
  // Recalculates when activities data changes
  const stats = useMemo<ActivityStats | null>(() => {
    if (!activitiesData || activitiesData.length === 0) {
      return null;
    }

    // Filter to the specific activity type
    const activities = activitiesData.filter((a) => a.type === activityType);

    // Get last activity
    const lastActivity =
      activities.length > 0 && activities[0] ? activities[0] : null;

    // Count today's activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = activities.filter((a) => {
      const activityDate = new Date(a.startTime);
      return activityDate >= today;
    }).length;

    // Extract metrics from last activity
    const lastAmount = lastActivity?.amountMl || null;
    const lastDuration = lastActivity?.duration || null;

    return {
      lastActivity,
      lastAmount,
      lastDuration,
      todayCount,
    };
  }, [activitiesData, activityType]);

  const loading = !activitiesData;

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

    // Amount-based activities (pumping - respects user preference)
    if (activityType === 'pumping' && lastAmount && lastAmount > 0) {
      return formatVolumeDisplay(lastAmount, userUnitPref, true);
    }

    return null;
  };

  const metric = formatMetric();

  if (loading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 animate-pulse',
          color,
          fullWidth && 'col-span-2',
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn('opacity-30', textColor)}>
            <Icons.Spinner className="h-12 w-12 animate-spin" />
          </div>
          <div className="flex-1">
            <div
              className={cn('h-7 rounded w-32 mb-2', textColor, 'opacity-20')}
            />
            <div className={cn('h-4 rounded w-24', textColor, 'opacity-20')} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
        color,
        fullWidth && 'col-span-2',
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('opacity-30', textColor)}>
            <Icon className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className={cn('text-2xl font-bold', textColor)}>{label}</h2>
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
          </div>
        </div>
      </div>
    </Card>
  );
}
