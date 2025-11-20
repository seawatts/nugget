'use client';

import type { Activities } from '@nugget/db/schema';
import { useCallback, useEffect, useState } from 'react';
import { getInProgressFeedingActivityAction } from '../../activity-cards.actions';
import type { FeedingFormData } from '../feeding-type-selector';

interface UseFeedingDrawerStateProps {
  isOpen: boolean;
  existingActivity?: typeof Activities.$inferSelect | null;
  babyId?: string;
}

export function useFeedingDrawerState({
  isOpen,
  existingActivity,
  babyId,
}: UseFeedingDrawerStateProps) {
  // Time state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState<FeedingFormData | null>(null);

  // Timer state
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isTimerStopped, setIsTimerStopped] = useState(false);
  const [duration, setDuration] = useState(0);

  // UI state
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isLoadingInProgress, setIsLoadingInProgress] = useState(false);

  // Computed values
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);
  const isTimerActive = Boolean(activeActivityId) && !isTimerStopped;

  // Reset all state to initial values
  const resetState = useCallback(() => {
    setActiveActivityId(null);
    setIsTimerStopped(false);
    setIsLoadingInProgress(false);
    setDuration(0);
    const now = new Date();
    setStartTime(now);
    setEndTime(now);
    setFormData(null);
  }, []);

  // Clear timer state after save
  const clearTimerState = useCallback(() => {
    setActiveActivityId(null);
    setIsTimerStopped(false);
    setFormData(null);
    setDuration(0);
  }, []);

  // Load existing activity data
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));

      // Calculate end time from start time and duration
      if (existingActivity.duration) {
        const calculatedEndTime = new Date(existingActivity.startTime);
        calculatedEndTime.setMinutes(
          calculatedEndTime.getMinutes() + existingActivity.duration,
        );
        setEndTime(calculatedEndTime);
      } else {
        setEndTime(new Date(existingActivity.startTime));
      }
    } else {
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
      setFormData(null);
    }
  }, [existingActivity]);

  // Load in-progress activity when drawer opens
  useEffect(() => {
    if (isOpen && !existingActivity && babyId) {
      setIsLoadingInProgress(true);
      void (async () => {
        try {
          const result = await getInProgressFeedingActivityAction({
            babyId,
          });
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));
            setEndTime(new Date());

            // Calculate duration from start time
            const elapsedSeconds = Math.floor(
              (Date.now() - new Date(inProgressActivity.startTime).getTime()) /
                1000,
            );
            setDuration(elapsedSeconds);

            // Set form data type based on activity type
            if (inProgressActivity.type === 'bottle') {
              setFormData({
                amountMl: inProgressActivity.amount || undefined,
                bottleType:
                  inProgressActivity.feedingSource === 'formula'
                    ? 'formula'
                    : 'breast_milk',
                notes: inProgressActivity.notes || undefined,
                type: 'bottle',
              });
            } else if (inProgressActivity.type === 'nursing') {
              setFormData({
                notes: inProgressActivity.notes || undefined,
                type: 'nursing',
              });
            }
          } else {
            setActiveActivityId(null);
          }
        } catch (error) {
          console.error('Failed to load in-progress feeding:', error);
        } finally {
          setIsLoadingInProgress(false);
        }
      })();
    }

    // Reset state when drawer closes - delay to allow closing animation to complete
    if (!isOpen) {
      // Delay state reset to prevent flash during drawer closing animation
      const timeoutId = setTimeout(() => {
        resetState();
      }, 300); // Standard drawer animation duration

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, existingActivity, babyId, resetState]);

  // Handle stopping the timer
  const handleStop = useCallback(() => {
    setEndTime(new Date());
    setIsTimerStopped(true);
  }, []);

  return {
    activeActivityId,
    clearTimerState,
    duration,
    endTime,
    formData,
    handleStop,

    // Computed
    isEditing,
    isLoadingInProgress,
    isTimerActive,
    isTimerStopped,

    // Actions
    resetState,
    setActiveActivityId,
    setDuration,
    setEndTime,
    setFormData,
    setIsTimerStopped,
    setShowCancelConfirmation,

    // Setters
    setStartTime,
    showCancelConfirmation,
    // State
    startTime,
  };
}
