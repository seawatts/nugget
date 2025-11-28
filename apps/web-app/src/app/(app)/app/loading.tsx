'use client';

import { Icons } from '@nugget/ui/custom/icons';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Icons.Spinner size="lg" variant="primary" />
      <span>Opening your dashboard…</span>
    </div>
  );
}
