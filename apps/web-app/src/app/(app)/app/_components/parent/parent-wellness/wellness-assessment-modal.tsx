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
import { H3, P } from '@nugget/ui/custom/typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Label } from '@nugget/ui/label';
import { RadioGroup, RadioGroupItem } from '@nugget/ui/radio-group';
import { Slider } from '@nugget/ui/slider';
import { Textarea } from '@nugget/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getWellnessAssessmentAction,
  submitWellnessResponsesAction,
  type WellnessQuestion,
} from './actions';

interface WellnessAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  triggered?: boolean;
}

type ResponseValue = string | number;

export function WellnessAssessmentModal({
  open,
  onOpenChange,
  userId,
  triggered = false,
}: WellnessAssessmentModalProps) {
  const [step, setStep] = useState<'loading' | 'questions' | 'results'>(
    'loading',
  );
  const [questions, setQuestions] = useState<WellnessQuestion[]>([]);
  const [title, setTitle] = useState('');
  const [scoringGuidance, setScoringGuidance] = useState('');
  const [supportResources, setSupportResources] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<number, ResponseValue>>({});
  const [notes, setNotes] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const { execute: getAssessment, isExecuting: isLoadingAssessment } =
    useAction(getWellnessAssessmentAction, {
      onError: ({ error }) => {
        toast.error('Failed to load assessment', {
          description: error.serverError || 'Please try again.',
        });
        onOpenChange(false);
      },
      onSuccess: ({ data }) => {
        if (data) {
          setQuestions(data.questions);
          setTitle(data.title);
          setScoringGuidance(data.scoringGuidance);
          setSupportResources(data.supportResources);
          setStep('questions');
        }
      },
    });

  const { execute: submitResponses, isExecuting: isSubmitting } = useAction(
    submitWellnessResponsesAction,
    {
      onError: ({ error }) => {
        toast.error('Failed to submit responses', {
          description: error.serverError || 'Please try again.',
        });
      },
      onSuccess: ({ data }) => {
        if (data?.assessment) {
          setRiskScore(data.assessment.riskScore);
          setRecommendations(data.assessment.recommendations || []);
          setStep('results');
        }
      },
    },
  );

  // Load assessment when modal opens
  useEffect(() => {
    if (open && step === 'loading') {
      getAssessment({ triggered, userId });
    }
  }, [open, userId, triggered, getAssessment, step]);

  const handleResponseChange = useCallback(
    (questionId: number, value: ResponseValue) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    submitResponses({
      assessmentType: triggered ? 'triggered' : 'routine',
      notes: notes || undefined,
      questions,
      responses: questions.map((q) => ({
        questionId: q.questionId,
        response: responses[q.questionId] ?? 0,
      })),
      userId,
    });
  }, [questions, responses, notes, userId, triggered, submitResponses]);

  const handleClose = useCallback(() => {
    setStep('loading');
    setQuestions([]);
    setResponses({});
    setNotes('');
    setRiskScore(null);
    setRecommendations([]);
    onOpenChange(false);
  }, [onOpenChange]);

  const renderQuestions = () => (
    <div className="gap-6 grid">
      {questions.map((question, index) => (
        <div className="gap-3 grid" key={question.questionId}>
          <Label className="text-base font-medium">
            {index + 1}. {question.question}
          </Label>

          {question.responseType === 'LIKERT_5' && (
            <RadioGroup
              onValueChange={(value) =>
                handleResponseChange(question.questionId, Number(value))
              }
              value={responses[question.questionId]?.toString()}
            >
              <div className="gap-3 grid">
                {[
                  { label: 'Never', value: 0 },
                  { label: 'Rarely', value: 1 },
                  { label: 'Sometimes', value: 2 },
                  { label: 'Often', value: 3 },
                  { label: 'Always', value: 4 },
                ].map((option) => (
                  <div className="flex items-center gap-2" key={option.value}>
                    <RadioGroupItem
                      id={`q${question.questionId}-${option.value}`}
                      value={option.value.toString()}
                    />
                    <Label
                      className="cursor-pointer font-normal"
                      htmlFor={`q${question.questionId}-${option.value}`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.responseType === 'RATING_1_5' && (
            <div className="gap-2 grid">
              <Slider
                className="py-4"
                max={5}
                min={1}
                onValueChange={(value) =>
                  handleResponseChange(question.questionId, value[0] || 1)
                }
                step={1}
                value={[Number(responses[question.questionId]) || 1]}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (Low)</span>
                <span>{responses[question.questionId] || 1}</span>
                <span>5 (High)</span>
              </div>
            </div>
          )}

          {question.responseType === 'YES_NO' && (
            <RadioGroup
              onValueChange={(value) =>
                handleResponseChange(
                  question.questionId,
                  value === 'yes' ? 1 : 0,
                )
              }
              value={responses[question.questionId] === 1 ? 'yes' : 'no'}
            >
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`q${question.questionId}-yes`}
                    value="yes"
                  />
                  <Label
                    className="cursor-pointer font-normal"
                    htmlFor={`q${question.questionId}-yes`}
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`q${question.questionId}-no`}
                    value="no"
                  />
                  <Label
                    className="cursor-pointer font-normal"
                    htmlFor={`q${question.questionId}-no`}
                  >
                    No
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}
        </div>
      ))}

      <div className="gap-2 grid">
        <Label htmlFor="wellness-notes">Additional Notes (Optional)</Label>
        <Textarea
          id="wellness-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share any additional thoughts or concerns..."
          rows={4}
          value={notes}
        />
      </div>
    </div>
  );

  const renderResults = () => {
    const isHighRisk = riskScore !== null && riskScore >= 13;
    const isMediumRisk =
      riskScore !== null && riskScore >= 10 && riskScore < 13;

    return (
      <div className="gap-6 grid">
        <Card className={isHighRisk ? 'border-destructive' : ''}>
          <CardHeader>
            <div className="flex items-start gap-3">
              {isHighRisk ? (
                <AlertCircle className="size-6 text-destructive" />
              ) : (
                <CheckCircle2 className="size-6 text-green-500" />
              )}
              <div className="flex-1">
                <CardTitle>Assessment Complete</CardTitle>
                <CardDescription>
                  {isHighRisk && 'Please review the recommendations below'}
                  {isMediumRisk && 'Consider the suggestions below'}
                  {!isHighRisk &&
                    !isMediumRisk &&
                    'Your well-being is important'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="gap-4 grid">
            {recommendations.map((rec) => (
              <P className="text-sm" key={rec}>
                {rec}
              </P>
            ))}
          </CardContent>
        </Card>

        {supportResources.length > 0 && (
          <div className="gap-2 grid">
            <H3 className="text-sm font-semibold">Support Resources</H3>
            {supportResources.map((resource) => (
              <P className="text-sm text-muted-foreground" key={resource}>
                {resource}
              </P>
            ))}
          </div>
        )}

        {scoringGuidance && (
          <div className="gap-2 grid">
            <H3 className="text-sm font-semibold">About This Assessment</H3>
            <P className="text-sm text-muted-foreground">{scoringGuidance}</P>
          </div>
        )}
      </div>
    );
  };

  const content = (
    <>
      {(step === 'loading' || isLoadingAssessment) && (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
          <P className="text-sm text-muted-foreground">Loading assessment...</P>
        </div>
      )}

      {step === 'questions' && renderQuestions()}
      {step === 'results' && renderResults()}
    </>
  );

  const footer = (
    <>
      {step === 'questions' && (
        <>
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={
              isSubmitting ||
              questions.some((q) => responses[q.questionId] === undefined)
            }
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Icons.Spinner className="animate-spin" size="sm" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </>
      )}

      {step === 'results' && (
        <Button className="w-full" onClick={handleClose}>
          Close
        </Button>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={handleClose} open={open}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{title || 'Wellness Assessment'}</DialogTitle>
            <DialogDescription>
              {step === 'questions' &&
                'Please answer the following questions honestly. Your responses are confidential.'}
              {step === 'results' && 'Review your assessment results'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">{content}</div>
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={handleClose} open={open}>
      <DrawerContent className="max-h-[90vh] overflow-x-hidden">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title || 'Wellness Assessment'}</DrawerTitle>
          <DrawerDescription>
            {step === 'questions' &&
              'Please answer the following questions honestly. Your responses are confidential.'}
            {step === 'results' && 'Review your assessment results'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4">{content}</div>
        <DrawerFooter className="pt-4">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
