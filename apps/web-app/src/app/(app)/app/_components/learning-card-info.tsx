'use client';

import { Button } from '@nugget/ui/button';
import { P } from '@nugget/ui/custom/typography';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
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
    return (
      <div className="min-w-[280px] h-[440px] snap-start rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 text-blue-700 dark:text-blue-300">
          <div className="size-6 bg-muted/50 rounded animate-pulse shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-16" />
          </div>
        </div>
        <div className="p-4 space-y-3 flex-1">
          <div className="h-4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(tip.category);
  const Icon = categoryConfig.icon;

  return (
    <div
      className={`min-w-[280px] h-[440px] snap-start rounded-lg border ${categoryConfig.borderColor} ${categoryConfig.bgColor} overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 p-4 ${categoryConfig.bgColor} ${categoryConfig.color}`}
      >
        <Icon className="size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm">{tip.subtitle}</h3>
          <p className="text-xs text-muted-foreground">
            {categoryConfig.label}
          </p>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
      </div>

      {/* Sticky Footer with Question and Answer Button */}
      <div
        className={`border-t ${categoryConfig.borderColor} ${categoryConfig.bgColor} p-4 space-y-3`}
      >
        {/* Question */}
        <div className="flex gap-2 items-start">
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
      </div>

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
    </div>
  );
}
