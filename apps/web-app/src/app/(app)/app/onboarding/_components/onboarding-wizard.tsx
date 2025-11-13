'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { completeOnboardingAction } from '../actions';
import { JourneyStageStep } from './journey-stage-step';
import { NavigationButtons } from './navigation-buttons';
import { StageDetailsStep } from './stage-details-step';
import { StepIndicator } from './step-indicator';
import type { JourneyStage, TTCMethod, UserRole } from './types';
import { UserRoleStep } from './user-role-step';

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [ttcMethod, setTTCMethod] = useState<TTCMethod | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateManuallySet, setDueDateManuallySet] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [babyName, setBabyName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDueDate = (lmpDate: string) => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    const calculatedDueDate = new Date(
      lmp.getTime() + 280 * 24 * 60 * 60 * 1000,
    );
    return calculatedDueDate.toISOString().split('T')[0];
  };

  const handleLastPeriodChange = (date: string) => {
    setLastPeriodDate(date);
    if (!dueDateManuallySet) {
      const calculated = calculateDueDate(date);
      setDueDate(calculated ?? '');
    }
  };

  const handleDueDateChange = (date: string) => {
    setDueDate(date);
    setDueDateManuallySet(true);
  };

  const handleComplete = () => {
    if (!journeyStage || !userRole) return;

    setError(null);

    // Save to localStorage as backup
    const onboardingData = {
      babyName,
      birthDate,
      completedAt: new Date().toISOString(),
      dueDate,
      journeyStage,
      lastPeriodDate,
      ttcMethod,
      userRole,
    };
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));

    // Submit to server
    startTransition(async () => {
      try {
        const result = await completeOnboardingAction({
          babyName: babyName || undefined,
          birthDate: birthDate || undefined,
          dueDate: dueDate || undefined,
          journeyStage,
          lastPeriodDate: lastPeriodDate || undefined,
          ttcMethod: ttcMethod || undefined,
          userRole,
        });

        if (result?.serverError) {
          setError(result.serverError);
          return;
        }

        if (result?.data?.success) {
          router.push('/app/onboarding/setup');
        }
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        setError('Failed to save onboarding data. Please try again.');
      }
    });
  };

  const canProceed = () => {
    if (step === 1) return journeyStage !== null;
    if (step === 2) {
      if (journeyStage === 'ttc') return ttcMethod !== null;
      if (journeyStage === 'pregnant') return dueDate !== '';
      if (journeyStage === 'born') return birthDate !== '';
    }
    if (step === 3) return userRole !== null;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {step === 1 && (
            <JourneyStageStep
              onSelect={setJourneyStage}
              selectedStage={journeyStage}
            />
          )}

          {step === 2 && (
            <StageDetailsStep
              babyName={babyName}
              birthDate={birthDate}
              dueDate={dueDate}
              dueDateManuallySet={dueDateManuallySet}
              journeyStage={journeyStage}
              lastPeriodDate={lastPeriodDate}
              onBabyNameChange={setBabyName}
              onBirthDateChange={setBirthDate}
              onDueDateChange={handleDueDateChange}
              onLastPeriodChange={handleLastPeriodChange}
              onTTCMethodSelect={setTTCMethod}
              ttcMethod={ttcMethod}
            />
          )}

          {step === 3 && (
            <UserRoleStep onSelect={setUserRole} selectedRole={userRole} />
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <NavigationButtons
            canProceed={canProceed()}
            currentStep={step}
            isPending={isPending}
            onBack={() => setStep(step - 1)}
            onComplete={handleComplete}
            onNext={() => setStep(step + 1)}
            totalSteps={TOTAL_STEPS}
          />

          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>
      </div>
    </div>
  );
}
