import { db } from '@nugget/db/client';
import { Babies } from '@nugget/db/schema';
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
} from 'date-fns';
import { eq } from 'drizzle-orm';
import { ImageResponse } from 'next/og';

import { DefaultOgLayout } from '~/components/og/default-og-layout';

export const runtime = 'edge';
export const alt = 'Baby Profile';
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = 'image/png';

function getAgeLabel(birthDate: Date): string {
  const now = new Date();
  const days = differenceInDays(now, birthDate);
  const weeks = differenceInWeeks(now, birthDate);
  const months = differenceInMonths(now, birthDate);

  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'} old`;
    }
    return `${years}y ${remainingMonths}m old`;
  }

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'} old`;
  }

  if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`;
  }

  return `${days} ${days === 1 ? 'day' : 'days'} old`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = await params;

  // Fetch baby data directly from database (Edge-compatible)
  const [baby] = await db
    .select()
    .from(Babies)
    .where(eq(Babies.id, babyId))
    .limit(1);

  if (!baby) {
    // Return a default "not found" image with nugget styling
    return new ImageResponse(
      <DefaultOgLayout subtitle="Baby not found" title="👶 Nugget" />,
      {
        ...size,
      },
    );
  }

  const babyName = baby.firstName || 'Baby';
  const ageLabel = baby.birthDate
    ? getAgeLabel(new Date(baby.birthDate))
    : 'Newborn';

  // Determine if we should show a photo or just the initial
  const hasPhoto = baby.photoUrl && !baby.avatarBackgroundColor;
  const avatarUrl = hasPhoto ? baby.photoUrl : undefined;
  const avatarLetter = !hasPhoto ? babyName.charAt(0).toUpperCase() : undefined;

  return new ImageResponse(
    <DefaultOgLayout
      avatarLetter={avatarLetter}
      avatarUrl={avatarUrl}
      footer="Nugget - Track Every Precious Moment"
      subtitle={ageLabel}
      title={`👶 ${babyName}`}
    />,
    {
      ...size,
    },
  );
}
