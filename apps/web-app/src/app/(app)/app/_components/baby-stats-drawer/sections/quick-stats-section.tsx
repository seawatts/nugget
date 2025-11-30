import { Card } from '@nugget/ui/card';
import { Zap } from 'lucide-react';
import type { Streaks } from '../types';

interface QuickStatsSectionProps {
  todayActivitiesCount: number;
  streaks: Streaks;
  level: { level: number; name: string };
  mostActiveToday: { type: string; label: string; count: number } | null;
}

export function QuickStatsSection({
  todayActivitiesCount,
  streaks,
  level,
  mostActiveToday,
}: QuickStatsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">At a Glance</h3>
      </div>
      <Card className="p-4 bg-gradient-to-br from-muted/50 to-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Today's Activities
            </div>
            <div className="text-xl font-bold text-foreground">
              {todayActivitiesCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Best Streak
            </div>
            <div className="text-xl font-bold text-foreground">
              {Math.max(
                streaks.feeding.current,
                streaks.diaper.current,
                streaks.sleep.current,
                streaks.perfectDay.current,
              )}{' '}
              days
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Level</div>
            <div className="text-xl font-bold text-foreground">
              {level.level}
            </div>
            <div className="text-xs text-muted-foreground">{level.name}</div>
          </div>
          {mostActiveToday && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Most Active Today
              </div>
              <div className="text-xl font-bold text-foreground">
                {mostActiveToday.count}
              </div>
              <div className="text-xs text-muted-foreground">
                {mostActiveToday.label}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
