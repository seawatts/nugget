import { Card } from '@nugget/ui/card';
import { format } from 'date-fns';
import { Award, TrendingUp } from 'lucide-react';
import type { WeeklyHighlights } from '../types';

interface WeeklyHighlightsSectionProps {
  highlights: WeeklyHighlights;
}

export function WeeklyHighlightsSection({
  highlights,
}: WeeklyHighlightsSectionProps) {
  if (!highlights.bestDay) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          This Week's Highlights
        </h3>
      </div>
      <Card className="p-4">
        <div className="space-y-2">
          {highlights.bestDay && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Best Day</span>
              <span className="text-sm font-semibold text-foreground">
                {highlights.bestDay.count} activities on{' '}
                {format(highlights.bestDay.date, 'MMM d')}
              </span>
            </div>
          )}
          {highlights.improvementMessage && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Trend</span>
              <span className="text-sm font-semibold text-foreground">
                {highlights.improvementMessage}
              </span>
            </div>
          )}
          {highlights.newRecords.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Award className="size-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {highlights.newRecords.join(', ')}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
