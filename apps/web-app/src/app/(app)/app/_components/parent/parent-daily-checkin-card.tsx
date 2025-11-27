'use client';

import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { Label } from '@nugget/ui/label';
import { RadioGroup, RadioGroupItem } from '@nugget/ui/radio-group';
import { toast } from '@nugget/ui/sonner';
import { Textarea } from '@nugget/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type CheckInQuestion,
  getDailyCheckInQuestionsAction,
  submitCheckInResponsesAction,
} from './parent-checkin/actions';

interface ParentDailyCheckInCardProps {
  userId: string;
  onCheckInComplete?: () => void;
  onDismissUntilTomorrow?: () => void;
}

type ResponseValue = string | number | boolean;

export function ParentDailyCheckInCard({
  userId,
  onCheckInComplete,
  onDismissUntilTomorrow,
}: ParentDailyCheckInCardProps) {
  const [questions, setQuestions] = useState<CheckInQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      const result = await getDailyCheckInQuestionsAction({ userId });
      if (result.data) {
        setQuestions(result.data.questions);
      }
      setIsLoading(false);
    }
    loadQuestions();
  }, [userId]);

  const handleSubmit = useCallback(async () => {
    // Validate all questions are answered
    const unanswered = questions.filter(
      (q) => responses[q.questionId] === undefined,
    );
    if (unanswered.length > 0) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate mood score (average of ratings)
      const ratingResponses = questions.filter(
        (q) =>
          q.responseType === 'rating_1_5' || q.responseType === 'emoji_scale',
      );
      const moodScore =
        ratingResponses.length > 0
          ? Math.round(
              ratingResponses.reduce(
                (sum, q) => sum + (Number(responses[q.questionId]) || 0),
                0,
              ) / ratingResponses.length,
            )
          : undefined;

      // Extract concerns
      const concernsRaised: string[] = [];
      questions.forEach((q) => {
        const response = responses[q.questionId];
        // Flag negative responses or urgent priorities
        if (q.priority === 'urgent') {
          concernsRaised.push(q.category);
        }
        if (q.responseType === 'emoji_scale' && Number(response) <= 2) {
          concernsRaised.push(q.category);
        }
        if (
          q.responseType === 'yes_no' &&
          response === 'yes' &&
          q.category !== 'self_care'
        ) {
          concernsRaised.push(q.category);
        }
      });

      const result = await submitCheckInResponsesAction({
        concernsRaised: [...new Set(concernsRaised)],
        moodScore,
        responses: questions.map((q) => ({
          category: q.category,
          question: q.question,
          questionId: q.questionId,
          response: responses[q.questionId] ?? 0,
          responseType: q.responseType,
        })),
        userId,
      });

      if (result.data?.success) {
        toast.success('Check-in completed! Thank you for sharing.');
        setCompleted(true);
        onCheckInComplete?.();
      } else {
        toast.error('Failed to submit check-in. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [questions, responses, userId, onCheckInComplete]);

  const handleDismiss = useCallback(() => {
    onDismissUntilTomorrow?.();
  }, [onDismissUntilTomorrow]);

  if (completed) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Check-In Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Come back tomorrow for a fresh check-in prompt.
                </p>
              </div>
            </div>
            <div className="w-full space-y-4">
              <p className="text-sm text-muted-foreground">
                Need to adjust something from today? You can change your answer,
                or dismiss this card until tomorrow.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="w-full"
                  onClick={() => setCompleted(false)}
                  variant="secondary"
                >
                  Change Answer
                </Button>
                <Button className="w-full" onClick={handleDismiss}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-In</CardTitle>
          <CardDescription>
            Loading your personalized check-in...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Icons.Spinner className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-In</CardTitle>
        <CardDescription>
          Take a moment to reflect on how you're doing today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div className="space-y-3" key={question.questionId}>
            <Label className="text-base font-medium">
              {index + 1}. {question.question}
            </Label>

            {question.responseType === 'emoji_scale' && (
              <RadioGroup
                onValueChange={(value) =>
                  setResponses((prev) => ({
                    ...prev,
                    [question.questionId]: Number(value),
                  }))
                }
                value={responses[question.questionId]?.toString()}
              >
                <div className="flex gap-4">
                  {['1', '2', '3', '4', '5'].map((value) => (
                    <div
                      className="flex flex-col items-center gap-2"
                      key={value}
                    >
                      <RadioGroupItem
                        className="peer sr-only"
                        id={`${question.questionId}-${value}`}
                        value={value}
                      />
                      <Label
                        className="text-2xl cursor-pointer opacity-50 peer-aria-checked:opacity-100 peer-aria-checked:scale-125 transition-all"
                        htmlFor={`${question.questionId}-${value}`}
                      >
                        {value === '1'
                          ? '😢'
                          : value === '2'
                            ? '😟'
                            : value === '3'
                              ? '😐'
                              : value === '4'
                                ? '😊'
                                : '😁'}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.responseType === 'yes_no' && (
              <RadioGroup
                onValueChange={(value) =>
                  setResponses((prev) => ({
                    ...prev,
                    [question.questionId]: value,
                  }))
                }
                value={responses[question.questionId]?.toString()}
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id={`${question.questionId}-yes`}
                      value="yes"
                    />
                    <Label htmlFor={`${question.questionId}-yes`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id={`${question.questionId}-no`}
                      value="no"
                    />
                    <Label htmlFor={`${question.questionId}-no`}>No</Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {question.responseType === 'rating_1_5' && (
              <RadioGroup
                onValueChange={(value) =>
                  setResponses((prev) => ({
                    ...prev,
                    [question.questionId]: Number(value),
                  }))
                }
                value={responses[question.questionId]?.toString()}
              >
                <div className="flex gap-2">
                  {['1', '2', '3', '4', '5'].map((value) => (
                    <div className="flex items-center space-x-1" key={value}>
                      <RadioGroupItem
                        id={`${question.questionId}-${value}`}
                        value={value}
                      />
                      <Label htmlFor={`${question.questionId}-${value}`}>
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.responseType === 'text_short' && (
              <Textarea
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    [question.questionId]: e.target.value,
                  }))
                }
                placeholder="Type your response here..."
                rows={2}
                value={(responses[question.questionId] as string) || ''}
              />
            )}
          </div>
        ))}

        <Button
          className="w-full"
          disabled={isSubmitting || questions.length === 0}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Icons.Spinner className="size-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Complete Check-In'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
