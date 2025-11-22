// Utility functions and constants for OG images with Nugget branding

export const NUGGET_COLORS = {
  AMBER: '#FBBF24',
  BROWN: '#78350F',
  SHELL_DARK: '#E8DFD0',
  SHELL_LIGHT: '#F8F3EB',
  SHELL_MID: '#F2EBE0',
} as const;

export const OG_SIZE = {
  height: 630,
  width: 1200,
} as const;

// SVG path for the wavy shell pattern (simplified for OG rendering)
export function getWavyShellPath(width: number, height: number) {
  // Start at 70% height and create wavy pattern to bottom
  const startY = height * 0.7;
  const waveHeight = 10;
  const waveCount = 10;
  const waveWidth = width / waveCount;

  let path = `M 0 ${startY}`;

  // Create waves
  for (let i = 0; i <= waveCount; i++) {
    const x = i * waveWidth;
    const y = startY + (i % 2 === 0 ? 0 : waveHeight);
    path += ` L ${x} ${y}`;
  }

  // Close path to bottom
  path += ` L ${width} ${height} L 0 ${height} Z`;

  return path;
}

// Generate radial gradient for shell effect
export function getShellGradient(id: string) {
  return `
    <defs>
      <radialGradient id="${id}" cx="50%" cy="90%" r="60%">
        <stop offset="0%" stop-color="${NUGGET_COLORS.SHELL_LIGHT}" stop-opacity="1" />
        <stop offset="40%" stop-color="${NUGGET_COLORS.SHELL_MID}" stop-opacity="1" />
        <stop offset="100%" stop-color="${NUGGET_COLORS.SHELL_DARK}" stop-opacity="1" />
      </radialGradient>
    </defs>
  `;
}

// Create circular avatar with nugget styling
export function getNuggetAvatarCircle(
  centerX: number,
  centerY: number,
  radius: number,
  options: {
    backgroundColor?: string;
    borderWidth?: number;
    showShell?: boolean;
  } = {},
) {
  const {
    backgroundColor = NUGGET_COLORS.AMBER,
    borderWidth = 4,
    showShell = true,
  } = options;

  const shellStartY = centerY + radius * 0.4;
  const shellPath = showShell
    ? `M ${centerX - radius} ${shellStartY}
       L ${centerX - radius * 0.7} ${shellStartY + 10}
       L ${centerX - radius * 0.4} ${shellStartY}
       L ${centerX - radius * 0.1} ${shellStartY + 12}
       L ${centerX + radius * 0.2} ${shellStartY}
       L ${centerX + radius * 0.5} ${shellStartY + 10}
       L ${centerX + radius * 0.8} ${shellStartY}
       L ${centerX + radius} ${shellStartY + 8}
       Q ${centerX + radius} ${centerY + radius} ${centerX} ${centerY + radius}
       Q ${centerX - radius} ${centerY + radius} ${centerX - radius} ${shellStartY}
       Z`
    : '';

  return {
    backgroundColor,
    borderWidth,
    radius,
    shellPath,
  };
}

// Font styles for OG images
export const OG_FONTS = {
  body: {
    fontSize: 32,
    fontWeight: 'normal',
  },
  small: {
    fontSize: 24,
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: 40,
    fontWeight: '600',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    lineHeight: 1.2,
  },
} as const;
