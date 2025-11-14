'use client';

import { getFullBabyName } from '@nugget/utils';
import { AlertCircle, Baby, Calendar, CheckCircle2, Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OnboardingData {
  stage: 'ttc' | 'pregnant' | 'baby';
  ttcMethod?: string;
  dueDate?: string;
  lastPeriodDate?: string;
  birthDate?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  // Legacy field for backward compatibility
  babyName?: string;
  userRole?: string;
}

export function SweetSpotBanner() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null,
  );
  const [daysUntilDue, setDaysUntilDue] = useState<number | null>(null);
  const [babyAgeWeeks, setBabyAgeWeeks] = useState<number | null>(null);
  const [pregnancyWeek, setPregnancyWeek] = useState<number | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('onboardingData');
    if (data) {
      const parsed = JSON.parse(data);
      setOnboardingData(parsed);

      if (parsed.stage === 'pregnant' && parsed.dueDate) {
        const due = new Date(parsed.dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilDue(diffDays);

        // Calculate pregnancy week
        if (parsed.lastPeriodDate) {
          const lmp = new Date(parsed.lastPeriodDate);
          const weeksDiff = Math.floor(
            (today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7),
          );
          setPregnancyWeek(weeksDiff);
        }
      }

      if (parsed.stage === 'baby' && parsed.birthDate) {
        const birth = new Date(parsed.birthDate);
        const today = new Date();
        const diffTime = today.getTime() - birth.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        setBabyAgeWeeks(diffWeeks);
      }
    }
  }, []);

  if (!onboardingData) {
    return (
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-[oklch(0.78_0.14_60)] px-6 py-3">
          <span className="font-bold text-[oklch(0.18_0.02_250)]">
            SweetSpot®
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Welcome to your parenting journey
          </p>
        </div>
      </div>
    );
  }

  if (onboardingData.stage === 'ttc') {
    return (
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-accent px-6 py-3">
            <Heart className="h-5 w-5 text-accent-foreground" />
            <span className="font-bold text-accent-foreground">
              Trying to Conceive
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <h3 className="mb-2 font-semibold text-foreground">
            Track Your Fertility
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Log your cycle, track ovulation, and optimize your chances of
            conception
          </p>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            href="/ttc"
          >
            Go to TTC Tracker
          </Link>
        </div>
      </div>
    );
  }

  if (onboardingData.stage === 'pregnant') {
    const isCloseToDelivery = daysUntilDue !== null && daysUntilDue <= 30;
    const isVeryClose = daysUntilDue !== null && daysUntilDue <= 7;

    return (
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-primary px-6 py-3">
            <Baby className="h-5 w-5 text-primary-foreground" />
            <span className="font-bold text-primary-foreground">
              {pregnancyWeek ? `Week ${pregnancyWeek}` : 'Pregnant'}
            </span>
          </div>
          {daysUntilDue !== null && (
            <div className="flex items-center gap-2 rounded-full bg-card px-4 py-3">
              <Calendar className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-foreground">
                {daysUntilDue > 0
                  ? `${daysUntilDue} days to go`
                  : 'Due any day!'}
              </span>
            </div>
          )}
        </div>

        {isVeryClose && (
          <div className="rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 p-4 border-2 border-secondary">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="mb-2 font-bold text-foreground">
                  Final Preparations!
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Your due date is just {daysUntilDue}{' '}
                  {daysUntilDue === 1 ? 'day' : 'days'} away. Make sure
                  everything is ready!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                    href="/hospital-prep"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Hospital Bag Checklist
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    href="/hospital-prep?tab=birth-plan"
                  >
                    Review Birth Plan
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    href="/settings?tab=contacts"
                  >
                    Emergency Contacts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCloseToDelivery && !isVeryClose && (
          <div className="rounded-2xl bg-card p-4">
            <h3 className="mb-2 font-semibold text-foreground">
              Getting Close!
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              With {daysUntilDue} days until your due date, now is the time to
              finalize your preparations
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                href="/hospital-prep"
              >
                Hospital Prep
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href="/nursery-prep"
              >
                Nursery Setup
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href="/learning"
              >
                Newborn Care
              </Link>
            </div>
          </div>
        )}

        {!isCloseToDelivery && (
          <div className="rounded-2xl bg-card p-4">
            <h3 className="mb-2 font-semibold text-foreground">
              Your Pregnancy Journey
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Track your pregnancy week by week and prepare for your baby's
              arrival
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                href="/pregnancy"
              >
                Pregnancy Tracker
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href="/hospital-prep"
              >
                Hospital Prep
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href="/nursery-prep"
              >
                Nursery Setup
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (onboardingData.stage === 'baby') {
    // Support both new structured names and legacy babyName field
    const babyName = onboardingData.firstName
      ? getFullBabyName({
          firstName: onboardingData.firstName,
          lastName: onboardingData.lastName,
          middleName: onboardingData.middleName,
        })
      : onboardingData.babyName || 'Baby';
    const isNewborn = babyAgeWeeks !== null && babyAgeWeeks < 4;

    return (
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[oklch(0.78_0.14_60)] px-6 py-3">
            <span className="font-bold text-[oklch(0.18_0.02_250)]">
              SweetSpot®
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-card px-4 py-3">
            <Baby className="h-5 w-5 text-secondary" />
            <span className="text-sm font-medium text-foreground">
              {babyAgeWeeks !== null ? `${babyAgeWeeks} weeks old` : babyName}
            </span>
          </div>
        </div>

        {isNewborn && (
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
            <h3 className="mb-2 font-semibold text-foreground">
              Welcome to Parenthood!
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              The first few weeks are all about bonding, feeding, and rest.
              Track {babyName}'s patterns to understand their needs.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                href="/learning"
              >
                Newborn Care Guide
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href="/postpartum"
              >
                Mom's Recovery
              </Link>
            </div>
          </div>
        )}

        {!isNewborn && (
          <div className="rounded-2xl bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Track {babyName}'s daily activities and watch for developmental
              milestones
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
