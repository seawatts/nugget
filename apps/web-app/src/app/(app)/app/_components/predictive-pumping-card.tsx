'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { toast } from '@nugget/ui/components/sonner';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Droplets, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { InfoCard } from './info-card';
import { LearningSection } from './learning-section';
import {
  getUpcomingPumpingAction,
  skipPumpingAction,
  type UpcomingPumpingData,
} from './upcoming-pumping/actions';
import { getPumpingLearningContent } from './upcoming-pumping/learning-content';
import { useActivityMutations } from './use-activity-mutations';
import { formatVolumeDisplay, getVolumeUnit } from './volume-utils';

interface PredictivePumpingCardProps {
  refreshTrigger?: number;
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictivePumpingCard({
  refreshTrigger = 0,
  onCardClick,
  onActivityLogged,
}: PredictivePumpingCardProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [data, setData] = useState<UpcomingPumpingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Fetch user preferences for volume display and time format
  const { data: user, isLoading: userLoading } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');
  const timeFormat = user?.timeFormat || '12h';

  // Use activity mutations hook for creating pumping activities
  const { createActivity, isCreating } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Listen for activity list invalidations to auto-refresh predictions
  const { data: baby } = api.babies.getMostRecent.useQuery();
  const { dataUpdatedAt } = api.activities.list.useQuery(
    { babyId: baby?.id ?? '', limit: 1 }, // Minimal query just to detect changes
    { enabled: !!baby?.id },
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUpcomingPumpingAction();

      if (result?.data) {
        setData(result.data);
        setError(null);
      } else if (result?.serverError) {
        setError(result.serverError);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load upcoming pumping data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger and dataUpdatedAt are intentionally used to trigger reloads
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger, dataUpdatedAt]);

  if (loading || userLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 animate-pulse bg-[oklch(0.65_0.18_280)] text-white col-span-2',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Icons.Spinner className="h-12 w-12 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-7 bg-white/20 rounded w-32 mb-2" />
            <div className="h-4 bg-white/20 rounded w-24" />
          </div>
        </div>
      </Card>
    );
  }

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

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
  const exactTime = formatTimeWithPreference(displayNextTime, timeFormat);

  // Format recovery time if overdue
  const recoveryTimeUntil = prediction.suggestedRecoveryTime
    ? formatDistanceToNow(prediction.suggestedRecoveryTime, {
        addSuffix: true,
      })
    : null;
  const recoveryExactTime = prediction.suggestedRecoveryTime
    ? formatTimeWithPreference(prediction.suggestedRecoveryTime, timeFormat)
    : null;

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const now = new Date();
      const suggestedAmount = 0; // Default pumping amount

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amount: suggestedAmount,
        assignedUserId: null,
        babyId: 'temp',
        createdAt: now,
        details: null,
        duration: null,
        endTime: null,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: 'pumped' as const,
        id: `optimistic-pumping-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: 'pumping' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity - mutation hook handles invalidation
      const activity = await createActivity({
        activityType: 'pumping',
        amount: suggestedAmount,
        startTime: now,
      });

      // Notify parent component
      onActivityLogged?.(activity);

      // Reload prediction data
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log pumping');
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipping(true);
    try {
      await skipPumpingAction();
      toast.success('Pumping reminder skipped');
      // Invalidate activities list to refresh timeline
      await utils.activities.list.invalidate();
      await loadData();
    } catch (error) {
      console.error('Failed to skip pumping:', error);
      toast.error('Failed to skip pumping');
    } finally {
      setSkipping(false);
    }
  };

  // Format amount for display based on user preference
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    return formatVolumeDisplay(ml, userUnitPref, true);
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-[oklch(0.65_0.18_280)] text-white',
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
              <button
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-1.5"
                onClick={handleInfoClick}
                type="button"
              >
                <Info className="size-5 opacity-70" />
              </button>
            </div>
            <div className="space-y-1">
              {effectiveIsOverdue ? (
                // Show overdue warning
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-400">
                      {prediction.overdueMinutes} min overdue
                    </span>
                  </div>
                  <div className="text-sm opacity-70">
                    Was expected at {exactTime}
                  </div>
                  {recoveryTimeUntil && recoveryExactTime && (
                    <div className="text-sm font-medium pt-1">
                      Suggested: {recoveryTimeUntil} • {recoveryExactTime}
                    </div>
                  )}
                </>
              ) : (
                // Show prediction
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">{timeUntil}</span>
                    <span className="text-sm opacity-70">{exactTime}</span>
                  </div>
                  {prediction.lastPumpingTime && (
                    <div className="text-sm opacity-60">
                      {formatDistanceToNow(prediction.lastPumpingTime, {
                        addSuffix: true,
                      })}{' '}
                      •{' '}
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && (
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-50"
              disabled={isCreating}
              onClick={handleQuickLog}
              size="sm"
            >
              {isCreating ? 'Logging...' : 'Log Now'}
            </Button>
            <Button
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-950/20"
              disabled={isCreating}
              onClick={handleCardClick}
              size="sm"
              variant="outline"
            >
              Log with Details
            </Button>
            <Button
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground"
              disabled={isCreating || skipping}
              onClick={handleSkip}
              size="sm"
              variant="ghost"
            >
              {skipping ? 'Skipping...' : 'Skip'}
            </Button>
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Pumping Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Learning Section */}
            {learningContent && (
              <LearningSection
                babyAgeDays={babyAgeDays}
                bgColor="bg-[oklch(0.65_0.18_280)]/5"
                borderColor="border-[oklch(0.65_0.18_280)]/20"
                color="bg-[oklch(0.65_0.18_280)]/10 text-[oklch(0.65_0.18_280)]"
                educationalContent={learningContent.message}
                icon={Droplets}
                tips={learningContent.tips}
              />
            )}

            {/* Volume Calculation Explanation */}
            {babyAgeDays !== null && (
              <InfoCard
                actions={
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full bg-transparent hover:bg-[oklch(0.65_0.18_280)]/10"
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
                      className="w-full bg-[oklch(0.65_0.18_280)] hover:bg-[oklch(0.65_0.18_280)]/90 text-white"
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
                bgColor="bg-[oklch(0.65_0.18_280)]/5"
                borderColor="border-[oklch(0.65_0.18_280)]/20"
                color="bg-[oklch(0.65_0.18_280)]/10 text-[oklch(0.65_0.18_280)]"
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
                          {pumping.amount !== null && (
                            <span className="text-foreground/70 font-medium">
                              {formatAmount(pumping.amount)}
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
    </>
  );
}
