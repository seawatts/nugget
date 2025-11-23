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
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ComparisonChart,
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  getComparisonContent,
  getTrendContent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  AmountType,
  ComparisonData,
  ComparisonTimeRange,
  MetricType,
  TrendData,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import {
  calculateCoSleeperStatsWithComparison,
  calculateCoSleeperTrendData,
  calculateSleepStatsWithComparison,
} from '../sleep-goals';
import { CoSleeperComparisonChart } from './co-sleeper-comparison-chart';
import { CoSleeperTrendChart } from './co-sleeper-trend-chart';
import { SleepTrendChart } from './sleep-trend-chart';

interface SleepStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  recentActivities: Array<{
    time: Date;
    duration?: number;
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
}

export function SleepStatsDrawer({
  open,
  onOpenChange,
  trendData,
  activities,
  recentActivities,
  timeFormat,
}: SleepStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');

  // Co-sleeper chart states
  const [coSleeperMetricType, setCoSleeperMetricType] =
    useState<MetricType>('hours');
  const [coSleeperAmountType, setCoSleeperAmountType] =
    useState<AmountType>('total');
  const [coSleeperTimeRange, setCoSleeperTimeRange] =
    useState<ComparisonTimeRange>('24h');
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<
    string | 'all'
  >('all');

  // Fetch family members for co-sleeper charts
  const { data: familyMembersData } = api.familyMembers.all.useQuery();

  const handleMetricTypeChange = (newType: MetricType) => {
    setMetricType(newType);
    // Reset to 'total' when switching to 'count' (Sleeps)
    if (newType === 'count' && amountType === 'average') {
      setAmountType('total');
    }
  };

  const handleCoSleeperMetricTypeChange = (newType: MetricType) => {
    setCoSleeperMetricType(newType);
    // Reset to 'total' when switching to 'count'
    if (newType === 'count' && coSleeperAmountType === 'average') {
      setCoSleeperAmountType('total');
    }
  };

  // Calculate stats based on selected time range
  const statsComparison = useMemo(() => {
    const selectedRange = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === timeRange,
    );
    return calculateSleepStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, timeRange]);

  const trendContent = getTrendContent('sleep', metricType);
  const selectedRangeHours =
    TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)?.hours ?? 24;
  const comparisonContent = getComparisonContent(timeRange, selectedRangeHours);

  // Calculate co-sleeper data
  const coSleeperTrendData = useMemo(
    () => calculateCoSleeperTrendData(activities),
    [activities],
  );

  const coSleeperComparisonData = useMemo(() => {
    const selectedRange = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === coSleeperTimeRange,
    );
    return calculateCoSleeperStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, coSleeperTimeRange]);

  // Filter data by selected family member
  const filteredCoSleeperTrendData = useMemo(() => {
    if (selectedFamilyMemberId === 'all') return coSleeperTrendData;

    return coSleeperTrendData.map((item) => ({
      byUser:
        selectedFamilyMemberId in item.byUser
          ? { [selectedFamilyMemberId]: item.byUser[selectedFamilyMemberId] }
          : {},
      date: item.date,
    }));
  }, [coSleeperTrendData, selectedFamilyMemberId]);

  const filteredCoSleeperComparisonData = useMemo(() => {
    if (selectedFamilyMemberId === 'all') return coSleeperComparisonData;

    return coSleeperComparisonData.filter(
      (item) => item.userId === selectedFamilyMemberId,
    );
  }, [coSleeperComparisonData, selectedFamilyMemberId]);

  const coSleeperSelectedRangeHours =
    TIME_RANGE_OPTIONS.find((opt) => opt.value === coSleeperTimeRange)?.hours ??
    24;
  const coSleeperComparisonContent = getComparisonContent(
    coSleeperTimeRange,
    coSleeperSelectedRangeHours,
  );

  // Calculate frequency data
  const sleepActivities = useMemo(
    () => activities.filter((a) => a.type === 'sleep'),
    [activities],
  );

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(sleepActivities),
    [sleepActivities],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(sleepActivities, 7),
    [sleepActivities],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(sleepActivities),
    [sleepActivities],
  );

  const comparisonData: ComparisonData[] = [
    {
      current: statsComparison.current.sleepCount,
      metric: 'Sleeps',
      previous: statsComparison.previous.sleepCount,
    },
    {
      current: Number((statsComparison.current.totalMinutes / 60).toFixed(1)),
      metric: 'Total (h)',
      previous: Number((statsComparison.previous.totalMinutes / 60).toFixed(1)),
    },
    {
      current: statsComparison.current.avgSleepDuration
        ? Number((statsComparison.current.avgSleepDuration / 60).toFixed(1))
        : 0,
      metric: 'Avg Sleep (h)',
      previous: statsComparison.previous.avgSleepDuration
        ? Number((statsComparison.previous.avgSleepDuration / 60).toFixed(1))
        : 0,
    },
  ];

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Sleep Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {trendContent.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {trendContent.description}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Metric Type Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {metricType === 'count' ? 'Sleeps' : 'Hours'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleMetricTypeChange('count')}
                  >
                    Sleeps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMetricTypeChange('hours')}
                  >
                    Hours
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {amountType === 'total' ? 'Total' : 'Average'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAmountType('total')}>
                    Total
                  </DropdownMenuItem>
                  {metricType !== 'count' && (
                    <DropdownMenuItem onClick={() => setAmountType('average')}>
                      Average
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <SleepTrendChart
          amountType={amountType}
          data={trendData}
          metricType={metricType as 'count' | 'hours'}
        />
      </Card>

      {/* Comparison Stats Section */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {comparisonContent.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {comparisonContent.description}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {
                  TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)
                    ?.label
                }
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIME_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ComparisonChart
          colorClass="var(--activity-sleep)"
          currentLabel={comparisonContent.currentLabel}
          data={comparisonData}
          previousLabel={comparisonContent.previousLabel}
        />
      </Card>

      {/* Co-Sleeping Family Members Section */}
      {familyMembersData && (
        <>
          {/* Co-Sleeper Trend Chart */}
          <Card className="p-4">
            <div className="mb-3 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Co-Sleeping
                  </h3>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
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
                                  )?.firstName || ''
                                }
                                src={
                                  familyMembersData?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )?.avatarUrl || undefined
                                }
                              />
                              <AvatarFallback className="text-[10px]">
                                {familyMembersData
                                  ?.find(
                                    (m) => m.userId === selectedFamilyMemberId,
                                  )
                                  ?.firstName?.charAt(0)
                                  .toUpperCase() || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            {familyMembersData?.find(
                              (m) => m.userId === selectedFamilyMemberId,
                            )?.firstName || 'Member'}
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
                              alt={member.firstName || 'Member'}
                              src={member.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-[10px]">
                              {member.firstName?.charAt(0).toUpperCase() || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          {member.firstName || 'Member'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Metric Type Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperMetricType === 'count' ? 'Sessions' : 'Hours'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCoSleeperMetricTypeChange('count')}
                      >
                        Sessions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCoSleeperMetricTypeChange('hours')}
                      >
                        Hours
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Total/Average Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {coSleeperAmountType === 'total' ? 'Total' : 'Average'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setCoSleeperAmountType('total')}
                      >
                        Total
                      </DropdownMenuItem>
                      {coSleeperMetricType !== 'count' && (
                        <DropdownMenuItem
                          onClick={() => setCoSleeperAmountType('average')}
                        >
                          Average
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <CoSleeperTrendChart
              amountType={coSleeperAmountType}
              data={filteredCoSleeperTrendData}
              familyMembers={familyMembersData}
              metricType={coSleeperMetricType as 'count' | 'hours'}
            />
          </Card>

          {/* Co-Sleeper Comparison Chart */}
          <Card className="p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {coSleeperComparisonContent.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {coSleeperComparisonContent.description}
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
                                )?.firstName || ''
                              }
                              src={
                                familyMembersData?.find(
                                  (m) => m.userId === selectedFamilyMemberId,
                                )?.avatarUrl || undefined
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {familyMembersData
                                ?.find(
                                  (m) => m.userId === selectedFamilyMemberId,
                                )
                                ?.firstName?.charAt(0)
                                .toUpperCase() || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          {familyMembersData?.find(
                            (m) => m.userId === selectedFamilyMemberId,
                          )?.firstName || 'Member'}
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
                        onClick={() => setSelectedFamilyMemberId(member.userId)}
                      >
                        <Avatar className="mr-2 size-4">
                          <AvatarImage
                            alt={member.firstName || 'Member'}
                            src={member.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-[10px]">
                            {member.firstName?.charAt(0).toUpperCase() || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        {member.firstName || 'Member'}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Time Range Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      {
                        TIME_RANGE_OPTIONS.find(
                          (opt) => opt.value === coSleeperTimeRange,
                        )?.label
                      }
                      <ChevronDown className="ml-1 size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {TIME_RANGE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setCoSleeperTimeRange(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CoSleeperComparisonChart
              data={filteredCoSleeperComparisonData}
              familyMembers={familyMembersData}
              metricType={coSleeperMetricType as 'count' | 'hours'}
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
              When sleep occurs throughout the day
            </p>
          </div>
          {/* Future: Add dropdown filters here */}
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
              Frequency patterns by day and time
            </p>
          </div>
          {/* Future: Add dropdown filters here */}
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
