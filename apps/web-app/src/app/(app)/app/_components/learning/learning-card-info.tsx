'use client';

import { api, type LearningTip } from '@nugget/api/react';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { P } from '@nugget/ui/custom/typography';
import { cn } from '@nugget/ui/lib/utils';
import { Check, MessageCircle } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { QuickChatDialog } from '../chat/quick-chat-dialog';
import { saveMilestoneQuestionResponseAction } from '../milestones/milestone-question.actions';
import { getCategoryConfig } from './learning-card-categories';

interface LearningCardInfoProps {
  tip?: LearningTip;
  ageInDays?: number;
  babyId?: string;
}

export function LearningCardInfo({
  tip,
  ageInDays: _ageInDays,
  babyId,
}: LearningCardInfoProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<string | undefined>();

  // Local state for optimistic updates (overridden by query data when available)
  const [localHasUserAnswered, setLocalHasUserAnswered] = useState(false);
  const [localUserAnswer, setLocalUserAnswer] = useState<'yes' | 'no' | null>(
    null,
  );

  const { executeAsync: saveResponse } = useAction(
    saveMilestoneQuestionResponseAction,
  );

  // Get babyId from dashboard store
  const baby = useDashboardDataStore.use.baby();
  const storeBabyId = baby?.id ?? babyId ?? '';

  // Lazy-load repliers data only when needed (when user clicks to see them)
  const { data: repliersData, refetch: refetchRepliers } =
    api.chats.getContextRepliers.useQuery(
      {
        babyId: storeBabyId,
        contextId: `${tip?.category}-${tip?.subtitle}`,
        contextType: 'learning_tip',
      },
      {
        enabled: false, // Don't fetch on mount - only when explicitly requested
        staleTime: 30000, // Cache for 30 seconds to avoid refetching unnecessarily
      },
    );

  // Derive state from query data (or use local optimistic state if query hasn't run)
  const repliers = repliersData?.allRepliers ?? [];
  const yesRepliers = repliersData?.yesRepliers ?? [];
  const noRepliers = repliersData?.noRepliers ?? [];
  const hasUserAnswered =
    repliersData?.hasCurrentUserAnswered ?? localHasUserAnswered;
  const userAnswer = repliersData?.currentUserAnswer ?? localUserAnswer;

  // Sync local state with query data when it changes
  useEffect(() => {
    if (repliersData) {
      setLocalHasUserAnswered(repliersData.hasCurrentUserAnswered);
      setLocalUserAnswer(repliersData.currentUserAnswer);
    }
  }, [repliersData]);

  // Refetch repliers when chat dialog closes
  useEffect(() => {
    if (!isChatOpen) {
      // Add a small delay to ensure the message has been saved
      const timer = setTimeout(() => {
        void refetchRepliers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen, refetchRepliers]);

  // Handler for yes/no button clicks
  const handleYesNoClick = useCallback(
    (answer: 'yes' | 'no') => {
      if (!storeBabyId || !tip) return;

      // If clicking the same answer, do nothing
      if (hasUserAnswered && userAnswer === answer) return;

      // Update local state immediately for instant feedback (optimistic update)
      setLocalHasUserAnswered(true);
      setLocalUserAnswer(answer);
      setPrefillMessage(answer);
      setIsChatOpen(true);

      // Save the response asynchronously in the background
      saveResponse({
        answer,
        babyId: storeBabyId,
        contextId: `${tip.category}-${tip.subtitle}`,
        contextType: 'learning_tip',
        question: tip.followUpQuestion,
      }).catch((error) => {
        console.error('Error saving response:', error);
      });
    },
    [storeBabyId, tip, saveResponse, hasUserAnswered, userAnswer],
  );

  // Handler for discuss button - opens chat without re-submitting answer
  const handleDiscussClick = useCallback(() => {
    setPrefillMessage(undefined);
    setIsChatOpen(true);
  }, []);

  // Handle loading state when tip is undefined or being resolved
  if (!tip) {
    const loadingColorConfig: ColorConfig = {
      border: 'border-blue-500/20',
      card: 'bg-blue-500/5',
      icon: 'text-blue-700 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-300',
    };

    return (
      <FeatureCard colorConfig={loadingColorConfig} variant="custom">
        <FeatureCard.Header
          className="flex items-center gap-3 bg-blue-500/10 p-4 pb-4"
          colorConfig={loadingColorConfig}
        >
          <div className="size-6 bg-muted/50 rounded animate-pulse shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-16" />
          </div>
        </FeatureCard.Header>
        <FeatureCard.Content className="space-y-3 p-4">
          <div className="h-4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
        </FeatureCard.Content>
      </FeatureCard>
    );
  }

  const categoryConfig = getCategoryConfig(tip.category);
  const Icon = categoryConfig.icon;

  const colorConfig: ColorConfig = {
    border: categoryConfig.borderColor,
    card: categoryConfig.bgColor,
    icon: categoryConfig.color,
    text: categoryConfig.color,
  };

  return (
    <FeatureCard colorConfig={colorConfig} variant="custom">
      {/* Header */}
      <FeatureCard.Header
        className={`flex items-center gap-3 ${categoryConfig.bgColor} p-4 pb-4`}
        colorConfig={colorConfig}
      >
        <Icon className="size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm">{tip.subtitle}</h3>
          <p className="text-xs text-muted-foreground">
            {categoryConfig.label}
          </p>
        </div>
      </FeatureCard.Header>

      {/* Scrollable Content Area */}
      <FeatureCard.Content className="space-y-3 p-4">
        {/* Summary */}
        <P className="text-sm text-muted-foreground">{tip.summary}</P>

        {/* Bullet Points */}
        <ul className="space-y-2">
          {tip.bulletPoints.map((point) => (
            <li className="flex gap-2 text-sm text-foreground/80" key={point}>
              <span className="text-muted-foreground shrink-0">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </FeatureCard.Content>

      {/* Sticky Footer with Question and Answer Button */}
      <FeatureCard.Footer
        className={`border-t ${categoryConfig.borderColor} ${categoryConfig.bgColor} flex-col gap-3 p-4 pt-4`}
        colorConfig={colorConfig}
      >
        {/* Question */}
        <div className="flex gap-2 items-start w-full">
          <MessageCircle className="size-4 shrink-0 text-primary mt-0.5" />
          <P className="text-sm font-medium text-foreground">
            {tip.followUpQuestion}
          </P>
        </div>

        {/* Yes/No Buttons or Answer Button */}
        {tip.isYesNoQuestion ? (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 w-full">
              <Button
                className={cn(
                  'flex-1 text-white',
                  hasUserAnswered && userAnswer === 'yes'
                    ? 'bg-green-600 hover:bg-green-600'
                    : hasUserAnswered
                      ? 'bg-green-600/50 hover:bg-green-600/50'
                      : 'bg-green-600 hover:bg-green-700',
                )}
                onClick={() => handleYesNoClick('yes')}
                size="sm"
                variant="default"
              >
                <Check className="size-4 mr-2" />
                Yes
                {yesRepliers.length > 0 && (
                  <div className="flex -space-x-2 ml-2">
                    {yesRepliers.slice(0, 3).map((replier) => {
                      const initials = `${replier.firstName?.[0] || ''}${replier.lastName?.[0] || ''}`;
                      return (
                        <Avatar
                          className="size-5 border-2 border-primary"
                          key={replier.userId}
                        >
                          <AvatarImage
                            alt={`${replier.firstName || ''} ${replier.lastName || ''}`}
                            src={replier.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {yesRepliers.length > 3 && (
                      <div className="size-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <span className="text-[8px] font-medium">
                          +{yesRepliers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Button>
              <Button
                className={cn(
                  'flex-1 text-white',
                  hasUserAnswered && userAnswer === 'no'
                    ? 'bg-red-600 hover:bg-red-600'
                    : hasUserAnswered
                      ? 'bg-red-600/50 hover:bg-red-600/50'
                      : 'bg-red-600 hover:bg-red-700',
                )}
                onClick={() => handleYesNoClick('no')}
                size="sm"
                variant="default"
              >
                No
                {noRepliers.length > 0 && (
                  <div className="flex -space-x-2 ml-2">
                    {noRepliers.slice(0, 3).map((replier) => {
                      const initials = `${replier.firstName?.[0] || ''}${replier.lastName?.[0] || ''}`;
                      return (
                        <Avatar
                          className="size-5 border-2 border-primary"
                          key={replier.userId}
                        >
                          <AvatarImage
                            alt={`${replier.firstName || ''} ${replier.lastName || ''}`}
                            src={replier.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {noRepliers.length > 3 && (
                      <div className="size-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <span className="text-[8px] font-medium">
                          +{noRepliers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Button>
            </div>
            {hasUserAnswered && (
              <Button
                className="w-full"
                onClick={handleDiscussClick}
                size="sm"
                variant="outline"
              >
                <MessageCircle className="size-4 mr-2" />
                Discuss
              </Button>
            )}
          </div>
        ) : (
          <Button
            className="w-full justify-center"
            onClick={() => setIsChatOpen(true)}
            size="sm"
            variant="default"
          >
            <MessageCircle className="size-4 mr-2" />
            Answer
            {repliers.length > 0 && (
              <div className="flex -space-x-2 ml-2">
                {repliers.slice(0, 3).map((replier) => {
                  const initials = `${replier.firstName?.[0] || ''}${replier.lastName?.[0] || ''}`;
                  return (
                    <Avatar
                      className="size-5 border-2 border-primary"
                      key={replier.userId}
                    >
                      <AvatarImage
                        alt={`${replier.firstName || ''} ${replier.lastName || ''}`}
                        src={replier.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {repliers.length > 3 && (
                  <div className="size-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <span className="text-[8px] font-medium">
                      +{repliers.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Button>
        )}
      </FeatureCard.Footer>

      {/* Chat Dialog */}
      {storeBabyId && tip && (
        <QuickChatDialog
          autoSendPrefill={!!prefillMessage}
          babyId={storeBabyId}
          contextId={`${tip.category}-${tip.subtitle}`}
          contextType="learning_tip"
          initialMessages={[
            {
              content: tip.followUpQuestion,
              createdAt: new Date(),
              id: 'follow-up-question',
              role: 'assistant',
            },
          ]}
          onOpenChange={setIsChatOpen}
          open={isChatOpen}
          prefillMessage={prefillMessage}
          title="Nugget AI"
          trigger={<span style={{ display: 'none' }} />}
        />
      )}
    </FeatureCard>
  );
}
