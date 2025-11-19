'use client';

import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({
  onRefresh,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;

    let startY = 0;
    let currentY = 0;
    let pulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if at the top of the page
      if (window.scrollY > 0) return;

      startY = e.touches[0]?.clientY ?? 0;
      touchStartY.current = startY;
      pulling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || window.scrollY > 0) return;

      currentY = e.touches[0]?.clientY ?? 0;
      const distance = currentY - startY;

      // Only pull down, not up
      if (distance > 0) {
        pulling = true;
        setIsPulling(true);

        // Apply resistance curve - gets harder to pull as distance increases
        const resistance = Math.min(distance / 2.5, MAX_PULL);

        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }

        rafId.current = requestAnimationFrame(() => {
          setPullDistance(resistance);
        });

        // Prevent scrolling when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;

      setIsPulling(false);

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);

        // Haptic feedback on iOS
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }

        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          // Keep the spinner visible for a brief moment
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 300);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }

      pulling = false;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [disabled, isRefreshing, onRefresh, pullDistance]);

  const isTriggered = pullDistance >= PULL_THRESHOLD;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  if (pullDistance === 0 && !isRefreshing && !isPulling) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-center"
      style={{
        transform: `translateY(${isRefreshing ? PULL_THRESHOLD : pullDistance}px)`,
        transition: isPulling
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-background shadow-lg',
          'border border-border',
          isRefreshing || isTriggered ? 'size-12' : 'size-10',
        )}
        style={{
          opacity: Math.min(progress * 1.5, 1),
          transform: `scale(${0.7 + progress * 0.3})`,
          transition: isPulling
            ? 'none'
            : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Icons.RefreshCw
          className={cn(
            'transition-transform',
            isRefreshing && 'animate-spin',
            !isRefreshing && isTriggered && 'rotate-180',
          )}
          size={isRefreshing || isTriggered ? 'default' : 'sm'}
          style={{
            transform:
              !isRefreshing && !isTriggered
                ? `rotate(${progress * 180}deg)`
                : undefined,
          }}
          variant={isTriggered ? 'primary' : 'muted'}
        />
      </div>
    </div>
  );
}
