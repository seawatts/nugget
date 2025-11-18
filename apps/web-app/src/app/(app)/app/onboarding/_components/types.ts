export type JourneyStage = 'ttc' | 'pregnant' | 'born';
export type TTCMethod = 'natural' | 'ivf' | 'other';

export interface OnboardingData {
  journeyStage: JourneyStage | null;
  ttcMethod: TTCMethod | null;
  lastPeriodDate: string;
  dueDate: string;
  dueDateManuallySet: boolean;
  birthDate: string;
  fullName: string;
}

export interface OnboardingLocalStorageState {
  step: number;
  journeyStage: JourneyStage | null;
  ttcMethod: TTCMethod | null;
  lastPeriodDate: string;
  dueDate: string;
  dueDateManuallySet: boolean;
  birthDate: string;
  fullName: string;
  birthWeightLbs: string;
  birthWeightOz: string;
  gender: string;
  selectedFamilyId: string | null;
}
