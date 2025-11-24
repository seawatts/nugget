import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { InfoCard } from '../shared/info-card';

export interface WhatsNextItem {
  title: string;
  description: string;
  timeframe: string;
}

interface WhatsNextSectionProps {
  icon: LucideIcon;
  babyAgeDays: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  items: WhatsNextItem[];
}

export function WhatsNextSection({
  babyAgeDays,
  color,
  bgColor,
  borderColor,
  items,
}: WhatsNextSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <InfoCard
      babyAgeDays={babyAgeDays}
      bgColor={bgColor}
      borderColor={borderColor}
      color={color}
      icon={TrendingUp}
      title="What's Coming Next"
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="group relative rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:border-border hover:bg-muted/30"
            key={item.title}
          >
            <div className="flex items-start gap-3">
              {/* Timeline dot */}
              <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <ArrowRight className="size-3 text-primary" />
              </div>

              <div className="flex-1 space-y-1.5">
                {/* Title and timeframe */}
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {item.timeframe}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </InfoCard>
  );
}
