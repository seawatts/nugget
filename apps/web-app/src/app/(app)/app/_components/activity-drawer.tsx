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
import { DiaperDrawerContent } from '~/app/(app)/app/_components/drawers/diaper-drawer';
import type { FeedingFormData } from '~/app/(app)/app/_components/drawers/feeding-drawer';
import { FeedingDrawerContent } from '~/app/(app)/app/_components/drawers/feeding-drawer';
import { GrowthDrawer } from '~/app/(app)/app/_components/drawers/growth-drawer';
import { MedicineDrawer } from '~/app/(app)/app/_components/drawers/medicine-drawer';
import { PottyDrawer } from '~/app/(app)/app/_components/drawers/potty-drawer';
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
  const [isPending, startTransition] = useTransition();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);

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
        // Parse sleep type from notes if present
        const sleepTypeMatch = existingActivity.notes.match(
          /^\[sleepType:(nap|night)\]/,
        );
        if (sleepTypeMatch) {
          setSleepType(sleepTypeMatch[1] as 'nap' | 'night');
          // Remove the sleep type marker from displayed notes
          const cleanNotes = existingActivity.notes.replace(
            /^\[sleepType:(nap|night)\]\s*/,
            '',
          );
          setNotes(cleanNotes);
        } else {
          setNotes(existingActivity.notes);
        }
      }
    }

    // Reset fields when drawer is opened for new activity
    if (!existingActivity) {
      setDuration(0);
      setSleepType('nap');
      setNotes('');
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

            // Parse sleep type from notes if present
            if (inProgressActivity.notes) {
              const sleepTypeMatch = inProgressActivity.notes.match(
                /^\[sleepType:(nap|night)\]/,
              );
              if (sleepTypeMatch) {
                setSleepType(sleepTypeMatch[1] as 'nap' | 'night');
                const cleanNotes = inProgressActivity.notes.replace(
                  /^\[sleepType:(nap|night)\]\s*/,
                  '',
                );
                setNotes(cleanNotes);
              } else {
                setNotes(inProgressActivity.notes);
              }
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
  }, [isOpen, activity.id, existingActivity]);

  const handleTimerStart = async () => {
    // Create sleep activity immediately when timer starts
    startTransition(async () => {
      try {
        const sleepNotes = `[sleepType:${sleepType}]${notes ? ` ${notes}` : ''}`;

        const result = await createActivityWithDetailsAction({
          activityType: 'sleep',
          notes: sleepNotes || undefined,
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

      // For sleep, encode sleep type in notes with a marker
      const sleepNotes =
        activity.id === 'sleep'
          ? `[sleepType:${sleepType}]${notes ? ` ${notes}` : ''}`
          : notes;

      // Close drawer immediately for better UX
      onClose();

      // Update the in-progress activity with endTime and duration
      startTransition(async () => {
        try {
          const result = await updateActivityAction({
            duration: Math.floor(duration / 60), // Convert seconds to minutes
            endTime,
            id: activeActivityId,
            notes: sleepNotes || undefined,
            startTime,
          });

          if (result?.data?.activity) {
            // Update with real data from server
            onActivityUpdated?.(result.data.activity);
            // Notify that save completed successfully (triggers refresh)
            onActivitySaved?.();
            toast.success('Sleep saved successfully');
            setActiveActivityId(null);
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

      // For sleep, encode sleep type in notes with a marker
      const sleepNotes =
        activity.id === 'sleep'
          ? `[sleepType:${sleepType}]${notes ? ` ${notes}` : ''}`
          : notes;

      // Create optimistic update data
      const optimisticActivity = {
        ...existingActivity,
        duration: Math.floor(duration / 60), // Convert seconds to minutes
        endTime,
        notes: sleepNotes || null,
        startTime,
      };

      // Update UI optimistically
      onActivityUpdated?.(optimisticActivity);

      // Close drawer immediately for better UX
      onClose();

      // Perform actual update in background
      startTransition(async () => {
        try {
          const result = await updateActivityAction({
            duration: Math.floor(duration / 60), // Convert seconds to minutes
            endTime,
            id: existingActivity.id,
            notes: sleepNotes || undefined,
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
          } = {
            activityType: activity.id,
            startTime: new Date(),
          };

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

          const result = await createActivityWithDetailsAction(activityData);

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
            setSleepType={setSleepType}
            setStartTime={setStartTime}
            sleepType={sleepType}
            startTime={startTime}
          />
        );
      case 'feeding':
      case 'nursing':
      case 'bottle':
      case 'solids':
      case 'pumping':
        return (
          <FeedingDrawerContent
            existingActivityType={
              activity.id === 'feeding'
                ? null
                : (activity.id as 'bottle' | 'nursing' | 'solids' | 'pumping')
            }
            onFormDataChange={setFeedingFormData}
          />
        );
      case 'diaper':
        return <DiaperDrawerContent />;
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
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
