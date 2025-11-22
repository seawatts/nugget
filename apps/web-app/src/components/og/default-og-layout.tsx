import { NUGGET_COLORS, OG_SIZE } from '~/lib/og-utils';
import { NuggetOgBackground } from './nugget-og-background';

interface DefaultOgLayoutProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  avatarLetter?: string;
  footer?: string;
  showShell?: boolean;
}

/**
 * Default layout for OG images with Nugget branding
 * Supports optional avatar/photo display
 */
export function DefaultOgLayout({
  title,
  subtitle,
  avatarUrl,
  avatarLetter,
  footer = 'Nugget - Track Every Precious Moment',
  showShell = true,
}: DefaultOgLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Background */}
      <NuggetOgBackground
        height={OG_SIZE.height}
        showShell={showShell}
        width={OG_SIZE.width}
      />

      {/* Content overlay */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 40,
          justifyContent: 'center',
          left: 0,
          padding: '80px 100px',
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      >
        {/* Avatar/Photo if provided */}
        {(avatarUrl || avatarLetter) && (
          <div
            style={{
              alignItems: 'center',
              border: '6px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              display: 'flex',
              height: 200,
              justifyContent: 'center',
              overflow: 'hidden',
              width: 200,
            }}
          >
            {avatarUrl ? (
              <img
                alt="Avatar"
                height={200}
                src={avatarUrl}
                style={{
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
                width={200}
              />
            ) : (
              <div
                style={{
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  color: NUGGET_COLORS.BROWN,
                  display: 'flex',
                  fontSize: 96,
                  fontWeight: 'bold',
                  height: '100%',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {avatarLetter}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: avatarUrl || avatarLetter ? 64 : 80,
            fontWeight: 'bold',
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {title}
        </div>

        {/* Subtitle if provided */}
        {subtitle && (
          <div
            style={{
              color: `${NUGGET_COLORS.BROWN}cc`,
              display: 'flex',
              fontSize: 36,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Footer branding */}
      {footer && (
        <div
          style={{
            alignItems: 'center',
            bottom: 40,
            color: NUGGET_COLORS.BROWN,
            display: 'flex',
            fontSize: 28,
            fontWeight: '600',
            justifyContent: 'center',
            left: 0,
            opacity: 0.8,
            position: 'absolute',
            width: '100%',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
