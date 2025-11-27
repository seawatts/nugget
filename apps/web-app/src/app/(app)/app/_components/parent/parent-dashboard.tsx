'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ParentDailyCheckInCard } from './parent-daily-checkin-card';
import { ParentLearningCarousel } from './parent-learning-carousel';
import { ParentSleepCard } from './parent-sleep-card';
import { ParentTasksCard } from './parent-tasks-card';
import { ParentTipsWidget } from './parent-tips-widget';
import { WellnessAssessmentModal } from './parent-wellness/wellness-assessment-modal';
import { ParentWellnessCard } from './parent-wellness-card';

interface ParentDashboardProps {
  userId: string;
}

const DAILY_CHECKIN_DISMISS_KEY = 'parentDailyCheckInDismissedDate';

function getTodayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function ParentDashboard({ userId }: ParentDashboardProps) {
  const [showWellnessAssessment, _setShowWellnessAssessment] = useState(false);
  const [dismissedToday, setDismissedToday] = useState(false);
  const [wellnessModalOpen, setWellnessModalOpen] = useState(false);

  const handleStartAssessment = useCallback(() => {
    setWellnessModalOpen(true);
  }, []);

  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedDate = window.localStorage.getItem(DAILY_CHECKIN_DISMISS_KEY);
    setDismissedToday(storedDate === todayKey);
  }, [todayKey]);

  const handleDismissUntilTomorrow = useCallback(() => {
    setDismissedToday(true);
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(DAILY_CHECKIN_DISMISS_KEY, todayKey);
  }, [todayKey]);

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen space-y-6">
      {/* Daily Check-In - Top Priority */}
      {!dismissedToday && (
        <div className="mb-6">
          <ParentDailyCheckInCard
            onDismissUntilTomorrow={handleDismissUntilTomorrow}
            userId={userId}
          />
        </div>
      )}

      {/* Wellness Assessment Alert - Conditional */}
      {showWellnessAssessment && (
        <div className="mb-6">
          <ParentWellnessCard
            onStartAssessment={handleStartAssessment}
            userId={userId}
          />
        </div>
      )}

      {/* Wellness Assessment Modal */}
      <WellnessAssessmentModal
        onOpenChange={setWellnessModalOpen}
        open={wellnessModalOpen}
        userId={userId}
      />

      {/* Postpartum Learning Carousel */}
      <ParentLearningCarousel />

      {/* Parent Sleep Tracking */}
      <div className="mb-6">
        <ParentSleepCard userId={userId} />
      </div>

      {/* Today's Tasks */}
      <div className="mb-6">
        <ParentTasksCard userId={userId} />
      </div>

      {/* Quick Tips Widget */}
      <div className="mb-6">
        <ParentTipsWidget userId={userId} />
      </div>
    </main>
  );
}
