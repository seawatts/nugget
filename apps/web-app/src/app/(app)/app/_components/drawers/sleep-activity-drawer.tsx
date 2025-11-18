'use client';

import { useAuth } from '@clerk/nextjs';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Calendar, Clock, Moon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getInProgressSleepActivityAction } from '../activity-cards.actions';
import { getFamilyMembersAction } from '../activity-timeline-filters.actions';
import { useActivityMutations } from '../use-activity-mutations';
import { SleepDrawerContent } from './sleep-drawer';

interface SleepActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Complete, self-contained sleep activity drawer
 * Manages all sleep-specific state and logic internally
 */
export function SleepActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
}: SleepActivityDrawerProps) {
  const { userId } = useAuth();
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();

  // Sleep-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [notes, setNotes] = useState('');
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
  const [isCoSleeping, setIsCoSleeping] = useState(false);
  const [coSleepingWith, setCoSleepingWith] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{
      id: string;
      name: string;
      avatarUrl?: string | null;
      userId: string;
    }>
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);

  // Fetch family members when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Set current user ID
      setCurrentUserId(userId || undefined);

      // Fetch family members
      void (async () => {
        try {
          const members = await getFamilyMembersAction();
          if (members) {
            setFamilyMembers(members);
          }
        } catch (error) {
          console.error('Failed to fetch family members:', error);
        }
      })();
    }
  }, [isOpen, userId]);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
    } else {
      setStartTime(new Date());
    }

    // Initialize sleep-specific fields from existing activity
    if (existingActivity) {
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
        setIsCoSleeping(existingActivity.details.isCoSleeping || false);
        setCoSleepingWith(existingActivity.details.coSleepingWith || []);
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
      setIsCoSleeping(false);
      setCoSleepingWith([]);
    }
  }, [existingActivity]);

  // Load in-progress sleep activity when drawer opens
  useEffect(() => {
    if (isOpen && !existingActivity) {
      void (async () => {
        try {
          const result = await getInProgressSleepActivityAction({});
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));

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
              setIsCoSleeping(inProgressActivity.details.isCoSleeping || false);
              setCoSleepingWith(
                inProgressActivity.details.coSleepingWith || [],
              );
            }
          } else {
            setActiveActivityId(null);
          }
        } catch (error) {
          console.error('Failed to load in-progress sleep:', error);
        }
      })();
    }

    // Reset state when drawer closes
    if (!isOpen) {
      setActiveActivityId(null);
      setDuration(0);
      setNotes('');
      setSleepQuality(undefined);
      setSleepLocation(undefined);
      setWakeReason(undefined);
      setIsCoSleeping(false);
      setCoSleepingWith([]);
    }
  }, [isOpen, existingActivity]);

  const handleTimerStart = async () => {
    try {
      const activity = await createActivity({
        activityType: 'sleep',
        details: {
          coSleepingWith: isCoSleeping ? coSleepingWith : undefined,
          isCoSleeping: isCoSleeping || undefined,
          location: sleepLocation,
          quality: sleepQuality,
          sleepType: sleepType,
          type: 'sleep' as const,
          wakeReason: wakeReason,
        },
        notes: notes || undefined,
        startTime: startTime,
      });

      if (activity?.id) {
        setActiveActivityId(activity.id);
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Calculate end time from duration
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // Create details object
      const sleepDetails = {
        coSleepingWith: isCoSleeping ? coSleepingWith : undefined,
        isCoSleeping: isCoSleeping || undefined,
        location: sleepLocation,
        quality: sleepQuality,
        sleepType: sleepType,
        type: 'sleep' as const,
        wakeReason: wakeReason,
      };

      // Close drawer immediately for better UX
      onClose();

      if (activeActivityId && !existingActivity) {
        // Update in-progress activity
        await updateActivity({
          details: sleepDetails,
          duration: Math.floor(duration / 60), // Convert seconds to minutes
          endTime,
          id: activeActivityId,
          notes: notes || undefined,
          startTime,
        });
        setActiveActivityId(null);
      } else if (existingActivity) {
        // Update existing activity
        await updateActivity({
          details: sleepDetails,
          duration: Math.floor(duration / 60), // Convert seconds to minutes
          endTime,
          id: existingActivity.id,
          notes: notes || undefined,
          startTime,
        });
      } else {
        // Create new activity
        await createActivity({
          activityType: 'sleep',
          details: sleepDetails,
          duration: Math.floor(duration / 60), // Convert seconds to minutes
          notes: notes || undefined,
          startTime,
        });
      }
    } catch (error) {
      console.error('Failed to save sleep:', error);
    }
  };

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-[oklch(0.75_0.15_195)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Moon
              className="size-8 text-[oklch(0.18_0.02_250)]"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-[oklch(0.18_0.02_250)]">
              Sleep
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-[oklch(0.18_0.02_250)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-4 text-sm text-[oklch(0.18_0.02_250)] opacity-90">
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
      <div className="flex-1 overflow-y-auto p-6">
        <SleepDrawerContent
          activeActivityId={activeActivityId}
          coSleepingWith={coSleepingWith}
          currentUserId={currentUserId}
          duration={duration}
          familyMembers={familyMembers}
          isCoSleeping={isCoSleeping}
          notes={notes}
          onTimerStart={handleTimerStart}
          setCoSleepingWith={setCoSleepingWith}
          setDuration={setDuration}
          setIsCoSleeping={setIsCoSleeping}
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
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]',
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
    </>
  );
}
