'use client';

import { Button } from '@nugget/ui/button';
import { P } from '@nugget/ui/custom/typography';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { getCategoryConfig } from './learning-card-categories';
import type { LearningTip } from './learning-carousel.actions';
import { QuickChatDialog } from './quick-chat-dialog';

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

        {/* Answer Button */}
        <Button
          className="w-full"
          onClick={() => setIsChatOpen(true)}
          size="sm"
          variant="default"
        >
          <MessageCircle className="size-4 mr-2" />
          Answer
        </Button>
      </FeatureCard.Footer>

      {/* Chat Dialog */}
      {babyId && tip && (
        <QuickChatDialog
          babyId={babyId}
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
          title="Nugget AI"
          trigger={<span style={{ display: 'none' }} />}
        />
      )}
    </FeatureCard>
  );
}
