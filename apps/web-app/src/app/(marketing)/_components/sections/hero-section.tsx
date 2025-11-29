'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import { Section } from '~/app/(marketing)/_components/section';
import { easeInOutCubic } from '~/app/(marketing)/_lib/animation';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Hero() {
  const { scrollY } = useScroll({
    offset: ['start start', 'end start'],
  });
  const y1 = useTransform(scrollY, [0, 300], [100, 0]);
  const y2 = useTransform(scrollY, [0, 300], [50, 0]);
  const y3 = useTransform(scrollY, [0, 300], [0, 0]);
  const y4 = useTransform(scrollY, [0, 300], [50, 0]);
  const y5 = useTransform(scrollY, [0, 300], [100, 0]);

  return (
    <Section className="min-h-[100vh] w-full overflow-hidden" id="hero">
      <main className="mx-auto pt-16 sm:pt-24 md:pt-32 text-center relative px-4">
        <div className="relative">
          <motion.div
            animate={{ height: '10vh', scale: 1 }}
            className="mb-16 relative z-20"
            initial={{ height: '80vh', scale: 4.5 }}
            style={{ transformOrigin: 'top' }}
            transition={{
              height: { delay: 0, duration: 1.8, ease: easeInOutCubic },
              scale: { delay: 0, duration: 1.8, ease: easeInOutCubic },
            }}
          >
            <div className="text-foreground text-xl font-bold p-4 h-20 w-20 flex items-center justify-center rounded-3xl mx-auto shadow-md bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding">
              <span className="text-4xl">🐣</span>
            </div>
          </motion.div>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 top-20 z-10"
            initial={{ opacity: 0, y: -20 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <span className="text-2xl font-bold text-foreground">
              {siteConfig.name}
            </span>
          </motion.div>
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.h1
            animate={{ opacity: 1 }}
            className="text-5xl font-bold mb-4 tracking-tighter"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: easeInOutCubic }}
          >
            {siteConfig.description}
          </motion.h1>
          <motion.p
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-xl mb-8 font-medium text-balance"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: easeInOutCubic }}
          >
            {siteConfig.hero.description}
          </motion.p>
          <div className="flex justify-center mb-16">
            <motion.div
              animate={{ opacity: 1 }}
              className="flex gap-4"
              initial={{ opacity: 0 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <a
                className="font-semibold text-sm h-10 w-fit px-6 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding text-foreground"
                href={siteConfig.hero.cta.primary.href}
              >
                {siteConfig.hero.cta.primary.text}
              </a>
              <a
                className="border border-border font-semibold text-sm h-10 w-fit px-6 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                href={siteConfig.hero.cta.secondary.href}
              >
                {siteConfig.hero.cta.secondary.text}
              </a>
            </motion.div>
          </div>
        </div>
        <div className="flex flex-nowrap items-center justify-center gap-4 sm:gap-8 h-auto sm:h-[500px] select-none">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="w-40 sm:w-64 h-[333px] sm:h-[500px] flex-shrink-0 relative"
            initial={{ opacity: 0, x: -200 }}
            style={{ y: y1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Image
              alt="iPhone"
              className="object-contain"
              fill
              src="/Device-1.png"
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="w-40 sm:w-64 h-[333px] sm:h-[500px] flex-shrink-0 relative"
            initial={{ opacity: 0, x: -100 }}
            style={{ y: y2 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Image
              alt="iPhone"
              className="object-contain"
              fill
              src="/Device-2.png"
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1 }}
            className="w-40 sm:w-64 h-[333px] sm:h-[500px] flex-shrink-0 relative"
            initial={{ opacity: 0 }}
            style={{ y: y3 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Image
              alt="iPhone"
              className="object-contain"
              fill
              src="/Device-3.png"
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="w-40 sm:w-64 h-[333px] sm:h-[500px] flex-shrink-0 relative"
            initial={{ opacity: 0, x: 100 }}
            style={{ y: y4 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Image
              alt="iPhone"
              className="object-contain"
              fill
              src="/Device-4.png"
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="w-40 sm:w-64 h-[333px] sm:h-[500px] flex-shrink-0 relative"
            initial={{ opacity: 0, x: 200 }}
            style={{ y: y5 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <Image
              alt="iPhone"
              className="object-contain"
              fill
              src="/Device-5.png"
            />
          </motion.div>
        </div>
      </main>
    </Section>
  );
}
