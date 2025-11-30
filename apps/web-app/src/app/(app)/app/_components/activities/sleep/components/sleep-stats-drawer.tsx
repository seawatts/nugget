'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { startOfDay, subDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  NightDayComparisonCard,
  NightDayTrendChart,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  AmountType,
  HeatmapRangeValue,
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
  TimelineWeekRange,
} from '../../shared/types';
import {
  getPivotPeriodOptionsForTimePeriod,
  HEATMAP_RANGE_OPTIONS,
  STAT_TIME_PERIOD_OPTIONS,
  TIMELINE_WEEK_OPTIONS,
} from '../../shared/types';
import { filterActivitiesUpToDate } from '../../shared/utils/date-based-prediction';
import {
  getCustomDateRangeLabel,
  getDateRangeLabel,
} from '../../shared/utils/date-range-utils';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import type { GoalContextInput } from '../../shared/utils/goal-utils';
import {
  getAgeDaysForDate,
  normalizeGoalContext,
} from '../../shared/utils/goal-utils';
import { getDateRangeLabelForPeriod } from '../../shared/utils/stat-calculations';
import {
  calculateCoSleeperTrendData,
  calculateSleepTrendData,
  getDailyNapGoal,
  getDailySleepHoursGoal,
} from '../sleep-goals';
import {
  calculateAverageAwake,
  calculateLongestAwake,
  calculateLongestSleep,
  calculateNightVsDaySleepComparison,
  calculateShortestAwake,
  calculateShortestSleep,
  calculateSleepStat,
} from '../sleep-stat-calculations';
import { ActivitySleepInsights } from './activity-sleep-insights';
import { CoSleeperTrendChart } from './co-sleeper-trend-chart';
import { ParentNapRecommendations } from './parent-nap-recommendations';
import { SleepPatternRecommendations } from './sleep-pattern-recommendations';
import { SleepTrendChart } from './sleep-trend-chart';

interface SleepStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  recentActivities: Array<{
    time: Date;
    duration?: number;
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
  dailyNapGoal?: number | null;
  dailySleepHoursGoal?: number | null;
  goalContext?: GoalContextInput | null;
}

