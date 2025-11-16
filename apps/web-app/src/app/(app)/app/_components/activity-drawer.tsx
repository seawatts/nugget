'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Clock, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { ActivityDrawerContent } from '~/app/(app)/app/_components/drawers/activity-drawer-content';
import { BathDrawer } from '~/app/(app)/app/_components/drawers/bath-drawer';
import {
  DiaperDrawerContent,
  type DiaperFormData,
} from '~/app/(app)/app/_components/drawers/diaper-drawer';
import type { FeedingFormData } from '~/app/(app)/app/_components/drawers/feeding-drawer';
import { FeedingDrawerContent } from '~/app/(app)/app/_components/drawers/feeding-drawer';
import { GrowthDrawer } from '~/app/(app)/app/_components/drawers/growth-drawer';
import { MedicineDrawer } from '~/app/(app)/app/_components/drawers/medicine-drawer';
import { PottyDrawer } from '~/app/(app)/app/_components/drawers/potty-drawer';
import { PumpingDrawerContent } from '~/app/(app)/app/_components/drawers/pumping-drawer';
import { SleepDrawerContent } from '~/app/(app)/app/_components/drawers/sleep-drawer';
import { TemperatureDrawer } from '~/app/(app)/app/_components/drawers/temperature-drawer';
import { TummyTimeDrawer } from '~/app/(app)/app/_components/drawers/tummy-time-drawer';
import {
  createActivityWithDetailsAction,
  getInProgressSleepActivityAction,
} from './activity-cards.actions';
import { updateActivityAction } from './update-activity.actions';

interface ActivityDrawerProps {
  activity: {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    textColor: string;
  };
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  onActivityUpdated?: (activity: typeof Activities.$inferSelect) => void;
  onActivitySaved?: () => void;
}

