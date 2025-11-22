#!/usr/bin/env bun

/**
 * Generate PWA icons with Nugget branding
 * Uses the chicken nugget avatar styling with wavy shell pattern
 *
 * Run with: bun run scripts/generate-icons.ts
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const NUGGET_COLORS = {
  AMBER: '#FBBF24',
  BROWN: '#78350F',
  SHELL_DARK: '#E8DFD0',
  SHELL_LIGHT: '#F8F3EB',
  SHELL_MID: '#F2EBE0',
} as const;

const OUTPUT_DIR = join(import.meta.dir, '../public');

interface IconSize {
  size: number;
  filename: string;
  includeShell: boolean;
}

const ICON_SIZES: IconSize[] = [
  { filename: 'android-chrome-512x512.png', includeShell: true, size: 512 },
  { filename: 'android-chrome-192x192.png', includeShell: true, size: 192 },
  { filename: 'apple-touch-icon.png', includeShell: true, size: 180 },
  { filename: 'favicon-32x32.png', includeShell: false, size: 32 },
  { filename: 'favicon-16x16.png', includeShell: false, size: 16 },
];

/**
 * Generate SVG for nugget icon with optional wavy shell
 */
function generateNuggetIconSvg(size: number, includeShell: boolean): string {
  const center = size / 2;
  const radius = size / 2;

  // Letter 'N' dimensions
  const letterSize = size * 0.45;
  const fontSize = letterSize;

  // Wavy shell path (starting at 70% height)
  const shellStartY = size * 0.7;
  const waveHeight = size * 0.02;
  const waveCount = 8;
  const waveWidth = size / waveCount;

  let wavePath = `M 0 ${shellStartY}`;
  for (let i = 0; i <= waveCount; i++) {
    const x = i * waveWidth;
    const y = shellStartY + (i % 2 === 0 ? 0 : waveHeight);
    wavePath += ` L ${x} ${y}`;
  }
  wavePath += ` L ${size} ${size} L 0 ${size} Z`;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle-clip">
      <circle cx="${center}" cy="${center}" r="${radius}" />
    </clipPath>
    <radialGradient id="shell-gradient" cx="50%" cy="90%" r="60%">
      <stop offset="0%" stop-color="${NUGGET_COLORS.SHELL_LIGHT}" />
      <stop offset="40%" stop-color="${NUGGET_COLORS.SHELL_MID}" />
      <stop offset="100%" stop-color="${NUGGET_COLORS.SHELL_DARK}" />
    </radialGradient>
  </defs>

  <g clip-path="url(#circle-clip)">
    <!-- Main amber background -->
    <circle cx="${center}" cy="${center}" r="${radius}" fill="${NUGGET_COLORS.AMBER}" />

    ${
      includeShell
        ? `
    <!-- Wavy shell pattern -->
    <path d="${wavePath}" fill="url(#shell-gradient)" opacity="0.9" />

    <!-- Shell highlight -->
    <path d="M 0 ${shellStartY} ${wavePath
      .split('L')
      .slice(0, waveCount + 1)
      .join(' L')}"
          fill="none"
          stroke="white"
          stroke-width="${size * 0.008}"
          opacity="0.5" />
    `
        : ''
    }

    <!-- Letter 'N' -->
    <text
      x="${center}"
      y="${center * 1.15}"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="${NUGGET_COLORS.BROWN}"
      text-anchor="middle"
      dominant-baseline="middle"
    >N</text>
  </g>
</svg>
  `.trim();
}

/**
 * Generate all icon sizes
 */
async function generateIcons() {
  console.log('🥘 Generating Nugget PWA icons...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const { size, filename, includeShell } of ICON_SIZES) {
    const svgContent = generateNuggetIconSvg(size, includeShell);
    const outputPath = join(OUTPUT_DIR, filename);

    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png({ compressionLevel: 9, quality: 100 })
        .toFile(outputPath);

      console.log(`✅ Generated ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error);
      throw error;
    }
  }

  // Generate favicon.ico with multiple sizes
  console.log('\n🔨 Generating favicon.ico...');
  try {
    const svg32 = generateNuggetIconSvg(32, false);

    // Generate ICO file with 32x32 size
    // Note: sharp doesn't support ICO format directly, so we create 32x32 and name it .ico
    await sharp(Buffer.from(svg32))
      .resize(32, 32)
      .png()
      .toFile(join(OUTPUT_DIR, 'favicon.ico'));

    console.log('✅ Generated favicon.ico');
  } catch (error) {
    console.error('❌ Failed to generate favicon.ico:', error);
    throw error;
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Run the generator
generateIcons().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
