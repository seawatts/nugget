'use client';

import { Button } from '@nugget/ui/button';
import { H4, P } from '@nugget/ui/custom/typography';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  Brain,
  Check,
  Heart,
  MessageCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { QuickChatDialog } from './quick-chat-dialog';

interface MilestoneCardProps {
  title: string;
  description: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  ageLabel: string;
  isCompleted?: boolean;
  isEnhancing?: boolean;
  onMarkComplete: () => void;
  bulletPoints: string[];
  followUpQuestion: string;
  summary?: string;
  babyId?: string;
}

interface TypeConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  borderColor: string;
  color: string;
}

const typeConfig: Record<string, TypeConfig> = {
  cognitive: {
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    color: 'text-purple-700 dark:text-purple-300',
    icon: Brain,
    label: 'Cognitive',
  },
  language: {
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    color: 'text-blue-700 dark:text-blue-300',
    icon: BookOpen,
    label: 'Language',
  },
  physical: {
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    color: 'text-green-700 dark:text-green-300',
    icon: Activity,
    label: 'Physical',
  },
  self_care: {
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    color: 'text-pink-700 dark:text-pink-300',
    icon: Heart,
    label: 'Self Care',
  },
  social: {
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    color: 'text-orange-700 dark:text-orange-300',
    icon: Users,
    label: 'Social',
  },
};

export function MilestoneCard({
  title,
  description,
  type,
  ageLabel,
  isCompleted = false,
  isEnhancing = false,
  onMarkComplete,
  bulletPoints,
  followUpQuestion,
  summary,
  babyId,
}: MilestoneCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  const colorConfig: ColorConfig = {
    border: config.borderColor,
    card: config.bgColor,
    icon: config.color,
    text: config.color,
  };

  return (
    <FeatureCard colorConfig={colorConfig} variant="custom">
      {/* Completed overlay */}
      <FeatureCard.Overlay show={isCompleted}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900 mb-3">
            <Check className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <H4 className="text-green-700 dark:text-green-300">Completed!</H4>
        </div>
      </FeatureCard.Overlay>

      {/* Header with icon and type */}
      <FeatureCard.Header
        className={`flex items-center gap-3 ${config.bgColor} p-4 pb-4`}
        colorConfig={colorConfig}
      >
        <Icon className="size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
        {ageLabel && (
          <div className="inline-block w-fit rounded-full bg-primary/20 px-2 py-0.5">
            <P className="text-xs font-medium text-primary">{ageLabel}</P>
          </div>
        )}
      </FeatureCard.Header>

      {/* Scrollable Content Area */}
      <FeatureCard.Content className="space-y-3 p-4">
        {/* Summary */}
        {summary && (
          <P
            className={`text-sm text-muted-foreground leading-relaxed ${
              isEnhancing ? 'animate-pulse' : ''
            }`}
          >
            {summary}
          </P>
        )}

        {/* Bullet Points */}
        {bulletPoints && bulletPoints.length > 0 && (
          <ul className="space-y-2">
            {bulletPoints.map((point, index) => (
              <li
                className={`flex gap-2 text-sm text-foreground/80 ${
                  isEnhancing ? 'animate-pulse' : ''
                }`}
                key={`${point.slice(0, 20)}-${index}`}
              >
                <span className="text-muted-foreground shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Loading indicator when enhancing */}
        {isEnhancing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Sparkles className="size-3 animate-pulse" />
            <span className="animate-pulse">Personalizing content...</span>
          </div>
        )}
      </FeatureCard.Content>

      {/* Footer with question and buttons */}
      <FeatureCard.Footer
        className={`border-t ${config.borderColor} ${config.bgColor} flex-col gap-3 p-4 pt-4`}
        colorConfig={colorConfig}
      >
        {!isCompleted ? (
          <>
            {/* Follow-up Question */}
            {followUpQuestion && (
              <div className="flex gap-2 items-start w-full">
                <MessageCircle className="size-4 shrink-0 text-primary mt-0.5" />
                <P className="text-sm font-medium text-foreground">
                  {followUpQuestion}
                </P>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 w-full">
              {babyId && followUpQuestion && (
                <Button
                  className="w-full"
                  onClick={() => setIsChatOpen(true)}
                  size="sm"
                  variant="default"
                >
                  <MessageCircle className="size-4 mr-2" />
                  Answer
                </Button>
              )}
              <Button className="w-full" size="sm" variant="outline">
                <Sparkles className="size-4 mr-2" />
                Learn More
              </Button>
              <Button
                className="w-full"
                onClick={onMarkComplete}
                size="sm"
                variant="outline"
              >
                <Check className="size-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full py-2">
            <Check className="size-4 text-green-600 dark:text-green-400" />
            <P className="text-sm font-medium text-green-700 dark:text-green-300">
              Completed!
            </P>
          </div>
        )}
      </FeatureCard.Footer>

      {/* Chat Dialog */}
      {babyId && followUpQuestion && (
        <QuickChatDialog
          babyId={babyId}
          contextId={`${type}-${title}`}
          contextType="milestone"
          initialMessages={[
            {
              content: followUpQuestion,
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