export function SleepStatsDrawer({
  open,
  onOpenChange,
  activities,
  recentActivities,
  timeFormat,
  dailyNapGoal,
  dailySleepHoursGoal,
  goalContext,
}: SleepStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [sessionsAmountType, setSessionsAmountType] =
    useState<AmountType>('total');
  const [hoursAmountType, setHoursAmountType] = useState<AmountType>('total');

  // Co-sleeper chart states
  const [coSleeperTimeRange, setCoSleeperTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [coSleeperSessionsAmountType, setCoSleeperSessionsAmountType] =
    useState<AmountType>('total');
  const [coSleeperHoursAmountType, setCoSleeperHoursAmountType] =
    useState<AmountType>('total');
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<
    string | 'all'
  >('all');
  const [timelineRange, setTimelineRange] =
    useState<TimelineWeekRange>('this_week');
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');
  const [statCardsTimePeriod, setStatCardsTimePeriod] =
    useState<StatTimePeriod>('this_week');
  const [statCardsPivotPeriod, setStatCardsPivotPeriod] =
    useState<StatPivotPeriod>('total');
  const [trendTimePeriod, setTrendTimePeriod] = useState<
    'all' | 'night' | 'day'
  >('all');

  // Reset pivot period if it's not available for the selected time period
  useEffect(() => {
    const availableOptions =
      getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod);
    const isCurrentPivotAvailable = availableOptions.some(
      (opt) => opt.value === statCardsPivotPeriod,
    );
    if (!isCurrentPivotAvailable) {
      setStatCardsPivotPeriod('total');
    }
  }, [statCardsTimePeriod, statCardsPivotPeriod]);

  const fallbackTimelineOption = TIMELINE_WEEK_OPTIONS[0] ?? {
    label: 'This Week',
    offsetDays: 0,
    value: 'this_week',
  };
  const selectedTimelineOption =
    TIMELINE_WEEK_OPTIONS.find((option) => option.value === timelineRange) ??
    fallbackTimelineOption;
  const fallbackHeatmapOption = HEATMAP_RANGE_OPTIONS.find(
    (option) => option.value === '30d',
  ) ??
    HEATMAP_RANGE_OPTIONS[0] ?? {
      days: 30,
      label: '30 Days',
      value: '30d',
    };
  const selectedHeatmapOption =
    HEATMAP_RANGE_OPTIONS.find((option) => option.value === heatmapRange) ??
    fallbackHeatmapOption;
  const timelineOffsetDays = selectedTimelineOption.offsetDays;

  // Get babyId from params for additional data fetching
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId as string | undefined;

  // Get babyBirthDate from goalContext
  const babyBirthDate = goalContext?.babyBirthDate
    ? typeof goalContext.babyBirthDate === 'string'
      ? new Date(goalContext.babyBirthDate)
      : goalContext.babyBirthDate
    : null;

  // Fetch family members for co-sleeper charts (only when drawer is open)
  const { data: familyMembersData } = api.familyMembers.all.useQuery(
    undefined,
    { enabled: open },
  );

  // Fetch all activities for correlation analysis (last 14 days)
  const fourteenDaysAgo = useMemo(
    () => startOfDay(subDays(new Date(), 14)),
    [],
  );
  const { data: allActivitiesForCorrelation = [] } =
    api.activities.list.useQuery(
      {
        babyId: babyId ?? '',
        limit: 500,
        since: fourteenDaysAgo,
      },
      {
        enabled: open && Boolean(babyId),
        staleTime: 60000,
      },
    );

  // Extract parent user IDs from family members
  const parentIds = useMemo(
    () => familyMembersData?.map((m) => m.userId).filter(Boolean) ?? [],
    [familyMembersData],
  );

  // Fetch parent sleep activities (all sleep activities by family members)
  // Note: Parent sleep activities are stored with babyId but have userId set to parent
  const { data: allParentSleepActivitiesRaw = [] } =
    api.activities.list.useQuery(
      {
        babyId: babyId ?? '',
        limit: 500,
        since: fourteenDaysAgo,
        type: 'sleep',
        userIds: parentIds.length > 0 ? parentIds : undefined,
      },
      {
        enabled: open && Boolean(babyId) && parentIds.length > 0,
        staleTime: 60000,
      },
    );

  // Filter to only parent sleep activities (those with userId in parentIds)
  const allParentSleepActivities = useMemo(
    () =>
      allParentSleepActivitiesRaw.filter((activity) =>
        activity.userId ? parentIds.includes(activity.userId) : false,
      ),
    [allParentSleepActivitiesRaw, parentIds],
  );

  // Build parent names map
  const parentNames = useMemo(() => {
    const names: Record<
      string,
      { firstName: string; avatarUrl?: string | null }
    > = {};
    familyMembersData?.forEach((member) => {
      if (member.userId && member.user) {
        names[member.userId] = {
          avatarUrl: member.user.avatarUrl,
          firstName: member.user.firstName || 'Parent',
        };
      }
    });
    return names;
  }, [familyMembersData]);

  // Transform family members data for chart components
  const transformedFamilyMembers = familyMembersData?.map((member) => ({
    firstName: member.user?.firstName || '',
    id: member.id,
    lastName: member.user?.lastName || null,
    userId: member.userId,
  }));

  // Calculate trend data based on selected time range and time period
  const dynamicTrendData = useMemo(
    () => calculateSleepTrendData(activities, trendTimeRange, trendTimePeriod),
    [activities, trendTimeRange, trendTimePeriod],
  );

  const normalizedGoalContext = useMemo(
    () => normalizeGoalContext(goalContext),
    [goalContext],
  );

  const trendGoalSeries = useMemo(() => {
    if (!normalizedGoalContext) return null;

    return dynamicTrendData.map(({ date }) => {
      const targetDate = new Date(date);
      const ageDays = getAgeDaysForDate(targetDate, normalizedGoalContext);
      if (ageDays === null) {
        return { hours: null, naps: null };
      }

      // Filter activities up to target date for accurate goal calculation
      const activitiesUpToDate = filterActivitiesUpToDate(
        activities,
        targetDate,
      );

      return {
        hours: getDailySleepHoursGoal(
          ageDays,
          targetDate,
          normalizedGoalContext.babyBirthDate ?? null,
        ),
        naps: getDailyNapGoal(
          ageDays,
          undefined, // Let the function calculate from activities
          undefined, // Let the function calculate from activities
          targetDate,
          activitiesUpToDate,
          normalizedGoalContext.babyBirthDate ?? null,
        ),
      };
    });
  }, [dynamicTrendData, normalizedGoalContext, activities]);

  const napGoalSeries = trendGoalSeries?.map((entry) => entry.naps ?? null);
  const sleepHoursGoalSeries = trendGoalSeries?.map(
    (entry) => entry.hours ?? null,
  );

  // Calculate co-sleeper data based on selected time range
  const coSleeperTrendData = useMemo(
    () => calculateCoSleeperTrendData(activities, coSleeperTimeRange),
    [activities, coSleeperTimeRange],
  );

  // Filter data by selected family member
  const filteredCoSleeperTrendData = useMemo(() => {
    if (selectedFamilyMemberId === 'all') return coSleeperTrendData;

    return coSleeperTrendData.map((item) => {
      const userData = item.byUser[selectedFamilyMemberId];
      return {
        byUser: userData
          ? { [selectedFamilyMemberId]: userData }
          : ({} as Record<string, { count: number; totalMinutes: number }>),
        date: item.date,
      };
    });
  }, [coSleeperTrendData, selectedFamilyMemberId]);

  // Calculate frequency data
  const sleepActivities = useMemo(
    () => activities.filter((a) => a.type === 'sleep'),
    [activities],
  );

  // Filter to selected range for heatmap
  const heatmapSleepActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return sleepActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [selectedHeatmapOption, sleepActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(heatmapSleepActivities),
    [heatmapSleepActivities],
  );
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(sleepActivities, 7, timelineOffsetDays),
    [sleepActivities, timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(sleepActivities),
    [sleepActivities],
  );

  const trendDateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );

  const coSleeperDateRangeLabel = useMemo(
    () => getDateRangeLabel(coSleeperTimeRange),
    [coSleeperTimeRange],
  );
  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  // Create calculate function for NumericStatCard
  const calculateSleepStatForCard = useMemo(
    () => (metric: StatMetricType, timePeriod: StatTimePeriod) =>
      calculateSleepStat(activities, metric, timePeriod, statCardsPivotPeriod),
    [activities, statCardsPivotPeriod],
  );

  // Calculate longest sleep
  const longestSleep = useMemo(
    () => calculateLongestSleep(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate shortest sleep
  const shortestSleep = useMemo(
    () => calculateShortestSleep(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate longest awake
  const longestAwake = useMemo(
    () => calculateLongestAwake(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate shortest awake
  const shortestAwake = useMemo(
    () => calculateShortestAwake(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate average awake
  const avgAwake = useMemo(
    () => calculateAverageAwake(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate night vs day sleep comparison
  const nightVsDaySleepComparison = useMemo(
    () => calculateNightVsDaySleepComparison(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate night vs day trend data for comparison chart
  const nightVsDayTrendData = useMemo(() => {
    const nightTrendData = calculateSleepTrendData(
      activities,
      trendTimeRange,
      'night',
    );
    const dayTrendData = calculateSleepTrendData(
      activities,
      trendTimeRange,
      'day',
    );
    return { dayTrendData, nightTrendData };
  }, [activities, trendTimeRange]);

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Sleep Statistics"
    >
      {/* Stat Cards Section with Shared Time Period Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Quick Stats</h3>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabelForPeriod(statCardsTimePeriod)}
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {STAT_TIME_PERIOD_OPTIONS.find(
                    (opt) => opt.value === statCardsTimePeriod,
                  )?.label ?? 'This Week'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STAT_TIME_PERIOD_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setStatCardsTimePeriod(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod).find(
                    (opt) => opt.value === statCardsPivotPeriod,
                  )?.label ?? 'Total'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod).map(
                  (option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setStatCardsPivotPeriod(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 2x3 Grid of Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sleep Sessions Count Card */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {calculateSleepStatForCard('count', statCardsTimePeriod).label}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {
                    calculateSleepStatForCard('count', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
              </div>
            </div>
          </Card>

          {/* Total Sleep Card with Average Duration underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {calculateSleepStatForCard('total', statCardsTimePeriod).label}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {
                    calculateSleepStatForCard('total', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Avg:{' '}
                  {
                    calculateSleepStatForCard('average', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
              </div>
            </div>
          </Card>

          {/* Longest Sleep Card with Average Duration and Min underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {longestSleep.label}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {longestSleep.formattedValue}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-sm text-muted-foreground">
                    Avg:{' '}
                    {
                      calculateSleepStatForCard('average', statCardsTimePeriod)
                        .formattedValue
                    }
                  </div>
                  {shortestSleep.value !== null && (
                    <div className="text-sm text-muted-foreground">
                      Min: {shortestSleep.formattedValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Longest Awake Card with Average Awake and Min underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {longestAwake.label}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {longestAwake.formattedValue}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-sm text-muted-foreground">
                    Avg: {avgAwake.formattedValue}
                  </div>
                  {shortestAwake.value !== null && (
                    <div className="text-sm text-muted-foreground">
                      Min: {shortestAwake.formattedValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Night vs Day Sleep Section */}
      <div className="space-y-3">
        <NightDayComparisonCard
          dayStats={[
            {
              label: 'Total Sleep',
              value: nightVsDaySleepComparison.day.formatted.total,
            },
            {
              label: 'Avg Duration',
              value: nightVsDaySleepComparison.day.formatted.avgDuration,
            },
            {
              label: 'Longest Nap',
              value: nightVsDaySleepComparison.day.formatted.longestNap,
            },
            {
              label: 'Nap Count',
              value: nightVsDaySleepComparison.day.formatted.count,
            },
          ]}
          insight={
            nightVsDaySleepComparison.nightPercentage !== null
              ? `Night sleep is ${nightVsDaySleepComparison.nightPercentage.toFixed(1)}% of total sleep`
              : undefined
          }
          nightStats={[
            {
              label: 'Total Sleep',
              value: nightVsDaySleepComparison.night.formatted.total,
            },
            {
              label: 'Avg Duration',
              value: nightVsDaySleepComparison.night.formatted.avgDuration,
            },
            {
              label: 'Longest Sleep',
              value: nightVsDaySleepComparison.night.formatted.longestSleep,
            },
            {
              label: 'Count',
              value: nightVsDaySleepComparison.night.formatted.count,
            },
          ]}
          timePeriod={statCardsTimePeriod}
          title="Night vs Day Sleep"
        />

        {/* Night vs Day Sleep Trend Chart */}
        <Card className="p-4">
          <div className="mb-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Night vs Day Sleep Trend
                </h3>
                <p className="text-xs text-muted-foreground">
                  {trendDateRangeLabel}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Time Range Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      {trendTimeRange === '24h' && '24 Hours'}
                      {trendTimeRange === '7d' && '7 Days'}
                      {trendTimeRange === '2w' && '2 Weeks'}
                      {trendTimeRange === '1m' && '1 Month'}
                      {trendTimeRange === '3m' && '3 Months'}
                      {trendTimeRange === '6m' && '6 Months'}
                      <ChevronDown className="ml-1 size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTrendTimeRange('24h')}>
                      24 Hours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTrendTimeRange('7d')}>
                      7 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTrendTimeRange('2w')}>
                      2 Weeks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTrendTimeRange('1m')}>
                      1 Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTrendTimeRange('3m')}>
                      3 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTrendTimeRange('6m')}>
                      6 Months
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <NightDayTrendChart
            dayData={nightVsDayTrendData.dayTrendData}
            metricType="hours"
            nightData={nightVsDayTrendData.nightTrendData}
            timeRange={trendTimeRange}
          />
        </Card>
      </div>

      {/* Sleep Sessions Trend Chart */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Sleep Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                {trendDateRangeLabel}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Time Range Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimeRange === '24h' && '24 Hours'}
                    {trendTimeRange === '7d' && '7 Days'}
                    {trendTimeRange === '2w' && '2 Weeks'}
                    {trendTimeRange === '1m' && '1 Month'}
                    {trendTimeRange === '3m' && '3 Months'}
                    {trendTimeRange === '6m' && '6 Months'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimeRange('24h')}>
                    24 Hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('7d')}>
                    7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('2w')}>
                    2 Weeks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('1m')}>
                    1 Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('3m')}>
                    3 Months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('6m')}>
                    6 Months
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {sessionsAmountType === 'total' ? 'Total' : 'Average'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSessionsAmountType('total')}
                  >
                    Total
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Night/Day/All Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimePeriod === 'all'
                      ? 'All'
                      : trendTimePeriod === 'night'
                        ? 'Night'
                        : 'Day'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('night')}>
                    Night
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('day')}>
                    Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <SleepTrendChart
          amountType={sessionsAmountType}
          dailyGoal={dailyNapGoal ?? null}
          data={dynamicTrendData}
          goalSeries={napGoalSeries}
          metricType="count"
          timeRange={trendTimeRange}
        />
      </Card>

      {/* Sleep Hours Trend Chart */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Sleep Hours
              </h3>
              <p className="text-xs text-muted-foreground">
                {trendDateRangeLabel}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Time Range Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimeRange === '24h' && '24 Hours'}
                    {trendTimeRange === '7d' && '7 Days'}
                    {trendTimeRange === '2w' && '2 Weeks'}
                    {trendTimeRange === '1m' && '1 Month'}
                    {trendTimeRange === '3m' && '3 Months'}
                    {trendTimeRange === '6m' && '6 Months'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimeRange('24h')}>
                    24 Hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('7d')}>
                    7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('2w')}>
                    2 Weeks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('1m')}>
                    1 Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('3m')}>
                    3 Months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('6m')}>
                    6 Months
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {hoursAmountType === 'total' ? 'Total' : 'Average'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setHoursAmountType('total')}>
                    Total
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHoursAmountType('average')}
                  >
                    Average
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Night/Day/All Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimePeriod === 'all'
                      ? 'All'
                      : trendTimePeriod === 'night'
                        ? 'Night'
                        : 'Day'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('night')}>
                    Night
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('day')}>
                    Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <SleepTrendChart
          amountType={hoursAmountType}
          dailyGoal={
            hoursAmountType === 'total' ? (dailySleepHoursGoal ?? null) : null
          }
          data={dynamicTrendData}
          goalSeries={
            hoursAmountType === 'total' ? sleepHoursGoalSeries : undefined
          }
          metricType="hours"
          timeRange={trendTimeRange}
        />
      </Card>

      {/* Co-Sleeping Family Members Section */}
      {familyMembersData && (
        <>
          {/* Co-Sleeper Sessions Trend Chart */}
          <Card className="p-4">
            <div className="mb-3 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Sessions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {coSleeperDateRangeLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Family Member Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-1.5" size="sm" variant="outline">
                        {selectedFamilyMemberId === 'all' ? (
                          'All'
                        ) : (
                          <>
                            <Avatar className="size-4">
                              <AvatarImage
                                alt={
                                  familyMembersData?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )?.user?.firstName || ''
                                }
                                src={
                                  familyMembersData?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )?.user?.avatarUrl || undefined
                                }
                              />
                              <AvatarFallback className="text-[10px]">
                                {familyMembersData
                                  ?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )
                                  ?.user?.firstName?.charAt(0)
                                  .toUpperCase() || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            {familyMembersData?.find(
                              (m) => m.userId === selectedFamilyMemberId,
                            )?.user?.firstName || 'Member'}
                          </>
                        )}
                        <ChevronDown className="ml-0.5 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSelectedFamilyMemberId('all')}
                      >
                        All
                      </DropdownMenuItem>
                      {familyMembersData?.map((member) => (
                        <DropdownMenuItem
                          key={member.userId}
                          onClick={() =>
                            setSelectedFamilyMemberId(member.userId)
                          }
                        >
                          <Avatar className="mr-2 size-4">
                            <AvatarImage
                              alt={member.user?.firstName || 'Member'}
                              src={member.user?.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-[10px]">
                              {member.user?.firstName
                                ?.charAt(0)
                                .toUpperCase() || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          {member.user?.firstName || 'Member'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Time Range Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperTimeRange === '24h' && '24 Hours'}
                        {coSleeperTimeRange === '7d' && '7 Days'}
                        {coSleeperTimeRange === '2w' && '2 Weeks'}
                        {coSleeperTimeRange === '1m' && '1 Month'}
                        {coSleeperTimeRange === '3m' && '3 Months'}
                        {coSleeperTimeRange === '6m' && '6 Months'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('24h')}
                      >
                        24 Hours
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('7d')}
                      >
                        7 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('2w')}
                      >
                        2 Weeks
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('1m')}
                      >
                        1 Month
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('3m')}
                      >
                        3 Months
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('6m')}
                      >
                        6 Months
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Total/Average Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperSessionsAmountType === 'total'
                          ? 'Total'
                          : 'Average'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCoSleeperSessionsAmountType('total')}
                      >
                        Total
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <CoSleeperTrendChart
              amountType={coSleeperSessionsAmountType}
              data={filteredCoSleeperTrendData}
              familyMembers={transformedFamilyMembers || []}
              metricType="count"
              timeRange={coSleeperTimeRange}
            />
          </Card>

          {/* Co-Sleeper Hours Trend Chart */}
          <Card className="p-4">
            <div className="mb-3 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Hours</h3>
                  <p className="text-xs text-muted-foreground">
                    {coSleeperDateRangeLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Family Member Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="gap-1.5" size="sm" variant="outline">
                        {selectedFamilyMemberId === 'all' ? (
                          'All'
                        ) : (
                          <>
                            <Avatar className="size-4">
                              <AvatarImage
                                alt={
                                  familyMembersData?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )?.user?.firstName || ''
                                }
                                src={
                                  familyMembersData?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )?.user?.avatarUrl || undefined
                                }
                              />
                              <AvatarFallback className="text-[10px]">
                                {familyMembersData
                                  ?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )
                                  ?.user?.firstName?.charAt(0)
                                  .toUpperCase() || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            {familyMembersData?.find(
                              (m) => m.userId === selectedFamilyMemberId,
                            )?.user?.firstName || 'Member'}
                          </>
                        )}
                        <ChevronDown className="ml-0.5 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSelectedFamilyMemberId('all')}
                      >
                        All
                      </DropdownMenuItem>
                      {familyMembersData?.map((member) => (
                        <DropdownMenuItem
                          key={member.userId}
                          onClick={() =>
                            setSelectedFamilyMemberId(member.userId)
                          }
                        >
                          <Avatar className="mr-2 size-4">
                            <AvatarImage
                              alt={member.user?.firstName || 'Member'}
                              src={member.user?.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-[10px]">
                              {member.user?.firstName
                                ?.charAt(0)
                                .toUpperCase() || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          {member.user?.firstName || 'Member'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Time Range Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperTimeRange === '24h' && '24 Hours'}
                        {coSleeperTimeRange === '7d' && '7 Days'}
                        {coSleeperTimeRange === '2w' && '2 Weeks'}
                        {coSleeperTimeRange === '1m' && '1 Month'}
                        {coSleeperTimeRange === '3m' && '3 Months'}
                        {coSleeperTimeRange === '6m' && '6 Months'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('24h')}
                      >
                        24 Hours
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('7d')}
                      >
                        7 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('2w')}
                      >
                        2 Weeks
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('1m')}
                      >
                        1 Month
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('3m')}
                      >
                        3 Months
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperTimeRange('6m')}
                      >
                        6 Months
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Total/Average Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperHoursAmountType === 'total'
                          ? 'Total'
                          : 'Average'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCoSleeperHoursAmountType('total')}
                      >
                        Total
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCoSleeperHoursAmountType('average')}
                      >
                        Average
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <CoSleeperTrendChart
              amountType={coSleeperHoursAmountType}
              data={filteredCoSleeperTrendData}
              familyMembers={transformedFamilyMembers || []}
              metricType="hours"
              timeRange={coSleeperTimeRange}
            />
          </Card>
        </>
      )}

      {/* Timeline Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Timeline</h3>
            <p className="text-xs text-muted-foreground">
              {timelineDateRangeLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {selectedTimelineOption.label}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIMELINE_WEEK_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimelineRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <TimeBlockChart
          colorVar="var(--activity-sleep)"
          data={timeBlockData}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Heatmap Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Heatmap</h3>
            <p className="text-xs text-muted-foreground">
              {heatmapDateRangeLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {selectedHeatmapOption.label}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {HEATMAP_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setHeatmapRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FrequencyHeatmap
          colorVar="var(--activity-sleep)"
          data={frequencyHeatmapData}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Frequency Insights Section */}
      <Card className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Pattern Insights
          </h3>
          <p className="text-xs text-muted-foreground">
            Key trends and patterns
          </p>
        </div>
        <FrequencyInsightsComponent
          activityLabel="sleep sessions"
          colorVar="var(--activity-sleep)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
            activityType="sleep"
            timeFormat={timeFormat}
            title="Sleep"
          />
        </Card>
      )}

      {/* Sleep Pattern Recommendations */}
      <SleepPatternRecommendations
        activities={activities}
        babyBirthDate={babyBirthDate}
        timeFormat={timeFormat}
      />

      {/* Activity-Sleep Correlation Insights */}
      <ActivitySleepInsights
        activities={allActivitiesForCorrelation}
        babyBirthDate={babyBirthDate}
      />

      {/* Parent Nap Recommendations */}
      {parentIds.length > 0 && (
        <ParentNapRecommendations
          allParentSleepActivities={allParentSleepActivities}
          babySleepActivities={activities}
          parentIds={parentIds}
          parentNames={parentNames}
          timeFormat={timeFormat}
        />
      )}
    </StatsDrawerWrapper>
  );
}
