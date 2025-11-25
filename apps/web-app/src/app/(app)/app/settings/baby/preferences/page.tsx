'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { P } from '@nugget/ui/custom/typography';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BabyPreferencesPage() {
  const router = useRouter();
  const { data: babies = [] } = api.babies.list.useQuery();

  // Redirect to main baby page - preferences are now in info drawers
  const babyId = babies[0]?.id;
  useEffect(() => {
    if (babyId) {
      router.replace(`/app/baby/${babyId}`);
    }
  }, [babyId, router]);

  return (
    <div className="flex items-center justify-center p-8 min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <P className="text-muted-foreground">
          Quick button preferences have been moved to the info drawers on the
          main baby page.
        </P>
        <P className="text-sm text-muted-foreground">
          Click the info icon on any feeding or pumping card to access
          preferences.
        </P>
        {babyId && (
          <Button onClick={() => router.push(`/app/baby/${babyId}`)}>
            Go to Baby Page
          </Button>
        )}
      </div>
    </div>
  );
}
