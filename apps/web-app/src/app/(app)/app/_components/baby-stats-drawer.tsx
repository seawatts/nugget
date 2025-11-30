'use client';

import { api } from '@nugget/api/react';
import { Card } from '@nugget/ui/card';
import { startOfDay, startOfWeek, subDays, subWeeks } from 'date-fns';
import { useMemo, useState } from 'react';
import { calculateTodaysFeedingStats } from './activities/feeding/feeding-goals';
import { calculateBabyAgeDays } from './activities/shared/baby-age-utils';
import { StatsDrawerWrapper } from './activities/shared/components/stats';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
} from './activities/shared/utils/frequency-utils';
import {
  ActivityTypesSection,
  EncouragementMessage,
  FunInsightsSection,
  InsightsPatternsSection,
  MilestonesSection,
  OverviewSection,
  QuickStatsSection,
  TodayActivitySection,
  VisualizationsSection,
  WeeklyHighlightsSection,
} from './baby-stats-drawer/sections';
import type { BabyStatsDrawerProps } from './baby-stats-drawer/types';
import {
  calculateActivityTypeDistribution,
  calculateAllActivitiesTrendData,
  calculateEstimatedWeight,
  calculateFunStats,
  calculateHumorousStats,
  calculateMilestones,
  calculatePatterns,
  calculateRealWorldComparisons,
  calculateRecords,
  calculateStreaks,
  calculateWeeklyHighlights,
  generateEncouragementMessage,
} from './baby-stats-drawer/utils';

