'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { parseBabyName } from '@nugget/utils';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { SignOutButton } from '~/components/sign-out-button';
import {
  completeOnboardingAction,
  completeOnboardingForExistingFamilyAction,
  createFamilyEarlyAction,
  upsertUserAction,
} from '../actions';
import {
  CREATE_NEW_FAMILY_ID,
  FamilySelectionStep,
} from './family-selection-step';
import { InviteCaregiversStep } from './invite-caregivers-step';
import { JourneyStageStep } from './journey-stage-step';
import { NavigationButtons } from './navigation-buttons';
import { StageDetailsStep } from './stage-details-step';
import { StepIndicator } from './step-indicator';
import type {
  JourneyStage,
  OnboardingLocalStorageState,
  TTCMethod,
} from './types';

const TOTAL_STEPS = 4; // Updated to include family selection step
const ONBOARDING_STORAGE_KEY = 'onboarding_wizard_state';

export function OnboardingWizard() {
  const router = useRouter();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);
  const [step, setStep] = useState(0);
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [ttcMethod, setTTCMethod] = useState<TTCMethod | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateManuallySet, setDueDateManuallySet] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthWeightLbs, setBirthWeightLbs] = useState('');
  const [birthWeightOz, setBirthWeightOz] = useState('');
  const [gender, setGender] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // Determine if user has any families
  const familyCount = userMemberships?.data?.length ?? 0;
  const hasFamilies = familyCount > 0;

  // Load state from localStorage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as OnboardingLocalStorageState;
          setStep(parsed.step);
          setJourneyStage(parsed.journeyStage);
          setTTCMethod(parsed.ttcMethod);
          setLastPeriodDate(parsed.lastPeriodDate);
          setDueDate(parsed.dueDate);
          setDueDateManuallySet(parsed.dueDateManuallySet);
          setBirthDate(parsed.birthDate);
          setFullName(parsed.fullName);
          setBirthWeightLbs(parsed.birthWeightLbs);
          setBirthWeightOz(parsed.birthWeightOz);
          setGender(parsed.gender);
          setSelectedFamilyId(parsed.selectedFamilyId);
        } else {
          // No saved state, determine starting step based on family count
          if (hasFamilies) {
            setStep(0); // Start with family selection
          } else {
            setStep(1); // Start with journey stage
          }
        }
      } catch (error) {
        console.error(
          'Failed to load onboarding state from localStorage:',
          error,
        );
        // On error, use default based on family count
        if (hasFamilies) {
          setStep(0);
        } else {
          setStep(1);
        }
      }
      setIsInitialized(true);
    };

    // Only load once userMemberships data is available
    if (userMemberships?.data) {
      loadFromLocalStorage();
    }
  }, [hasFamilies, userMemberships?.data]);

  // Save state to localStorage whenever relevant state changes
  useEffect(() => {
    if (!isInitialized) return;

    const saveTimeout = setTimeout(() => {
      try {
        const state: OnboardingLocalStorageState = {
          birthDate,
          birthWeightLbs,
          birthWeightOz,
          dueDate,
          dueDateManuallySet,
          fullName,
          gender,
          journeyStage,
          lastPeriodDate,
          selectedFamilyId,
          step,
          ttcMethod,
        };
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error(
          'Failed to save onboarding state to localStorage:',
          error,
        );
      }
    }, 300); // Debounce to avoid excessive writes

    return () => clearTimeout(saveTimeout);
  }, [
    isInitialized,
    step,
    journeyStage,
    ttcMethod,
    lastPeriodDate,
    dueDate,
    dueDateManuallySet,
    birthDate,
    fullName,
    birthWeightLbs,
    birthWeightOz,
    gender,
    selectedFamilyId,
  ]);

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

  // Handle URL parameters for reset/force-complete
  useEffect(() => {
    if (!isInitialized || !userMemberships?.data) return;

    const searchParams = new URLSearchParams(window.location.search);
    const resetParam = searchParams.get('reset');
    const forceCompleteParam = searchParams.get('force_complete');

    // Reset onboarding state
    if (resetParam === 'true') {
      console.log('Resetting onboarding state via URL parameter');
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setStep(hasFamilies ? 0 : 1);
      setSelectedFamilyId(null);
      // Clear URL parameter
      window.history.replaceState({}, '', '/app/onboarding');
      return;
    }

    // Force complete onboarding for first family
    if (forceCompleteParam === 'true' && familyCount > 0 && !isAutoCompleting) {
      console.log('Force completing onboarding via URL parameter');
      setIsAutoCompleting(true);

      const completeForFirstFamily = async () => {
        const family = userMemberships.data?.[0];
        if (!family) {
          setIsAutoCompleting(false);
          return;
        }

        try {
          // Switch to the family in Clerk
          if (setActive) {
            await setActive({ organization: family.organization.id });
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          // Mark onboarding as complete
          const result = await completeOnboardingForExistingFamilyAction({
            clerkOrgId: family.organization.id,
          });

          if (result?.data?.success) {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);
            localStorage.setItem(
              'onboardingData',
              JSON.stringify({
                clerkOrgId: family.organization.id,
                completedAt: new Date().toISOString(),
              }),
            );
            window.location.href = '/app';
          } else {
            console.error('Failed to force complete:', result?.serverError);
            setIsAutoCompleting(false);
            window.history.replaceState({}, '', '/app/onboarding');
          }
        } catch (error) {
          console.error('Error force completing:', error);
          setIsAutoCompleting(false);
          window.history.replaceState({}, '', '/app/onboarding');
        }
      };

      void completeForFirstFamily();
    }
  }, [
    isInitialized,
    userMemberships,
    hasFamilies,
    familyCount,
    isAutoCompleting,
    setActive,
  ]);

  // Auto-complete onboarding for users with exactly 1 family
  useEffect(() => {
    // Only auto-complete if:
    // - User is initialized
    // - User has exactly 1 family
    // - User is at step 0 (family selection)
    // - Not already auto-completing
    if (!isInitialized || familyCount !== 1 || step !== 0 || isAutoCompleting) {
      return;
    }

    const autoCompleteOnboarding = async () => {
      setIsAutoCompleting(true);
      const family = userMemberships?.data?.[0];

      if (!family) {
        setIsAutoCompleting(false);
        return;
      }

      try {
        console.log(
          'Auto-completing onboarding for single family:',
          family.organization.name,
        );

        // Switch to the family in Clerk
        if (setActive) {
          try {
            await setActive({ organization: family.organization.id });
            // Give Clerk time to update
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (orgError) {
            console.error('Failed to switch organization:', orgError);
            setIsAutoCompleting(false);
            return;
          }
        }

        // Mark onboarding as complete
        const result = await completeOnboardingForExistingFamilyAction({
          clerkOrgId: family.organization.id,
        });

        if (result?.serverError || !result?.data?.success) {
          console.error(
            'Failed to auto-complete onboarding:',
            result?.serverError,
          );
          setIsAutoCompleting(false);
          return;
        }

        // Clear localStorage and set completion flag
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        localStorage.setItem(
          'onboardingData',
          JSON.stringify({
            clerkOrgId: family.organization.id,
            completedAt: new Date().toISOString(),
          }),
        );

        // Redirect to app
        window.location.href = '/app';
      } catch (error) {
        console.error('Error during auto-complete:', error);
        setIsAutoCompleting(false);
      }
    };

    // Add a small delay to avoid race conditions
    const timeoutId = setTimeout(() => {
      void autoCompleteOnboarding();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    isInitialized,
    familyCount,
    step,
    isAutoCompleting,
    userMemberships,
    setActive,
  ]);

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

  const handleFamilySelect = (familyId: string) => {
    setSelectedFamilyId(familyId);
  };

  const handleFamilySelectionComplete = async () => {
    if (!selectedFamilyId) {
      setError('Please select a family');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        // FIRST: Switch to the selected family in Clerk
        if (setActive) {
          try {
            await setActive({ organization: selectedFamilyId });
            console.log(
              'Successfully switched to organization:',
              selectedFamilyId,
            );
            // Give Clerk time to update the session in cookies/storage
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (orgError) {
            console.error('Failed to switch organization:', orgError);
            setError(
              'Failed to switch to the selected family. Please try again.',
            );
            return;
          }
        }

        // THEN: Mark onboarding as complete for this family
        const result = await completeOnboardingForExistingFamilyAction({
          clerkOrgId: selectedFamilyId,
        });

        if (result?.serverError) {
          console.error('Server error:', result.serverError);
          setError(result.serverError);
          return;
        }

        if (!result?.data?.success) {
          setError('Failed to complete onboarding. Please try again.');
          return;
        }

        // Clear localStorage after successful completion
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        localStorage.setItem(
          'onboardingData',
          JSON.stringify({
            clerkOrgId: selectedFamilyId,
            completedAt: new Date().toISOString(),
          }),
        );

        // Force a full page reload to ensure Clerk session is fully updated
        // This ensures middleware and all auth checks use the new organization context
        window.location.href = '/app';
      } catch (error) {
        console.error('Failed to complete family selection:', error);
        setError('An error occurred. Please try again.');
      }
    });
  };

  const handleComplete = () => {
    try {
      if (!journeyStage) {
        console.error('No journey stage selected');
        setError('Please select your journey stage');
        return;
      }

      setError(null);

      // Parse the full name into parts
      const { firstName, middleName, lastName } = parseBabyName(fullName);

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
        gender,
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
          const result = await completeOnboardingAction({
            birthDate: birthDate || undefined,
            birthWeightOz:
              birthWeightTotalOz > 0 ? birthWeightTotalOz : undefined,
            dueDate: dueDate || undefined,
            firstName: firstName || undefined,
            gender: gender || undefined,
            journeyStage,
            lastName: lastName || undefined,
            lastPeriodDate: lastPeriodDate || undefined,
            middleName: middleName || undefined,
            ttcMethod: ttcMethod || undefined,
          });

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
            // Set the active organization in the session
            if (result.data.family && setActive) {
              await setActive({ organization: result.data.family.clerkOrgId });
            }

            // Clear localStorage after successful completion
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);

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

  const handleNext = async () => {
    // If moving from step 0, handle family selection
    if (step === 0) {
      // If creating new family, proceed to journey stage
      if (selectedFamilyId === CREATE_NEW_FAMILY_ID) {
        setStep(1);
        return;
      }
      // Otherwise, complete onboarding for existing family
      await handleFamilySelectionComplete();
      return;
    }

    // If moving from step 2 to step 3, create the family and baby first
    if (step === 2) {
      setError(null);
      startTransition(async () => {
        try {
          // Parse the full name into parts
          const { firstName, middleName, lastName } = parseBabyName(fullName);

          // Convert lbs/oz to total ounces
          const lbs = Number.parseInt(birthWeightLbs || '0', 10);
          const oz = Number.parseInt(birthWeightOz || '0', 10);
          const birthWeightTotalOz = lbs * 16 + oz;

          const result = await createFamilyEarlyAction({
            birthDate: birthDate || undefined,
            birthWeightOz:
              birthWeightTotalOz > 0 ? birthWeightTotalOz : undefined,
            dueDate: dueDate || undefined,
            firstName: firstName || undefined,
            gender: gender || undefined,
            journeyStage: journeyStage ?? 'born',
            lastName: lastName || undefined,
            lastPeriodDate: lastPeriodDate || undefined,
            middleName: middleName || undefined,
            ttcMethod: ttcMethod || undefined,
          });

          if (result?.serverError) {
            console.error('Failed to create family:', result.serverError);
            setError(
              result.serverError ||
                'Failed to set up family. Please try again.',
            );
            return;
          }

          if (result?.data?.success && result.data.family) {
            // Set the active organization in Clerk session
            if (setActive) {
              try {
                await setActive({
                  organization: result.data.family.clerkOrgId,
                });

                // Give a small delay to ensure session is updated
                await new Promise((resolve) => setTimeout(resolve, 500));
              } catch (error) {
                console.error('Failed to set active organization:', error);
                // Continue anyway, it might still work
              }
            }

            // Move to step 3
            setStep(3);
          } else {
            console.error('Unexpected result from createFamilyEarlyAction');
            setError('Failed to set up family. Please try again.');
          }
        } catch (error) {
          console.error('Error creating family:', error);
          setError('Failed to set up family. Please try again.');
        }
      });
    } else {
      // For other steps, just increment
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    let result = false;
    if (step === 0) {
      result = selectedFamilyId !== null;
    } else if (step === 1) {
      result = journeyStage !== null;
    } else if (step === 2) {
      if (journeyStage === 'ttc') result = ttcMethod !== null;
      else if (journeyStage === 'pregnant') result = dueDate !== '';
      else if (journeyStage === 'born') result = birthDate !== '';
    } else if (step === 3) {
      result = true; // Step 3 is optional
    }

    return result;
  };

  // Show loading state while initializing or auto-completing
  if (!isInitialized || isAutoCompleting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {isAutoCompleting ? 'Setting up your family...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate display steps (exclude step 0 from count if user has no families)
  const effectiveTotalSteps = hasFamilies ? TOTAL_STEPS : TOTAL_STEPS - 1;
  const displayStep = hasFamilies ? step : Math.max(step - 1, 1);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Sign Out Button */}
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton>
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </div>
        </SignOutButton>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {step === 0 && hasFamilies && (
            <FamilySelectionStep
              families={userMemberships?.data ?? []}
              onSelect={handleFamilySelect}
              selectedFamilyId={selectedFamilyId}
            />
          )}

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
              gender={gender}
              journeyStage={journeyStage}
              lastPeriodDate={lastPeriodDate}
              onBirthDateChange={setBirthDate}
              onBirthWeightLbsChange={setBirthWeightLbs}
              onBirthWeightOzChange={setBirthWeightOz}
              onDueDateChange={handleDueDateChange}
              onFullNameChange={setFullName}
              onGenderChange={setGender}
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
            currentStep={displayStep}
            isPending={isPending}
            onBack={() => {
              if (step > 0) {
                // Don't go back to step 0 if user has no families
                if (!hasFamilies && step === 1) {
                  return;
                }
                setStep(step - 1);
              }
            }}
            onComplete={handleComplete}
            onNext={handleNext}
            totalSteps={effectiveTotalSteps}
          />

          <StepIndicator
            currentStep={displayStep}
            totalSteps={effectiveTotalSteps}
          />
        </div>
      </div>
    </div>
  );
}
