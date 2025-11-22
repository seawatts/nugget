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
import { mlToOz } from '../../shared/volume-utils';

interface PumpingTrendChartProps {
  data: TrendData[];
  metricType: 'count' | 'amount';
  unit: 'ML' | 'OZ';
  amountType: AmountType;
}

export function PumpingTrendChart({
  data,
  metricType,
  unit,
  amountType,
}: PumpingTrendChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const displayDate = formatChartDate(date);

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
      value,
    };
  });

  const label =
    metricType === 'count'
      ? 'Sessions'
      : `${amountType === 'average' ? 'Avg' : 'Total'} (${unit.toLowerCase()})`;

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        value: {
          color: 'var(--activity-pumping)',
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
            fill="var(--activity-pumping)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
