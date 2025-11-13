'use client';

import { cn } from '@nugget/ui/lib/utils';
import { Baby, Calendar, Heart } from 'lucide-react';
import type { JourneyStage } from './types';

interface JourneyStageStepProps {
  selectedStage: JourneyStage | null;
  onSelect: (stage: JourneyStage) => void;
}

export function JourneyStageStep({
  selectedStage,
  onSelect,
}: JourneyStageStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance">
          Welcome to Your Parenting Journey
        </h1>
        <p className="text-muted-foreground">
          Let's personalize your experience. Where are you in your journey?
        </p>
      </div>

      <div className="space-y-3">
        <button
          className={cn(
            'w-full p-6 rounded-3xl border-2 transition-all text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selectedStage === 'ttc'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50',
          )}
          onClick={() => onSelect('ttc')}
          type="button"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center flex-shrink-0">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Trying to Conceive</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your cycle, ovulation, and conception journey
              </p>
            </div>
          </div>
        </button>

        <button
          className={cn(
            'w-full p-6 rounded-3xl border-2 transition-all text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selectedStage === 'pregnant'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50',
          )}
          onClick={() => onSelect('pregnant')}
          type="button"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Pregnant</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your pregnancy week by week and prepare for baby
              </p>
            </div>
          </div>
        </button>

        <button
          className={cn(
            'w-full p-6 rounded-3xl border-2 transition-all text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selectedStage === 'born'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50',
          )}
          onClick={() => onSelect('born')}
          type="button"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Baby is Here</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track feeding, sleep, diapers, and developmental milestones
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
