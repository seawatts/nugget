'use client';

import { P } from '@nugget/ui/custom/typography';
import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LearningCardLoadingProps {
  babyName: string;
  ageInDays: number;
}

const loadingMessages = [
  (name: string, age: number) =>
    `Generating insights for ${name}'s ${age} ${age === 1 ? 'day' : 'days'} old`,
  (name: string) => `Analyzing ${name}'s feeding patterns`,
  (name: string) => `Reviewing ${name}'s sleep data`,
  (name: string) => `Studying ${name}'s development`,
  (name: string) => `Creating personalized tips for ${name}`,
  (_name: string, age: number) => `Tailoring advice for day ${age}`,
  (name: string) => `Learning about ${name}'s routine`,
  () => 'Consulting latest research',
  () => 'Crafting actionable insights',
];

export function LearningCardLoading({
  babyName,
  ageInDays,
}: LearningCardLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Cycle every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const currentMessage =
    loadingMessages[messageIndex]?.(babyName, ageInDays) || 'Loading...';

  return (
    <div className="w-[280px] h-[440px] snap-start rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden flex flex-col">
      {/* Single star icon with loading spinner around it */}
      <div className="flex items-center justify-center p-6 bg-primary/10">
        <div className="relative">
          <Loader2 className="size-16 text-primary/30 animate-spin" />
          <Sparkles className="size-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 flex flex-col items-center justify-center text-center">
        {/* Cycling message - fixed width container to prevent jumping */}
        <div className="space-y-2 min-h-[48px] w-full">
          <P className="text-sm font-medium text-foreground animate-fade-in">
            {currentMessage}
          </P>
          <P className="text-xs text-muted-foreground">
            This may take a moment...
          </P>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === messageIndex % 3
                  ? 'w-8 bg-primary'
                  : 'w-1.5 bg-primary/30'
              }`}
              key={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
