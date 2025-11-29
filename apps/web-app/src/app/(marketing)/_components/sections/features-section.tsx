import Link from 'next/link';
import { Section } from '~/app/(marketing)/_components/section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Features() {
  const services = siteConfig.features || [];

  if (services.length === 0) {
    return null;
  }

  return (
    <Section
      className="max-w-screen-lg mx-auto container px-10"
      id="features"
      subtitle="Powerful features"
      title="Features"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(({ name, description, icon: Icon }, index) => (
          <div
            className="rounded-lg overflow-hidden bg-card p-6 flex flex-col items-center text-center"
            key={name || index}
          >
            <div className="flex flex-col items-center gap-y-4 mb-4">
              <div className="p-2 rounded-lg text-foreground bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding">
                {Icon}
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">
                {name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Link
              className="text-sm hover:underline text-activity-nail-trimming"
              href="/app"
            >
              Learn more &gt;
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
