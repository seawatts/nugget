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
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartDate } from '../../shared/components/stats';
import type { TrendData } from '../../shared/types';

interface DiaperTrendChartProps {
  data: TrendData[];
  goalSeries?: Array<number | null>;
  dailyGoal?: number | null;
}

export function DiaperTrendChart({
  data,
  goalSeries,
  dailyGoal,
}: DiaperTrendChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const displayDate = formatChartDate(date);
    const wet = item.wet || 0;
    const dirty = item.dirty || 0;
    const both = item.both || 0;
    const total = wet + dirty + both;

    return {
      both,
      dirty,
      displayDate,
      total,
      wet,
    };
  });

  const chartData = formattedData.map((item, index) => {
    const goal =
      goalSeries && goalSeries.length > index ? goalSeries[index] : null;
    return {
      ...item,
      goal,
    };
  });

  const hasGoalSeries = chartData.some(
    (item) => typeof item.goal === 'number' && !Number.isNaN(item.goal),
  );

  const fallbackGoal = hasGoalSeries ? null : (dailyGoal ?? null);

  return (
    <ChartContainer
      className="h-[220px] w-full"
      config={{
        both: {
          color: 'var(--activity-feeding)',
          label: 'Both',
        },
        dirty: {
          color: 'var(--activity-pumping)',
          label: 'Poop',
        },
        total: {
          color: 'var(--activity-sleep)',
          label: 'All',
        },
        wet: {
          color: 'var(--activity-diaper)',
          label: 'Pee',
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
          barCategoryGap="16%"
          data={chartData}
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={28} />
          <ChartTooltip
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="wet"
            fill="var(--activity-diaper)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="dirty"
            fill="var(--activity-pumping)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="both"
            fill="var(--activity-feeding)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="total"
            fill="var(--activity-sleep)"
            radius={[4, 4, 0, 0]}
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
