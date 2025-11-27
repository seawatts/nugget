'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import { format } from 'date-fns';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { AmountType, TrendData } from '../../shared/types';
import { adjustGoalForRange } from '../../shared/utils/goal-utils';

interface SleepTrendChartProps {
  data: TrendData[];
  metricType: 'count' | 'hours';
  amountType: AmountType;
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
  goalSeries?: Array<number | null>;
  dailyGoal?: number | null;
}

export function SleepTrendChart({
  data,
  metricType,
  amountType,
  timeRange,
  goalSeries,
  dailyGoal,
}: SleepTrendChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    // Format based on time range
    let displayDate: string;
    if (timeRange === '24h') {
      displayDate = format(date, 'HH:mm'); // Show hour for 24h view
    } else if (timeRange === '3m' || timeRange === '6m') {
      displayDate = format(date, 'M/d'); // Show date for 3m and 6m (weekly grouping)
    } else {
      displayDate = format(date, 'EEE'); // Show day abbreviation for 7d, 2w, 1m
    }

    let value = 0;
    if (metricType === 'count') {
      // For naps, we just show the count (average doesn't apply per day)
      value = item.count || 0;
    } else if (item.totalMinutes) {
      if (amountType === 'average' && item.count && item.count > 0) {
        // Average nap duration in hours
        value = Number((item.totalMinutes / item.count / 60).toFixed(1));
      } else {
        // Total sleep hours
        value = Number((item.totalMinutes / 60).toFixed(1));
      }
    }

    return {
      displayDate,
      rawDate: item.date,
      value,
    };
  });

  let label = '';
  if (metricType === 'count') {
    label = 'Naps';
  } else {
    label = `${amountType === 'average' ? 'Avg' : 'Total'} (h)`;
  }

  const chartData = formattedData.map((item, index) => {
    const seriesGoal =
      goalSeries && goalSeries.length > index ? goalSeries[index] : null;
    return {
      ...item,
      goal: adjustGoalForRange(seriesGoal, timeRange),
    };
  });

  const hasGoalSeries = chartData.some(
    (item) => typeof item.goal === 'number' && !Number.isNaN(item.goal),
  );

  const fallbackGoal = hasGoalSeries
    ? null
    : adjustGoalForRange(dailyGoal ?? null, timeRange);

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        value: {
          color: 'var(--activity-sleep)',
          label,
        },
        ...(hasGoalSeries || fallbackGoal !== null
          ? {
              goal: {
                color: 'var(--muted-foreground)',
                label: 'Goal',
              },
            }
          : {}),
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          data={chartData}
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
                labelFormatter={(_, payload) => {
                  const dataPoint = payload?.[0]?.payload as
                    | { rawDate?: string }
                    | undefined;
                  if (!dataPoint?.rawDate) {
                    return null;
                  }
                  return format(new Date(dataPoint.rawDate), 'EEE, MMM d');
                }}
              />
            )}
          />
          <Bar
            dataKey="value"
            fill="var(--activity-sleep)"
            radius={[8, 8, 0, 0]}
          />
          {hasGoalSeries && (
            <Line
              connectNulls={false}
              dataKey="goal"
              dot={false}
              isAnimationActive={false}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeWidth={2}
              type="monotone"
            />
          )}
          {!hasGoalSeries && fallbackGoal !== null && (
            <ReferenceLine
              label={{
                fill: 'var(--muted-foreground)',
                fontSize: 10,
                position: 'right',
                value: 'Goal',
              }}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              y={fallbackGoal}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
