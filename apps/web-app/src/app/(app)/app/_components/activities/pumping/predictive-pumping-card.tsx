'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { BarChart3, Droplets, Info, Zap } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { LearningSection } from '../../learning/learning-section';
import { InfoCard } from '../../shared/info-card';
import {
  PredictiveCardSkeleton,
  PredictiveOverdueActions,
  usePredictiveActions,
} from '../shared/components/predictive-cards';
import { QuickLogInfoSection } from '../shared/components/quick-log-info-section';
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { skipPumpingAction } from './actions';
import { PumpingStatsDrawer } from './components';
import { getPumpingLearningContent } from './learning-content';
import { predictNextPumping } from './prediction';
import { calculatePumpingTrendData } from './pumping-goals';
import { getPumpingGuidanceByAge } from './pumping-intervals';

interface PredictivePumpingCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictivePumpingCard({
  onCardClick,
  onActivityLogged: _onActivityLogged,
}: PredictivePumpingCardProps) {
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId;

  const router = useRouter();

  // Fetch user preferences for volume display and time format
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');
  const timeFormat = user?.timeFormat || '12h';

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingPumping.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Query last 7 days of activities for trend chart
  const { data: allActivities } = api.activities.list.useQuery(
    {
      babyId: babyId ?? '',
      limit: 100,
    },
    { enabled: Boolean(babyId) },
  );

  // Filter to last 7 days client-side
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
  const last7DaysActivities = allActivities?.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= sevenDaysAgo;
  });

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        guidanceMessage:
          queryData.babyAgeDays !== null
            ? getPumpingGuidanceByAge(queryData.babyAgeDays)
            : 'Pump regularly to establish and maintain milk supply.',
        prediction: predictNextPumping(
          queryData.recentActivities,
          queryData.babyBirthDate,
        ),
      }
    : null;

  const error = queryError?.message || null;

  // Build smart defaults for quick log
  const defaultQuickLogData: Record<string, unknown> = {};
  if (
    (user?.quickLogPumpingUseLastVolume ?? true) &&
    data?.prediction.suggestedVolume
  ) {
    defaultQuickLogData.amountMl = data.prediction.suggestedVolume;
  }
  if (
    (user?.quickLogPumpingUseTypicalDuration ?? true) &&
    data?.prediction.suggestedDuration
  ) {
    defaultQuickLogData.duration = data.prediction.suggestedDuration;
  }

  // Use shared actions hook with pumping defaults
  const { handleQuickLog, handleSkip, isCreating, isSkipping } =
    usePredictiveActions({
      activityType: 'pumping',
      defaultQuickLogData,
      onActivityLogged: _onActivityLogged,
      skipAction: skipPumpingAction,
    });

  if (error) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 bg-destructive/10 col-span-2',
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (isLoading && !data) {
    return <PredictiveCardSkeleton activityType="pumping" />;
  }

  if (!data) return null;

  const { prediction, babyAgeDays } = data;

  // Check if we should suppress overdue state due to recent skip
  const isRecentlySkipped = prediction.recentSkipTime
    ? Date.now() - new Date(prediction.recentSkipTime).getTime() <
      prediction.intervalHours * 60 * 60 * 1000
    : false;
  const effectiveIsOverdue = prediction.isOverdue && !isRecentlySkipped;

  // Calculate display time - if recently skipped, show next predicted time from skip moment
  const displayNextTime =
    isRecentlySkipped && prediction.recentSkipTime
      ? new Date(
          new Date(prediction.recentSkipTime).getTime() +
            prediction.intervalHours * 60 * 60 * 1000,
        )
      : prediction.nextPumpingTime;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getPumpingLearningContent(babyAgeDays) : null;

  // Build quick log settings for info drawer
  const quickLogSettings = {
    activeSettings: [
      ...((user?.quickLogPumpingUseLastVolume ?? true) ? ['Last volume'] : []),
      ...((user?.quickLogPumpingUseTypicalDuration ?? true)
        ? ['Typical duration']
        : []),
    ],
    enabled: user?.quickLogEnabled ?? true,
  };

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
  const exactTime = formatTimeWithPreference(displayNextTime, timeFormat);

  // Format overdue time
  const formatOverdueTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0
        ? `${hours}h ${mins}m`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatsDrawer(true);
  };

  // Format amount for display based on user preference
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    return formatVolumeDisplay(ml, userUnitPref, true);
  };

  // Calculate stats for drawer
  const pumpingTrendData = last7DaysActivities
    ? calculatePumpingTrendData(last7DaysActivities)
    : [];

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-activity-pumping text-activity-pumping-foreground',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Droplets className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Pumping</h2>
              <div className="flex items-center gap-1">
                {isFetching && !isLoading && (
                  <Icons.Spinner
                    className="animate-spin opacity-70"
                    size="xs"
                  />
                )}
                {(user?.quickLogEnabled ?? true) && (
                  <button
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating}
                    onClick={handleQuickLog}
                    title="Quick log with smart defaults"
                    type="button"
                  >
                    {isCreating ? (
                      <Icons.Spinner className="animate-spin opacity-70 size-5" />
                    ) : (
                      <Zap className="size-5 opacity-70" />
                    )}
                  </button>
                )}
                <button
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  onClick={handleStatsClick}
                  title="View statistics"
                  type="button"
                >
                  <BarChart3 className="size-5 opacity-70" />
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-1.5"
                  onClick={handleInfoClick}
                  type="button"
                >
                  <Info className="size-5 opacity-70" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                // Show skeleton only on time text during initial load
                <>
                  <Skeleton className="h-6 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </>
              ) : effectiveIsOverdue ? (
                // Show overdue warning
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastPumpingTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastPumpingTime, {
                          addSuffix: true,
                        }).replace(/^about /, '')}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastPumpingTime,
                          timeFormat,
                        )}
                        {prediction.lastPumpingAmount && (
                          <span>
                            {' '}
                            • {formatAmount(prediction.lastPumpingAmount)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction with overdue indicator */}
                  <div className="text-sm opacity-60">
                    Next {exactTime}
                    {prediction.overdueMinutes && (
                      <span className="text-amber-400 font-medium">
                        {' '}
                        • {formatOverdueTime(prediction.overdueMinutes)} overdue
                      </span>
                    )}
                    {prediction.suggestedVolume && (
                      <span> • {formatAmount(prediction.suggestedVolume)}</span>
                    )}
                  </div>
                </>
              ) : (
                // Show prediction
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastPumpingTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastPumpingTime, {
                          addSuffix: true,
                        }).replace(/^about /, '')}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastPumpingTime,
                          timeFormat,
                        )}
                        {prediction.lastPumpingAmount && (
                          <span>
                            {' '}
                            • {formatAmount(prediction.lastPumpingAmount)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction */}
                  <div className="text-sm opacity-60">
                    Next {timeUntil} • {exactTime}
                    {prediction.suggestedVolume && (
                      <span> • {formatAmount(prediction.suggestedVolume)}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && (
          <div className="mt-4">
            <PredictiveOverdueActions
              isSkipping={isSkipping}
              onLog={handleCardClick}
              onSkip={handleSkip}
            />
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent className="max-h-[90vh] overflow-x-hidden">
          <DrawerHeader>
            <DrawerTitle>Pumping Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Learning Section */}
            {learningContent && (
              <LearningSection
                babyAgeDays={babyAgeDays}
                bgColor="bg-activity-pumping/5"
                borderColor="border-activity-pumping/20"
                color="bg-activity-pumping/10 text-activity-pumping"
                educationalContent={learningContent.message}
                icon={Droplets}
                tips={learningContent.tips}
              />
            )}

            {/* Quick Log Info Section */}
            <QuickLogInfoSection
              activityType="pumping"
              bgColor="bg-activity-pumping/5"
              borderColor="border-activity-pumping/20"
              calculationDetails={prediction.calculationDetails}
              color="bg-activity-pumping/10 text-activity-pumping"
              enabledSettings={quickLogSettings.activeSettings}
              isQuickLogEnabled={quickLogSettings.enabled}
            />

            {/* Volume Calculation Explanation */}
            {babyAgeDays !== null && (
              <InfoCard
                actions={
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full bg-transparent hover:bg-activity-pumping/10"
                      onClick={() => {
                        setShowInfoDrawer(false);
                        router.push('/app/nutrition#pumping-tips');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Learn More
                    </Button>
                    <Button
                      className="w-full bg-activity-pumping hover:bg-activity-pumping/90 text-activity-pumping-foreground"
                      onClick={() => {
                        setShowInfoDrawer(false);
                        router.push('/app/settings?tab=baby');
                      }}
                      size="sm"
                    >
                      Update Settings
                    </Button>
                  </div>
                }
                babyAgeDays={babyAgeDays}
                bgColor="bg-activity-pumping/5"
                borderColor="border-activity-pumping/20"
                color="bg-activity-pumping/10 text-activity-pumping"
                icon={Info}
                title="Smart Volume Calculation"
              >
                <p className="text-sm text-foreground/90">
                  When you select a duration in the pumping drawer, we
                  automatically calculate expected volumes based on your baby's
                  age.
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5">
                  <li className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      Early days (1-3): Small colostrum volumes (
                      {userUnitPref === 'OZ' ? '0.2-0.7oz' : '5-20ml'})
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      Week 1-2: Transitional milk increases (
                      {userUnitPref === 'OZ' ? '1-3oz' : '30-90ml'})
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>After 1 month: Uses your personalized settings</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      Duration matters: Longer sessions = proportionally more
                      volume
                    </span>
                  </li>
                </ul>
              </InfoCard>
            )}

            {/* Recent Pattern */}
            {prediction.recentPumpingPattern.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Recent Pumping Sessions
                </p>
                <div className="space-y-2">
                  {prediction.recentPumpingPattern
                    .slice(0, 5)
                    .map((pumping) => (
                      <div
                        className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2"
                        key={pumping.time.toISOString()}
                      >
                        <span className="text-muted-foreground">
                          {formatTimeWithPreference(pumping.time, timeFormat)}
                        </span>
                        <div className="flex gap-2 items-center">
                          {pumping.amountMl !== null && (
                            <span className="text-foreground/70 font-medium">
                              {formatAmount(pumping.amountMl)}
                            </span>
                          )}
                          {pumping.intervalFromPrevious !== null && (
                            <span className="text-muted-foreground/60">
                              ({pumping.intervalFromPrevious.toFixed(1)}h apart)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Average Interval */}
            {prediction.averageIntervalHours !== null && (
              <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                <span className="text-muted-foreground">Average interval</span>
                <span className="text-foreground font-medium">
                  {prediction.averageIntervalHours.toFixed(1)} hours
                </span>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Stats Drawer */}
      <PumpingStatsDrawer
        activities={last7DaysActivities ?? []}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        trendData={pumpingTrendData}
        unit={userUnitPref}
      />
    </>
  );
}
