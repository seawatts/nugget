'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import { useRef } from 'react';
import { Section } from '~/app/(marketing)/_components/section';
import { easeOutCubic } from '~/app/(marketing)/_lib/animation';

export function FeatureScroll() {
  const phone1Ref = useRef(null);
  const phone2Ref = useRef(null);
  const phone3Ref = useRef(null);

  const { scrollYProgress: scrollYProgress1 } = useScroll({
    offset: ['start end', 'end start'],
    target: phone1Ref,
  });

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    offset: ['start end', 'end start'],
    target: phone2Ref,
  });

  const { scrollYProgress: scrollYProgress3 } = useScroll({
    offset: ['start end', 'end start'],
    target: phone3Ref,
  });

  const y1 = useTransform(scrollYProgress1, [0, 0.3], [150, 0], {
    ease: easeOutCubic,
  });
  const y2 = useTransform(scrollYProgress2, [0.1, 0.4], [200, 0], {
    ease: easeOutCubic,
  });
  const y3 = useTransform(scrollYProgress3, [0.2, 0.5], [250, 0], {
    ease: easeOutCubic,
  });

  return (
    <Section
      className="container px-4 sm:px-10 mx-auto max-w-[var(--max-container-width)]"
      id="feature-scroll"
      subtitle="An app unlike any other"
      title="Experience"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mx-auto select-none">
        <motion.div
          className="w-full h-auto -z-10 max-w-[250px] sm:max-w-[300px] mx-auto relative aspect-[9/16]"
          ref={phone1Ref}
          style={{ y: y1 }}
        >
          <Image
            alt="iPhone 1"
            className="object-contain"
            fill
            src="/Device-6.png"
          />
        </motion.div>
        <motion.div
          className="w-full h-auto -z-10 max-w-[250px] sm:max-w-[300px] mx-auto relative aspect-[9/16]"
          ref={phone2Ref}
          style={{ y: y2 }}
        >
          <Image
            alt="iPhone 2"
            className="object-contain"
            fill
            src="/Device-7.png"
          />
        </motion.div>
        <motion.div
          className="w-full h-auto -z-10 max-w-[250px] sm:max-w-[300px] mx-auto relative aspect-[9/16]"
          ref={phone3Ref}
          style={{ y: y3 }}
        >
          <Image
            alt="iPhone 3"
            className="object-contain"
            fill
            src="/Device-8.png"
          />
        </motion.div>
      </div>
    </Section>
  );
}
