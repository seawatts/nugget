import { Badge } from '@nugget/ui/badge';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Clock,
  Droplet,
  Moon,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';

interface QuickButton {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}

interface QuickButtonInfoProps {
  buttons: QuickButton[];
  className?: string;
}

export function QuickButtonInfo({ buttons, className }: QuickButtonInfoProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {buttons.map((button) => (
        <div
          className="group relative flex items-start gap-3 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          key={button.label}
        >
          {/* Icon */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm ring-1 ring-foreground/5">
            <button.icon className="size-4 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {button.label}
              </span>
              <Badge className="font-mono text-xs" variant="secondary">
                {button.value}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {button.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions to create button data for each activity type

export function getPumpingButtons(
  low: string,
  medium: string,
  high: string,
  description: string,
): QuickButton[] {
  return [
    {
      description: `Minimal output session (${description})`,
      icon: Droplet,
      label: 'Low',
      value: low,
    },
    {
      description: `Typical output (${description})`,
      icon: Droplet,
      label: 'Medium',
      value: medium,
    },
    {
      description: `Above average session (${description})`,
      icon: Sparkles,
      label: 'High',
      value: high,
    },
  ];
}

export function getFeedingButtons(
  bottleAmount: string,
  nursingDuration: string,
  ageContext: string,
): QuickButton[] {
  return [
    {
      description: `Standard intake for ${ageContext}`,
      icon: Baby,
      label: 'Quick Bottle',
      value: bottleAmount,
    },
    {
      description: `Typical nursing duration for ${ageContext}`,
      icon: Clock,
      label: 'Quick Nursing',
      value: nursingDuration,
    },
  ];
}

export function getDiaperButtons(): QuickButton[] {
  return [
    {
      description: 'Logs a wet-only diaper',
      icon: Droplet,
      label: 'Quick Pee',
      value: 'Wet',
    },
    {
      description: 'Logs a dirty-only diaper',
      icon: Zap,
      label: 'Quick Poop',
      value: 'Dirty',
    },
    {
      description: 'Logs a combination diaper',
      icon: Sparkles,
      label: 'Quick Both',
      value: 'Both',
    },
  ];
}

export function getSleepButtons(): QuickButton[] {
  return [
    {
      description: 'Logs a completed 1-hour sleep session',
      icon: Moon,
      label: '1 Hour',
      value: '1h',
    },
    {
      description: 'Logs a completed 2-hour sleep session',
      icon: Moon,
      label: '2 Hours',
      value: '2h',
    },
    {
      description: 'Begins real-time tracking for ongoing sleep',
      icon: Smartphone,
      label: 'Start Timer',
      value: 'Live',
    },
  ];
}
