'use client';

import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, P, Text } from '@nugget/ui/custom/typography';
import { Confetti, type ConfettiRef } from '@nugget/ui/magicui/confetti';
import { Particles } from '@nugget/ui/magicui/particles';
import { ShineBorder } from '@nugget/ui/magicui/shine-border';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface PublicCelebrationCardProps {
  celebration: {
    title: string;
    babyName: string;
    ageLabel: string;
    aiSummary: string | null;
    photoUrls: string[];
    statistics: {
      feedingCount?: number;
      sleepHours?: number;
      diaperCount?: number;
    };
    celebrationId: string;
  };
}

export function PublicCelebrationCard({
  celebration,
}: PublicCelebrationCardProps) {
  const confettiRef = useRef<ConfettiRef>(null);

  // Confetti state management - only show once per celebration
  useEffect(() => {
    const storageKey = `celebration_confetti_shown_${celebration.celebrationId}`;
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
  }, [celebration.celebrationId]);

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
              {celebration.babyName} is {celebration.ageLabel.toLowerCase()}
            </Text>
          </div>

          {/* AI-Generated Summary */}
          {celebration.aiSummary && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
              <P className="text-center font-medium">{celebration.aiSummary}</P>
            </div>
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
          {celebration.photoUrls && celebration.photoUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {celebration.photoUrls.map((url) => (
                <div
                  className="relative aspect-square rounded-lg overflow-hidden border border-border"
                  key={url}
                >
                  <img
                    alt="Celebration memory"
                    className="object-cover size-full"
                    src={url}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
