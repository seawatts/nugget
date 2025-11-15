'use client';

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
import { format, formatDistanceToNow } from 'date-fns';
import { Droplets, Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LearningSection } from './learning-section';
import {
  getUpcomingPumpingAction,
  quickLogPumpingAction,
  type UpcomingPumpingData,
} from './upcoming-pumping/actions';
import { getPumpingLearningContent } from './upcoming-pumping/learning-content';

interface PredictivePumpingCardProps {
  refreshTrigger?: number;
  onCardClick?: () => void;
}

export function PredictivePumpingCard({
  refreshTrigger = 0,
  onCardClick,
}: PredictivePumpingCardProps) {
  const [data, setData] = useState<UpcomingPumpingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [quickLogging, setQuickLogging] = useState(false);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger reloads from parent
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  if (loading) {
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

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getPumpingLearningContent(babyAgeDays) : null;

  // Format countdown
  const timeUntil = formatDistanceToNow(prediction.nextPumpingTime, {
    addSuffix: true,
  });
  const exactTime = format(prediction.nextPumpingTime, 'h:mm a');

  // Format recovery time if overdue
  const recoveryTimeUntil = prediction.suggestedRecoveryTime
    ? formatDistanceToNow(prediction.suggestedRecoveryTime, {
        addSuffix: true,
      })
    : null;
  const recoveryExactTime = prediction.suggestedRecoveryTime
    ? format(prediction.suggestedRecoveryTime, 'h:mm a')
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
    setQuickLogging(true);
    try {
      const result = await quickLogPumpingAction({});

      if (result?.data) {
        toast.success('Pumping logged!');
        await loadData(); // Reload to show updated state
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log pumping');
    } finally {
      setQuickLogging(false);
    }
  };

  // Format amount for display (ml to oz)
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    const oz = Math.round(ml / 30);
    return `${oz}oz`;
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-[oklch(0.65_0.18_280)] text-white',
          prediction.isOverdue
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
              {prediction.isOverdue ? (
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
                      Last pumped{' '}
                      {formatDistanceToNow(prediction.lastPumpingTime, {
                        addSuffix: true,
                      })}{' '}
                      • {format(prediction.lastPumpingTime, 'h:mm a')}
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
        {prediction.isOverdue && (
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-50"
              disabled={quickLogging}
              onClick={handleQuickLog}
              size="sm"
            >
              {quickLogging ? 'Logging...' : 'Log Now'}
            </Button>
            <Button
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-950/20"
              disabled={quickLogging}
              onClick={handleCardClick}
              size="sm"
              variant="outline"
            >
              Log with Details
            </Button>
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pumping Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
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
                          {format(pumping.time, 'h:mm a')}
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
