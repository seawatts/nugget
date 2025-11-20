import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function FamilyMemberPage({ params }: PageProps) {
  const { userId } = await params;
  redirect(`/app/family/${userId}/dashboard`);
}
