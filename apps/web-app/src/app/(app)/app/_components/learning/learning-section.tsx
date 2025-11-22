import { Button } from '@nugget/ui/button';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { InfoCard } from '../shared/info-card';

interface LearningSectionProps {
  icon: LucideIcon;
  title?: string;
  babyAgeDays: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  educationalContent: string;
  tips: string[];
  children?: React.ReactNode;
}

export function LearningSection({
  icon,
  title = 'How This Works',
  babyAgeDays,
  color,
  bgColor,
  borderColor,
  educationalContent,
  tips,
  children,
}: LearningSectionProps) {
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
      {tips.length > 0 && (
        <ul className="text-sm text-foreground/80 space-y-1.5">
          {tips.map((tip) => (
            <li className="flex gap-2" key={tip}>
              <span className="text-muted-foreground">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </InfoCard>
  );
}
