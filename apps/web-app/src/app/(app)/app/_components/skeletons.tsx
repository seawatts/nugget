export function CelebrationsSkeleton() {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card/50 p-6 animate-pulse">
      <div className="h-8 bg-muted/30 rounded w-3/4 mb-4" />
      <div className="h-20 bg-muted/30 rounded" />
    </div>
  );
}

export function TodaySummarySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 animate-pulse">
      <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <div className="h-16 bg-muted/30 rounded" />
        <div className="h-16 bg-muted/30 rounded" />
        <div className="h-16 bg-muted/30 rounded" />
        <div className="h-16 bg-muted/30 rounded" />
        <div className="h-16 bg-muted/30 rounded" />
        <div className="h-16 bg-muted/30 rounded" />
      </div>
    </div>
  );
}

export function ActivityCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
      <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
      <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
      <div className="h-32 bg-muted/30 rounded-xl animate-pulse" />
    </div>
  );
}

export function LearningCarouselSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-5 bg-muted/30 rounded animate-pulse" />
        <div className="h-6 bg-muted/30 rounded w-24 animate-pulse" />
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        <div className="w-[340px] sm:w-96 h-64 bg-muted/30 rounded-xl animate-pulse shrink-0" />
        <div className="w-[340px] sm:w-96 h-64 bg-muted/30 rounded-xl animate-pulse shrink-0" />
      </div>
    </div>
  );
}

export function MilestonesCarouselSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-5 bg-muted/30 rounded animate-pulse" />
        <div className="h-6 bg-muted/30 rounded w-28 animate-pulse" />
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        <div className="w-[340px] sm:w-96 h-64 bg-muted/30 rounded-xl animate-pulse shrink-0" />
        <div className="w-[340px] sm:w-96 h-64 bg-muted/30 rounded-xl animate-pulse shrink-0" />
      </div>
    </div>
  );
}

export function ActivityTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div className="h-20 bg-muted/30 rounded-xl animate-pulse" key={i} />
      ))}
    </div>
  );
}
