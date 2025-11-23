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
import type { ComparisonData } from '../../types';

interface ComparisonChartProps {
  data: ComparisonData[];
  colorClass: string;
  currentLabel?: string;
  previousLabel?: string;
}

export function ComparisonChart({
  data,
  colorClass,
  currentLabel = 'Current',
  previousLabel = 'Previous',
}: ComparisonChartProps) {
  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        current: {
          color: colorClass,
          label: currentLabel,
        },
        previous: {
          color: 'var(--muted-foreground)',
          label: previousLabel,
        },
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
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
          <Bar dataKey="current" fill={colorClass} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
