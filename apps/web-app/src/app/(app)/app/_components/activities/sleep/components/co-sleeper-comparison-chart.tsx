'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { CoSleeperComparisonData } from '../sleep-goals';

interface CoSleeperComparisonChartProps {
  data: CoSleeperComparisonData[];
  metricType: 'count' | 'hours';
  familyMembers: Array<{
    id: string;
    userId: string;
    firstName: string;
    lastName: string | null;
  }>;
  currentLabel?: string;
  previousLabel?: string;
}

export function CoSleeperComparisonChart({
  data,
  metricType,
  familyMembers,
  currentLabel = 'Current',
  previousLabel = 'Previous',
}: CoSleeperComparisonChartProps) {
  // Map user IDs to family member names
  const userIdToName = new Map<string, string>();
  for (const member of familyMembers) {
    const name = member.firstName || 'Unknown';
    userIdToName.set(member.userId, name);
  }

  // Format data for the chart
  const formattedData = data.map((item) => {
    const userName = userIdToName.get(item.userId) || 'Unknown';

    let currentValue = 0;
    let previousValue = 0;

    if (metricType === 'count') {
      currentValue = item.current.count;
      previousValue = item.previous.count;
    } else {
      // Convert minutes to hours
      currentValue = Number((item.current.totalMinutes / 60).toFixed(1));
      previousValue = Number((item.previous.totalMinutes / 60).toFixed(1));
    }

    return {
      current: currentValue,
      metric: userName,
      previous: previousValue,
    };
  });

  // If no data, show empty state
  if (formattedData.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
        No co-sleeping activities recorded
      </div>
    );
  }

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        current: {
          color: 'var(--activity-sleep)',
          label: currentLabel,
        },
        previous: {
          color: 'var(--muted-foreground)',
          label: previousLabel,
        },
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={formattedData}
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="metric"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={20} />
          <ChartTooltip
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <Legend />
          <Bar
            dataKey="previous"
            fill="var(--muted-foreground)"
            opacity={0.5}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="current"
            fill="var(--activity-sleep)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
