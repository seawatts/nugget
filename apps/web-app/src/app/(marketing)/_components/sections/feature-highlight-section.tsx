/* eslint-disable @next/next/no-img-element */
'use client';

import { buttonVariants } from '@nugget/ui/components/button';
import { cn } from '@nugget/ui/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Section } from '~/app/(marketing)/_components/section';
import { easeOutCubic } from '~/app/(marketing)/_lib/animation';
import { siteConfig } from '~/app/(marketing)/_lib/config';

interface FeatureProps {
  title: string;
  description: string;
  imageSrc: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
}

function Feature({
  title,
  description,
  imageSrc,
  direction,
  isActive,
}: FeatureProps) {
  const isLTR = direction === 'ltr';
  const textVariants = {
    hidden: { opacity: 0, x: isLTR ? -20 : 20 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: easeOutCubic,
        staggerChildren: 0.15,
      },
      x: 0,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: isLTR ? -10 : 10 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easeOutCubic,
      },
      x: 0,
    },
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-between pb-10 transition-all duration-500 ease-out',
        isLTR ? 'lg:flex-row' : 'lg:flex-row-reverse',
      )}
    >
      <motion.div
        animate={isActive ? 'visible' : 'hidden'}
        className={cn(
          'w-full lg:w-1/2 mb-10 lg:mb-0',
          isLTR ? 'lg:pr-8' : 'lg:pl-8',
        )}
        initial="hidden"
        variants={textVariants}
      >
        <div className="flex flex-col gap-4 max-w-sm text-center lg:text-left mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
            variants={itemVariants}
          >
            {title}
          </motion.h2>
          <motion.p className="text-xl md:text-2xl" variants={itemVariants}>
            {description}
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'rounded-full group text-lg bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding text-foreground hover:scale-105 active:scale-95 transition-transform',
                'mx-auto lg:mx-0',
              )}
              href="/app"
            >
              {siteConfig.cta}
            </Link>
          </motion.div>
        </div>
      </motion.div>
      <div className="w-full lg:w-1/2">
        <div className="w-full max-w-[300px] mx-auto relative aspect-[9/16]">
          <Image alt={title} className="object-contain" fill src={imageSrc} />
        </div>
      </div>
    </motion.div>
  );
}

export function FeatureHighlight() {
  const features = siteConfig.featureHighlight || [];

  const [activeFeature, setActiveFeature] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (container) {
        const { top, bottom } = container.getBoundingClientRect();
        const middleOfScreen = window.innerHeight / 2;
        const featureHeight = (bottom - top) / features.length;

        const activeIndex = Math.floor((middleOfScreen - top) / featureHeight);
        setActiveFeature(
          Math.max(-1, Math.min(features.length - 1, activeIndex)),
        );
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [features.length]);

  if (features.length === 0) {
    return null;
  }

  return (
    <Section
      className="container px-10 mx-auto max-w-[var(--max-container-width)]"
      id="feature-highlight"
      ref={containerRef}
      subtitle="Powerful features"
      title="Features"
    >
      {features.map((feature, index) => (
        <Feature
          isActive={activeFeature === index}
          key={feature.title || index}
          {...feature}
        />
      ))}
    </Section>
  );
}
