/* eslint-disable @next/next/no-img-element */

import { buttonVariants } from '@nugget/ui/components/button';
import { cn } from '@nugget/ui/lib/utils';
import { ChevronRight, HeartHandshake } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Marquee from '~/app/(marketing)/_components/ui/marquee';
import { siteConfig } from '~/app/(marketing)/_lib/config';

// Transform testimonials to review format
const getReviews = () => {
  const testimonials = siteConfig.testimonials || [];
  return testimonials.slice(0, 6).map((testimonial, _index) => ({
    body:
      typeof testimonial.description === 'string'
        ? testimonial.description
        : testimonial.description?.toString() || '',
    img: testimonial.img,
    name: testimonial.name,
    username: `@${testimonial.name.toLowerCase().replace(/\s+/g, '')}`,
  }));
};

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        'relative w-64 cursor-pointer overflow-hidden rounded-[2rem] border p-4',
        // light styles
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        // dark styles
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="relative w-8 h-8 rounded-full overflow-hidden">
          <Image alt="" className="object-cover" fill src={img} />
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export function CTASection() {
  const reviews = getReviews();
  const firstRow = reviews.slice(0, reviews.length / 2);
  const secondRow = reviews.slice(reviews.length / 2);

  return (
    <section id="cta">
      <div className="py-14">
        <div className="container flex w-full flex-col items-center justify-center p-4 mx-auto max-w-[var(--max-container-width)]">
          <div className="relative flex w-full max-w-[1000px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border p-10 py-14">
            <div className="absolute rotate-[35deg]">
              <Marquee className="[--duration:20s]" pauseOnHover repeat={3}>
                {firstRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
              <Marquee
                className="[--duration:20s]"
                pauseOnHover
                repeat={3}
                reverse
              >
                {secondRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
              <Marquee className="[--duration:20s]" pauseOnHover repeat={3}>
                {firstRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
              <Marquee
                className="[--duration:20s]"
                pauseOnHover
                repeat={3}
                reverse
              >
                {secondRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
              <Marquee className="[--duration:20s]" pauseOnHover repeat={3}>
                {firstRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
              <Marquee
                className="[--duration:20s]"
                pauseOnHover
                repeat={3}
                reverse
              >
                {secondRow.map((review, index) => (
                  <ReviewCard key={`${review.username}-${index}`} {...review} />
                ))}
              </Marquee>
            </div>
            <div className="z-10 mx-auto size-24 rounded-[2rem] border bg-white/10 p-3 shadow-2xl backdrop-blur-md dark:bg-black/10 lg:size-32">
              <HeartHandshake className="mx-auto size-16 text-black dark:text-white lg:size-24" />
            </div>
            <div className="z-10 mt-4 flex flex-col items-center text-center text-black dark:text-white">
              <h1 className="text-3xl font-bold lg:text-4xl">
                {siteConfig.ctaSection?.title || 'Ready to Start Your Journey?'}
              </h1>
              <p className="mt-2">
                {siteConfig.ctaSection?.subtext ||
                  'Join thousands of parents tracking their journey'}
              </p>
              <Link
                className={cn(
                  buttonVariants({
                    size: 'lg',
                    variant: 'outline',
                  }),
                  'group mt-4 rounded-[2rem] px-6',
                )}
                href={siteConfig.ctaSection?.button?.href || '/app'}
              >
                {siteConfig.ctaSection?.button?.text || siteConfig.cta}
                <ChevronRight className="ml-1 size-4 transition-all duration-300 ease-out group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent to-white to-70% dark:to-black" />
          </div>
        </div>
      </div>
    </section>
  );
}

export const CTA = CTASection;
