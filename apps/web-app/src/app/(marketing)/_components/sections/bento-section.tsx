/* eslint-disable @next/next/no-img-element */
'use client';

import { cn } from '@nugget/ui/lib/utils';
import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import { useRef } from 'react';
import { Section } from '~/app/(marketing)/_components/section';
import { easeInOutCubic } from '~/app/(marketing)/_lib/animation';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function BentoGrid() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    target: ref,
  });

  const opacities = [
    useTransform(scrollYProgress, [0, 0.1, 0.3], [0, 0, 1], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.2, 0.4], [0, 0, 1], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 0, 1], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.4, 0.6], [0, 0, 1], {
      ease: easeInOutCubic,
    }),
  ];

  const yTransforms = [
    useTransform(scrollYProgress, [0, 0.1, 0.3], [100, 100, 0], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.2, 0.4], [100, 100, 0], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.3, 0.5], [100, 100, 0], {
      ease: easeInOutCubic,
    }),
    useTransform(scrollYProgress, [0, 0.4, 0.6], [100, 100, 0], {
      ease: easeInOutCubic,
    }),
  ];

  const bentoItems = siteConfig.bento || [];

  return (
    <Section
      className="mx-auto max-w-screen-md px-10"
      id="bento"
      ref={ref}
      subtitle="It does a lot of things"
      title="Benefits"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bentoItems.map((bentoItem, index) => (
          <motion.div
            className={cn(
              'bg-muted p-4 sm:p-6 !pb-0 rounded-3xl grid grid-rows-1',
              bentoItem.fullWidth && 'md:col-span-2',
            )}
            key={bentoItem.title || index}
            style={{ opacity: opacities[index], y: yTransforms[index] }}
          >
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                {bentoItem.title}
              </h2>
              <p className="text-sm sm:text-base text-foreground mb-4">
                {bentoItem.content}
              </p>
            </div>
            <div
              className={cn(
                'flex justify-center',
                bentoItem.fullWidth && 'sm:space-x-4',
              )}
            >
              <div className="w-full h-64 sm:h-96 rounded-xl relative overflow-hidden">
                <Image
                  alt={bentoItem.imageAlt}
                  className="object-cover object-top"
                  fill
                  src={bentoItem.imageSrc}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
