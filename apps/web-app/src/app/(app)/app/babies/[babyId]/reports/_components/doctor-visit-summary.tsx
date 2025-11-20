'use client';

import { api } from '@nugget/api/react';
import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/skeleton';
import { AlertCircle, Baby, Droplet, Moon, Sparkles } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { getDoctorVisitSummaryAction } from '~/app/(app)/app/_components/activities/doctor-visit/summary-actions';
import { DiaperChart, FeedingChart, SleepChart } from './activity-charts';
import { DateRangeFilter } from './date-range-filter';

interface DoctorVisitSummaryProps {
  babyId?: string;
}

export function DoctorVisitSummary({ babyId }: DoctorVisitSummaryProps) {
  // Get baby info
  const [baby] = api.babies.getMostRecent.useSuspenseQuery();
  const effectiveBabyId = babyId || baby?.id;

  // Date range state
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>(() => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return { endDate, startDate };
  });

  // Fetch summary data
  const { execute, result, isExecuting } = useAction(
    getDoctorVisitSummaryAction,
  );

  // Load initial data
  useEffect(() => {
    if (effectiveBabyId) {
      void execute({
        babyId: effectiveBabyId,
        endDate: dateRange.endDate,
        startDate: dateRange.startDate,
      });
    }
  }, [effectiveBabyId, dateRange, execute]);

  const summaryData = result?.data;

  // Handle date range changes
  const handleDateRangeChange = (newRange: {
    startDate: Date;
    endDate: Date;
  }) => {
    setDateRange(newRange);
  };

  if (!effectiveBabyId) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No baby found. Please complete onboarding first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        lastVisitDate={summaryData?.lastVisitDate || null}
        onRangeChange={handleDateRangeChange}
      />

      {isExecuting ? (
        <LoadingSkeleton />
      ) : summaryData ? (
        <>
          {/* Section A: Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              average={summaryData.feeding.averagePerDay}
              icon={Droplet}
              label="Feedings"
              sublabel={`${summaryData.feeding.totalMl.toFixed(0)} ml total`}
              total={summaryData.feeding.total}
            />
            <SummaryCard
              average={summaryData.sleep.averageHoursPerDay}
              icon={Moon}
              label="Sleep"
              sublabel={`${(summaryData.sleep.longestSleepMinutes / 60).toFixed(1)} hrs longest`}
              total={summaryData.sleep.totalMinutes / 60}
              unit="hrs"
            />
            <SummaryCard
              average={summaryData.diaper.averagePerDay}
              icon={Baby}
              label="Diapers"
              sublabel={`${summaryData.diaper.wet}W / ${summaryData.diaper.dirty}D / ${summaryData.diaper.both}B`}
              total={summaryData.diaper.total}
            />
          </div>

          {/* Section B: Daily Breakdown Charts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Daily Breakdown
            </h3>
            <FeedingChart data={summaryData.feeding.byDay} />
            <SleepChart data={summaryData.sleep.byDay} />
            <DiaperChart data={summaryData.diaper.byDay} />
          </div>

          {/* Section C: AI Insights */}
          <AIInsights
            babyId={effectiveBabyId}
            dateRange={dateRange}
            summaryData={summaryData}
          />
        </>
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  total: number;
  average: number;
  unit?: string;
  sublabel?: string;
}

function SummaryCard({
  icon: Icon,
  label,
  total,
  average,
  unit = '',
  sublabel,
}: SummaryCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <Icon className="size-6 text-primary opacity-70" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground">
          {total.toFixed(unit === 'hrs' ? 1 : 0)}
          {unit}
        </p>
        <p className="text-sm text-muted-foreground">
          Avg: {average.toFixed(1)} per day
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-2">{sublabel}</p>
        )}
      </div>
    </Card>
  );
}

interface AIInsightsProps {
  babyId: string;
  dateRange: { startDate: Date; endDate: Date };
  summaryData: {
    babyInfo: { name: string; ageDays: number };
    diaper: { averagePerDay: number };
    feeding: { averagePerDay: number };
    sleep: { averageHoursPerDay: number };
  };
}

function AIInsights({ summaryData }: AIInsightsProps) {
  // TODO: Implement AI insights generation
  // For now, show a placeholder
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="size-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            AI Doctor Visit Prep
          </h3>
          <p className="text-sm text-muted-foreground">
            Questions and insights for your doctor
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">
            {summaryData.babyInfo.name} ({summaryData.babyInfo.ageDays} days
            old) has been feeding {summaryData.feeding.averagePerDay.toFixed(1)}{' '}
            times per day on average, sleeping{' '}
            {summaryData.sleep.averageHoursPerDay.toFixed(1)} hours per day, and
            having {summaryData.diaper.averagePerDay.toFixed(1)} diaper changes
            per day.
          </p>
        </div>

        {/* Questions Placeholder */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">
            Questions to Ask Doctor
          </h4>
          <ul className="space-y-2">
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Is {summaryData.babyInfo.name}'s feeding frequency appropriate
                for their age?
              </span>
            </li>
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Are the sleep patterns normal for a{' '}
                {summaryData.babyInfo.ageDays}-day-old baby?
              </span>
            </li>
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Is the diaper output indicating adequate hydration and
                nutrition?
              </span>
            </li>
          </ul>
        </div>

        {/* Concerns Placeholder */}
        {summaryData.diaper.averagePerDay < 6 &&
          summaryData.babyInfo.ageDays < 30 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-1">
                    Potential Concern
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Diaper output is below the recommended 6+ per day for
                    newborns. Please discuss with your pediatrician.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card className="p-5" key={i}>
            <Skeleton className="h-6 w-6 mb-3" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3].map((i) => (
          <Card className="p-5" key={i}>
            <Skeleton className="h-[200px] w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
