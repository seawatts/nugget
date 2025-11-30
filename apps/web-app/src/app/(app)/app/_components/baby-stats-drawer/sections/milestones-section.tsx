import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Target } from 'lucide-react';
import type { Milestones } from '../types';

interface MilestonesSectionProps {
  activities: Array<typeof Activities.$inferSelect>;
  formatVolume: (ml: number) => string;
  milestones: Milestones;
}

export function MilestonesSection({
  activities,
  formatVolume,
  milestones,
}: MilestonesSectionProps) {
  if (
    !milestones.activityMilestone &&
    !milestones.volumeMilestone &&
    !milestones.diaperMilestone &&
    !milestones.daysMilestone
  ) {
    return null;
  }

  const totalVolumeMl = activities
    .filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding') &&
        a.amountMl,
    )
    .reduce((sum, a) => sum + (a.amountMl || 0), 0);

  const totalDiapers = activities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
      </div>
      <div className="space-y-3">
        {milestones.activityMilestone && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Activities
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {activities.length.toLocaleString()} /{' '}
                  {milestones.activityMilestone.next.toLocaleString()}
                </div>
              </div>
              <div className="text-lg">
                {milestones.activityMilestone.progress >= 75
                  ? '🎉'
                  : milestones.activityMilestone.progress >= 50
                    ? '🎯'
                    : '📈'}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, milestones.activityMilestone.progress)}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {milestones.activityMilestone.next - activities.length} more to
              next milestone!
            </div>
          </Card>
        )}
        {milestones.volumeMilestone && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Volume Fed
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatVolume(totalVolumeMl)} /{' '}
                  {formatVolume(milestones.volumeMilestone.next)}
                </div>
              </div>
              <div className="text-lg">🥛</div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, milestones.volumeMilestone.progress)}%`,
                }}
              />
            </div>
          </Card>
        )}
        {milestones.diaperMilestone && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Diapers Changed
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {totalDiapers} / {milestones.diaperMilestone.next}
                </div>
              </div>
              <div className="text-lg">👶</div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, milestones.diaperMilestone.progress)}%`,
                }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
