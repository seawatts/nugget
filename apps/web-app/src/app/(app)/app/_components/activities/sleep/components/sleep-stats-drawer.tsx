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
import { subDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
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
  calculateShortestAwake,
  calculateShortestSleep,
  calculateSleepStat,
} from '../sleep-stat-calculations';
import { CoSleeperTrendChart } from './co-sleeper-trend-chart';
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

  // Fetch family members for co-sleeper charts (only when drawer is open)
  const { data: familyMembersData } = api.familyMembers.all.useQuery(
    undefined,
    { enabled: open },
  );

  // Transform family members data for chart components
  const transformedFamilyMembers = familyMembersData?.map((member) => ({
    firstName: member.user?.firstName || '',
    id: member.id,
    lastName: member.user?.lastName || null,
    userId: member.userId,
  }));

  // Calculate trend data based on selected time range
  const dynamicTrendData = useMemo(
    () => calculateSleepTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
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

      return {
        hours: getDailySleepHoursGoal(ageDays),
        naps: getDailyNapGoal(
          ageDays,
          normalizedGoalContext.predictedIntervalHours ?? undefined,
          normalizedGoalContext.dataPointsCount,
        ),
      };
    });
  }, [dynamicTrendData, normalizedGoalContext]);

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
    </StatsDrawerWrapper>
  );
}
