import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import { Users } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

type UserRecord = typeof Users.$inferSelect;
type UserHomePreferences = Pick<
  UserRecord,
  'defaultHomeScreenId' | 'defaultHomeScreenType' | 'lastSelectedBabyId'
>;

type TimingEntry = {
  duration: number;
  label: string;
};

const getUserHomePreferences = unstable_cache(
  async (userId: string) => {
    const user = await db.query.Users.findFirst({
      columns: {
        defaultHomeScreenId: true,
        defaultHomeScreenType: true,
        lastSelectedBabyId: true,
      },
      where: eq(Users.id, userId),
    });

    return user ?? null;
  },
  ['user-home-preferences'],
  {
    revalidate: 300,
  },
);

async function timeSegment<T>(
  label: string,
  timings: TimingEntry[],
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    const entry = { duration, label };
    timings.push(entry);
    console.log(
      `[AppRedirectTiming] ${label}: ${duration.toFixed(1)}ms`,
      entry,
    );
  }
}

function flushTimingsAndRedirect(path: string, timings: TimingEntry[]): never {
  if (timings.length > 0) {
    const summary = timings
      .map((entry) => `${entry.label}=${entry.duration.toFixed(1)}ms`)
      .join(', ');
    console.log(`[AppRedirectTiming] summary -> ${summary}`);
  }
  redirect(path);
}

function resolveUserTarget(user: UserHomePreferences | null): string | null {
  if (!user) {
    return null;
  }

  if (user.defaultHomeScreenType === 'baby' && user.defaultHomeScreenId) {
    return `/app/babies/${user.defaultHomeScreenId}/dashboard`;
  }

  if (user.defaultHomeScreenType === 'user' && user.defaultHomeScreenId) {
    return `/app/family/${user.defaultHomeScreenId}`;
  }

  if (user.lastSelectedBabyId) {
    return `/app/babies/${user.lastSelectedBabyId}/dashboard`;
  }

  return null;
}

export default async function Home() {
  const timings: TimingEntry[] = [];
  const api = await getApi();
  const { userId } = await auth();

  const onboardingPromise = timeSegment(
    'api.onboarding.checkOnboarding',
    timings,
    () => api.onboarding.checkOnboarding(),
  );
  const userPreferencesPromise = userId
    ? timeSegment('db.users.homePreferences', timings, () =>
        getUserHomePreferences(userId),
      )
    : null;
  const babiesPromise = userId
    ? timeSegment('api.babies.list', timings, () => api.babies.list())
    : null;

  const onboardingStatus = await onboardingPromise;

  if (!onboardingStatus.completed) {
    flushTimingsAndRedirect('/app/onboarding', timings);
  }

  if (userId) {
    const userHomePreferences = userPreferencesPromise
      ? await userPreferencesPromise
      : null;
    const preferenceTarget = resolveUserTarget(userHomePreferences);

    if (preferenceTarget) {
      flushTimingsAndRedirect(preferenceTarget, timings);
    }

    const babies = babiesPromise ? await babiesPromise : null;
    if (babies && babies.length > 0 && babies[0]) {
      flushTimingsAndRedirect(`/app/babies/${babies[0].id}/dashboard`, timings);
    }
  }

  flushTimingsAndRedirect('/app/babies', timings);
}
