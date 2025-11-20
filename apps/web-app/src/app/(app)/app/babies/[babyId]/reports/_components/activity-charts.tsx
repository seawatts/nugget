'use client';

import { Card } from '@nugget/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import { Baby, Droplet, Moon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface FeedingChartProps {
  data: Array<{ date: string; count: number; totalMl: number }>;
}

export function FeedingChart({ data }: FeedingChartProps) {
  // Format date for display (e.g., "Mon 1/15")
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
    return {
      ...item,
      displayDate: `${dayName} ${monthDay}`,
    };
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Droplet className="size-5 text-activity-feeding" />
            Feeding Patterns
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Daily feeding counts
          </p>
        </div>
      </div>

      <ChartContainer
        className="h-[200px] w-full"
        config={{
          count: {
            color: 'var(--activity-feeding)',
            label: 'Feedings',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={formattedData}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              fontSize={12}
              stroke="var(--muted-foreground)"
            />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" />
            <ChartTooltip
              content={(props) => <ChartTooltipContent {...props} />}
            />
            <Bar
              dataKey="count"
              fill="var(--activity-feeding)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
}

interface SleepChartProps {
  data: Array<{ date: string; count: number; totalMinutes: number }>;
}

export function SleepChart({ data }: SleepChartProps) {
  // Convert minutes to hours for display
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
    return {
      displayDate: `${dayName} ${monthDay}`,
      hours: item.totalMinutes / 60,
    };
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Moon className="size-5 text-activity-sleep" />
            Sleep Patterns
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Daily sleep hours
          </p>
        </div>
      </div>

      <ChartContainer
        className="h-[200px] w-full"
        config={{
          hours: {
            color: 'var(--activity-sleep)',
            label: 'Hours',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="sleepGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--activity-sleep)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--activity-sleep)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              fontSize={12}
              stroke="var(--muted-foreground)"
            />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" />
            <ChartTooltip
              content={(props) => <ChartTooltipContent {...props} />}
            />
            <Area
              dataKey="hours"
              fill="url(#sleepGradient)"
              stroke="var(--activity-sleep)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
}

interface DiaperChartProps {
  data: Array<{ date: string; wet: number; dirty: number; both: number }>;
}

export function DiaperChart({ data }: DiaperChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
    return {
      ...item,
      displayDate: `${dayName} ${monthDay}`,
    };
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Baby className="size-5 text-activity-diaper" />
            Diaper Changes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Daily diaper breakdown
          </p>
        </div>
      </div>

      <ChartContainer
        className="h-[200px] w-full"
        config={{
          both: {
            color: 'var(--activity-feeding)',
            label: 'Both',
          },
          dirty: {
            color: 'var(--activity-pumping)',
            label: 'Dirty',
          },
          wet: {
            color: 'var(--activity-diaper)',
            label: 'Wet',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={formattedData}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              fontSize={12}
              stroke="var(--muted-foreground)"
            />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" />
            <ChartTooltip
              content={(props) => <ChartTooltipContent {...props} />}
            />
            <Bar
              dataKey="wet"
              fill="var(--activity-diaper)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="dirty"
              fill="var(--activity-pumping)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="both"
              fill="var(--activity-feeding)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-activity-diaper" />
          <span className="text-sm text-muted-foreground">Wet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-activity-pumping" />
          <span className="text-sm text-muted-foreground">Dirty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-activity-feeding" />
          <span className="text-sm text-muted-foreground">Both</span>
        </div>
      </div>
    </Card>
  );
}
