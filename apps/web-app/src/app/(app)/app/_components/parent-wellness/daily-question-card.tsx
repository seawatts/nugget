'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { toast } from '@nugget/ui/sonner';
import { format, startOfDay, subDays } from 'date-fns';
import { useParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useMemo, useState } from 'react';
import { PredictiveInfoDrawer } from '../activities/shared/components/predictive-cards';
import { PredictiveCardHeader } from '../activities/shared/components/predictive-cards/predictive-card-header';
import { submitDailyWellnessResponseAction } from './actions';
import { DailyQuestionStatsDrawer } from './components/daily-question-stats-drawer';
import { parentWellnessTheme } from './theme-config';

interface SevenDayResponse {
  date: string;
  dateObj: Date;
  displayDate: string;
  hasResponse: boolean;
  isToday: boolean;
  answer?: string | null;
}

function useSevenDayResponses(
  allResponses: Array<{
    date: Date;
    selectedAnswer: string | null;
  }>,
): SevenDayResponse[] {
  return useMemo(() => {
    const startOfDayNow = startOfDay(new Date());
    const days: SevenDayResponse[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDayNow, i);
      const dateKey = format(date, 'yyyy-MM-dd');

      // Find response for this day
      const dayResponse = allResponses.find((response) => {
        const responseDate = startOfDay(response.date);
        const responseKey = format(responseDate, 'yyyy-MM-dd');
        return responseKey === dateKey;
      });

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
      const isToday = i === 0;

      days.push({
        answer: dayResponse?.selectedAnswer ?? null,
        date: dateKey,
        dateObj: date,
        displayDate: `${dayName} ${monthDay}`,
        hasResponse: !!dayResponse?.selectedAnswer,
        isToday,
      });
    }

    return days;
  }, [allResponses]);
}

export function ParentDailyQuestionCard() {
  const params = useParams();
  const babyId = params.babyId as string;

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { executeAsync: submitResponse } = useAction(
    submitDailyWellnessResponseAction,
    {
      onError: ({ error }) => {
        toast.error(error.serverError ?? 'Failed to save response');
      },
      onSuccess: () => {
        toast.success('Response saved!');
        setSelectedAnswer(null);
        // Invalidate queries to refetch
        void utils.parentWellness.getDailyQuestion.invalidate({ babyId });
        void utils.parentWellness.getResponseHistory.invalidate({ babyId });
      },
    },
  );

  const utils = api.useUtils();

  // Get today's question
  // Cache for 24 hours since it's a daily question that doesn't change once generated
  // Backend also checks DB first, so this prevents unnecessary refetches
  const { data: questionData, isLoading: isLoadingQuestion } =
    api.parentWellness.getDailyQuestion.useQuery(
      { babyId },
      {
        gcTime: 1000 * 60 * 60 * 24 * 2, // Keep in cache for 2 days (in case user views next day)
        staleTime: 1000 * 60 * 60 * 24, // 24 hours - daily question doesn't change
      },
    );

  // Get response history for 7-day tracker and goals
  // Cache for 5 minutes since it can change when user submits answers
  const { data: historyData } = api.parentWellness.getResponseHistory.useQuery(
    { babyId, days: 30 },
    {
      gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  const sevenDayData = useSevenDayResponses(
    historyData?.responses.map((r) => ({
      date: r.date,
      selectedAnswer: r.selectedAnswer,
    })) ?? [],
  );

  const handleAnswerClick = async (answer: string) => {
    if (!questionData || questionData.isAnswered) return;

    setSelectedAnswer(answer);
    setIsSubmitting(true);

    try {
      await submitResponse({
        babyId,
        responseId: questionData.id,
        selectedAnswer: answer,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = parentWellnessTheme;
  const Icon = theme.icon;

  const learningContent = {
    message:
      "Daily check-ins help you track your well-being and notice patterns in how you're feeling. Taking a moment each day to reflect can help you recognize when you need support and celebrate the good days too.",
    summary:
      "Daily check-ins help you track your well-being and notice patterns in how you're feeling. Taking a moment each day to reflect can help you recognize when you need support and celebrate the good days too.",
    tips: [
      'Quick 2-4 second check-ins help you stay connected to your feelings',
      'Tracking patterns helps identify what supports your well-being',
      'All feelings are valid - good days and hard days are both normal',
      'Building this habit supports your mental health journey',
    ],
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden p-6 ${theme.color} ${theme.textColor}`}
      >
        <PredictiveCardHeader
          icon={Icon}
          isFetching={isLoadingQuestion}
          onInfoClick={() => setShowInfoDrawer(true)}
          onStatsClick={() => setShowStatsDrawer(true)}
          showStatsIcon={true}
          title="Daily Check-In"
        />

        {/* Goal Tracking */}
        {historyData && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-4 text-sm">
              {historyData.currentStreak > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">
                    {historyData.currentStreak}
                  </span>
                  <span className="text-muted-foreground">day streak</span>
                  {historyData.currentStreak >= 3 && (
                    <span className="text-lg">🔥</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="font-semibold">
                  {historyData.weeklyCompletionCount}
                </span>
                <span className="text-muted-foreground">/7 this week</span>
              </div>
            </div>
          </div>
        )}

        {/* Question and Answers */}
        {isLoadingQuestion ? (
          <div className="mt-6 space-y-3">
            <div className="h-6 bg-white/10 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-10 bg-white/10 rounded animate-pulse" />
              <div className="h-10 bg-white/10 rounded animate-pulse" />
              <div className="h-10 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        ) : questionData ? (
          <div className="mt-6 space-y-4">
            <p className="text-lg font-medium leading-relaxed">
              {questionData.question}
            </p>

            {questionData.isAnswered ? (
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  You answered:
                </p>
                <p className="font-semibold">{questionData.selectedAnswer}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questionData.answerChoices.map((choice: string) => (
                  <Button
                    className="w-full justify-start text-left h-auto py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20"
                    disabled={isSubmitting || selectedAnswer !== null}
                    key={choice}
                    onClick={() => handleAnswerClick(choice)}
                    variant="ghost"
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            <p>Unable to load question. Please try again later.</p>
          </div>
        )}

        {/* 7-Day Grid */}
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-2">
            {sevenDayData.map((day) => (
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                  day.hasResponse
                    ? 'bg-white/20'
                    : day.isToday
                      ? 'bg-white/10'
                      : 'bg-white/5'
                }`}
                key={day.date}
              >
                <span className="text-xs text-muted-foreground">
                  {day.displayDate.split(' ')[0]}
                </span>
                <span className="text-xs font-medium">
                  {day.displayDate.split(' ')[1]}
                </span>
                {day.hasResponse && (
                  <div className="size-1.5 rounded-full bg-white/60 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="vitamin_d"
        babyAgeDays={null}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        title="Daily Check-In"
      />

      {/* Stats Drawer */}
      {historyData && (
        <DailyQuestionStatsDrawer
          babyId={babyId}
          currentStreak={historyData.currentStreak}
          onOpenChange={setShowStatsDrawer}
          open={showStatsDrawer}
          responses={historyData.responses}
          weeklyCompletionCount={historyData.weeklyCompletionCount}
        />
      )}
    </>
  );
}
