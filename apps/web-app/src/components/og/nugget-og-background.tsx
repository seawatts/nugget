import { getWavyShellPath, NUGGET_COLORS } from '~/lib/og-utils';

interface NuggetOgBackgroundProps {
  width: number;
  height: number;
  showShell?: boolean;
  backgroundColor?: string;
}

/**
 * Background component with Nugget branding (wavy shell pattern)
 * Designed for use in Next.js OG Image generation
 */
export function NuggetOgBackground({
  width,
  height,
  showShell = true,
  backgroundColor = NUGGET_COLORS.AMBER,
}: NuggetOgBackgroundProps) {
  const shellPath = getWavyShellPath(width, height);
  const gradientId = 'shell-gradient-bg';

  return (
    <div
      style={{
        background: backgroundColor,
        display: 'flex',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      {showShell && (
        <svg
          aria-label="Nugget shell pattern background"
          height={height}
          style={{
            bottom: 0,
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
          width={width}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Nugget shell pattern background</title>
          <defs>
            <radialGradient cx="50%" cy="90%" id={gradientId} r="60%">
              <stop
                offset="0%"
                stopColor={NUGGET_COLORS.SHELL_LIGHT}
                stopOpacity="1"
              />
              <stop
                offset="40%"
                stopColor={NUGGET_COLORS.SHELL_MID}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={NUGGET_COLORS.SHELL_DARK}
                stopOpacity="1"
              />
            </radialGradient>

            {/* Shadow for depth */}
            <filter id="shell-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA slope="0.2" type="linear" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Shadow layer */}
          <path
            d={shellPath}
            fill="rgba(0, 0, 0, 0.05)"
            transform="translate(0, 3)"
          />

          {/* Main shell pattern */}
          <path
            d={shellPath}
            fill={`url(#${gradientId})`}
            filter="url(#shell-shadow)"
          />

          {/* Highlight on top edge */}
          <path
            d={`M 0 ${height * 0.7} ${(shellPath.split('L')[0] || '').replace('M 0', 'L')}`}
            fill="none"
            opacity="0.4"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      )}
    </div>
  );
}
