'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, P, Text } from '@nugget/ui/custom/typography';
import { Confetti, type ConfettiRef } from '@nugget/ui/magicui/confetti';
import { Particles } from '@nugget/ui/magicui/particles';
import { ShineBorder } from '@nugget/ui/magicui/shine-border';
import { Camera, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { QuickChatDialog } from '../chat/quick-chat-dialog';
import type { CelebrationCardData } from './celebration-card.actions';
import { CelebrationPhotoUpload } from './celebration-photo-upload';
import { CelebrationShareDialog } from './celebration-share-dialog';

interface CelebrationCardProps {
  celebration: CelebrationCardData;
  babyId: string;
  babyName: string;
  isLoadingAI?: boolean;
}

export function CelebrationCard({
  celebration,
  babyId,
  babyName,
  isLoadingAI = false,
}: CelebrationCardProps) {
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeChatConfig, setActiveChatConfig] = useState<{
    question: string;
    systemPrompt: string;
    title: string;
    contextId: string;
  } | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  // Confetti state management - only show once per celebration
  useEffect(() => {
    const storageKey = `celebration_confetti_shown_${celebration.id}`;
    const hasShownConfetti = localStorage.getItem(storageKey);

    if (!hasShownConfetti) {
      // Delay confetti slightly for better visual impact
      const timer = setTimeout(() => {
        confettiRef.current?.fire({
          colors: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'],
          origin: { y: 0.6 },
          particleCount: 150,
          spread: 100,
        });
        localStorage.setItem(storageKey, 'true');
      }, 300);

      return () => clearTimeout(timer);
    }

    // Clean up old confetti entries (> 30 days)
    const cleanupOldEntries = () => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('celebration_confetti_shown_')) {
          // Extract timestamp if stored, otherwise clean up after 30 days
          const storedAt = localStorage.getItem(`${key}_timestamp`);
          if (storedAt) {
            const daysSince =
              (Date.now() - Number.parseInt(storedAt, 10)) /
              (1000 * 60 * 60 * 24);
            if (daysSince > 30) {
              localStorage.removeItem(key);
              localStorage.removeItem(`${key}_timestamp`);
            }
          }
        }
      });
    };

    cleanupOldEntries();
  }, [celebration.id]);

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'take_photo':
        setPhotoUploadOpen(true);
        break;
      case 'share':
        setShareDialogOpen(true);
        break;
    }
  };

  const handleChatOpen = (
    questionType: 'milestone' | 'memory' | 'guidance',
  ) => {
    if (!celebration.aiQuestions) return;

    const question = celebration.aiQuestions[questionType];
    const titles = {
      guidance: 'Get Guidance',
      memory: 'Share Memory',
      milestone: 'Track Development',
    };

    setActiveChatConfig({
      contextId: `celebration-${celebration.celebrationType}-${questionType}`,
      question: question.question,
      systemPrompt: question.systemPrompt,
      title: titles[questionType],
    });
    setChatDialogOpen(true);
  };

  return (
    <>
      {/* Confetti Canvas */}
      <Confetti
        className="pointer-events-none absolute inset-0 z-50 size-full"
        manualstart
        ref={confettiRef}
      />

      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Animated shine border effect */}
        <ShineBorder
          borderWidth={2}
          className="z-0"
          duration={14}
          shineColor={['#ff006e', '#8338ec', '#3a86ff']}
        />

        {/* Particles background */}
        <Particles
          className="absolute inset-0 pointer-events-none z-0"
          color="#ff006e"
          ease={50}
          quantity={30}
          size={1.2}
          staticity={50}
        />

        {/* Confetti-like decorative elements */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 left-4 size-3 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute top-8 right-8 size-2 rounded-full bg-secondary/30 animate-pulse delay-100" />
          <div className="absolute bottom-6 left-12 size-2.5 rounded-full bg-accent/20 animate-pulse delay-200" />
          <div className="absolute top-12 right-16 size-1.5 rounded-full bg-primary/30 animate-pulse delay-300" />
          <div className="absolute bottom-12 right-6 size-2 rounded-full bg-secondary/20 animate-pulse delay-150" />
          <Sparkles className="absolute top-6 right-12 size-5 text-primary/40 animate-pulse delay-75" />
          <Sparkles className="absolute bottom-8 left-8 size-4 text-secondary/40 animate-pulse delay-200" />
        </div>

        <div className="relative p-6 gap-6 grid z-20">
          {/* Header with celebration title */}
          <div className="text-center gap-2 grid">
            <H2 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
              {celebration.title}
            </H2>
            <Text className="font-medium" size="lg" variant="muted">
              {babyName} is {celebration.ageLabel.toLowerCase()}
            </Text>
          </div>

          {/* AI-Generated Summary */}
          {isLoadingAI && !celebration.aiSummary ? (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="size-4 text-primary animate-pulse" />
                <P className="text-center text-sm text-muted-foreground">
                  Creating your personalized celebration message...
                </P>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-primary/10 rounded-full animate-pulse w-3/4 mx-auto" />
                <div className="h-3 bg-primary/10 rounded-full animate-pulse w-full" />
              </div>
            </div>
          ) : (
            celebration.aiSummary && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                <P className="text-center font-medium">
                  {celebration.aiSummary}
                </P>
              </div>
            )
          )}

          {/* Statistics Section */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="text-center gap-1 grid">
              <Icons.Milk className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Feedings
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.feedingCount || 0}
              </Text>
            </div>
            <div className="text-center gap-1 grid">
              <Icons.Moon className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Sleep Hours
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.sleepHours?.toFixed(1) || 0}
              </Text>
            </div>
            <div className="text-center gap-1 grid">
              <Icons.Baby className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Diapers
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.diaperCount || 0}
              </Text>
            </div>
          </div>

          {/* Photos if exist */}
          {celebration.memory?.photoUrls &&
            celebration.memory.photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {celebration.memory.photoUrls.map((url) => (
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden border border-border"
                    key={url}
                  >
                    <img
                      alt={'Celebration memory'}
                      className="object-cover size-full"
                      src={url}
                    />
                  </div>
                ))}
              </div>
            )}

          {/* AI Question Buttons */}
          {isLoadingAI && !celebration.aiQuestions ? (
            <div className="gap-3 grid">
              <Text
                className="text-center font-semibold"
                size="sm"
                variant="muted"
              >
                Chat with AI
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((i) => (
                  <div
                    className="gap-2 flex-col h-auto py-3 flex items-center justify-center border border-border/50 rounded-md bg-background/50"
                    key={i}
                  >
                    <Sparkles className="size-4 text-muted-foreground animate-pulse" />
                    <div className="h-2 bg-muted/50 rounded-full animate-pulse w-16" />
                  </div>
                ))}
              </div>
              <P className="text-center text-xs text-muted-foreground">
                Preparing intelligent questions...
              </P>
            </div>
          ) : (
            celebration.aiQuestions && (
              <div className="gap-3 grid">
                <Text
                  className="text-center font-semibold"
                  size="sm"
                  variant="muted"
                >
                  Chat with AI
                </Text>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2 flex-col h-auto py-3"
                    onClick={() => handleChatOpen('milestone')}
                    size="sm"
                    variant="outline"
                  >
                    <MessageCircle className="size-4" />
                    <span className="text-xs">Track Development</span>
                  </Button>
                  <Button
                    className="gap-2 flex-col h-auto py-3"
                    onClick={() => handleChatOpen('guidance')}
                    size="sm"
                    variant="outline"
                  >
                    <Sparkles className="size-4" />
                    <span className="text-xs">Get Guidance</span>
                  </Button>
                </div>
              </div>
            )
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {celebration.actions
              .filter((action) => action.type !== 'save_memory')
              .map((action) => (
                <Button
                  className="gap-2 flex-col h-auto py-3"
                  key={action.type}
                  onClick={() => handleActionClick(action.type)}
                  size="sm"
                  variant="outline"
                >
                  {action.type === 'take_photo' && (
                    <Camera className="size-4" />
                  )}
                  {action.type === 'share' && <Share2 className="size-4" />}
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
          </div>

          {/* Shared status */}
          {celebration.memory?.sharedWith &&
            celebration.memory.sharedWith.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Share2 className="size-4" />
                <Text size="sm" variant="muted">
                  Shared with {celebration.memory.sharedWith.length}{' '}
                  {celebration.memory.sharedWith.length === 1
                    ? 'person'
                    : 'people'}
                </Text>
              </div>
            )}
        </div>
      </Card>

      {/* Dialogs */}
      <CelebrationPhotoUpload
        babyId={babyId}
        babyName={babyName}
        celebrationType={celebration.celebrationType}
        existingPhotos={celebration.memory?.photoUrls || []}
        onOpenChange={setPhotoUploadOpen}
        open={photoUploadOpen}
      />

      <CelebrationShareDialog
        babyId={babyId}
        babyName={babyName}
        celebrationTitle={celebration.title}
        celebrationType={celebration.celebrationType}
        onOpenChange={setShareDialogOpen}
        open={shareDialogOpen}
      />

      {/* AI Chat Dialog */}
      {activeChatConfig && (
        <QuickChatDialog
          autoSendPrefill
          babyId={babyId}
          contextId={activeChatConfig.contextId}
          contextType="celebration"
          onOpenChange={(open) => {
            setChatDialogOpen(open);
            if (!open) {
              setActiveChatConfig(null);
            }
          }}
          open={chatDialogOpen}
          prefillMessage={activeChatConfig.question}
          systemPrompt={activeChatConfig.systemPrompt}
          title={activeChatConfig.title}
        />
      )}
    </>
  );
}
