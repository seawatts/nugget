import { Button } from '@nugget/ui/button';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface LearningSectionProps {
  icon: LucideIcon;
  title?: string;
  babyAgeDays: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  educationalContent: string;
  tips: string[];
}

export function LearningSection({
  icon: Icon,
  title = 'How This Works',
  babyAgeDays,
  color,
  bgColor,
  borderColor,
  educationalContent,
  tips,
}: LearningSectionProps) {
  return (
    <div
      className={`mb-6 rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}
    >
      <div className={`flex items-center gap-3 p-4 ${color}`}>
        <Icon className="size-6" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          {babyAgeDays !== null && (
            <p className="text-xs text-muted-foreground">
              At {babyAgeDays} {babyAgeDays === 1 ? 'day' : 'days'} old
            </p>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
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
        <Button asChild className="w-full" size="sm" variant="outline">
          <Link href="/app/learning">Learn More</Link>
        </Button>
      </div>
    </div>
  );
}
