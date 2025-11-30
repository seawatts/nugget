'use client';

import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Badge } from '@nugget/ui/badge';
import { Card } from '@nugget/ui/card';
import { Clock, Moon, Users } from 'lucide-react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { maximizeParentSleep } from '../parent-nap-scheduling';

interface ParentNapRecommendationsProps {
  babySleepActivities: Array<typeof Activities.$inferSelect>;
  allParentSleepActivities: Array<typeof Activities.$inferSelect>;
  parentIds: string[];
  parentNames: Record<string, { firstName: string; avatarUrl?: string | null }>;
  timeFormat: '12h' | '24h';
}

export function ParentNapRecommendations({
  babySleepActivities,
  allParentSleepActivities,
  parentIds,
  parentNames,
  timeFormat,
}: ParentNapRecommendationsProps) {
  if (parentIds.length === 0) {
    return null; // Don't show if no parents
  }

  const recommendations = maximizeParentSleep(
    babySleepActivities,
    allParentSleepActivities,
    parentIds,
  );

  const priorityColors = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  if (
    recommendations.recommendations.length === 0 &&
    recommendations.coordinatedWindows.length === 0
  ) {
    return (
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground">
            Parent Nap Recommendations
          </h3>
          <p className="text-xs text-muted-foreground">
            Track more baby sleep data to get personalized nap recommendations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Parent Nap Recommendations
        </h3>
        <p className="text-xs text-muted-foreground">
          Maximize your sleep during baby's longest sleep windows
        </p>
      </div>

      {/* Coordinated Windows (Both Parents) */}
      {recommendations.coordinatedWindows.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">
              Coordinated Nap Opportunities
            </h4>
          </div>
          <div className="space-y-3">
            {recommendations.coordinatedWindows.slice(0, 2).map((window) => (
              <div
                className="rounded-lg border bg-muted/50 p-3"
                key={`${window.startTime}-${window.endTime}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={priorityColors[window.priority]}
                        variant="secondary"
                      >
                        {window.priority.charAt(0).toUpperCase() +
                          window.priority.slice(1)}
                        {' Priority'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatTimeWithPreference(window.startTime, timeFormat)} -{' '}
                      {formatTimeWithPreference(window.endTime, timeFormat)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Math.round((window.durationMinutes / 60) * 10) / 10}{' '}
                      hours available
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {window.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {window.participants.map((userId) => {
                        const parent = parentNames[userId];
                        if (!parent) return null;
                        return (
                          <div
                            className="flex items-center gap-1 rounded-md bg-background px-2 py-1"
                            key={userId}
                          >
                            <Avatar className="size-4">
                              <AvatarImage
                                alt={parent.firstName}
                                src={parent.avatarUrl || undefined}
                              />
                              <AvatarFallback className="text-[8px]">
                                {parent.firstName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground">
                              {parent.firstName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Recommendations */}
      {recommendations.recommendations.map((rec) => {
        const parent = parentNames[rec.userId];
        if (!parent) return null;

        if (rec.recommendedNaps.length === 0) {
          return null;
        }

        return (
          <div className="space-y-3" key={rec.userId}>
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage
                  alt={parent.firstName}
                  src={parent.avatarUrl || undefined}
                />
                <AvatarFallback className="text-xs">
                  {parent.firstName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="text-sm font-medium text-foreground">
                {parent.firstName}'s Nap Opportunities
              </h4>
            </div>
            <div className="space-y-2">
              {rec.recommendedNaps.map((nap) => (
                <div
                  className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                  key={`${nap.startTime}-${nap.endTime}`}
                >
                  <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30">
                    <Moon className="size-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatTimeWithPreference(nap.startTime, timeFormat)} -{' '}
                        {formatTimeWithPreference(nap.endTime, timeFormat)}
                      </p>
                      <Badge
                        className={priorityColors[nap.priority]}
                        variant="secondary"
                      >
                        {nap.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Math.round((nap.durationMinutes / 60) * 10) / 10} hours
                      available
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {nap.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {rec.reasoning && (
              <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {recommendations.totalPotentialSleepMinutes > 0 && (
        <div className="mt-4 rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Total Available Sleep
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {Math.round(
                  (recommendations.totalPotentialSleepMinutes / 60) * 10,
                ) / 10}{' '}
                hours
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Combined sleep opportunities for all parents during baby's
                longest sleep windows
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
