import { Button } from '@nugget/ui/button';
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
import Link from 'next/link';
import type { QuickButton as QuickButtonType } from '../activities/feeding/learning-content';
import { InfoCard } from '../shared/info-card';
import { QuickButtonInfo } from './quick-button-info';

interface LearningSectionProps {
  icon: LucideIcon;
  title?: string;
  babyAgeDays: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  educationalContent: string;
  tips: string[];
  quickButtons?: QuickButtonType[];
  children?: React.ReactNode;
}

// Map icon strings to Lucide icon components
const ICON_MAP: Record<string, LucideIcon> = {
  baby: Baby,
  clock: Clock,
  droplet: Droplet,
  moon: Moon,
  smartphone: Smartphone,
  sparkles: Sparkles,
  zap: Zap,
};

export function LearningSection({
  icon,
  title = 'How This Works',
  babyAgeDays,
  color,
  bgColor,
  borderColor,
  educationalContent,
  tips,
  quickButtons,
  children,
}: LearningSectionProps) {
  // Convert icon strings to Lucide components
  const buttonsWithIcons = quickButtons?.map((button) => ({
    ...button,
    icon: ICON_MAP[button.icon] || Sparkles,
  }));

  return (
    <InfoCard
      actions={
        <Button asChild className="w-full" size="sm" variant="outline">
          <Link href="/app/learning">Learn More</Link>
        </Button>
      }
      babyAgeDays={babyAgeDays}
      bgColor={bgColor}
      borderColor={borderColor}
      color={color}
      icon={icon}
      title={title}
    >
      <p className="text-sm text-foreground/90">{educationalContent}</p>

      {/* Quick Buttons Visual Display */}
      {buttonsWithIcons && buttonsWithIcons.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-foreground/70 mb-3 uppercase tracking-wide">
            Quick Action Buttons
          </h4>
          <QuickButtonInfo buttons={buttonsWithIcons} />
        </div>
      )}

      {tips.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wide">
            Tips
          </h4>
          <ul className="text-sm text-foreground/80 space-y-1.5">
            {tips.map((tip) => (
              <li className="flex gap-2" key={tip}>
                <span className="text-muted-foreground">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
    </InfoCard>
  );
}
