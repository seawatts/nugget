'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { toast } from '@nugget/ui/sonner';
import { format, startOfDay, subDays } from 'date-fns';
import { Check, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { PredictiveInfoDrawer } from '../activities/shared/components/predictive-cards';
import { PredictiveCardHeader } from '../activities/shared/components/predictive-cards/predictive-card-header';
import { PredictiveProgressTrack } from '../activities/shared/components/predictive-progress-track';
import { DailyQuestionStatsDrawer } from './components/daily-question-stats-drawer';
import { ParentWellnessIntroNotification } from './components/parent-wellness-intro-notification';
import { parentWellnessTheme } from './theme-config';

interface SevenDayResponse {
  date: string;
  dateObj: Date;
  displayDate: string;
  hasResponse: boolean;
  isToday: boolean;
  answer?: string | null;
  question?: string | null;
}

function useSevenDayResponses(
  allResponses: Array<{
    date: Date;
    selectedAnswer: string | null;
    question: string;
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
        question: dayResponse?.question ?? null,
      });
    }

    return days;
  }, [allResponses]);
}

export function ParentDailyQuestionCard() {
  const params = useParams();
  const babyId = params.babyId as string;

  const userData = useDashboardDataStore.use.user();
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SevenDayResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showIntro, setShowIntro] = useState(
    !userData?.hasSeenParentWellnessIntro,
  );

  const utils = api.useUtils();

  const { mutateAsync: submitResponse } =
    api.parentWellness.submitResponse.useMutation<{
      previousQuestion?: {
        id: string;
        question: string;
        answerChoices: string[];
        selectedAnswer: string | null;
        isAnswered: boolean;
      };
      previousHistory?: {
        currentStreak: number;
        weeklyCompletionCount: number;
        responses: Array<{
          id: string;
          question: string;
          answerChoices: string[];
          selectedAnswer: string | null;
          date: Date;
        }>;
      };
    }>({
      onError: (error, _variables, context) => {
        // Rollback on error
        if (context?.previousQuestion) {
          utils.parentWellness.getDailyQuestion.setData(
            { babyId },
            context.previousQuestion,
          );
        }
        if (context?.previousHistory) {
          utils.parentWellness.getResponseHistory.setData(
            { babyId, days: 30 },
            context.previousHistory,
          );
        }
        toast.error(error.message ?? 'Failed to save response');
      },
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await utils.parentWellness.getDailyQuestion.cancel({ babyId });
        await utils.parentWellness.getResponseHistory.cancel({ babyId });
        await utils.timeline.getItems.cancel({ babyId });

        // Snapshot previous values
        const previousQuestion = utils.parentWellness.getDailyQuestion.getData({
          babyId,
        });
        const previousHistory = utils.parentWellness.getResponseHistory.getData(
          { babyId },
        );

        // Optimistically update the daily question
        if (previousQuestion) {
          utils.parentWellness.getDailyQuestion.setData(
            { babyId },
            {
              ...previousQuestion,
              isAnswered: true,
              selectedAnswer: variables.selectedAnswer,
            },
          );
        }

        // Optimistically update the response history
        if (previousHistory) {
          const updatedResponses = previousHistory.responses.map((r) => {
            if (r.id === variables.responseId) {
              return {
                ...r,
                selectedAnswer: variables.selectedAnswer,
              };
            }
            return r;
          });
          utils.parentWellness.getResponseHistory.setData(
            { babyId, days: 30 },
            {
              ...previousHistory,
              responses: updatedResponses,
            },
          );
        }

        // Return context with snapshot
        return { previousHistory, previousQuestion };
      },
      onSettled: () => {
        // Refetch to ensure consistency
        void utils.parentWellness.getDailyQuestion.invalidate({ babyId });
        void utils.parentWellness.getResponseHistory.invalidate({ babyId });
        void utils.timeline.getItems.invalidate({ babyId });
      },
      onSuccess: () => {
        toast.success('Response saved!');
        setSelectedAnswer(null);
        setIsEditing(false);
      },
    });

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
      question: r.question,
      selectedAnswer: r.selectedAnswer,
    })) ?? [],
  );

  const handleAnswerClick = async (answer: string) => {
    if (!questionData) return;
    // Allow updating if in edit mode, otherwise only allow if not answered
    if (questionData.isAnswered && !isEditing) return;

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
        className={`relative overflow-hidden p-6 border-0 ${theme.color} ${theme.textColor}`}
      >
        <PredictiveCardHeader
          icon={Icon}
          isFetching={isLoadingQuestion}
          onInfoClick={() => setShowInfoDrawer(true)}
          onStatsClick={() => setShowStatsDrawer(true)}
          showStatsIcon={true}
          title="Daily Check-In"
        />

        {/* Intro notification for new users */}
        {showIntro && userData && !userData.hasSeenParentWellnessIntro && (
          <div className="mt-4">
            <ParentWellnessIntroNotification
              onDismiss={(keepEnabled) => {
                setShowIntro(false);
                if (!keepEnabled) {
                  // The notification handles updating preferences
                  // Optionally trigger a re-render or navigation
                }
              }}
            />
          </div>
        )}

        {/* Goal Tracking - Progress Bar */}
        {historyData && (
          <div className="mt-4">
            <PredictiveProgressTrack
              endLabel="GOAL 7"
              progressPercent={(historyData.weeklyCompletionCount / 7) * 100}
              srLabel={`${historyData.weeklyCompletionCount} out of 7 check-ins this week`}
              startLabel={`${historyData.weeklyCompletionCount} THIS WEEK`}
            />
          </div>
        )}

        {/* Question and Answers */}
        <div className="mt-6">
          {isLoadingQuestion ? (
            <div className="space-y-3">
              <div className="h-5 bg-white/10 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 bg-white/10 rounded animate-pulse" />
                <div className="h-10 bg-white/10 rounded animate-pulse" />
                <div className="h-10 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ) : selectedDay?.question ? (
            // Show selected past day's question and answer
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs opacity-70">
                  {format(selectedDay.dateObj, 'EEEE, MMM d')}
                </p>
                <Button
                  className="text-xs h-auto py-1 px-2"
                  onClick={() => setSelectedDay(null)}
                  variant="ghost"
                >
                  Back to today
                </Button>
              </div>
              <p className="text-base font-medium leading-snug">
                {selectedDay.question}
              </p>
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-xs opacity-70 mb-1">You answered:</p>
                <p className="text-sm font-semibold">{selectedDay.answer}</p>
              </div>
            </div>
          ) : questionData ? (
            // Show today's question
            <div className="space-y-3">
              <p className="text-base font-medium leading-snug">
                {questionData.question}
              </p>

              {questionData.isAnswered && !isEditing ? (
                <div className="space-y-2">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-xs opacity-70 mb-1">You answered:</p>
                    <p className="text-sm font-semibold">
                      {questionData.selectedAnswer}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-sm"
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                  >
                    Change Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isEditing && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs opacity-70">Select a new answer:</p>
                      <Button
                        className="text-xs h-auto py-1 px-2"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedAnswer(null);
                        }}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {questionData.answerChoices.map((choice: string) => (
                    <Button
                      className="w-full justify-start text-left h-auto py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
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
            <div className="text-center text-muted-foreground">
              <p className="text-sm">
                Unable to load question. Please try again later.
              </p>
            </div>
          )}
        </div>

        {/* 7-Day Grid */}
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-2">
            {sevenDayData.map((day) => {
              const [weekday] = day.displayDate.split(' ');
              const answered = day.hasResponse;
              const isSelected = selectedDay?.date === day.date;
              return (
                <button
                  className="flex flex-col items-center gap-1.5 text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!answered}
                  key={day.date}
                  onClick={() => {
                    if (answered && day.question) {
                      setSelectedDay(day);
                    }
                  }}
                  type="button"
                >
                  <div className="flex flex-col items-center gap-0.5 min-h-[28px]">
                    <span className="text-xs font-semibold opacity-90">
                      {weekday}
                    </span>
                    <span
                      className={`text-[10px] font-medium opacity-75 leading-none ${
                        !day.isToday ? 'invisible' : ''
                      }`}
                    >
                      Today
                    </span>
                  </div>
                  <div
                    className={`flex size-10 items-center justify-center rounded-full border transition-all ${
                      answered
                        ? 'bg-white text-primary shadow-lg border-transparent'
                        : 'border-white/30 text-white/40'
                    } ${day.isToday || isSelected ? 'ring-2 ring-white/70' : ''}`}
                  >
                    {answered ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <X className="size-4" strokeWidth={3} />
                    )}
                  </div>
                </button>
              );
            })}
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
