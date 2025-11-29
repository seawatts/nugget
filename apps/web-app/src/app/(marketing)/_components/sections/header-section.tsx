'use client';

import { buttonVariants } from '@nugget/ui/components/button';
import { cn } from '@nugget/ui/lib/utils';
import { AnimatePresence, motion, useAnimation } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MobileDrawer } from '~/app/(marketing)/_components/mobile-drawer';
import { easeInOutCubic } from '~/app/(marketing)/_lib/animation';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [addBorder, setAddBorder] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const controls = useAnimation();

  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY);
      setAddBorder(currentScrollY > 20);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    // Set isInitialLoad to false after the component has mounted
    setIsInitialLoad(false);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    controls.start(isVisible ? 'visible' : 'hidden');
  }, [isVisible, controls]);

  const headerVariants = {
    hidden: { opacity: 0, y: '-100%' },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          animate={controls}
          className={cn('sticky top-0 z-50 p-0 bg-background/60 backdrop-blur')}
          exit="hidden"
          initial="hidden"
          transition={{
            delay: isInitialLoad ? 0.5 : 0,
            duration: isInitialLoad ? 1 : 0.3,
            ease: easeInOutCubic,
          }}
          variants={headerVariants}
        >
          <div className="flex justify-between items-center container mx-auto p-2">
            <Link
              className="relative mr-6 flex items-center space-x-2"
              href="/"
              title="brand-logo"
            >
              <span className="text-2xl">🐣</span>
              <span className="font-bold text-xl">{siteConfig.name}</span>
            </Link>
            <div className="hidden lg:block">
              <Link
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'h-8 rounded-full group bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding text-foreground hover:scale-105 active:scale-95 transition-transform',
                )}
                href="/app"
              >
                {siteConfig.cta}
              </Link>
            </div>
            <div className="mt-2 cursor-pointer block lg:hidden">
              <MobileDrawer />
            </div>
          </div>
          <motion.hr
            animate={{ opacity: addBorder ? 1 : 0 }}
            className="absolute w-full bottom-0"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />
        </motion.header>
      )}
    </AnimatePresence>
  );
}
