import { getApi } from '@nugget/api/server';
import { redirect } from 'next/navigation';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Get the primary baby and redirect to their page
  const api = await getApi();
  const baby = await api.babies.getMostRecent();

  if (baby) {
    redirect(`/app/${baby.id}`);
  }

  // If no baby exists, redirect to onboarding
  redirect('/app/onboarding');
}
