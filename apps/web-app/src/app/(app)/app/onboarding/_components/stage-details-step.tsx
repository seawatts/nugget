import { BabyDetailsForm } from './baby-details-form';
import { PregnancyDatesForm } from './pregnancy-dates-form';
import { TTCMethodForm } from './ttc-method-form';
import type { JourneyStage, TTCMethod } from './types';

interface StageDetailsStepProps {
  journeyStage: JourneyStage | null;
  ttcMethod: TTCMethod | null;
  lastPeriodDate: string;
  dueDate: string;
  dueDateManuallySet: boolean;
  birthDate: string;
  fullName: string;
  birthWeightLbs: string;
  birthWeightOz: string;
  onTTCMethodSelect: (method: TTCMethod) => void;
  onLastPeriodChange: (date: string) => void;
  onDueDateChange: (date: string) => void;
  onBirthDateChange: (date: string) => void;
  onFullNameChange: (name: string) => void;
  onBirthWeightLbsChange: (lbs: string) => void;
  onBirthWeightOzChange: (oz: string) => void;
}

export function StageDetailsStep({
  journeyStage,
  ttcMethod,
  lastPeriodDate,
  dueDate,
  dueDateManuallySet,
  birthDate,
  fullName,
  birthWeightLbs,
  birthWeightOz,
  onTTCMethodSelect,
  onLastPeriodChange,
  onDueDateChange,
  onBirthDateChange,
  onFullNameChange,
  onBirthWeightLbsChange,
  onBirthWeightOzChange,
}: StageDetailsStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {journeyStage === 'ttc' && (
        <TTCMethodForm
          onSelect={onTTCMethodSelect}
          selectedMethod={ttcMethod}
        />
      )}

      {journeyStage === 'pregnant' && (
        <PregnancyDatesForm
          dueDate={dueDate}
          dueDateManuallySet={dueDateManuallySet}
          lastPeriodDate={lastPeriodDate}
          onDueDateChange={onDueDateChange}
          onLastPeriodChange={onLastPeriodChange}
        />
      )}

      {journeyStage === 'born' && (
        <BabyDetailsForm
          birthDate={birthDate}
          birthWeightLbs={birthWeightLbs}
          birthWeightOz={birthWeightOz}
          fullName={fullName}
          onBirthDateChange={onBirthDateChange}
          onBirthWeightLbsChange={onBirthWeightLbsChange}
          onBirthWeightOzChange={onBirthWeightOzChange}
          onFullNameChange={onFullNameChange}
        />
      )}
    </div>
  );
}
