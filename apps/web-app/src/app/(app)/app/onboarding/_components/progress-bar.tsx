interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-muted h-1">
      <div
        className="bg-primary h-1 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
