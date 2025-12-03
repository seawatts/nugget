'use client';

import { DASHBOARD_COMPONENT } from '@nugget/analytics/utils';
import { api } from '@nugget/api/react';
import { Card } from '@nugget/ui/card';
import { format } from 'date-fns';
import { StatsDrawerWrapper } from '../../activities/shared/components/stats/stats-drawer-wrapper';

interface DailyQuestionStatsDrawerProps {
  babyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responses: Array<{
    id: string;
    createdAt: Date;
    date: Date;
    question: string;
    selectedAnswer: string | null;
    answerChoices: string[];
  }>;
  currentStreak: number;
  weeklyCompletionCount: number;
}

export function DailyQuestionStatsDrawer({
  babyId,
  open,
  onOpenChange,
  responses,
  currentStreak,
  weeklyCompletionCount,
}: DailyQuestionStatsDrawerProps) {
  const { data: insightsData } = api.parentWellness.getWeeklyInsights.useQuery(
    { babyId },
    {
      enabled: responses.length > 0,
    },
  );

  const answeredResponses = responses.filter((r) => r.selectedAnswer);

  return (
    <StatsDrawerWrapper
      babyId={babyId}
      componentName={DASHBOARD_COMPONENT.PARENT_WELLNESS_STATS_DRAWER}
      onOpenChange={onOpenChange}
      open={open}
      title="Check-In Insights"
    >
      {/* Goal Summary */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Your Progress</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Current Streak
            </span>
            <span className="text-lg font-semibold">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              {currentStreak >= 3 && ' 🔥'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This Week</span>
            <span className="text-lg font-semibold">
              {weeklyCompletionCount}/7 days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Check-Ins
            </span>
            <span className="text-lg font-semibold">
              {answeredResponses.length}
            </span>
          </div>
        </div>
      </Card>

      {/* AI Insights */}
      {insightsData && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Weekly Insights</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insightsData.insights}
          </p>
        </Card>
      )}

      {/* Recent Responses */}
      {answeredResponses.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Check-Ins</h3>
          <div className="space-y-3">
            {answeredResponses.slice(0, 10).map((response) => (
              <div
                className="flex flex-col gap-1 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                key={response.id}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(
                      new Date(response.createdAt ?? response.date),
                      'MMM d, yyyy',
                    )}
                  </span>
                </div>
                <p className="text-sm font-medium">{response.question}</p>
                <p className="text-sm text-muted-foreground">
                  Answered:{' '}
                  <span className="font-medium">{response.selectedAnswer}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {answeredResponses.length === 0 && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Start checking in daily to see your insights and patterns here.
          </p>
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
