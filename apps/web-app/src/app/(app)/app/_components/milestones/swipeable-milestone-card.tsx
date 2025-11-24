'use client';

import { cn } from '@nugget/ui/lib/utils';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSwipeGesture } from './use-swipe-gesture';

interface SwipeableMilestoneCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SwipeableMilestoneCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  className,
}: SwipeableMilestoneCardProps) {
  const [isEntering, setIsEntering] = useState(true);

  const { handlers, swipeState } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,
  });

  // Entry animation
  useEffect(() => {
    // Trigger entry animation
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Don't apply swipe handlers when disabled
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const { offsetX, rotation, isDragging } = swipeState;

  // Calculate opacity for overlays (0 to 1 based on offset)
  const overlayOpacity = Math.min(Math.abs(offsetX) / 150, 0.6);

  // Determine which overlay to show
  const showRightOverlay = offsetX > 50;
  const showLeftOverlay = offsetX < -50;

  // Calculate scale for overlay icons (grows as you swipe)
  const iconScale = Math.min(Math.abs(offsetX) / 100, 1);

  return (
    <div className={cn('relative', className)} style={{ touchAction: 'pan-y' }}>
      {/* Swipe overlays */}
      {isDragging && showRightOverlay && (
        <div
          className="absolute inset-0 z-10 rounded-2xl bg-primary flex items-center justify-center pointer-events-none transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        >
          <div
            className="rounded-full bg-white p-4 transition-transform duration-200"
            style={{ transform: `scale(${iconScale})` }}
          >
            <Check className="size-12 text-primary" strokeWidth={3} />
          </div>
        </div>
      )}

      {isDragging && showLeftOverlay && (
        <div
          className="absolute inset-0 z-10 rounded-2xl bg-red-500 flex items-center justify-center pointer-events-none transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        >
          <div
            className="rounded-full bg-white p-4 transition-transform duration-200"
            style={{ transform: `scale(${iconScale})` }}
          >
            <X className="size-12 text-red-500" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Card with transform */}
      <div
        className={cn(
          'transition-all',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
        onDragStart={(e) => e.preventDefault()}
        style={{
          opacity: isEntering ? 0 : 1,
          transform: isEntering
            ? 'translateX(100px) scale(0.95)'
            : `translateX(${offsetX}px) rotate(${rotation}deg)`,
          transition: isEntering
            ? 'opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : isDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: isDragging ? 'none' : 'auto',
        }} // Prevent default drag behavior
        {...handlers}
      >
        {children}
      </div>
    </div>
  );
}
