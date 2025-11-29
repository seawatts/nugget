/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from '@nugget/ui/components/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { Section } from '~/app/(marketing)/_components/section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Benefits() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ behavior: 'smooth', left: -300 });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ behavior: 'smooth', left: 300 });
    }
  };

  return (
    <Section
      className="bg-muted relative max-w-screen"
      subtitle={`What you can do with ${siteConfig.name}`}
      title="Benefits"
    >
      <div
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollContainerRef}
      >
        {/* Add empty div for extra gap on desktop */}
        <div
          aria-hidden="true"
          className="hidden md:block flex-shrink-0 w-[calc(90%-1rem)] md:w-1/3 lg:w-1/3 xl:w-1/4 snap-start select-none px-4"
        />
        {siteConfig.benefits.map((benefit, _index) => (
          <div
            className="flex-shrink-0 w-[calc(90%-1rem)] md:w-1/3 lg:w-1/3 xl:w-1/4 snap-center md:snap-start select-none px-4"
            key={benefit.id}
          >
            <div className="h-[500px] relative rounded-xl overflow-hidden">
              <Image
                alt={benefit.text}
                className="object-cover transition-all duration-500 ease-out object-[0px_10px] hover:object-top"
                fill
                src={benefit.image}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-muted to-transparent pointer-events-none" />
            </div>
            <div className="mt-4">
              <h2 className="text-balance text-xl tracking-tight font-semibold leading-[1.25] text-left text-foreground/80 dark:text-foreground/90">
                {benefit.text}
              </h2>
            </div>
          </div>
        ))}
        {/* Add empty div for extra gap on desktop */}
        <div
          aria-hidden="true"
          className="hidden md:block flex-shrink-0 w-1/3 lg:w-1/3 xl:w-1/4 snap-start"
        />
      </div>
      <div className="flex justify-center md:justify-end mt-4 md:mt-8 md:pr-32">
        <div className="flex gap-4">
          <Button
            className="size-8 rounded-full"
            onClick={scrollPrev}
            size="icon"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <Button
            className="size-8 rounded-full"
            onClick={scrollNext}
            size="icon"
            variant="outline"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next slide</span>
          </Button>
        </div>
      </div>
    </Section>
  );
}
