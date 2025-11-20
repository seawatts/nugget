import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    babyId: string;
  }>;
}

export default async function BabyPage({ params }: PageProps) {
  const { babyId } = await params;
  redirect(`/app/babies/${babyId}/dashboard`);
}
