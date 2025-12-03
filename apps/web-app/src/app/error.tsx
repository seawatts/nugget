'use client';

import { Button } from '@nugget/ui/button';
import { H2, P } from '@nugget/ui/custom/typography';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to PostHog for tracking
    posthog.captureException(error, {
      digest: error.digest,
      source: 'error_page',
    });
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <H2>Something went wrong!</H2>
      <P className="text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </P>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
    </div>
  );
}
