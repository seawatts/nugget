'use client';

import { Button } from '@nugget/ui/components/button';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';
import { Section } from '~/app/(marketing)/_components/section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Pricing() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    target: ref,
  });

  const opacities = [
    useTransform(scrollYProgress, [0, 0.1, 0.3], [0, 0, 1]),
    useTransform(scrollYProgress, [0, 0.2, 0.4], [0, 0, 1]),
  ];

  const yTransforms = [
    useTransform(scrollYProgress, [0, 0.1, 0.3], [100, 100, 0]),
    useTransform(scrollYProgress, [0, 0.2, 0.4], [100, 100, 0]),
  ];

  const pricingPlans = siteConfig.pricing?.pricingItems || [];

  // Only show first 2 plans for template style
  const displayPlans = pricingPlans.slice(0, 2);

  return (
    <Section
      className="container px-10 mx-auto max-w-[var(--max-container-width)]"
      id="pricing"
      ref={ref}
      subtitle="simple pricing"
      title="Pricing"
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto py-10">
        {displayPlans.map((plan, index) => (
          <motion.div
            className="bg-muted/60 p-6 rounded-3xl grid grid-rows-[auto_auto_1fr_auto]"
            key={plan.name}
            style={{ opacity: opacities[index], y: yTransforms[index] }}
          >
            <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
            <div className="text-4xl font-bold mb-2 text-activity-nail-trimming">
              {plan.price}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.period}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {plan.description}
            </p>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, featureIndex) => (
                <div
                  className="flex items-center"
                  key={feature || featureIndex}
                >
                  <CheckIcon className="w-5 h-5 mr-2 text-activity-nail-trimming" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button
              asChild
              className="rounded-full bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding text-foreground hover:scale-105 active:scale-95 transition-transform"
              size="sm"
              variant={'default'}
            >
              <Link href={plan.href || '/app'}>
                Get Started
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
