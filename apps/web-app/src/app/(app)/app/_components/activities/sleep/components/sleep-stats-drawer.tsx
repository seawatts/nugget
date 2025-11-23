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
import { useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type { AmountType, TrendData } from '../../shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import {
  calculateCoSleeperTrendData,
  calculateSleepTrendData,
} from '../sleep-goals';
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
  activities,
  recentActivities,
  timeFormat,
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

  // Fetch family members for co-sleeper charts
  const { data: familyMembersData } = api.familyMembers.all.useQuery();

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

  // Filter to last 30 days for heatmap
  const last30DaysSleepActivities = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return sleepActivities.filter(
      (activity) => new Date(activity.startTime) >= thirtyDaysAgo,
    );
  }, [sleepActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(last30DaysSleepActivities),
    [last30DaysSleepActivities],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(sleepActivities, 7),
    [sleepActivities],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(sleepActivities),
    [sleepActivities],
  );

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Sleep Statistics"
    >
      {/* Sleep Sessions Trend Chart */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Sleep Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                Number of sleep sessions over time
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
          data={dynamicTrendData}
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
                Sleep duration over time
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
          data={dynamicTrendData}
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
                    Sessions by family member
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
                    Duration by family member
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
