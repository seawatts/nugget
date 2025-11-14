'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { parseBabyName } from '@nugget/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { completeOnboardingAction, upsertUserAction } from '../actions';
import { InviteCaregiversStep } from './invite-caregivers-step';
import { JourneyStageStep } from './journey-stage-step';
import { NavigationButtons } from './navigation-buttons';
import { StageDetailsStep } from './stage-details-step';
import { StepIndicator } from './step-indicator';
import type { JourneyStage, TTCMethod } from './types';

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const router = useRouter();
  const { setActive } = useOrganizationList();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [ttcMethod, setTTCMethod] = useState<TTCMethod | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateManuallySet, setDueDateManuallySet] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthWeightLbs, setBirthWeightLbs] = useState('');
  const [birthWeightOz, setBirthWeightOz] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Upsert user when component mounts to ensure user exists in database
  useEffect(() => {
    startTransition(async () => {
      try {
        await upsertUserAction();
      } catch (error) {
        console.error('Failed to upsert user:', error);
        // Don't show error to user - this is a background operation
      }
    });
  }, []);

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
    try {
      console.log('handleComplete called', {
        birthDate,
        birthWeightLbs,
        birthWeightOz,
        fullName,
        isPending,
        journeyStage,
        step,
      });

      if (!journeyStage) {
        console.error('No journey stage selected');
        setError('Please select your journey stage');
        return;
      }

      setError(null);

      // Parse the full name into parts
      const { firstName, middleName, lastName } = parseBabyName(fullName);

      console.log('Parsed name:', { firstName, lastName, middleName });

      // Convert lbs/oz to total ounces
      const lbs = Number.parseInt(birthWeightLbs || '0', 10);
      const oz = Number.parseInt(birthWeightOz || '0', 10);
      const birthWeightTotalOz = lbs * 16 + oz;

      // Save to localStorage as backup
      const onboardingData = {
        birthDate,
        birthWeightOz: birthWeightTotalOz > 0 ? birthWeightTotalOz : undefined,
        completedAt: new Date().toISOString(),
        dueDate,
        firstName,
        fullName,
        journeyStage,
        lastName,
        lastPeriodDate,
        middleName,
        ttcMethod,
      };
      localStorage.setItem('onboardingData', JSON.stringify(onboardingData));

      // Submit to server
      startTransition(async () => {
        try {
          console.log('Submitting onboarding data:', {
            birthDate: birthDate || undefined,
            birthWeightOz:
              birthWeightTotalOz > 0 ? birthWeightTotalOz : undefined,
            dueDate: dueDate || undefined,
            firstName: firstName || undefined,
            journeyStage,
            lastName: lastName || undefined,
            lastPeriodDate: lastPeriodDate || undefined,
            middleName: middleName || undefined,
            ttcMethod: ttcMethod || undefined,
          });

          const result = await completeOnboardingAction({
            birthDate: birthDate || undefined,
            birthWeightOz:
              birthWeightTotalOz > 0 ? birthWeightTotalOz : undefined,
            dueDate: dueDate || undefined,
            firstName: firstName || undefined,
            journeyStage,
            lastName: lastName || undefined,
            lastPeriodDate: lastPeriodDate || undefined,
            middleName: middleName || undefined,
            ttcMethod: ttcMethod || undefined,
          });

          console.log('Onboarding action result:', result);

          if (result?.serverError) {
            console.error('Server error:', result.serverError);
            setError(result.serverError);
            return;
          }

          if (result?.validationErrors) {
            console.error('Validation errors:', result.validationErrors);
            setError('Please check your input and try again.');
            return;
          }

          if (result?.data?.success && result.data.family) {
            console.log('Onboarding completed successfully');

            // Set the active organization in the session
            if (result.data.family && setActive) {
              await setActive({ organization: result.data.family.id });
            }

            // Now navigate to the app
            router.push('/app');
          } else {
            console.error('Unexpected result:', result);
            setError('Something went wrong. Please try again.');
          }
        } catch (error) {
          console.error('Failed to complete onboarding (async):', error);
          setError('Failed to save onboarding data. Please try again.');
        }
      });
    } catch (error) {
      console.error('Failed to complete onboarding (sync):', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const canProceed = () => {
    let result = false;
    if (step === 1) {
      result = journeyStage !== null;
    } else if (step === 2) {
      if (journeyStage === 'ttc') result = ttcMethod !== null;
      else if (journeyStage === 'pregnant') result = dueDate !== '';
      else if (journeyStage === 'born') result = birthDate !== '';
    } else if (step === 3) {
      result = true; // Step 3 is optional
    }

    console.log('canProceed check:', {
      birthDate,
      dueDate,
      journeyStage,
      result,
      step,
      ttcMethod,
    });

    return result;
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
              birthDate={birthDate}
              birthWeightLbs={birthWeightLbs}
              birthWeightOz={birthWeightOz}
              dueDate={dueDate}
              dueDateManuallySet={dueDateManuallySet}
              fullName={fullName}
              journeyStage={journeyStage}
              lastPeriodDate={lastPeriodDate}
              onBirthDateChange={setBirthDate}
              onBirthWeightLbsChange={setBirthWeightLbs}
              onBirthWeightOzChange={setBirthWeightOz}
              onDueDateChange={handleDueDateChange}
              onFullNameChange={setFullName}
              onLastPeriodChange={handleLastPeriodChange}
              onTTCMethodSelect={setTTCMethod}
              ttcMethod={ttcMethod}
            />
          )}

          {step === 3 && <InviteCaregiversStep />}

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
