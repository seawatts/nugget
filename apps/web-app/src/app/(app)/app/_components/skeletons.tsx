export function CelebrationsSkeleton() {
  return (
    <div className="mb-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <div className="relative p-6 gap-6 grid">
        {/* Header skeleton - this will be replaced with actual title */}
        <div className="text-center gap-2 grid animate-pulse">
          <div className="h-9 bg-muted/30 rounded-lg w-3/4 mx-auto" />
          <div className="h-5 bg-muted/30 rounded w-1/2 mx-auto" />
        </div>

        {/* Everything else will show as actual content with inline loading for AI */}
        <div className="grid gap-6">
          <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
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

export function DevelopmentalPhasesSkeleton() {
  const placeholders = ['current-phase', 'upcoming-phase'];
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-5 bg-muted/30 rounded animate-pulse" />
        <div className="h-6 bg-muted/30 rounded w-40 animate-pulse" />
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {placeholders.map((key) => (
          <div
            className="w-[340px] sm:w-96 h-[560px] bg-muted/30 rounded-3xl animate-pulse shrink-0"
            key={key}
          />
        ))}
      </div>
    </div>
  );
}
