/**
 * Activity timer hook
 * Centralized timer logic for activity tracking (bottle, nursing, sleep, etc.)
 */

import { useEffect, useRef, useState } from 'react';
import { formatElapsedTime, formatTime } from '../time-formatting-utils';

export interface UseActivityTimerOptions {
  /** Initial duration in seconds */
  initialDuration?: number;
  /** Start time for the activity */
  startTime?: Date;
  /** Whether to auto-start the timer */
  autoStart?: boolean;
  /** Callback when timer starts */
  onStart?: () => void | Promise<void>;
  /** Callback when timer stops */
  onStop?: () => void | Promise<void>;
  /** Callback when timer pauses */
  onPause?: () => void;
  /** Callback when timer resumes */
  onResume?: () => void;
}

export interface UseActivityTimerReturn {
  /** Current duration in seconds */
  duration: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start the timer */
  start: () => Promise<void>;
  /** Stop the timer */
  stop: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset the timer to 0 */
  reset: () => void;
  /** Set duration manually */
  setDuration: (seconds: number) => void;
  /** Format duration as mm:ss */
  formatTime: () => string;
  /** Format duration as HH:MM:SS */
  formatElapsed: () => string;
  /** Start time of the current session */
  startTime: Date | null;
}

/**
 * Hook for managing activity timers
 * Handles all timer-related state and logic
 */
export function useActivityTimer(
  options: UseActivityTimerOptions = {},
): UseActivityTimerReturn {
  const {
    initialDuration = 0,
    startTime: initialStartTime,
    autoStart = false,
    onStart,
    onStop,
    onPause,
    onResume,
  } = options;

  const [duration, setDuration] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState<Date | null>(
    initialStartTime || null,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update duration when initialDuration changes
  useEffect(() => {
    if (initialDuration !== duration && !isRunning) {
      setDuration(initialDuration);
    }
  }, [initialDuration, duration, isRunning]);

  // Timer effect
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - startTime.getTime()) / 1000,
        );
        setDuration(elapsedSeconds);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, startTime]);

  const start = async () => {
    const newStartTime = new Date();
    setStartTime(newStartTime);
    setDuration(0);
    setIsRunning(true);

    if (onStart) {
      await onStart();
    }
  };

  const stop = () => {
    setIsRunning(false);
    if (onStop) {
      void onStop();
    }
  };

  const pause = () => {
    setIsRunning(false);
    if (onPause) {
      onPause();
    }
  };

  const resume = () => {
    setIsRunning(true);
    if (onResume) {
      onResume();
    }
  };

  const reset = () => {
    setDuration(0);
    setIsRunning(false);
    setStartTime(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    duration,
    formatElapsed: () => formatElapsedTime(duration),
    formatTime: () => formatTime(duration),
    isRunning,
    pause,
    reset,
    resume,
    setDuration,
    start,
    startTime,
    stop,
  };
}
