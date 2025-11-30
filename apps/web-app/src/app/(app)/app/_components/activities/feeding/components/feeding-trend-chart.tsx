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
  type DotProps,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { AmountType, TrendData } from '../../shared/types';
import { adjustGoalForRange } from '../../shared/utils/goal-utils';
import { mlToOz } from '../../shared/volume-utils';

interface FeedingTrendChartProps {
  data: TrendData[];
  metricType: 'count' | 'amount';
  unit: 'ML' | 'OZ';
  amountType: AmountType;
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
  dailyGoal?: number | null;
  goalSeries?: Array<number | null>;
}

export function FeedingTrendChart({
  data,
  metricType,
  unit,
  amountType,
  timeRange,
  dailyGoal,
  goalSeries,
}: FeedingTrendChartProps) {
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
      value = item.count || 0;
    } else if (item.totalMl) {
      if (amountType === 'average' && item.count && item.count > 0) {
        const avgMl = item.totalMl / item.count;
        value = unit === 'OZ' ? mlToOz(avgMl) : Math.round(avgMl);
      } else {
        value = unit === 'OZ' ? mlToOz(item.totalMl) : item.totalMl;
      }
    }

    return {
      displayDate,
      rawDate: item.date,
      value,
    };
  });

  const label =
    metricType === 'count'
      ? 'Feedings'
      : `${amountType === 'average' ? 'Avg' : 'Total'} (${unit.toLowerCase()})`;

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

  const GoalLineDot = (
    props: DotProps & { payload?: { goal?: number | null } },
  ) => {
    const { cx, cy, payload } = props;

    // Access goal from payload - Recharts passes the entire data object as payload
    const goal =
      payload && typeof payload === 'object' && 'goal' in payload
        ? (payload as { goal?: number | null }).goal
        : null;

    // Only render if we have valid coordinates and a valid goal
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      !Number.isFinite(cx) ||
      !Number.isFinite(cy) ||
      typeof goal !== 'number' ||
      !Number.isFinite(goal) ||
      goal <= 0
    ) {
      return null;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        fill="var(--muted-foreground)"
        r={4}
        stroke="var(--muted-foreground)"
        strokeWidth={2}
      />
    );
  };

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        value: {
          color: 'var(--activity-feeding)',
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
            fill="var(--activity-feeding)"
            radius={[8, 8, 0, 0]}
          />
          {hasGoalSeries && (
            <Line
              connectNulls={false}
              dataKey="goal"
              dot={(props) => {
                const typedProps = props as unknown as DotProps & {
                  payload?: { goal?: number | null };
                };
                return (
                  <GoalLineDot
                    cx={typedProps.cx}
                    cy={typedProps.cy}
                    payload={typedProps.payload}
                  />
                );
              }}
              isAnimationActive={false}
              stroke="transparent"
              strokeWidth={0}
              type="linear"
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
