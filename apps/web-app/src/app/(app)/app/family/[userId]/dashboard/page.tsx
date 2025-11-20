import { ParentDashboard } from '~/app/(app)/app/_components/parent/parent-dashboard';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function ParentDashboardPage({ params }: PageProps) {
  const { userId } = await params;

  return <ParentDashboard userId={userId} />;
}
