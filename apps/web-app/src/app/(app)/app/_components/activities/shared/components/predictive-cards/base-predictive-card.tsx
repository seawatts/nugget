'use client';

import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ActivityTheme } from '../../activity-theme-config';
import type { SevenDayActivity } from '../../hooks/use-seven-day-activities';
import type { WeeklyStats } from '../../hooks/use-weekly-stats';
import { PredictiveProgressTrack } from '../predictive-progress-track';
import { DayGridButton } from './day-grid-button';
import { PredictiveCardHeader } from './predictive-card-header';

interface DailyStats {
  count: number;
  goal: number;
  percentage: number;
}

interface BasePredictiveCardProps {
  activityType: string;
  title: string;
  icon: LucideIcon;
  theme: ActivityTheme;
  sevenDayData: SevenDayActivity[];
  weeklyStats?: WeeklyStats; // Optional: only show if provided
  dailyStats?: DailyStats; // Optional: for daily progress tracking
  onDayClick: (day: SevenDayActivity) => void | Promise<void>;
  onAddClick: () => void;
  onInfoClick: () => void;
  onStatsClick: () => void;
  isLogging: boolean;
}

export function BasePredictiveCard({
  title,
  icon,
  theme,
  sevenDayData,
  weeklyStats,
  dailyStats,
  onDayClick,
  onAddClick,
  onInfoClick,
  onStatsClick,
  isLogging,
}: BasePredictiveCardProps) {
  const hasProgressTracker = weeklyStats || dailyStats;

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-6',
        `bg-${theme.color} ${theme.textColor}`,
      )}
    >
      <PredictiveCardHeader
        icon={icon}
        isFetching={false}
        onAddClick={onAddClick}
        onInfoClick={onInfoClick}
        onStatsClick={onStatsClick}
        showAddIcon={true}
        showStatsIcon={true}
        title={title}
      />

      {/* Weekly Progress Tracker (if provided) */}
      {weeklyStats && (
        <div className="mt-4">
          <PredictiveProgressTrack
            endLabel={`GOAL ${weeklyStats.goal}`}
            progressPercent={weeklyStats.percentage}
            srLabel={`${weeklyStats.count} of ${weeklyStats.goal} completed this week`}
            startLabel={`${weeklyStats.count} THIS WEEK`}
          />
        </div>
      )}

      {/* Daily Progress Tracker (if provided) */}
      {dailyStats && (
        <div className="mt-4">
          <PredictiveProgressTrack
            endLabel={`Goal ${dailyStats.goal}`}
            progressPercent={dailyStats.percentage}
            srLabel={`${dailyStats.count} of ${dailyStats.goal} completed today`}
            startLabel={`${dailyStats.count} Today`}
          />
        </div>
      )}

      {/* 7-Day Grid */}
      <div className={cn('mt-6', hasProgressTracker && 'mt-4')}>
        <div className="grid grid-cols-7 gap-2">
          {sevenDayData.map((day) => (
            <DayGridButton
              day={day}
              isLogging={isLogging}
              key={day.date}
              onClick={() => onDayClick(day)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
