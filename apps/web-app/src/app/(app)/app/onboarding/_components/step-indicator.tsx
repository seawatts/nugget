import { cn } from '@nugget/ui/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex justify-center gap-2 pt-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            stepNumber === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted',
          )}
          key={stepNumber}
        />
      ))}
    </div>
  );
}
