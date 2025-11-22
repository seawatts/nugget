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
import type { AmountType, TrendData } from '../../shared/types';

interface SleepTrendChartProps {
  data: TrendData[];
  metricType: 'count' | 'hours';
  amountType: AmountType;
}

export function SleepTrendChart({
  data,
  metricType,
  amountType,
}: SleepTrendChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const displayDate = formatChartDate(date);

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
      value,
    };
  });

  let label = '';
  if (metricType === 'count') {
    label = 'Naps';
  } else {
    label = `${amountType === 'average' ? 'Avg' : 'Total'} (h)`;
  }

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        value: {
          color: 'var(--activity-sleep)',
          label,
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
            dataKey="displayDate"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={20} />
          <ChartTooltip
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <Bar
            dataKey="value"
            fill="var(--activity-sleep)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
