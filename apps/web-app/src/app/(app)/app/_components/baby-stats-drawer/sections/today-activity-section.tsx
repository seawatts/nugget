import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Calendar } from 'lucide-react';

interface TodayActivitySectionProps {
  feedingStats: {
    count: number;
    totalMl: number;
    avgAmountMl: number | null;
  };
  diaperStats: {
    total: number;
    wet: number;
    dirty: number;
  };
  sleepStats: {
    count: number;
    totalHours: number;
  };
  todayActivities: Array<typeof Activities.$inferSelect>;
  formatVolume: (ml: number) => string;
}

export function TodayActivitySection({
  feedingStats,
  diaperStats,
  sleepStats,
  todayActivities,
  formatVolume,
}: TodayActivitySectionProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Today's Activity
          </h3>
        </div>
      </div>

      {/* Feeding Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Today's Feedings
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold text-foreground">
              {feedingStats.count}
            </div>
          </Card>
          {feedingStats.totalMl > 0 && (
            <>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Volume
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatVolume(feedingStats.totalMl)}
                </div>
              </Card>
              {feedingStats.avgAmountMl !== null && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Average
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatVolume(feedingStats.avgAmountMl)}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
        {/* Bottle vs Nursing breakdown */}
        {feedingStats.count > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Bottle</div>
              <div className="text-xl font-semibold text-foreground">
                {
                  todayActivities.filter(
                    (a) =>
                      a.type === 'bottle' ||
                      (a.type === 'feeding' &&
                        a.details &&
                        typeof a.details === 'object' &&
                        'type' in a.details &&
                        a.details.type === 'bottle'),
                  ).length
                }
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Nursing</div>
              <div className="text-xl font-semibold text-foreground">
                {
                  todayActivities.filter(
                    (a) =>
                      a.type === 'nursing' ||
                      (a.type === 'feeding' &&
                        a.details &&
                        typeof a.details === 'object' &&
                        'type' in a.details &&
                        a.details.type === 'nursing'),
                  ).length
                }
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Diaper Stats */}
      {diaperStats.total > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Diapers
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-bold text-foreground">
                {diaperStats.total}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Wet</div>
              <div className="text-2xl font-bold text-foreground">
                {diaperStats.wet}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Dirty</div>
              <div className="text-2xl font-bold text-foreground">
                {diaperStats.dirty}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sleep Stats */}
      {sleepStats.count > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Sleep
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Sessions</div>
              <div className="text-2xl font-bold text-foreground">
                {sleepStats.count}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Total Hours
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(sleepStats.totalHours * 10) / 10}h
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
