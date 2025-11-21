import { H2, P } from '@nugget/ui/custom/typography';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicCelebrationData } from '~/app/(app)/app/_components/celebrations/celebration-card.actions';
import { siteConfig } from '~/app/(marketing)/_lib/config';
import { PublicCelebrationCard } from './_components/public-celebration-card';

interface PageProps {
  params: Promise<{
    celebrationId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { celebrationId } = await params;
  const celebration = await getPublicCelebrationData(celebrationId);

  if (!celebration) {
    return {
      description: 'Celebration not found',
      title: 'Celebration Not Found',
    };
  }

  const description = `${celebration.babyName} just reached an amazing milestone! ${celebration.title}`;
  const imageUrl = `${siteConfig.url}/share/celebration/${celebrationId}/opengraph-image`;

  return {
    description,
    openGraph: {
      description,
      images: [
        {
          alt: celebration.title,
          height: 630,
          url: imageUrl,
          width: 1200,
        },
      ],
      siteName: siteConfig.name,
      title: celebration.title,
      type: 'website',
      url: `${siteConfig.url}/share/celebration/${celebrationId}`,
    },
    title: `${celebration.title} - ${siteConfig.name}`,
    twitter: {
      card: 'summary_large_image',
      description,
      images: [imageUrl],
      title: celebration.title,
    },
  };
}

export default async function ShareCelebrationPage({ params }: PageProps) {
  const { celebrationId } = await params;
  const celebration = await getPublicCelebrationData(celebrationId);

  if (!celebration) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 gap-4 grid">
          <Link
            className="inline-block mx-auto hover:opacity-80 transition-opacity"
            href="/"
          >
            <H2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {siteConfig.name}
            </H2>
          </Link>
          <P size="sm" variant="muted">
            A milestone worth celebrating
          </P>
        </div>

        {/* Celebration Card */}
        <PublicCelebrationCard celebration={celebration} />

        {/* CTA Section */}
        <div className="mt-8 text-center p-6 rounded-lg border border-border bg-card gap-4 grid">
          <H2 className="text-xl font-semibold">
            Create your own celebrations
          </H2>
          <P size="sm" variant="muted">
            Track your baby&apos;s milestones and share special moments with
            family
          </P>
          <div className="flex gap-3 justify-center">
            <Link
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
              href="/sign-up"
            >
              Get Started Free
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
              href="/"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <P size="xs" variant="muted">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </P>
        </footer>
      </div>
    </div>
  );
}
