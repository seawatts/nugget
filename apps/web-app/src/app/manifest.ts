import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#FBBF24', // Nugget amber color
    categories: ['health', 'lifestyle', 'productivity'],
    description:
      "Your complete parenting journey companion - from trying to conceive to tracking your baby's milestones. Track your cycle, follow your pregnancy week by week, and monitor your baby's feeding, sleep, and milestones.",
    display: 'standalone',
    icons: [
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: '/android-chrome-192x192.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/android-chrome-512x512.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '192x192',
        src: '/android-chrome-192x192.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: '/android-chrome-512x512.png',
        type: 'image/png',
      },
      {
        sizes: '180x180',
        src: '/apple-touch-icon.png',
        type: 'image/png',
      },
      {
        sizes: '32x32',
        src: '/favicon-32x32.png',
        type: 'image/png',
      },
      {
        sizes: '16x16',
        src: '/favicon-16x16.png',
        type: 'image/png',
      },
    ],
    name: 'Nugget - Your Parenting Journey Companion',
    orientation: 'portrait',
    // @ts-expect-error - permissions not in MetadataRoute.Manifest type yet
    permissions: ['notifications'],
    scope: '/',
    screenshots: [],
    short_name: 'Nugget',
    shortcuts: [
      {
        description: 'Log a new baby activity',
        icons: [
          {
            sizes: '192x192',
            src: '/android-chrome-192x192.png',
          },
        ],
        name: 'Log Activity',
        short_name: 'Activity',
        url: '/app',
      },
      {
        description: 'View activity timeline',
        icons: [
          {
            sizes: '192x192',
            src: '/android-chrome-192x192.png',
          },
        ],
        name: 'Timeline',
        short_name: 'Timeline',
        url: '/app/timeline',
      },
      {
        description: 'View baby insights and patterns',
        icons: [
          {
            sizes: '192x192',
            src: '/android-chrome-192x192.png',
          },
        ],
        name: 'Insights',
        short_name: 'Insights',
        url: '/app/insights',
      },
    ],
    start_url: '/app',
    theme_color: '#FBBF24', // Nugget amber color
  };
}
