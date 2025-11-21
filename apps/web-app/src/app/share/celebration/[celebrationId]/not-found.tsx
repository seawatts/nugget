import { H2, P } from '@nugget/ui/custom/typography';
import Link from 'next/link';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="gap-6 grid">
          {/* Header */}
          <Link
            className="inline-block mx-auto hover:opacity-80 transition-opacity"
            href="/"
          >
            <H2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {siteConfig.name}
            </H2>
          </Link>

          {/* Error message */}
          <div className="gap-4 grid">
            <div className="text-6xl font-bold text-muted-foreground">404</div>
            <H2 className="text-3xl font-bold">Celebration Not Found</H2>
            <P variant="muted">
              This celebration link may be invalid or no longer available.
            </P>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Link
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
              href="/"
            >
              Go Home
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
              href="/sign-up"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
