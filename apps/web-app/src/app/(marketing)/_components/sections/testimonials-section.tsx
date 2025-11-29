/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import { Section } from '~/app/(marketing)/_components/section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Testimonials() {
  const testimonials = siteConfig.testimonials || [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Section
      className="container px-10 mx-auto"
      subtitle="What our users say"
      title="Testimonials"
    >
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 py-10">
        {testimonials.map((testimonial, index) => (
          <div
            className="bg-muted/60 overflow-hidden rounded-3xl flex flex-col h-fit"
            key={testimonial.id || index}
            style={{
              gridRow: `span ${Math.floor((testimonial.description?.toString().length || 0) / 50) + 1}`,
            }}
          >
            <div className="px-4 py-5 sm:p-6 flex-grow">
              <div className="flex items-center mb-4">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    alt={testimonial.name}
                    className="object-cover"
                    fill
                    src={testimonial.img}
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-foreground">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <div className="text-foreground">{testimonial.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
