'use client';

import { P } from '@nugget/ui/custom/typography';
import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AIGeneratingCardProps } from './ai-generating-card.types';
import { FeatureCard } from './feature-card';
import type { ColorConfig } from './feature-card.types';

/**
 * Predefined color configurations for different variants
 * Including progress indicator colors
 */
const VARIANT_COLORS: Record<
  NonNullable<AIGeneratingCardProps['variant']>,
  ColorConfig & { progressActive: string; progressInactive: string }
> = {
  custom: {
    border: '',
    card: '',
    progressActive: 'bg-primary',
    progressInactive: 'bg-primary/30',
    text: '',
  },
  info: {
    badge: 'bg-blue-500/20',
    border: 'border-blue-500/20',
    card: 'bg-gradient-to-br from-blue-500/5 to-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    progressActive: 'bg-blue-600 dark:bg-blue-400',
    progressInactive: 'bg-blue-600/30 dark:bg-blue-400/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  primary: {
    badge: 'bg-primary/20',
    border: 'border-primary/20',
    card: 'bg-gradient-to-br from-primary/5 to-primary/10',
    icon: 'text-primary',
    progressActive: 'bg-primary',
    progressInactive: 'bg-primary/30',
    text: 'text-primary',
  },
  success: {
    badge: 'bg-green-500/20',
    border: 'border-green-500/20',
    card: 'bg-gradient-to-br from-green-500/5 to-green-500/10',
    icon: 'text-green-600 dark:text-green-400',
    progressActive: 'bg-green-600 dark:bg-green-400',
    progressInactive: 'bg-green-600/30 dark:bg-green-400/30',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    badge: 'bg-yellow-500/20',
    border: 'border-yellow-500/20',
    card: 'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10',
    icon: 'text-yellow-600 dark:text-yellow-400',
    progressActive: 'bg-yellow-600 dark:bg-yellow-400',
    progressInactive: 'bg-yellow-600/30 dark:bg-yellow-400/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
};

/**
 * Generic AI content generation loading card with cycling messages
 * Provides a consistent loading experience across different features
 *
 * @example
 * ```tsx
 * <AIGeneratingCard
 *   babyName="Emma"
 *   ageInDays={45}
 *   messages={[
 *     (name, age) => `Generating insights for ${name}`,
 *     (name) => `Analyzing ${name}'s patterns`,
 *   ]}
 *   variant="primary"
 * />
 * ```
 */
export function AIGeneratingCard({
  babyName,
  ageInDays,
  messages,
  variant = 'primary',
  colorConfig: customColorConfig,
  subtitle = 'This may take a moment...',
  cycleInterval = 2000,
}: AIGeneratingCardProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through messages at specified interval
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [messages.length, cycleInterval]);

  // Get full color configuration including progress colors
  const fullColorConfig =
    variant === 'custom' && customColorConfig
      ? {
          ...customColorConfig,
          progressActive: 'bg-primary',
          progressInactive: 'bg-primary/30',
        }
      : VARIANT_COLORS[variant];

  // Extract base color config for FeatureCard
  const colorConfig: ColorConfig = {
    badge: fullColorConfig.badge,
    border: fullColorConfig.border,
    card: fullColorConfig.card,
    icon: fullColorConfig.icon,
    text: fullColorConfig.text,
  };

  // Generate current message
  const currentMessage =
    messages[messageIndex]?.(babyName, ageInDays) || 'Loading...';

  return (
    <FeatureCard
      className="min-w-[280px] h-[440px] snap-start"
      colorConfig={colorConfig}
      variant="custom"
    >
      {/* Header with animated spinner */}
      <FeatureCard.Header
        className={`flex items-center justify-center p-6 ${colorConfig.card}`}
        colorConfig={colorConfig}
      >
        <div className="relative">
          <Loader2
            className={`size-16 ${colorConfig.icon} opacity-30 animate-spin`}
          />
          <Sparkles
            className={`size-8 ${colorConfig.icon} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse`}
          />
        </div>
      </FeatureCard.Header>

      {/* Content with cycling message */}
      <FeatureCard.Content className="p-6 space-y-6 flex-1 flex flex-col items-center justify-center text-center">
        {/* Cycling message with fixed height to prevent jumping */}
        <div className="space-y-2 min-h-[48px] w-full">
          <P className="text-sm font-medium text-foreground animate-fade-in">
            {currentMessage}
          </P>
          <P className="text-xs text-muted-foreground">{subtitle}</P>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === messageIndex % 3
                  ? `w-8 ${fullColorConfig.progressActive}`
                  : `w-1.5 ${fullColorConfig.progressInactive}`
              }`}
              key={i}
            />
          ))}
        </div>
      </FeatureCard.Content>
    </FeatureCard>
  );
}
