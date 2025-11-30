import { Card } from '@nugget/ui/card';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import type { FunStats, HumorousStats } from '../types';

interface FunInsightsSectionProps {
  formatVolume: (ml: number) => string;
  funStats: FunStats | null;
  humorousStats: HumorousStats | null;
}

export function FunInsightsSection({
  formatVolume,
  funStats,
  humorousStats,
}: FunInsightsSectionProps) {
  if (!humorousStats && !funStats) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Fun Insights</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {funStats && (
          <>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Total Activities
              </div>
              <div className="text-2xl font-bold text-foreground">
                {funStats.totalActivities.toLocaleString()}
              </div>
            </Card>
            {funStats.daysSinceFirst > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Days Tracking
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {funStats.daysSinceFirst}
                </div>
              </Card>
            )}
            {funStats.mostActiveDay && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Most Active Day
                </div>
                <div className="text-xl font-bold text-foreground">
                  {funStats.mostActiveDayCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(funStats.mostActiveDay), 'MMM d, yyyy')}
                </div>
              </Card>
            )}
            {funStats.avgPerDay7d > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg/Day (7d)
                </div>
                <div className="text-xl font-bold text-foreground">
                  {Math.round(funStats.avgPerDay7d * 10) / 10}
                </div>
              </Card>
            )}
            {funStats.avgPerDay30d > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg/Day (30d)
                </div>
                <div className="text-xl font-bold text-foreground">
                  {Math.round(funStats.avgPerDay30d * 10) / 10}
                </div>
              </Card>
            )}
            {funStats.totalVolumeMl > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Volume Fed
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatVolume(funStats.totalVolumeMl)}
                </div>
              </Card>
            )}
            {funStats.totalDiapers > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Diapers
                </div>
                <div className="text-xl font-bold text-foreground">
                  {funStats.totalDiapers.toLocaleString()}
                </div>
              </Card>
            )}
          </>
        )}
        {humorousStats && (
          <>
            {humorousStats.avgDiaperGap > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Diaper Change Speed
                </div>
                <div className="text-lg font-bold text-foreground">
                  {humorousStats.avgDiaperGap} min avg
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  You're on it! ⚡
                </div>
              </Card>
            )}
            {humorousStats.maxInHour > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Activity Density
                </div>
                <div className="text-lg font-bold text-foreground">
                  {humorousStats.maxInHour} in 1 hour
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  You're a pro! 🚀
                </div>
              </Card>
            )}
            {humorousStats.sleepEfficiency > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Sleep Efficiency
                </div>
                <div className="text-lg font-bold text-foreground">
                  {humorousStats.sleepEfficiency}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {humorousStats.sleepEfficiency > 50
                    ? 'More than a cat! 🐱'
                    : 'Sweet dreams! 💤'}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
