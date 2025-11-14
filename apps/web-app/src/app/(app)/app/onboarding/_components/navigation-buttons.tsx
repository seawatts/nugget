import { Button } from '@nugget/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  canProceed,
  isPending,
  onBack,
  onNext,
  onComplete,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-3 pt-4">
      {currentStep > 1 && (
        <Button
          className="flex-1"
          disabled={isPending}
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {isLastStep ? (
        <Button
          className="flex-1"
          disabled={!canProceed || isPending}
          onClick={() => {
            console.log('Get Started button clicked', {
              canProceed,
              currentStep,
              isPending,
              totalSteps,
            });
            onComplete();
          }}
        >
          {isPending ? 'Saving...' : 'Get Started'}
          <CheckCircle2 className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          className="flex-1"
          disabled={!canProceed || isPending}
          onClick={onNext}
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
