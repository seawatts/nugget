import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import type { Patterns, RealWorldComparisons, Records } from '../types';

interface InsightsPatternsSectionProps {
  activities: Array<typeof Activities.$inferSelect>;
  comparisons: RealWorldComparisons;
  patterns: Patterns;
  records: Records;
}

export function InsightsPatternsSection({
  activities,
  comparisons,
  patterns,
  records,
}: InsightsPatternsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Insights & Patterns
        </h3>
      </div>

      {/* Real-World Comparisons */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">
          Real-World Comparisons
        </h4>
        <div className="space-y-2">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="text-sm font-medium text-foreground mb-1">
              Diaper Mountain
            </div>
            <div className="text-base text-foreground">
              {comparisons.diaper}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <div className="text-sm font-medium text-foreground mb-1">
              Milk Ocean
            </div>
            <div className="text-base text-foreground">{comparisons.milk}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="text-sm font-medium text-foreground mb-1">
              Sleep Champion
            </div>
            <div className="text-base text-foreground">{comparisons.sleep}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="text-sm font-medium text-foreground mb-1">
              Activity Marathon
            </div>
            <div className="text-base text-foreground">
              {comparisons.activities}
            </div>
          </Card>
          {activities.filter((a) => a.type === 'vitamin_d').length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Vitamin D Sunshine
              </div>
              <div className="text-base text-foreground">
                {comparisons.vitaminD}
              </div>
            </Card>
          )}
          {activities.filter((a) => a.type === 'stroller_walk').length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Walking Adventures
              </div>
              <div className="text-base text-foreground">
                {comparisons.walks}
              </div>
            </Card>
          )}
          {activities.filter((a) => a.type === 'nail_trimming').length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Nail Trimming Master
              </div>
              <div className="text-base text-foreground">
                {comparisons.nailTrimming}
              </div>
            </Card>
          )}
          {activities.filter((a) => a.type === 'contrast_time').length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Contrast Time Champion
              </div>
              <div className="text-base text-foreground">
                {comparisons.contrastTime}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Pattern Recognition */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">
          Your Patterns
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {patterns.nightOwl ? '🦉 Night Owl' : '🐦 Early Bird'}
            </div>
            <div className="text-sm font-semibold text-foreground">
              Most active at {patterns.mostProductiveHour}:00
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Feeding Style
            </div>
            <div className="text-sm font-semibold text-foreground">
              {patterns.feedingStyle === 'bottle'
                ? '🍼 Bottle Enthusiast'
                : patterns.feedingStyle === 'nursing'
                  ? '🤱 Nursing Pro'
                  : '⚖️ Balanced Feeder'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Weekend Warrior
            </div>
            <div className="text-sm font-semibold text-foreground">
              {patterns.weekendWarrior.weekend > patterns.weekendWarrior.weekday
                ? `Weekend: ${patterns.weekendWarrior.weekend}`
                : `Weekday: ${patterns.weekendWarrior.weekday}`}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Tracking Accuracy
            </div>
            <div className="text-sm font-semibold text-foreground">
              {patterns.trackingAccuracy}% 🎯
            </div>
          </Card>
        </div>
      </div>

      {/* Personal Records */}
      {(records.longestSleep ||
        records.mostFeedingsInDay ||
        records.mostActiveDay) && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Personal Records
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {records.longestSleep && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Longest Sleep
                </div>
                <div className="text-xl font-bold text-foreground">
                  {Math.round((records.longestSleep.duration / 60) * 10) / 10}h
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(records.longestSleep.date, 'MMM d, yyyy')}
                </div>
              </Card>
            )}
            {records.mostFeedingsInDay && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Most Feedings (Day)
                </div>
                <div className="text-xl font-bold text-foreground">
                  {records.mostFeedingsInDay.count}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(records.mostFeedingsInDay.date, 'MMM d, yyyy')}
                </div>
              </Card>
            )}
            {records.mostActiveDay && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Most Active Day
                </div>
                <div className="text-xl font-bold text-foreground">
                  {records.mostActiveDay.count} activities
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(records.mostActiveDay.date, 'MMM d, yyyy')}
                </div>
              </Card>
            )}
            {records.fastestFeeding && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Fastest Feeding Gap
                </div>
                <div className="text-xl font-bold text-foreground">
                  {records.fastestFeeding.minutes} min
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(records.fastestFeeding.date, 'MMM d, yyyy')}
                </div>
              </Card>
            )}
            {records.longestGap && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Longest Break
                </div>
                <div className="text-xl font-bold text-foreground">
                  {records.longestGap.hours}h
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(records.longestGap.date, 'MMM d, yyyy')}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
