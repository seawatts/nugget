'use client';

import { Button } from '@nugget/ui/button';

interface PredictiveOverdueActionsProps {
  onLog: (e: React.MouseEvent) => void;
  onSkip: (e: React.MouseEvent) => void;
  isSkipping: boolean;
}

export function PredictiveOverdueActions({
  onLog,
  onSkip,
  isSkipping,
}: PredictiveOverdueActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-50"
        onClick={onLog}
        size="sm"
      >
        Log
      </Button>
      <Button
        className="flex-1 bg-muted hover:bg-muted/80 text-foreground"
        disabled={isSkipping}
        onClick={onSkip}
        size="sm"
        variant="ghost"
      >
        {isSkipping ? 'Skipping...' : 'Skip'}
      </Button>
    </div>
  );
}
