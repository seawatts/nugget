'use client';

import { Skeleton } from '@nugget/ui/components/skeleton';

/**
 * Skeleton loading state for the feeding drawer
 * Matches the layout of the feeding type selector to prevent layout jump
 */
export function FeedingDrawerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title and description skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-7 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>

      {/* Three card button skeletons matching the feeding type selector */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((index) => (
          <div
            className="p-4 rounded-xl border-2 border-transparent"
            key={index}
          >
            <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-4 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
