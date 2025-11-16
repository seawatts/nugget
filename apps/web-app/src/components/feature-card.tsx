'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import type {
  ColorConfig,
  FeatureCardBadgeProps,
  FeatureCardContentProps,
  FeatureCardFooterProps,
  FeatureCardHeaderProps,
  FeatureCardIconProps,
  FeatureCardOverlayProps,
  FeatureCardRootProps,
  FeatureCardVariant,
} from './feature-card.types';

/**
 * Predefined color configurations for different variants
 */
const VARIANT_COLORS: Record<FeatureCardVariant, ColorConfig> = {
  custom: {
    border: '',
    card: '',
    text: '',
  },
  danger: {
    badge: 'bg-red-500/20 text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
    card: 'bg-gradient-to-br from-red-500/5 to-red-500/10',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-700 dark:text-red-300',
  },
  default: {
    badge: 'bg-muted text-muted-foreground',
    border: 'border-border',
    card: 'bg-card',
    icon: 'text-foreground',
    text: 'text-foreground',
  },
  info: {
    badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    card: 'bg-blue-500/5',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  primary: {
    badge: 'bg-primary/20 text-primary',
    border: 'border-primary/20',
    card: 'bg-gradient-to-br from-primary/5 to-primary/10',
    icon: 'text-primary',
    text: 'text-primary',
  },
  success: {
    badge: 'bg-green-500/20 text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
    card: 'bg-gradient-to-br from-green-500/5 to-emerald-500/10',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    badge: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/20',
    card: 'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
};

/**
 * Get color configuration based on variant
 */
function getColorConfig(
  variant: FeatureCardVariant = 'default',
  customConfig?: ColorConfig,
): ColorConfig {
  if (variant === 'custom' && customConfig) {
    return customConfig;
  }
  return VARIANT_COLORS[variant];
}

/**
 * Root FeatureCard component
 */
function FeatureCardRoot({
  children,
  variant = 'default',
  className,
  colorConfig: customColorConfig,
}: FeatureCardRootProps) {
  const colorConfig = getColorConfig(variant, customColorConfig);

  return (
    <Card
      className={cn(
        'min-w-[280px] h-[440px] snap-start flex flex-col relative overflow-hidden p-0',
        colorConfig.border,
        colorConfig.card,
        className,
      )}
    >
      {children}
    </Card>
  );
}

/**
 * Header section with icon/badge support
 */
function FeatureCardHeader({
  children,
  className,
  colorConfig,
}: FeatureCardHeaderProps) {
  return (
    <CardHeader className={cn('pb-3', colorConfig?.text, className)}>
      {children}
    </CardHeader>
  );
}

/**
 * Icon component with color variants
 */
function FeatureCardIcon({
  icon: Icon,
  className,
  colorConfig,
}: FeatureCardIconProps) {
  return (
    <Icon className={cn('size-6 shrink-0', colorConfig?.icon, className)} />
  );
}

/**
 * Badge/label display component
 */
function FeatureCardBadge({
  children,
  className,
  variant = 'default',
  colorConfig,
}: FeatureCardBadgeProps) {
  const badgeClass =
    variant === 'custom' && colorConfig?.badge
      ? colorConfig.badge
      : variant === 'secondary'
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-primary/20 text-primary';

  return (
    <div
      className={cn(
        'inline-block w-fit rounded-full px-3 py-1',
        badgeClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Main scrollable content area
 */
function FeatureCardContent({
  children,
  className,
  scrollable = true,
}: FeatureCardContentProps) {
  return (
    <CardContent
      className={cn('pb-3 flex-1', scrollable && 'overflow-y-auto', className)}
    >
      {children}
    </CardContent>
  );
}

/**
 * Footer with button slots
 */
function FeatureCardFooter({
  children,
  className,
  colorConfig,
}: FeatureCardFooterProps) {
  return (
    <CardFooter className={cn(colorConfig?.text, className)}>
      {children}
    </CardFooter>
  );
}

/**
 * Overlay for states (completed, loading, etc.)
 */
function FeatureCardOverlay({
  children,
  show = true,
  className,
}: FeatureCardOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Export compound component
 */
export const FeatureCard = Object.assign(FeatureCardRoot, {
  Badge: FeatureCardBadge,
  Content: FeatureCardContent,
  Footer: FeatureCardFooter,
  Header: FeatureCardHeader,
  Icon: FeatureCardIcon,
  Overlay: FeatureCardOverlay,
});

/**
 * Export utility for getting color config
 */
export { getColorConfig, VARIANT_COLORS };
