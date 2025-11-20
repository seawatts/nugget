'use client';

import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';

interface PredictiveCardErrorProps {
  error: string;
}

export function PredictiveCardError({ error }: PredictiveCardErrorProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 p-6 bg-destructive/10 col-span-2',
      )}
    >
      <p className="text-sm text-destructive">{error}</p>
    </Card>
  );
}
