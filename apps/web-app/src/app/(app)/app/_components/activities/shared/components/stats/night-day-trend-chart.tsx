'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import { format } from 'date-fns';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendData } from '../../types';

interface NightDayTrendChartProps {
  nightData: TrendData[];
  dayData: TrendData[];
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
  metricType: 'count' | 'hours' | 'amount';
  unit?: 'ML' | 'OZ';
  nightLabel?: string;
  dayLabel?: string;
  valueLabel?: string;
}

export function NightDayTrendChart({
  dayData,
  metricType,
  nightData,
  timeRange,
  unit,
  dayLabel = 'Day',
  nightLabel = 'Night',
  valueLabel: _valueLabel,
}: NightDayTrendChartProps) {
  // Format data for chart
  const formattedData = useMemo(() => {
    // Get all unique dates from both datasets
    const allDates = new Set<string>();
    for (const item of nightData) {
      allDates.add(item.date);
    }
    for (const item of dayData) {
      allDates.add(item.date);
    }

    const dates = Array.from(allDates).sort();

    return dates.map((date) => {
      const nightItem = nightData.find((item) => item.date === date);
      const dayItem = dayData.find((item) => item.date === date);

      const dateObj = new Date(date);

      // Format display date based on time range
      let displayDate: string;
      if (timeRange === '24h') {
        displayDate = format(dateObj, 'HH:mm');
      } else if (timeRange === '3m' || timeRange === '6m') {
        displayDate = format(dateObj, 'M/d');
      } else {
        displayDate = format(dateObj, 'EEE');
      }

      let nightValue = 0;
      let dayValue = 0;

      if (metricType === 'count') {
        nightValue = nightItem?.count || 0;
        dayValue = dayItem?.count || 0;
      } else if (metricType === 'hours') {
        const nightMinutes = nightItem?.totalMinutes || 0;
        const dayMinutes = dayItem?.totalMinutes || 0;
        nightValue = Number((nightMinutes / 60).toFixed(1));
        dayValue = Number((dayMinutes / 60).toFixed(1));
      } else if (metricType === 'amount') {
        const nightMl = nightItem?.totalMl || 0;
        const dayMl = dayItem?.totalMl || 0;
        if (unit === 'OZ') {
          // Convert ML to OZ (1 OZ = 29.5735 ML)
          nightValue = Number((nightMl / 29.5735).toFixed(1));
          dayValue = Number((dayMl / 29.5735).toFixed(1));
        } else {
          nightValue = Math.round(nightMl);
          dayValue = Math.round(dayMl);
        }
      }

      return {
        date: displayDate,
        day: dayValue,
        night: nightValue,
      };
    });
  }, [dayData, metricType, nightData, timeRange, unit]);

  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        day: {
          color: 'hsl(var(--chart-2))',
          label: dayLabel,
        },
        night: {
          color: 'hsl(var(--chart-1))',
          label: nightLabel,
        },
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <LineChart
          data={formattedData}
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={40} />
          <ChartTooltip
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <Legend />
          <Line
            dataKey="night"
            dot={false}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="day"
            dot={false}
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
