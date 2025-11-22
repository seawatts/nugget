import { db } from '@nugget/db/client';
import { Babies, CelebrationMemories } from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
import { eq } from 'drizzle-orm';
import { ImageResponse } from 'next/og';

import { CELEBRATION_MILESTONES } from '~/app/(app)/app/_components/celebrations/celebration-milestones';
import { NuggetOgBackground } from '~/components/og/nugget-og-background';
import { NUGGET_COLORS, OG_SIZE } from '~/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Celebration';
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ celebrationId: string }>;
}) {
  const { celebrationId } = await params;

  // Fetch celebration memory directly from database (Edge-compatible)
  const [memory] = await db
    .select()
    .from(CelebrationMemories)
    .where(eq(CelebrationMemories.id, celebrationId))
    .limit(1);

  if (!memory) {
    // Return a default "not found" image with nugget styling
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          height: '100%',
          position: 'relative',
          width: '100%',
        }}
      >
        <NuggetOgBackground height={OG_SIZE.height} width={OG_SIZE.width} />
        <div
          style={{
            alignItems: 'center',
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: 60,
            fontWeight: 'bold',
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          Celebration Not Found
        </div>
      </div>,
      {
        ...size,
      },
    );
  }

  // Fetch baby data directly from database
  const [babyData] = await db
    .select()
    .from(Babies)
    .where(eq(Babies.id, memory.babyId))
    .limit(1);

  if (!babyData || !babyData.birthDate) {
    // Return a default "not found" image with nugget styling
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          height: '100%',
          position: 'relative',
          width: '100%',
        }}
      >
        <NuggetOgBackground height={OG_SIZE.height} width={OG_SIZE.width} />
        <div
          style={{
            alignItems: 'center',
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: 60,
            fontWeight: 'bold',
            height: '100%',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          Celebration Not Found
        </div>
      </div>,
      {
        ...size,
      },
    );
  }

  // Calculate age and find milestone
  const ageInDays = differenceInDays(new Date(), new Date(babyData.birthDate));
  const milestone = CELEBRATION_MILESTONES.find(
    (m) => m.type === memory.celebrationType,
  );

  // Build celebration data
  const celebration = {
    ageLabel: milestone?.ageLabel || `${ageInDays} days old`,
    babyName: babyData.firstName || 'Baby',
    photoUrls: (memory.photoUrls as string[]) || [],
    title: milestone?.title || '🎉 Celebration!',
  };

  const hasPhoto = celebration.photoUrls && celebration.photoUrls.length > 0;
  const photoUrl = hasPhoto ? celebration.photoUrls[0] : null;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Nugget-themed background */}
      <NuggetOgBackground height={OG_SIZE.height} width={OG_SIZE.width} />

      {/* Content overlay */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          left: 0,
          padding: '60px',
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      >
        {/* Decorative confetti circles with amber tones */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            height: '80px',
            left: '80px',
            position: 'absolute',
            top: '80px',
            width: '80px',
          }}
        />
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            height: '120px',
            position: 'absolute',
            right: '100px',
            top: '100px',
            width: '120px',
          }}
        />
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            bottom: '180px',
            height: '100px',
            left: '140px',
            position: 'absolute',
            width: '100px',
          }}
        />
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            bottom: '180px',
            height: '60px',
            position: 'absolute',
            right: '120px',
            width: '60px',
          }}
        />

        {/* Main content */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: '40px',
            justifyContent: 'center',
          }}
        >
          {/* Photo if available */}
          {photoUrl && (
            <div
              style={{
                border: `8px solid ${NUGGET_COLORS.SHELL_LIGHT}`,
                borderRadius: '50%',
                height: '220px',
                overflow: 'hidden',
                width: '220px',
              }}
            >
              <img
                alt="Baby"
                src={photoUrl}
                style={{
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
              />
            </div>
          )}

          {/* Celebration Title */}
          <div
            style={{
              color: NUGGET_COLORS.BROWN,
              display: 'flex',
              flexDirection: 'column',
              fontSize: hasPhoto ? '64px' : '80px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {celebration.title}
          </div>

          {/* Baby Name and Age */}
          <div
            style={{
              color: NUGGET_COLORS.BROWN,
              display: 'flex',
              flexDirection: 'column',
              fontSize: '32px',
              fontWeight: '600',
              opacity: 0.9,
              textAlign: 'center',
            }}
          >
            <div>{celebration.babyName}</div>
            <div
              style={{
                fontSize: '28px',
                marginTop: '8px',
                opacity: 0.8,
              }}
            >
              {celebration.ageLabel}
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            alignItems: 'center',
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: '24px',
            fontWeight: '600',
            justifyContent: 'center',
            marginTop: '40px',
            opacity: 0.8,
          }}
        >
          Nugget - Track Every Precious Moment
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
