import { ReactScan } from '@nugget/ui/custom/react-scan';
import { ThemeProvider } from '@nugget/ui/custom/theme';
import { cn } from '@nugget/ui/lib/utils';
import { Toaster } from '@nugget/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import '@nugget/ui/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { AnalyticsProviders } from '@nugget/analytics/providers';
import { TRPCReactProvider } from '@nugget/api/react';
import { StripeProvider } from '@nugget/stripe/guards/client';
import { Suspense } from 'react';
import { env } from '~/env.server';

export const metadata: Metadata = {
  description:
    "Your complete parenting journey companion - from trying to conceive to tracking your baby's milestones",
  metadataBase: new URL(
    env.VERCEL_ENV === 'production'
      ? 'https://nugget.baby'
      : 'http://localhost:3000',
  ),
  openGraph: {
    description:
      "Track your cycle, follow your pregnancy week by week, and monitor your baby's feeding, sleep, and milestones",
    siteName: 'Nugget',
    title: 'Nugget - Your Parenting Journey Companion',
    url: 'https://nugget.baby',
  },
  title: 'Nugget - Your Parenting Journey',
  twitter: {
    card: 'summary_large_image',
    creator: '@nugget',
    site: '@nugget',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
};

const isDevelopment = process.env.NODE_ENV === 'development';

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {isDevelopment && <ReactScan />}
          <NuqsAdapter>
            <TRPCReactProvider>
              <Suspense>
                <ClerkProvider>
                  <AnalyticsProviders identifyUser>
                    <StripeProvider>
                      {props.children}
                      <Toaster />
                    </StripeProvider>
                  </AnalyticsProviders>
                </ClerkProvider>
              </Suspense>
            </TRPCReactProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
