'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { format } from 'date-fns';
import { CalendarCheck, Info, Stethoscope } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { InfoCard } from '../../shared/info-card';
import { PredictiveCardSkeleton } from '../shared/components/predictive-cards';
import { getDoctorVisitLearningContent } from './learning-content';
import {
  formatNextVisitMessage,
  getVisitProgress,
  predictNextDoctorVisit,
} from './prediction';

interface PredictiveDoctorVisitCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveDoctorVisitCard({
  onCardClick,
  onActivityLogged: _onActivityLogged,
}: PredictiveDoctorVisitCardProps) {
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId;

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingDoctorVisit.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        prediction: predictNextDoctorVisit(
          queryData.recentActivities,
          queryData.babyBirthDate,
        ),
      }
    : null;

  const error = queryError?.message || null;

  const prediction = data?.prediction;
  const nextVisit = prediction?.nextVisit;
  const isOverdue = prediction?.isOverdue || false;

  // Format the main display message
  const displayMessage = prediction
    ? formatNextVisitMessage(prediction)
    : 'Loading...';

  // Get progress info
  const progress = prediction ? getVisitProgress(prediction) : null;

  // Get learning content based on next visit or baby age
  const learningContent =
    data && data.babyAgeDays !== null
      ? getDoctorVisitLearningContent(
          nextVisit?.ageDays || data.babyAgeDays || 0,
        )
      : null;

  // Show loading skeleton
  if (isLoading && !data) {
    return <PredictiveCardSkeleton activityType="doctor_visit" />;
  }

  // Show error state
  if (error && !data) {
    return (
      <Card className="p-6 bg-card border-border col-span-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-full bg-activity-doctor-visit/10 flex items-center justify-center">
            <Stethoscope className="size-5 text-activity-doctor-visit" />
          </div>
          <div>
            <h3 className="font-semibold">Doctor Visit</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load visit schedule
            </p>
          </div>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  // Don't show card if baby is older than 1 year and all visits complete
  if (
    data?.babyAgeDays &&
    data.babyAgeDays > 365 &&
    !nextVisit &&
    progress?.completed === progress?.total
  ) {
    return null;
  }

  return (
    <>
      <Card
        className={cn(
          'p-6 bg-card border-border cursor-pointer transition-all hover:shadow-md col-span-2',
          isOverdue && 'border-l-4 border-l-destructive',
          isFetching && 'opacity-70',
        )}
        onClick={onCardClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-activity-doctor-visit/10 flex items-center justify-center">
              <Stethoscope className="size-5 text-activity-doctor-visit" />
            </div>
            <div>
              <h3 className="font-semibold">Doctor Visit</h3>
              {progress && (
                <p className="text-xs text-muted-foreground">
                  {progress.completed} of {progress.total} visits completed
                </p>
              )}
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoDrawer(true);
            }}
            type="button"
          >
            <Info className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Next Visit Message */}
          <div>
            <p
              className={cn(
                'text-lg font-medium',
                isOverdue && 'text-destructive',
              )}
            >
              {displayMessage}
            </p>
            {nextVisit && (
              <p className="text-sm text-muted-foreground mt-1">
                {format(nextVisit.dueDate, 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Last Visit Info */}
          {prediction?.lastVisitDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck className="size-4" />
              <span>
                Last visit: {format(prediction.lastVisitDate, 'MMM d')}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          {progress && progress.total > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-activity-doctor-visit transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Common Vaccinations for Next Visit */}
          {nextVisit && nextVisit.commonVaccinations.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Expected Vaccinations:
              </p>
              <p className="text-xs text-muted-foreground">
                {nextVisit.commonVaccinations.join(', ')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>About Well-Baby Checkups</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 pt-0 space-y-6 max-h-[70vh] overflow-y-auto">
            {learningContent && (
              <InfoCard
                babyAgeDays={data?.babyAgeDays ?? null}
                bgColor="bg-activity-doctor-visit/5"
                borderColor="border-activity-doctor-visit/20"
                color="bg-activity-doctor-visit/10 text-activity-doctor-visit"
                icon={Stethoscope}
                title={learningContent.title}
              >
                <ul className="text-sm text-foreground/80 space-y-1.5">
                  {learningContent.tips.map((tip) => (
                    <li className="flex gap-2" key={tip}>
                      <span className="text-muted-foreground">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </InfoCard>
            )}

            {/* Schedule Overview */}
            {prediction && prediction.allVisits.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">First Year Checkup Schedule</h3>
                <div className="space-y-2">
                  {prediction.allVisits.map((visit) => (
                    <div
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      key={visit.label}
                    >
                      <div>
                        <p className="text-sm font-medium">{visit.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(visit.dueDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                      {visit.isPast && (
                        <CalendarCheck className="size-4 text-activity-doctor-visit" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
