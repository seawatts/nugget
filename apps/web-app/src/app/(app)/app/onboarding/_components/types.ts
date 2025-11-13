export type JourneyStage = 'ttc' | 'pregnant' | 'born';
export type TTCMethod = 'natural' | 'ivf' | 'other';
export type UserRole = 'primary' | 'partner';

export interface OnboardingData {
  journeyStage: JourneyStage | null;
  ttcMethod: TTCMethod | null;
  lastPeriodDate: string;
  dueDate: string;
  dueDateManuallySet: boolean;
  birthDate: string;
  babyName: string;
  userRole: UserRole | null;
}
