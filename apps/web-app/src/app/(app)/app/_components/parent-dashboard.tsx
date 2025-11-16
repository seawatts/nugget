'use client';

import { useCallback, useState } from 'react';
import { ActivityTimeline } from '~/app/(app)/app/_components/activity-timeline';
import { ParentDailyCheckInCard } from './parent-daily-checkin-card';
import { ParentLearningCarousel } from './parent-learning-carousel';
import { ParentSleepCard } from './parent-sleep-card';
import { ParentTasksCard } from './parent-tasks-card';
import { ParentTipsWidget } from './parent-tips-widget';
import { ParentWellnessCard } from './parent-wellness-card';

interface ParentDashboardProps {
  userId: string;
}

export function ParentDashboard({ userId }: ParentDashboardProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showWellnessAssessment, _setShowWellnessAssessment] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false);

  const handleSleepLogged = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCheckInComplete = useCallback(() => {
    setCheckInCompleted(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen space-y-6">
      {/* Daily Check-In - Top Priority */}
      {!checkInCompleted && (
        <div className="mb-6">
          <ParentDailyCheckInCard
            onCheckInComplete={handleCheckInComplete}
            userId={userId}
          />
        </div>
      )}

      {/* Wellness Assessment Alert - Conditional */}
      {showWellnessAssessment && (
        <div className="mb-6">
          <ParentWellnessCard
            onStartAssessment={() => {
              // TODO: Open wellness assessment in a modal/drawer
              console.log('Start wellness assessment');
            }}
            userId={userId}
          />
        </div>
      )}

      {/* Postpartum Learning Carousel */}
      <ParentLearningCarousel />

      {/* Parent Sleep Tracking */}
      <div className="mb-6">
        <ParentSleepCard onSleepLogged={handleSleepLogged} userId={userId} />
      </div>

      {/* Today's Tasks */}
      <div className="mb-6">
        <ParentTasksCard userId={userId} />
      </div>

      {/* Quick Tips Widget */}
      <div className="mb-6">
        <ParentTipsWidget userId={userId} />
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline
        optimisticActivities={[]}
        refreshTrigger={refreshTrigger}
      />
    </main>
  );
}
