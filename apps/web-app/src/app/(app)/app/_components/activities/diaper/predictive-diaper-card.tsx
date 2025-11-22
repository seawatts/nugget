'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Baby, Info, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import {
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
  PredictiveOverdueActions,
  usePredictiveActions,
} from '../shared/components/predictive-cards';
import { skipDiaperAction } from './actions';
import { getDiaperGuidanceByAge } from './diaper-intervals';
import { getDiaperLearningContent } from './learning-content';
import { predictNextDiaper } from './prediction';

interface PredictiveDiaperCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveDiaperCard({
  onCardClick,
  onActivityLogged: _onActivityLogged,
}: PredictiveDiaperCardProps) {
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId;

  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingDiaper.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        guidanceMessage:
          queryData.babyAgeDays !== null
            ? getDiaperGuidanceByAge(queryData.babyAgeDays)
            : 'Check diaper regularly and change when wet or soiled.',
        prediction: predictNextDiaper(
          queryData.recentActivities.filter((a) => a.type === 'diaper'),
          queryData.babyBirthDate,
          queryData.recentActivities,
        ),
      }
    : null;

  const error = queryError?.message || null;

  // Build smart defaults for quick log
  const defaultQuickLogData: Record<string, unknown> = {};
  if (
    (userData?.quickLogDiaperUsePredictedType ?? true) &&
    data?.prediction.suggestedType
  ) {
    defaultQuickLogData.details = { type: data.prediction.suggestedType };
  }

  // Use shared actions hook with diaper defaults
  const { handleQuickLog, handleSkip, isCreating, isSkipping } =
    usePredictiveActions({
      activityType: 'diaper',
      defaultQuickLogData,
      onActivityLogged: _onActivityLogged,
      skipAction: skipDiaperAction,
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
    return <PredictiveCardSkeleton activityType="diaper" />;
  }

  if (!data) return null;

  const { prediction, babyAgeDays } = data;

  // Check if we should suppress overdue state due to recent skip (from DB)
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
      : prediction.nextDiaperTime;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getDiaperLearningContent(babyAgeDays) : null;

  // Build quick log settings for info drawer
  const quickLogSettings = {
    activeSettings: [
      ...((userData?.quickLogDiaperUsePredictedType ?? true)
        ? ['Predicted type']
        : []),
    ],
    enabled: userData?.quickLogEnabled ?? true,
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

  // Format diaper type
  const formatDiaperType = (type: string | null) => {
    if (!type) return '';
    if (type === 'both') return 'Both';
    if (type === 'wet') return 'Pee';
    if (type === 'dirty') return 'Poop';
    return type.charAt(0).toUpperCase() + type.slice(1);
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

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-activity-diaper text-activity-diaper-foreground',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Baby className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Diaper</h2>
              <div className="flex items-center gap-1">
                {isFetching && !isLoading && (
                  <Icons.Spinner
                    className="animate-spin opacity-70"
                    size="xs"
                  />
                )}
                {(userData?.quickLogEnabled ?? true) && (
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
                  className="p-1.5 rounded-full hover:bg-black/10 transition-colors -mr-1.5"
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
                  <Skeleton className="h-6 w-48 bg-current/20" />
                  <Skeleton className="h-4 w-32 bg-current/20" />
                </>
              ) : effectiveIsOverdue ? (
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastDiaperTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastDiaperTime, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastDiaperTime,
                          timeFormat,
                        )}
                        {prediction.lastDiaperType && (
                          <span>
                            {' '}
                            • {formatDiaperType(prediction.lastDiaperType)}
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
                  </div>
                </>
              ) : (
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastDiaperTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastDiaperTime, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastDiaperTime,
                          timeFormat,
                        )}
                        {prediction.lastDiaperType && (
                          <span>
                            {' '}
                            • {formatDiaperType(prediction.lastDiaperType)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction */}
                  <div className="text-sm opacity-60">
                    Next {timeUntil} • {exactTime}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && (
          <PredictiveOverdueActions
            isSkipping={isSkipping}
            onLog={handleCardClick}
            onSkip={handleSkip}
          />
        )}
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="diaper"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        calculationDetails={prediction.calculationDetails}
        formatPatternItem={(item): React.ReactNode => {
          return (
            <>
              <span className="text-muted-foreground">
                {formatTimeWithPreference(item.time, timeFormat)}
              </span>
              <div className="flex gap-2 items-center">
                {'type' in item && item.type ? (
                  <span className="text-foreground/70 font-medium">
                    {formatDiaperType(item.type as string)}
                  </span>
                ) : null}
                {'intervalFromPrevious' in item &&
                item.intervalFromPrevious !== null ? (
                  <span className="text-muted-foreground/60">
                    ({(item.intervalFromPrevious as number).toFixed(1)}h apart)
                  </span>
                ) : null}
              </div>
            </>
          );
        }}
        icon={Baby}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        quickLogSettings={quickLogSettings}
        recentPattern={prediction.recentDiaperPattern}
        timeFormat={timeFormat}
        title="Diaper"
      />
    </>
  );
}
