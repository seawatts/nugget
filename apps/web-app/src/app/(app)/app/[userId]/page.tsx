import { redirect } from 'next/navigation';
import { DashboardContainer } from '~/app/(app)/app/_components/dashboard-container';
import { ParentDashboard } from '~/app/(app)/app/_components/parent-dashboard';
import { getEntityInfoAction } from './actions';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserPage({ params }: PageProps) {
  const { userId } = await params;

  // Get entity info to determine if it's a baby or user
  const result = await getEntityInfoAction({ userId });

  // If entity not found, redirect to home
  if (!result?.data) {
    redirect('/app');
  }

  const entity = result.data;

  // Render appropriate dashboard based on entity type
  if (entity.type === 'baby') {
    return <DashboardContainer />;
  }

  return <ParentDashboard userId={userId} />;
}
