import { getApi } from '@nugget/api/server';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { H2, P } from '@nugget/ui/custom/typography';
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
} from 'date-fns';
import Link from 'next/link';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

function getBabyAge(birthDate: Date) {
  const now = new Date();
  const days = differenceInDays(now, birthDate);
  const weeks = differenceInWeeks(now, birthDate);
  const months = differenceInMonths(now, birthDate);

  if (days < 14) {
    return `${days} ${days === 1 ? 'day' : 'days'} old`;
  }
  if (weeks < 8) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
  }
  return `${months} ${months === 1 ? 'month' : 'months'} old`;
}

export default async function BabiesPage() {
  const api = await getApi();

  // Get all babies in the family
  const babies = await api.babies.list();

  if (!babies || babies.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icons.Baby className="text-primary" size="xl" />
            </div>
          </div>

          <div className="space-y-2">
            <H2>No Babies Yet</H2>
            <P className="text-muted-foreground">
              Add your first baby to get started with tracking.
            </P>
          </div>

          <Link className="block" href="/app/onboarding">
            <Button className="w-full" size="lg">
              <Icons.Plus className="mr-2" size="sm" />
              Add Your First Baby
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <H2>Your Babies</H2>
            <P className="text-muted-foreground">
              Select a baby to view their dashboard
            </P>
          </div>
          <Link href="/app/onboarding">
            <Button size="sm">
              <Icons.Plus className="mr-2" size="sm" />
              Add Baby
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {babies.map((baby) => (
            <Link href={`/app/babies/${baby.id}`} key={baby.id}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-4">
                  <NuggetAvatar
                    backgroundColor={baby.avatarBackgroundColor || undefined}
                    image={
                      !baby.avatarBackgroundColor && baby.photoUrl
                        ? baby.photoUrl
                        : undefined
                    }
                    name={baby.firstName}
                    size="lg"
                  />
                  <div className="space-y-1">
                    <H2 className="text-lg">{baby.firstName}</H2>
                    <P className="text-sm text-muted-foreground">
                      {getBabyAge(new Date(baby.birthDate))}
                    </P>
                  </div>
                  <Button className="w-full" variant="outline">
                    View Dashboard
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
