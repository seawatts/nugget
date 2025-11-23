'use client';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartDate } from '../../shared/components/stats';
import type { AmountType } from '../../shared/types';
import type { CoSleeperTrendData } from '../sleep-goals';

interface CoSleeperTrendChartProps {
  data: CoSleeperTrendData[];
  metricType: 'count' | 'hours';
  amountType: AmountType;
  familyMembers: Array<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
  }>;
}

// Use activity-sleep color with varying opacity for different family members
const COLORS = [
  'var(--activity-sleep)',
  'color-mix(in oklch, var(--activity-sleep) 80%, transparent)',
  'color-mix(in oklch, var(--activity-sleep) 60%, transparent)',
  'color-mix(in oklch, var(--activity-sleep) 40%, transparent)',
  'color-mix(in oklch, var(--activity-sleep) 20%, transparent)',
];

export function CoSleeperTrendChart({
  data,
  metricType,
  amountType,
  familyMembers,
}: CoSleeperTrendChartProps) {
  // Get unique user IDs from the data
  const uniqueUserIds = new Set<string>();
  for (const item of data) {
    for (const userId of Object.keys(item.byUser)) {
      uniqueUserIds.add(userId);
    }
  }

  // Map user IDs to family member names
  const userIdToName = new Map<string, string>();
  for (const member of familyMembers) {
    const name = member.firstName || 'Unknown';
    userIdToName.set(member.userId, name);
  }

  // Format data for the chart
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const displayDate = formatChartDate(date);

    const dataPoint: Record<string, string | number> = {
      displayDate,
    };

    // Add data for each user
    for (const userId of uniqueUserIds) {
      const userStats = item.byUser[userId];
      let value = 0;

      if (userStats) {
        if (metricType === 'count') {
          value = userStats.count;
        } else if (userStats.totalMinutes) {
          if (amountType === 'average' && userStats.count > 0) {
            // Average sleep duration in hours
            value = Number(
              (userStats.totalMinutes / userStats.count / 60).toFixed(1),
            );
          } else {
            // Total sleep hours
            value = Number((userStats.totalMinutes / 60).toFixed(1));
          }
        }
      }

      dataPoint[userId] = value;
    }

    return dataPoint;
  });

  // Build chart config
  const chartConfig: Record<string, { label: string; color: string }> = {};
  const userIdArray = Array.from(uniqueUserIds);
  for (let i = 0; i < userIdArray.length; i++) {
    const userId = userIdArray[i];
    if (!userId) continue;
    chartConfig[userId] = {
      color: COLORS[i % COLORS.length] || 'hsl(var(--chart-1))',
      label: userIdToName.get(userId) || 'Unknown',
    };
  }

  // If no data, show empty state
  if (uniqueUserIds.size === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
        No co-sleeping activities recorded
      </div>
    );
  }

  return (
    <ChartContainer className="h-[200px] w-full" config={chartConfig}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={formattedData}
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={20} />
          <ChartTooltip
            content={(props) => (
              <ChartTooltipContent
                {...props}
                labelFormatter={(value) => `${value}`}
                nameKey="label"
              />
            )}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {Array.from(uniqueUserIds).map((userId) => (
            <Bar
              dataKey={userId}
              fill={chartConfig[userId]?.color || 'hsl(var(--chart-1))'}
              key={userId}
              name={chartConfig[userId]?.label || 'Unknown'}
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
