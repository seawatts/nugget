'use client';

import { Card } from '@nugget/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendData } from '../types';

interface GenericTrendChartProps {
  data: TrendData[];
  timeRange?: '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
  colorVar?: string; // CSS variable name (e.g., 'var(--activity-walk)')
}

export function GenericTrendChart({
  data,
  colorVar = 'var(--primary)',
}: GenericTrendChartProps) {
  // Prepare chart data
  const chartData = data.map((item) => ({
    count: item.count || 0,
    date: item.displayDate || item.date,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={chartData}>
          <XAxis
            axisLine={false}
            dataKey="date"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            fontSize={12}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;

              const data = payload[0]?.payload;
              return (
                <Card className="p-2 shadow-lg">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{data.date}</p>
                    <p className="text-xs text-muted-foreground">
                      Count: {data.count}
                    </p>
                  </div>
                </Card>
              );
            }}
          />
          <Bar dataKey="count" fill={colorVar} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
