import { getApi } from '@nugget/api/server';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, P } from '@nugget/ui/custom/typography';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const api = await getApi();

  // Check if onboarding is complete
  const onboardingStatus = await api.onboarding.checkOnboarding();

  // Get the primary baby and redirect to their page
  const baby = await api.babies.getMostRecent();

  if (baby) {
    redirect(`/app/${baby.id}`);
  }

  // If no baby exists and onboarding is NOT complete, redirect to onboarding
  if (!onboardingStatus.completed) {
    redirect('/app/onboarding');
  }

  // Onboarding is complete but no babies exist yet
  // Show a welcome page with option to add a baby
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icons.Baby className="text-primary" size="xl" />
          </div>
        </div>

        <div className="space-y-2">
          <H2>Welcome to Your Family!</H2>
          <P className="text-muted-foreground">
            You&apos;ve successfully joined the family. There are no babies
            added yet.
          </P>
        </div>

        <div className="space-y-3">
          <Link className="block" href="/app/onboarding">
            <Button className="w-full" size="lg">
              <Icons.Plus className="mr-2" size="sm" />
              Add Your First Baby
            </Button>
          </Link>

          <P className="text-sm text-muted-foreground">
            You can also wait for other family members to add a baby
          </P>
        </div>
      </Card>
    </div>
  );
}