export function ActivityDrawer({
  activity,
  existingActivity,
  isOpen,
  onClose,
  onActivityUpdated,
  onActivitySaved,
}: ActivityDrawerProps) {
  const Icon = activity.icon;
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [notes, setNotes] = useState('');
  const [feedingFormData, setFeedingFormData] =
    useState<FeedingFormData | null>(null);
  const [diaperFormData, setDiaperFormData] = useState<DiaperFormData | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);
  const [sleepQuality, setSleepQuality] = useState<
    'peaceful' | 'restless' | 'fussy' | 'crying' | undefined
  >();
  const [sleepLocation, setSleepLocation] = useState<
    | 'crib'
    | 'bassinet'
    | 'bed'
    | 'car_seat'
    | 'stroller'
    | 'arms'
    | 'swing'
    | 'bouncer'
    | undefined
  >();
  const [wakeReason, setWakeReason] = useState<
    | 'hungry'
    | 'diaper'
    | 'crying'
    | 'naturally'
    | 'noise'
    | 'unknown'
    | undefined
  >();

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
    } else {
      setStartTime(new Date());
    }

    // Initialize sleep-specific fields
    if (existingActivity && activity.id === 'sleep') {
      if (existingActivity.duration) {
        setDuration(existingActivity.duration * 60); // Convert minutes to seconds
      }
      if (existingActivity.notes) {
        setNotes(existingActivity.notes);
      }
      // Parse sleep details from details field
      if (
        existingActivity.details &&
        existingActivity.details.type === 'sleep'
      ) {
        setSleepType(existingActivity.details.sleepType);
        setSleepQuality(existingActivity.details.quality);
        setSleepLocation(existingActivity.details.location);
        setWakeReason(existingActivity.details.wakeReason);
      }
    }

    // Reset fields when drawer is opened for new activity
    if (!existingActivity) {
      setDuration(0);
      setSleepType('nap');
      setNotes('');
      setSleepQuality(undefined);
      setSleepLocation(undefined);
      setWakeReason(undefined);
    }
  }, [existingActivity, activity.id]);

  // Load in-progress sleep activity when drawer opens for sleep
  useEffect(() => {
    if (isOpen && activity.id === 'sleep' && !existingActivity) {
      startTransition(async () => {
        try {
          const result = await getInProgressSleepActivityAction({});
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));

            // Parse sleep details from details field
            if (inProgressActivity.notes) {
              setNotes(inProgressActivity.notes);
            }
            if (
              inProgressActivity.details &&
              inProgressActivity.details.type === 'sleep'
            ) {
              setSleepType(inProgressActivity.details.sleepType);
              setSleepQuality(inProgressActivity.details.quality);
              setSleepLocation(inProgressActivity.details.location);
              setWakeReason(inProgressActivity.details.wakeReason);
            }
          } else {
            // No in-progress activity
            setActiveActivityId(null);
          }
        } catch (error) {
          console.error('Failed to load in-progress sleep:', error);
        }
      });
    }

    // Reset activeActivityId when drawer closes
    if (!isOpen) {
      setActiveActivityId(null);
    }
  }, [isOpen, activity.id, existingActivity]);

  const handleTimerStart = async () => {
    // Create sleep activity immediately when timer starts
    startTransition(async () => {
      try {
        const result = await createActivityWithDetailsAction({
          activityType: 'sleep',
          details: {
            location: sleepLocation,
            quality: sleepQuality,
            sleepType: sleepType,
            type: 'sleep' as const,
            wakeReason: wakeReason,
          },
          notes: notes || undefined,
          startTime: startTime,
        });

        if (result?.data?.activity) {
          setActiveActivityId(result.data.activity.id);
          toast.success('Sleep tracking started');
        } else if (result?.serverError) {
          toast.error(result.serverError);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to start tracking',
        );
      }
    });
  };

  const handleSave = async () => {
    // Handle saving in-progress activity
    if (activeActivityId && !existingActivity) {
      // Calculate end time from duration
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // For sleep, create details object
      const sleepDetails =
        activity.id === 'sleep'
          ? {
              location: sleepLocation,
              quality: sleepQuality,
              sleepType: sleepType,
              type: 'sleep' as const,
              wakeReason: wakeReason,
            }
          : undefined;

      // Update the in-progress activity with endTime and duration
      startTransition(async () => {
        try {
          const result = await updateActivityAction({
            details: sleepDetails,
            duration: Math.floor(duration / 60), // Convert seconds to minutes
            endTime,
            id: activeActivityId,
            notes: notes || undefined,
            startTime,
          });

          if (result?.data?.activity) {
            // Clear the active activity first
            setActiveActivityId(null);

            // Update with real data from server
            onActivityUpdated?.(result.data.activity);
            // Notify that save completed successfully (triggers refresh)
            onActivitySaved?.();
            toast.success('Sleep saved successfully');

            // Close drawer after successful save
            onClose();
          } else if (result?.serverError) {
            toast.error(result.serverError);
          }
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to save sleep',
          );
        }
      });
    } else if (isEditing && existingActivity) {
      // Calculate end time from duration
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // For sleep, create details object
      const sleepDetails =
        activity.id === 'sleep'
          ? {
              location: sleepLocation,
              quality: sleepQuality,
              sleepType: sleepType,
              type: 'sleep' as const,
              wakeReason: wakeReason,
            }
          : undefined;

      // Create optimistic update data
      const optimisticActivity = {
        ...existingActivity,
        details: sleepDetails,
        duration: Math.floor(duration / 60), // Convert seconds to minutes
        endTime,
        notes: notes || null,
        startTime,
      } as typeof Activities.$inferSelect;

      // Update UI optimistically
      onActivityUpdated?.(optimisticActivity);

      // Close drawer immediately for better UX
      onClose();

      // Perform actual update in background
      startTransition(async () => {
        try {
          const result = await updateActivityAction({
            details: sleepDetails,
            duration: Math.floor(duration / 60), // Convert seconds to minutes
            endTime,
            id: existingActivity.id,
            notes: notes || undefined,
            startTime,
          });

          if (result?.data?.activity) {
            // Update with real data from server
            onActivityUpdated?.(result.data.activity);
            // Notify that save completed successfully (triggers refresh)
            onActivitySaved?.();
            toast.success('Activity updated successfully');
          } else if (result?.serverError) {
            toast.error(result.serverError);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to update activity',
          );
        }
      });
    } else {
      // Creating new activity
      // Close drawer immediately for better UX
      onClose();

      // Perform creation in background
      startTransition(async () => {
        try {
          // Prepare activity data based on type
          let activityData: {
            activityType: string;
            amount?: number;
            feedingSource?: 'direct' | 'pumped' | 'formula' | 'donor';
            duration?: number;
            notes?: string;
            startTime?: Date;
            details?: {
              type: string;
              sleepType?: string;
              quality?: string;
              location?: string;
              wakeReason?: string;
              size?: string;
              color?: string;
              consistency?: string;
            };
          } = {
            activityType: activity.id,
            startTime: new Date(),
          };

          // Add sleep-specific fields
          if (activity.id === 'sleep') {
            const sleepNotes = `[sleepType:${sleepType}]${notes ? ` ${notes}` : ''}`;
            activityData = {
              ...activityData,
              duration: Math.floor(duration / 60), // Convert seconds to minutes
              notes: sleepNotes || undefined,
              startTime,
            };
          }

          // Add feeding-specific fields
          if (feedingFormData) {
            if (feedingFormData.type === 'bottle') {
              activityData = {
                ...activityData,
                activityType: 'bottle',
                amount: feedingFormData.amountMl,
                feedingSource:
                  feedingFormData.bottleType === 'breast_milk'
                    ? 'direct'
                    : 'formula',
                notes: feedingFormData.notes || undefined,
              };
            } else if (feedingFormData.type === 'nursing') {
              const totalDuration =
                (feedingFormData.leftDuration || 0) +
                (feedingFormData.rightDuration || 0);
              activityData = {
                ...activityData,
                activityType: 'nursing',
                duration: totalDuration,
                notes: feedingFormData.notes || undefined,
              };
            }
          }

          // Add diaper-specific fields
          if (diaperFormData?.type) {
            activityData = {
              ...activityData,
              activityType: diaperFormData.type,
              details: {
                type: diaperFormData.type,
                ...(diaperFormData.size && { size: diaperFormData.size }),
                ...(diaperFormData.color && { color: diaperFormData.color }),
                ...(diaperFormData.consistency && {
                  consistency: diaperFormData.consistency,
                }),
              },
              notes: diaperFormData.notes || undefined,
            };
          }

          const result = await createActivityWithDetailsAction(
            activityData as Parameters<
              typeof createActivityWithDetailsAction
            >[0],
          );

          if (result?.data?.activity) {
            // Notify that save completed successfully (triggers refresh)
            onActivitySaved?.();
            toast.success('Activity created successfully');
          } else if (result?.serverError) {
            toast.error(result.serverError);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to create activity',
          );
        }
      });
    }
  };

  const renderContent = () => {
    switch (activity.id) {
      case 'sleep':
        return (
          <SleepDrawerContent
            activeActivityId={activeActivityId}
            duration={duration}
            notes={notes}
            onTimerStart={handleTimerStart}
            setDuration={setDuration}
            setNotes={setNotes}
            setSleepLocation={setSleepLocation}
            setSleepQuality={setSleepQuality}
            setSleepType={setSleepType}
            setStartTime={setStartTime}
            setWakeReason={setWakeReason}
            sleepLocation={sleepLocation}
            sleepQuality={sleepQuality}
            sleepType={sleepType}
            startTime={startTime}
            wakeReason={wakeReason}
          />
        );
      case 'feeding':
      case 'nursing':
      case 'bottle':
      case 'solids':
        return (
          <FeedingDrawerContent
            existingActivityType={
              activity.id === 'feeding'
                ? null
                : (activity.id as 'bottle' | 'nursing' | 'solids')
            }
            onFormDataChange={setFeedingFormData}
          />
        );
      case 'pumping':
        return <PumpingDrawerContent />;
      case 'diaper':
        return <DiaperDrawerContent onDataChange={setDiaperFormData} />;
      case 'potty':
        return <PottyDrawer />;
      case 'activity':
        return <ActivityDrawerContent />;
      case 'tummy-time':
        return <TummyTimeDrawer />;
      case 'medicine':
        return <MedicineDrawer />;
      case 'temperature':
        return <TemperatureDrawer />;
      case 'growth':
        return <GrowthDrawer />;
      case 'bath':
        return <BathDrawer />;
      default:
        return null;
    }
  };

  return (
    <Drawer onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DrawerContent className="max-h-[85vh] bg-background border-none">
        {/* Custom Header with Activity Color */}
        <div className={cn('p-6 pb-4', activity.color)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon
                className={cn('size-8', activity.textColor)}
                strokeWidth={1.5}
              />
              <DrawerTitle
                className={cn('text-2xl font-bold', activity.textColor)}
              >
                {activity.label}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button
                className={cn(
                  'p-2 rounded-full hover:bg-black/10 transition-colors',
                  activity.textColor,
                )}
                type="button"
              >
                <X className="size-6" />
              </button>
            </DrawerClose>
          </div>

          {/* Time Display */}
          <div
            className={cn(
              'flex items-center gap-4 text-sm',
              activity.textColor,
              'opacity-90',
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>
                {startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>
                {startTime.toLocaleDateString([], {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>

        {/* Footer with Actions */}
        <div className="p-6 pt-4 border-t border-border">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button
                className="flex-1 h-12 text-base bg-transparent"
                variant="outline"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className={cn(
                'flex-1 h-12 text-base font-semibold',
                activity.color,
                activity.textColor,
              )}
              disabled={isPending}
              onClick={handleSave}
            >
              {isPending
                ? 'Saving...'
                : activeActivityId && !existingActivity
                  ? 'Save'
                  : isEditing
                    ? 'Update'
                    : 'Save'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
