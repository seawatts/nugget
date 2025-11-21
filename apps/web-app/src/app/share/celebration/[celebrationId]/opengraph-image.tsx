import { ImageResponse } from 'next/og';
import { getPublicCelebrationData } from '~/app/(app)/app/_components/celebrations/celebration-card.actions';

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
  const celebration = await getPublicCelebrationData(celebrationId);

  if (!celebration) {
    // Return a default "not found" image
    return new ImageResponse(
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          fontSize: 60,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontWeight: 'bold',
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

  const hasPhoto = celebration.photoUrls && celebration.photoUrls.length > 0;
  const photoUrl = hasPhoto ? celebration.photoUrls[0] : null;

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '60px',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Decorative confetti circles */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
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
          background: 'rgba(255, 255, 255, 0.15)',
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
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          bottom: '120px',
          height: '100px',
          left: '140px',
          position: 'absolute',
          width: '100px',
        }}
      />
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          borderRadius: '50%',
          bottom: '100px',
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
              border: '8px solid rgba(255, 255, 255, 0.3)',
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
            color: 'white',
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
            color: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '32px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          <div>{celebration.babyName}</div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '28px',
              marginTop: '8px',
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
          color: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          fontSize: '24px',
          fontWeight: '600',
          justifyContent: 'center',
          marginTop: '40px',
        }}
      >
        Nugget - Track Every Precious Moment
      </div>
    </div>,
    {
      ...size,
    },
  );
}
