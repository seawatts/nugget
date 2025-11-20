'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import {
  Baby,
  ChevronRight,
  Clock,
  Droplet,
  Moon,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { Suspense, use, useState } from 'react';
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
import { DoctorVisitSummary } from './_components/doctor-visit-summary';

// Sample data for charts
const sleepData = [
  { day: 'Mon', hours: 14.5 },
  { day: 'Tue', hours: 13.2 },
  { day: 'Wed', hours: 15.1 },
  { day: 'Thu', hours: 14.8 },
  { day: 'Fri', hours: 13.5 },
  { day: 'Sat', hours: 15.5 },
  { day: 'Sun', hours: 14.2 },
];

const feedingData = [
  { count: 1, time: '12am' },
  { count: 1, time: '3am' },
  { count: 2, time: '6am' },
  { count: 1, time: '9am' },
  { count: 2, time: '12pm' },
  { count: 1, time: '3pm' },
  { count: 2, time: '6pm' },
  { count: 1, time: '9pm' },
];

const diaperData = [
  { day: 'Mon', dirty: 3, wet: 6 },
  { day: 'Tue', dirty: 2, wet: 7 },
  { day: 'Wed', dirty: 4, wet: 6 },
  { day: 'Thu', dirty: 3, wet: 8 },
  { day: 'Fri', dirty: 2, wet: 7 },
  { day: 'Sat', dirty: 3, wet: 6 },
  { day: 'Sun', dirty: 3, wet: 7 },
];

type ViewMode = 'general' | 'doctor-visit';

interface PageProps {
  params: Promise<{
    babyId: string;
  }>;
}

export default function ReportsPage({ params }: PageProps) {
  const { babyId } = use(params);
  const [viewMode, setViewMode] = useState<ViewMode>('general');

  return (
    <main className="px-4 pt-6 pb-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
          Reports
        </h1>
        <p className="text-muted-foreground text-balance">
          Track your baby's patterns and trends
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          className="rounded-full"
          onClick={() => setViewMode('general')}
          size="sm"
          variant={viewMode === 'general' ? 'default' : 'outline'}
        >
          <TrendingUp className="mr-2 size-4" />
          General Reports
        </Button>
        <Button
          className="rounded-full"
          onClick={() => setViewMode('doctor-visit')}
          size="sm"
          variant={viewMode === 'doctor-visit' ? 'default' : 'outline'}
        >
          <Stethoscope className="mr-2 size-4" />
          Doctor Visit Prep
        </Button>
      </div>

      {/* Conditional rendering based on view mode */}
      {viewMode === 'doctor-visit' ? (
        <Suspense fallback={<div>Loading...</div>}>
          <DoctorVisitSummary babyId={babyId} />
        </Suspense>
      ) : (
        <>
          {/* Date Range Selector */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button className="rounded-full" size="sm" variant="default">
              Today
            </Button>
            <Button
              className="rounded-full bg-transparent"
              size="sm"
              variant="outline"
            >
              Week
            </Button>
            <Button
              className="rounded-full bg-transparent"
              size="sm"
              variant="outline"
            >
              Month
            </Button>
            <Button
              className="rounded-full bg-transparent"
              size="sm"
              variant="outline"
            >
              Custom
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 bg-[var(--sleep)] text-[var(--primary-foreground)]">
              <Moon className="h-5 w-5 mb-2 opacity-90" />
              <div className="text-2xl font-bold mb-1">14.2h</div>
              <div className="text-xs opacity-90">Avg Sleep</div>
            </Card>

            <Card className="p-4 bg-[var(--feeding)] text-white">
              <Droplet className="h-5 w-5 mb-2 opacity-90" />
              <div className="text-2xl font-bold mb-1">8</div>
              <div className="text-xs opacity-90">Feedings</div>
            </Card>

            <Card className="p-4 bg-[var(--diaper)] text-[var(--primary-foreground)]">
              <Baby className="h-5 w-5 mb-2 opacity-90" />
              <div className="text-2xl font-bold mb-1">10</div>
              <div className="text-xs opacity-90">Diapers</div>
            </Card>
          </div>

          {/* Sleep Chart */}
          <Card className="p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Moon className="h-5 w-5 text-[var(--sleep)]" />
                  Sleep Patterns
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Daily sleep hours this week
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <ChartContainer
              className="h-[200px] w-full"
              config={{
                hours: {
                  color: 'var(--sleep)',
                  label: 'Hours',
                },
              }}
            >
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={sleepData}>
                  <defs>
                    <linearGradient
                      id="sleepGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--sleep)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--sleep)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
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
                    stroke="var(--sleep)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-foreground">
                <span className="font-semibold">+8%</span> more sleep than last
                week
              </span>
            </div>
          </Card>

          {/* Feeding Chart */}
          <Card className="p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-[var(--feeding)]" />
                  Feeding Schedule
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Today's feeding times
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <ChartContainer
              className="h-[200px] w-full"
              config={{
                count: {
                  color: 'var(--feeding)',
                  label: 'Feedings',
                },
              }}
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={feedingData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                  <ChartTooltip
                    content={(props) => <ChartTooltipContent {...props} />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--feeding)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-[var(--feeding)]" />
              <span className="text-sm text-foreground">
                Average <span className="font-semibold">3.2 hours</span> between
                feedings
              </span>
            </div>
          </Card>

          {/* Diaper Chart */}
          <Card className="p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Baby className="h-5 w-5 text-[var(--diaper)]" />
                  Diaper Changes
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Weekly diaper summary
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <ChartContainer
              className="h-[200px] w-full"
              config={{
                dirty: {
                  color: 'var(--feeding)',
                  label: 'Dirty',
                },
                wet: {
                  color: 'var(--diaper)',
                  label: 'Wet',
                },
              }}
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={diaperData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                  <ChartTooltip
                    content={(props) => <ChartTooltipContent {...props} />}
                  />
                  <Bar
                    dataKey="wet"
                    fill="var(--diaper)"
                    radius={[8, 8, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="dirty"
                    fill="var(--feeding)"
                    radius={[8, 8, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--diaper)]" />
                <span className="text-sm text-muted-foreground">Wet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--feeding)]" />
                <span className="text-sm text-muted-foreground">Dirty</span>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Quick Stats
            </h3>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Longest Sleep
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    6h 45m
                  </div>
                </div>
                <Moon className="h-8 w-8 text-[var(--sleep)] opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Milk Today
                  </div>
                  <div className="text-xl font-bold text-foreground">28 oz</div>
                </div>
                <Droplet className="h-8 w-8 text-[var(--feeding)] opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Last Feeding
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    2h 15m ago
                  </div>
                </div>
                <Clock className="h-8 w-8 text-[var(--feeding)] opacity-50" />
              </div>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
