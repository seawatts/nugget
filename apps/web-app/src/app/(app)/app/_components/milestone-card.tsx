'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { P } from '@nugget/ui/custom/typography';
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
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { getContextChatReplyAction } from '../chat/actions';
import { QuickChatDialog } from './quick-chat-dialog';

interface MilestoneCardProps {
  title: string;
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

interface ChatReplier {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface TypeConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  borderColor: string;
  color: string;
}

type MilestoneType =
  | 'physical'
  | 'cognitive'
  | 'social'
  | 'language'
  | 'self_care';

const typeConfig: Record<MilestoneType, TypeConfig> = {
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
  const [repliers, setRepliers] = useState<ChatReplier[]>([]);
  const { executeAsync: fetchRepliers } = useAction(getContextChatReplyAction);
  const config = typeConfig[type];
  const Icon = config.icon;

  // Function to fetch repliers
  const loadRepliers = useCallback(() => {
    if (babyId && followUpQuestion) {
      fetchRepliers({
        babyId,
        contextId: `${type}-${title}`,
        contextType: 'milestone',
      })
        // biome-ignore lint/suspicious/noExplicitAny: action result type
        .then((result: any) => {
          if (result?.data) {
            setRepliers(result.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching repliers:', error);
        });
    }
  }, [babyId, followUpQuestion, type, title, fetchRepliers]);

  // Fetch repliers when component mounts
  useEffect(() => {
    loadRepliers();
  }, [loadRepliers]);

  // Refetch repliers when chat dialog closes
  useEffect(() => {
    if (!isChatOpen) {
      // Add a small delay to ensure the message has been saved
      const timer = setTimeout(() => {
        loadRepliers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen, loadRepliers]);

  const colorConfig: ColorConfig = {
    border: config.borderColor,
    card: config.bgColor,
    icon: config.color,
    text: config.color,
  };

  return (
    <FeatureCard
      className={
        isCompleted ? 'relative border-green-500/30 bg-green-500/5' : ''
      }
      colorConfig={colorConfig}
      variant="custom"
    >
      {/* Completed Badge */}
      {isCompleted && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 shadow-sm">
          <Check className="size-3 text-white" />
          <span className="text-xs font-medium text-white">Done</span>
        </div>
      )}

      {/* Header with icon and type */}
      <FeatureCard.Header
        className={`flex items-center gap-3 ${config.bgColor} p-5`}
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
      <FeatureCard.Content className="space-y-4 p-5 pb-3">
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
          <ul className="space-y-2.5">
            {bulletPoints.map((point, index) => (
              <li
                className={`flex gap-2.5 text-sm text-foreground/80 leading-relaxed ${
                  isEnhancing ? 'animate-pulse' : ''
                }`}
                key={`${point.slice(0, 20)}-${index}`}
              >
                <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
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
        className={`border-t ${config.borderColor} ${config.bgColor} flex-col gap-4 p-5`}
        colorConfig={colorConfig}
      >
        {/* Follow-up Question */}
        {followUpQuestion && (
          <div className="flex gap-2 items-start w-full">
            <MessageCircle className="size-4 shrink-0 text-primary mt-0.5" />
            <P className="text-sm font-medium text-foreground leading-snug">
              {followUpQuestion}
            </P>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {babyId && followUpQuestion && (
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
          <Button
            className="w-full"
            disabled={isCompleted}
            onClick={onMarkComplete}
            size="sm"
            variant={isCompleted ? 'default' : 'outline'}
          >
            <Check className="size-4 mr-2" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </Button>
        </div>
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
