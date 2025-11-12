'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { cn } from '@nugget/ui/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Calculator,
  Calendar,
  CheckCircle2,
  Heart,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type JourneyStage = 'ttc' | 'pregnant' | 'born';
type TTCMethod = 'natural' | 'ivf' | 'other';
type UserRole = 'primary' | 'partner';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [ttcMethod, setTTCMethod] = useState<TTCMethod | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateManuallySet, setDueDateManuallySet] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [babyName, setBabyName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const calculateDueDate = (lmpDate: string) => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    const dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000); // Add 280 days
    return dueDate.toISOString().split('T')[0];
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

    router.push('/onboarding/setup');
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
      <div className="w-full bg-muted h-1">
        <div
          className="bg-primary h-1 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Step 1: Journey Stage */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-balance">
                  Welcome to Your Parenting Journey
                </h1>
                <p className="text-muted-foreground">
                  Let's personalize your experience. Where are you in your
                  journey?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  className={cn(
                    'w-full p-6 rounded-3xl border-2 transition-all text-left',
                    journeyStage === 'ttc'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => setJourneyStage('ttc')}
                  type="button"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Trying to Conceive
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Track your cycle, ovulation, and conception journey
                      </p>
                    </div>
                    {journeyStage === 'ttc' && (
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  className={cn(
                    'w-full p-6 rounded-3xl border-2 transition-all text-left',
                    journeyStage === 'pregnant'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => setJourneyStage('pregnant')}
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
                    {journeyStage === 'pregnant' && (
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  className={cn(
                    'w-full p-6 rounded-3xl border-2 transition-all text-left',
                    journeyStage === 'born'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => setJourneyStage('born')}
                  type="button"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <Baby className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Baby is Here</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Track feeding, sleep, diapers, and developmental
                        milestones
                      </p>
                    </div>
                    {journeyStage === 'born' && (
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Stage-Specific Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {journeyStage === 'ttc' && (
                <div className="space-y-3">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-balance">
                      Your Conception Journey
                    </h1>
                    <p className="text-muted-foreground">
                      How are you trying to conceive?
                    </p>
                  </div>

                  <button
                    className={cn(
                      'w-full p-5 rounded-2xl border-2 transition-all text-left',
                      ttcMethod === 'natural'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                    onClick={() => setTTCMethod('natural')}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Natural Conception</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tracking cycles and ovulation
                        </p>
                      </div>
                      {ttcMethod === 'natural' && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>

                  <button
                    className={cn(
                      'w-full p-5 rounded-2xl border-2 transition-all text-left',
                      ttcMethod === 'ivf'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                    onClick={() => setTTCMethod('ivf')}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          IVF / Fertility Treatment
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Assisted reproductive technology
                        </p>
                      </div>
                      {ttcMethod === 'ivf' && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>

                  <button
                    className={cn(
                      'w-full p-5 rounded-2xl border-2 transition-all text-left',
                      ttcMethod === 'other'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                    onClick={() => setTTCMethod('other')}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Other Method</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Adoption, surrogacy, or other
                        </p>
                      </div>
                      {ttcMethod === 'other' && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                </div>
              )}

              {journeyStage === 'pregnant' && (
                <div className="p-6 bg-card rounded-3xl border border-border space-y-6">
                  <div className="space-y-2">
                    <Label
                      className="flex items-center gap-2"
                      htmlFor="lastPeriod"
                    >
                      <Calculator className="h-4 w-4" />
                      First Day of Last Period
                    </Label>
                    <Input
                      className="text-base"
                      id="lastPeriod"
                      onChange={(e) => handleLastPeriodChange(e.target.value)}
                      type="date"
                      value={lastPeriodDate}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll automatically calculate your due date (40 weeks from
                      this date)
                    </p>
                  </div>

                  {lastPeriodDate && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      className="flex items-center gap-2"
                      htmlFor="dueDate"
                    >
                      Expected Due Date
                      {!dueDateManuallySet && dueDate && (
                        <span className="text-xs text-primary font-normal">
                          (Auto-calculated)
                        </span>
                      )}
                    </Label>
                    <Input
                      className="text-base"
                      id="dueDate"
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      type="date"
                      value={dueDate}
                    />
                    <p className="text-xs text-muted-foreground">
                      {dueDateManuallySet
                        ? 'You can adjust this date if your doctor provided a different due date'
                        : 'Enter your due date directly if you already know it'}
                    </p>
                  </div>
                </div>
              )}

              {journeyStage === 'born' && (
                <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="babyName">Baby's Name (optional)</Label>
                    <Input
                      className="text-base"
                      id="babyName"
                      onChange={(e) => setBabyName(e.target.value)}
                      placeholder="Enter baby's name"
                      type="text"
                      value={babyName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      className="text-base"
                      id="birthDate"
                      onChange={(e) => setBirthDate(e.target.value)}
                      type="date"
                      value={birthDate}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll track age-appropriate milestones and provide
                      personalized tips
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: User Role */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-balance">
                  One More Thing
                </h1>
                <p className="text-muted-foreground">
                  What's your role in this journey?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  className={cn(
                    'w-full p-6 rounded-3xl border-2 transition-all text-left',
                    userRole === 'primary'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => setUserRole('primary')}
                  type="button"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <Baby className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Primary Caregiver
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mom, birthing parent, or primary caregiver
                      </p>
                    </div>
                    {userRole === 'primary' && (
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>

                <button
                  className={cn(
                    'w-full p-6 rounded-3xl border-2 transition-all text-left',
                    userRole === 'partner'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                  onClick={() => setUserRole('partner')}
                  type="button"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Partner / Support Person
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dad, partner, or support person helping with care
                      </p>
                    </div>
                    {userRole === 'partner' && (
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button
                className="flex-1"
                onClick={() => setStep(step - 1)}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                className="flex-1"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={!canProceed()}
                onClick={handleComplete}
              >
                Get Started
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map((i) => (
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-muted',
                )}
                key={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
