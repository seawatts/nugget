'use client';

import { MessageSquare } from 'lucide-react';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { QuickChatDialogContent } from '../chat/quick-chat-dialog';
import { SwipeableMilestoneCard } from './swipeable-milestone-card';

interface MilestoneChatCardProps {
  babyId: string;
  milestoneTitle: string;
  answer: 'yes' | 'no';
  followUpQuestion: string;
  contextId: string;
  onDismiss: () => void;
}

export function MilestoneChatCard({
  babyId,
  milestoneTitle,
  answer,
  followUpQuestion,
  contextId,
  onDismiss,
}: MilestoneChatCardProps) {
  // Use a neutral color scheme for the chat card
  const colorConfig: ColorConfig = {
    border: 'border-primary/20',
    card: 'bg-primary/10',
    icon: 'text-primary',
    text: 'text-primary',
  };

  return (
    <SwipeableMilestoneCard
      className="w-full"
      onSwipeLeft={onDismiss}
      onSwipeRight={onDismiss}
    >
      <FeatureCard colorConfig={colorConfig} variant="custom">
        {/* Header */}
        <FeatureCard.Header
          className="flex flex-col gap-3 bg-primary/10 p-5"
          colorConfig={colorConfig}
        >
          <div className="flex w-full items-start gap-3">
            <MessageSquare className="size-6 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm">Chat with Nugget AI</h3>
              <p className="text-xs text-muted-foreground">
                About: {milestoneTitle}
              </p>
            </div>
          </div>
        </FeatureCard.Header>

        {/* Chat Content - Mark as non-swipeable to allow vertical scrolling */}
        <div className="h-[400px]" data-swipeable-ignore>
          <QuickChatDialogContent
            autoSendPrefill={true}
            babyId={babyId}
            contextId={contextId}
            contextType="milestone"
            initialMessages={[
              {
                content: followUpQuestion,
                createdAt: new Date(),
                id: 'follow-up-question',
                role: 'assistant',
              },
            ]}
            placeholder="Type your response..."
            prefillMessage={answer}
            title="Nugget AI"
          />
        </div>

        {/* Footer hint */}
        <FeatureCard.Footer
          className="border-t border-primary/20 bg-primary/10 p-3"
          colorConfig={colorConfig}
        >
          <p className="text-center text-xs text-muted-foreground">
            Swipe to continue to next milestone
          </p>
        </FeatureCard.Footer>
      </FeatureCard>
    </SwipeableMilestoneCard>
  );
}
