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
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartDate } from '../../shared/components/stats';
import type { TrendData } from '../../shared/types';

interface DiaperTrendChartProps {
  data: TrendData[];
}

export function DiaperTrendChart({ data }: DiaperTrendChartProps) {
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
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          barCategoryGap="16%"
          data={formattedData}
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
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
