'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

interface SwipeState {
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  rotation: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  onSwipeStart,
  onSwipeEnd,
}: UseSwipeGestureOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isSwiping = useRef(false);

  // Common start handler for both touch and mouse
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      startX.current = clientX;
      startY.current = clientY;
      currentX.current = clientX;
      currentY.current = clientY;
      isSwiping.current = true;

      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
      }));

      onSwipeStart?.();
    },
    [onSwipeStart],
  );

  // Common move handler for both touch and mouse
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isSwiping.current) return;

    currentX.current = clientX;
    currentY.current = clientY;

    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;

    // Calculate rotation based on horizontal movement (max 15 degrees)
    const rotation = (deltaX / window.innerWidth) * 15;

    // Determine direction based on larger delta
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeState({
      direction,
      isDragging: true,
      offsetX: deltaX,
      offsetY: deltaY,
      rotation,
    });
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove],
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      console.log('[SwipeGesture] Mouse down at:', e.clientX, e.clientY);
      handleStart(e.clientX, e.clientY);
    },
    [handleStart],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSwiping.current) return;
      console.log('[SwipeGesture] Mouse move:', e.clientX, e.clientY);
      handleMove(e.clientX, e.clientY);
    },
    [handleMove],
  );

  // Common end handler for both touch and mouse
  const handleEnd = useCallback(() => {
    if (!isSwiping.current) return;

    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    console.log(
      '[SwipeGesture] End - deltaX:',
      deltaX,
      'deltaY:',
      deltaY,
      'threshold:',
      threshold,
    );

    // Determine if threshold was met
    let actionTriggered = false;

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX >= threshold) {
        // Complete the exit animation by extending the offset
        const exitOffset = deltaX > 0 ? window.innerWidth : -window.innerWidth;
        setSwipeState((prev) => ({
          ...prev,
          isDragging: false,
          offsetX: exitOffset,
        }));

        if (deltaX > 0) {
          onSwipeRight?.();
          actionTriggered = true;
        } else {
          onSwipeLeft?.();
          actionTriggered = true;
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY >= threshold) {
        // Complete the exit animation by extending the offset
        const exitOffset =
          deltaY > 0 ? window.innerHeight : -window.innerHeight;
        setSwipeState((prev) => ({
          ...prev,
          isDragging: false,
          offsetY: exitOffset,
        }));

        if (deltaY > 0) {
          onSwipeDown?.();
          actionTriggered = true;
        } else {
          onSwipeUp?.();
          actionTriggered = true;
        }
      }
    }

    // Haptic feedback on successful swipe
    if (actionTriggered && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    isSwiping.current = false;

    // If action was not triggered, reset to spring back
    if (!actionTriggered) {
      setSwipeState({
        direction: null,
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      });
    }

    onSwipeEnd?.();
  }, [
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeEnd,
  ]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Add global mouse event listeners when mouse dragging
  useEffect(() => {
    if (isSwiping.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  const resetSwipe = useCallback(() => {
    setSwipeState({
      direction: null,
      isDragging: false,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  }, []);

  return {
    handlers: {
      onMouseDown: handleMouseDown,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchStart: handleTouchStart,
    },
    resetSwipe,
    swipeState,
  };
}