export function BabyStatsDrawer({
  babyId,
  activities: activitiesProp,
  measurementUnit = 'metric',
  onOpenChange,
  open,
}: BabyStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [activityPeriod, setActivityPeriod] = useState<'week' | 'month'>(
    'week',
  );

  // Fetch baby data
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId },
    { enabled: Boolean(babyId) },
  );

  // Fetch extended activities for stats drawer (90 days, only when drawer opens)
  const ninetyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 90)), []);
  const { data: extendedActivities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 500,
      since: ninetyDaysAgo,
    },
    {
      enabled: Boolean(babyId) && open,
      staleTime: 60000,
    },
  );

  // Use fetched activities, fallback to prop if provided
  const activities = useMemo(() => {
    return extendedActivities.length > 0
      ? extendedActivities
      : (activitiesProp ?? []);
  }, [extendedActivities, activitiesProp]);

  // Calculate age
  const ageDays = useMemo(() => {
    if (!baby?.birthDate) return null;
    return calculateBabyAgeDays(new Date(baby.birthDate));
  }, [baby?.birthDate]);

  // Filter to today's activities
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });
  }, [activities, todayStart]);

  // Filter to this week's activities
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const weekActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= weekStart;
    });
  }, [activities, weekStart]);

  // Filter to this month's activities
  const monthStart = useMemo(() => startOfDay(subDays(new Date(), 30)), []);
  const monthActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= monthStart;
    });
  }, [activities, monthStart]);

  // Calculate estimated weight
  const estimatedWeightOz = useMemo(() => {
    if (!ageDays || !baby?.birthWeightOz) return null;
    return calculateEstimatedWeight(ageDays, baby.birthWeightOz);
  }, [ageDays, baby?.birthWeightOz]);

  // Calculate feeding stats
  const feedingStats = useMemo(() => {
    return calculateTodaysFeedingStats(todayActivities);
  }, [todayActivities]);

  // Calculate diaper stats
  const diaperStats = useMemo(() => {
    const diaperActivities = todayActivities.filter(
      (a) => a.type === 'diaper' || a.type === 'wet' || a.type === 'dirty',
    );
    const wetCount = diaperActivities.filter(
      (a) =>
        a.details &&
        typeof a.details === 'object' &&
        'type' in a.details &&
        (a.details.type === 'wet' || a.details.type === 'both'),
    ).length;
    const dirtyCount = diaperActivities.filter(
      (a) =>
        a.details &&
        typeof a.details === 'object' &&
        'type' in a.details &&
        (a.details.type === 'dirty' || a.details.type === 'both'),
    ).length;
    return {
      dirty: dirtyCount,
      total: diaperActivities.length,
      wet: wetCount,
    };
  }, [todayActivities]);

  // Calculate sleep stats
  const sleepStats = useMemo(() => {
    const sleepActivities = todayActivities.filter(
      (a) => a.type === 'sleep' && a.duration && a.duration > 0,
    );
    const totalMinutes = sleepActivities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0,
    );
    const totalHours = totalMinutes / 60;
    return {
      count: sleepActivities.length,
      totalHours,
      totalMinutes,
    };
  }, [todayActivities]);

  // Format volume based on unit
  const formatVolume = (ml: number): string => {
    if (measurementUnit === 'imperial') {
      const oz = ml / 29.5735; // 1 oz = 29.5735 ml
      return `${Math.round(oz * 10) / 10} oz`;
    }
    return `${Math.round(ml)} ml`;
  };

  // Calculate activity type stats
  const activityTypeStats = useMemo(() => {
    const periodActivities =
      activityPeriod === 'week' ? weekActivities : monthActivities;
    const periodDays = activityPeriod === 'week' ? 7 : 30;

    const stats = {
      bath: periodActivities.filter((a) => a.type === 'bath').length,
      contrastTime: periodActivities.filter((a) => a.type === 'contrast_time')
        .length,
      doctorVisit: periodActivities.filter((a) => a.type === 'doctor_visit')
        .length,
      nailTrimming: periodActivities.filter((a) => a.type === 'nail_trimming')
        .length,
      pumping: periodActivities.filter((a) => a.type === 'pumping').length,
      solids: periodActivities.filter((a) => a.type === 'solids').length,
      strollerWalk: periodActivities.filter((a) => a.type === 'stroller_walk')
        .length,
      vitaminD: periodActivities.filter((a) => a.type === 'vitamin_d').length,
    };

    // Get last activity dates
    const getLastActivity = (type: string) => {
      const filtered = periodActivities
        .filter((a) => a.type === type)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );
      return filtered[0] ? new Date(filtered[0].startTime) : null;
    };

    return {
      ...stats,
      lastBath: getLastActivity('bath'),
      lastContrastTime: getLastActivity('contrast_time'),
      lastDoctorVisit: getLastActivity('doctor_visit'),
      lastNailTrimming: getLastActivity('nail_trimming'),
      lastSolids: getLastActivity('solids'),
      lastStrollerWalk: getLastActivity('stroller_walk'),
      lastVitaminD: getLastActivity('vitamin_d'),
      periodDays,
    };
  }, [weekActivities, monthActivities, activityPeriod]);

  // Calculate fun stats
  const funStats = useMemo(() => calculateFunStats(activities), [activities]);

  // Calculate trend data
  const trendData = useMemo(
    () => calculateAllActivitiesTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate activity distribution
  const activityDistribution = useMemo(
    () => calculateActivityTypeDistribution(activities, 7),
    [activities],
  );

  // Calculate frequency heatmap data
  const heatmapData = useMemo(() => {
    // Use last 30 days for heatmap
    const cutoff = startOfDay(subDays(new Date(), 30));
    const recentActivities = activities.filter(
      (a) => new Date(a.startTime) >= cutoff,
    );
    return calculateHourlyFrequency(recentActivities, 'count');
  }, [activities]);

  // Calculate time block data
  const timeBlockData = useMemo(
    () => calculateTimeBlockData(activities, 7, 0),
    [activities],
  );

  // Calculate streaks
  const streaks = useMemo(() => calculateStreaks(activities), [activities]);

  // Calculate real-world comparisons
  const comparisons = useMemo(() => {
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;
    const totalVolumeMl = activities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);
    const totalSleepHours = activities
      .filter((a) => a.type === 'sleep' && a.duration)
      .reduce((sum, a) => sum + (a.duration || 0) / 60, 0);
    const totalVitaminD = activities.filter(
      (a) => a.type === 'vitamin_d',
    ).length;
    const totalStrollerWalks = activities.filter(
      (a) => a.type === 'stroller_walk',
    ).length;
    const totalNailTrimming = activities.filter(
      (a) => a.type === 'nail_trimming',
    ).length;
    const totalContrastTime = activities.filter(
      (a) => a.type === 'contrast_time',
    ).length;
    return calculateRealWorldComparisons(
      totalDiapers,
      totalVolumeMl,
      totalSleepHours,
      activities.length,
      totalVitaminD,
      totalStrollerWalks,
      totalNailTrimming,
      totalContrastTime,
    );
  }, [activities]);

  // Calculate patterns
  const patterns = useMemo(() => calculatePatterns(activities), [activities]);

  // Calculate records
  const records = useMemo(() => calculateRecords(activities), [activities]);

  // Calculate milestones
  const milestones = useMemo(() => {
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;
    const totalVolumeMl = activities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const daysTracking = sortedActivities[0]
      ? Math.floor(
          (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    return calculateMilestones(
      activities.length,
      totalVolumeMl,
      totalDiapers,
      daysTracking,
    );
  }, [activities]);

  // Calculate humorous stats
  const humorousStats = useMemo(
    () => calculateHumorousStats(activities),
    [activities],
  );

  // Calculate level based on total activities
  const level = useMemo(() => {
    const total = activities.length;
    if (total >= 5000) return { level: 10, name: 'Master Tracker' };
    if (total >= 2500) return { level: 9, name: 'Expert Parent' };
    if (total >= 1000) return { level: 8, name: 'Pro Tracker' };
    if (total >= 500) return { level: 7, name: 'Dedicated Parent' };
    if (total >= 250) return { level: 6, name: 'Consistent Tracker' };
    if (total >= 100) return { level: 5, name: 'Active Parent' };
    if (total >= 50) return { level: 4, name: 'Regular Tracker' };
    if (total >= 25) return { level: 3, name: 'Getting Started' };
    if (total >= 10) return { level: 2, name: 'New Parent' };
    return { level: 1, name: 'Just Beginning' };
  }, [activities.length]);

  // Calculate weekly highlights
  const previousWeekStart = useMemo(
    () => startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    [],
  );
  const previousWeekEnd = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const previousWeekActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return (
        activityDate >= previousWeekStart && activityDate < previousWeekEnd
      );
    });
  }, [activities, previousWeekStart, previousWeekEnd]);

  const weeklyHighlights = useMemo(
    () =>
      calculateWeeklyHighlights(
        activities,
        weekActivities,
        previousWeekActivities,
      ),
    [activities, weekActivities, previousWeekActivities],
  );

  // Generate encouragement message
  const encouragementMessage = useMemo(() => {
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const daysTracking = sortedActivities[0]
      ? Math.floor(
          (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    return generateEncouragementMessage(
      streaks,
      activities.length,
      daysTracking,
    );
  }, [activities, streaks]);

  // Calculate most active activity type today
  const mostActiveToday = useMemo(() => {
    if (todayActivities.length === 0) return null;
    const typeCounts = new Map<string, number>();
    todayActivities.forEach((activity) => {
      typeCounts.set(activity.type, (typeCounts.get(activity.type) || 0) + 1);
    });
    let maxCount = 0;
    let mostActive: string | null = null;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostActive = type;
      }
    });
    const typeLabels: Record<string, string> = {
      bath: 'Bath',
      bottle: 'Bottle',
      'contrast-time': 'Contrast Time',
      diaper: 'Diaper',
      dirty: 'Dirty',
      'doctor-visit': 'Doctor Visit',
      feeding: 'Feeding',
      'nail-trimming': 'Nail Trimming',
      nursing: 'Nursing',
      pumping: 'Pumping',
      sleep: 'Sleep',
      solids: 'Solids',
      stroller_walk: 'Stroller Walk',
      'vitamin-d': 'Vitamin D',
      wet: 'Wet',
    };
    return mostActive
      ? {
          count: maxCount,
          label: typeLabels[mostActive] || mostActive,
          type: mostActive,
        }
      : null;
  }, [todayActivities]);

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Baby Stats"
    >
      <div className="space-y-4">
        {/* Encouragement Message */}
        {encouragementMessage && (
          <EncouragementMessage message={encouragementMessage} />
        )}

        {/* Overview Section */}
        <OverviewSection
          ageDays={ageDays}
          birthWeightOz={baby?.birthWeightOz ?? null}
          currentWeightOz={baby?.currentWeightOz ?? null}
          estimatedWeightOz={estimatedWeightOz}
          measurementUnit={measurementUnit}
        />

        {/* Quick Stats Summary */}
        <QuickStatsSection
          level={level}
          mostActiveToday={mostActiveToday}
          streaks={streaks}
          todayActivitiesCount={todayActivities.length}
        />

        {/* Weekly Highlights */}
        <WeeklyHighlightsSection highlights={weeklyHighlights} />

        {/* Today's Activity Section */}
        <TodayActivitySection
          diaperStats={diaperStats}
          feedingStats={feedingStats}
          formatVolume={formatVolume}
          sleepStats={sleepStats}
          todayActivities={todayActivities}
        />

        {/* Activity Type Stats Section */}
        <ActivityTypesSection
          activityPeriod={activityPeriod}
          activityTypeStats={activityTypeStats}
          onPeriodChange={setActivityPeriod}
        />

        {/* Insights & Patterns Section */}
        <InsightsPatternsSection
          activities={activities}
          comparisons={comparisons}
          patterns={patterns}
          records={records}
        />

        {/* Milestones Section */}
        <MilestonesSection
          activities={activities}
          formatVolume={formatVolume}
          milestones={milestones}
        />

        {/* Fun Insights Section */}
        <FunInsightsSection
          formatVolume={formatVolume}
          funStats={funStats}
          humorousStats={humorousStats}
        />

        {/* Visualizations Section */}
        <VisualizationsSection
          activityDistribution={activityDistribution}
          heatmapData={heatmapData}
          onTrendTimeRangeChange={setTrendTimeRange}
          timeBlockData={timeBlockData}
          trendData={trendData}
          trendTimeRange={trendTimeRange}
        />

        {/* Missing Data Message */}
        {!baby?.birthWeightOz && (
          <Card className="p-4 bg-muted/50">
            <div className="text-sm text-muted-foreground">
              Add birth weight in settings to see estimated weight calculations.
            </div>
          </Card>
        )}
      </div>
    </StatsDrawerWrapper>
  );
}
