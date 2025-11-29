import { cn } from '@nugget/ui/lib/utils';
import { Baby, Bell, Brain, Calendar, Clock, Heart, Users } from 'lucide-react';
import { FirstBentoAnimation } from '~/app/(marketing)/_components/first-bento-animation';
import { FourthBentoAnimation } from '~/app/(marketing)/_components/fourth-bento-animation';
import { SecondBentoAnimation } from '~/app/(marketing)/_components/second-bento-animation';
import { ThirdBentoAnimation } from '~/app/(marketing)/_components/third-bento-animation';
import { SecurityShieldBackground } from '../_components/security-shield-background';

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'p-1 py-0.5 font-medium dark:font-semibold text-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

// Team pricing constants
export const TEAM_PRICING = {
  BASE_PRICE_MONTHLY: 10,
  BASE_PRICE_YEARLY: 8,
  DEFAULT_SEATS: 1,
  INCLUDED_SEATS: 1,
  MAX_SEATS: 50,
  PRICE_PER_SEAT_MONTHLY: 10,
  PRICE_PER_SEAT_YEARLY: 8,
} as const;

const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const siteConfig = {
  benefits: [
    {
      id: 1,
      image: '/Device-6.png',
      text: 'Track your cycle, ovulation, and conception journey with science-backed insights.',
    },
    {
      id: 2,
      image: '/Device-7.png',
      text: 'Follow your pregnancy week by week with personalized guidance and milestones.',
    },
    {
      id: 3,
      image: '/Device-8.png',
      text: 'Monitor feeding, sleep, diapers, and development with ease and confidence.',
    },
    {
      id: 4,
      image: '/Device-1.png',
      text: 'Share your journey with partners and family members seamlessly.',
    },
  ],
  bento: [
    {
      content:
        'Track your cycle and ovulation. Get insights to boost your chances.',
      fullWidth: true,
      imageAlt: 'Cycle tracking illustration',
      imageSrc: '/Device-1.png',
      title: 'Trying to Conceive',
    },
    {
      content:
        "Week-by-week updates, size comparisons, and checklists for baby's arrival.",
      fullWidth: false,
      imageAlt: 'Pregnancy tracking illustration',
      imageSrc: '/Device-2.png',
      title: 'Pregnancy Tracking',
    },
    {
      content:
        'Log feeding, sleep, and diapers. Spot patterns and share with your doctor.',
      fullWidth: false,
      imageAlt: 'Baby care logging illustration',
      imageSrc: '/Device-3.png',
      title: 'Baby Care Logging',
    },
    {
      content: 'Capture every milestone from first smile to first steps.',
      fullWidth: true,
      imageAlt: 'Milestone tracking illustration',
      imageSrc: '/Device-4.png',
      title: 'Milestone Tracking',
    },
  ],
  bentoSection: {
    description: 'Everything you need, from conception to first steps.',
    items: [
      {
        content: <FirstBentoAnimation />,
        description:
          'Track your cycle and ovulation. Get insights to boost your chances.',
        id: 1,
        title: 'Trying to Conceive',
      },
      {
        content: <SecondBentoAnimation />,
        description:
          "Week-by-week updates, size comparisons, and checklists for baby's arrival.",
        id: 2,
        title: 'Pregnancy Tracking',
      },
      {
        content: <ThirdBentoAnimation />,
        description:
          'Log feeding, sleep, and diapers. Spot patterns and share with your doctor.',
        id: 3,
        title: 'Baby Care Logging',
      },
      {
        content: <FourthBentoAnimation once={false} />,
        description: 'Capture every milestone from first smile to first steps.',
        id: 4,
        title: 'Milestone Tracking',
      },
    ],
    title: 'Your Complete Parenting Journey',
  },
  companyShowcase: {
    companyLogos: [],
  },
  cta: 'Get Started',
  ctaSection: {
    backgroundImage: '/agent-cta-background.png',
    button: {
      href: '/app?utm_source=marketing-site&utm_medium=cta-button',
      text: 'Start Your Journey',
    },
    id: 'cta',
    subtext: 'Join thousands of parents',
    title: 'Start tracking today',
  },
  description: 'Your parenting journey, simplified.',
  faqSection: {
    description: 'Everything you need to know.',
    faQitems: [
      {
        answer:
          "Nugget is a comprehensive parenting journey app that supports you through three key phases: trying to conceive (cycle and ovulation tracking), pregnancy (week-by-week tracking and preparation), and baby care (feeding, sleep, diapers, and milestone tracking). It's your all-in-one companion from conception to your child's early years.",
        id: 1,
        question: 'What is Nugget?',
      },
      {
        answer:
          'Nugget uses science-backed algorithms to help you track your menstrual cycle, predict ovulation windows, and identify fertile periods. You can log symptoms, moods, and other fertility indicators to get personalized insights that help optimize your chances of conception.',
        id: 2,
        question: 'How does cycle tracking work?',
      },
      {
        answer:
          'Yes, all your data is encrypted and stored securely. We never share your personal health information with third parties. You have complete control over your data and can export or delete it at any time. Your privacy is our top priority.',
        id: 3,
        question: 'Is my data private and secure?',
      },
      {
        answer:
          'Absolutely! Nugget allows you to share access with your partner, family members, or caregivers. You can control what information each person can see and update, making it easy to coordinate care and celebrate milestones together.',
        id: 4,
        question: 'Can I share my journey with my partner?',
      },
      {
        answer:
          "The pregnancy tracker provides week-by-week updates on your baby's development, size comparisons, symptom tracking, appointment reminders, and preparation checklists. You'll receive personalized content based on your due date and can track weight, measurements, and other health metrics.",
        id: 5,
        question: 'What features are included in pregnancy tracking?',
      },
      {
        answer:
          'For baby care, you can log feeding sessions (breastfeeding or bottle), sleep patterns, diaper changes, growth measurements, medications, and health notes. The app helps you identify patterns, track progress, and generate reports to share with your pediatrician.',
        id: 6,
        question: 'What can I track for my baby?',
      },
      {
        answer:
          "Nugget tracks developmental milestones across multiple domains: motor skills, language, social-emotional, and cognitive development. You can record when milestones are achieved, add photos and videos, and receive age-appropriate activity suggestions to support your child's growth.",
        id: 7,
        question: 'How does milestone tracking work?',
      },
      {
        answer:
          'Yes! You can easily export your data as PDF reports or CSV files. This is especially useful for sharing information with healthcare providers or keeping a personal backup of your parenting journey.',
        id: 8,
        question: 'Can I export my data?',
      },
      {
        answer:
          'Nugget is available as a web app (desktop and mobile browsers) and native mobile apps for iOS and Android. Your data syncs seamlessly across all devices, so you can log activities and check insights wherever you are.',
        id: 9,
        question: 'What platforms is Nugget available on?',
      },
    ],
    title: 'Frequently Asked Questions',
  },
  featureHighlight: [
    {
      description:
        'Track your cycle and ovulation. Get insights to boost your chances.',
      direction: 'rtl' as const,
      imageSrc: '/Device-2.png',
      title: 'Trying to Conceive',
    },
    {
      description:
        "Week-by-week updates, size comparisons, and checklists for baby's arrival.",
      direction: 'ltr' as const,
      imageSrc: '/Device-3.png',
      title: 'Pregnancy Tracking',
    },
    {
      description:
        'Log feeding, sleep, and diapers. Spot patterns and share with your doctor.',
      direction: 'rtl' as const,
      imageSrc: '/Device-4.png',
      title: 'Baby Care Logging',
    },
  ],
  featureSection: {
    description:
      'Discover how Nugget supports every phase of your parenting journey',
    items: [
      {
        content:
          'Track your cycle, ovulation, and symptoms with intelligent predictions and insights.',
        id: 1,
        image:
          'https://images.unsplash.com/photo-1720378042271-60aff1e1c538?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Conception Journey',
      },
      {
        content:
          'Week-by-week pregnancy updates with size comparisons and developmental milestones.',
        id: 2,
        image:
          'https://images.unsplash.com/photo-1720371300677-ba4838fa0678?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Pregnancy Tracking',
      },
      {
        content:
          'Log feeding, sleep, and diaper changes. Identify patterns and share with your pediatrician.',
        id: 3,
        image:
          'https://images.unsplash.com/photo-1666882990322-e7f3b8df4f75?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDF8fHxlbnwwfHx8fHw%3D',
        title: 'Baby Care',
      },
      {
        content:
          'Celebrate developmental milestones and share precious moments with loved ones.',
        id: 4,
        image:
          'https://images.unsplash.com/photo-1720371300677-ba4838fa0678?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        title: 'Milestone Tracking',
      },
    ],
    title: 'Every Phase. Every Moment.',
  },
  features: [
    {
      description:
        'Intelligent cycle tracking that learns your patterns and optimizes your conception journey.',
      icon: <Calendar className="h-6 w-6" />,
      name: 'Cycle & Ovulation Tracking',
    },
    {
      description:
        'Track your pregnancy with size comparisons, developmental milestones, and personalized guidance.',
      icon: <Baby className="h-6 w-6" />,
      name: 'Pregnancy Week-by-Week',
    },
    {
      description:
        'Log feeding, sleep, diapers, and growth. Identify patterns and share with healthcare providers.',
      icon: <Clock className="h-6 w-6" />,
      name: 'Baby Care Logging',
    },
    {
      description:
        'Share your journey with partners and family members seamlessly.',
      icon: <Users className="h-6 w-6" />,
      name: 'Partner Sharing',
    },
    {
      description:
        'Contextual notifications that adapt to your schedule and help you stay on track.',
      icon: <Bell className="h-6 w-6" />,
      name: 'Smart Reminders',
    },
    {
      description:
        'Get personalized insights based on scientific research and your personal data.',
      icon: <Brain className="h-6 w-6" />,
      name: 'Science-Backed Insights',
    },
  ],
  footerLinks: [
    {
      links: [
        { id: 1, title: 'Privacy Policy', url: '/privacy-policy' },
        { id: 2, title: 'Terms of Service', url: '/terms-of-service' },
      ],
      title: 'Company',
    },
    {
      links: [
        {
          id: 12,
          title: 'iOS App',
          url: 'https://apps.apple.com/app/nugget',
        },
        {
          id: 13,
          title: 'Android App',
          url: 'https://play.google.com/store/apps/nugget',
        },
        {
          id: 14,
          title: 'Web App',
          url: 'https://nugget.baby/app',
        },
      ],
      title: 'Products',
    },
    {
      links: [
        {
          id: 16,
          title: 'Blog',
          url: '/blog',
        },
        { id: 18, title: 'Docs', url: 'https://docs.nugget.baby' },
        { id: 19, title: 'Support', url: '/support' },
      ],
      title: 'Resources',
    },
  ],
  growthSection: {
    description: 'Privacy-first. Built for modern parents.',
    items: [
      {
        content: <SecurityShieldBackground />,
        description:
          "Your data is encrypted and private. You're in complete control.",
        id: 1,
        title: 'Privacy-First Parenting',
      },
      {
        content: (
          <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_50%)] -translate-y-20">
            <Baby className="size-32 text-primary animate-pulse" />
          </div>
        ),
        description:
          'Works on iOS, Android, and web. Your data syncs everywhere.',
        id: 2,
        title: 'Cross-Platform Sync',
      },
    ],
    title: 'Built for Modern Parents',
  },
  hero: {
    badge: 'Your Parenting Companion',
    badgeIcon: <Heart className="size-4" />,
    badgeUrl:
      'https://nugget.baby/app?utm_source=marketing-site&utm_medium=hero-cta',
    cta: {
      primary: {
        href: '/app?utm_source=marketing-site&utm_medium=hero-cta',
        text: 'Start Your Journey',
      },
      secondary: {
        href: 'https://docs.nugget.baby',
        text: 'Learn More',
      },
    },
    description:
      "From trying to conceive to baby's first steps—track everything in one simple app.",
    title: 'Your Complete Parenting Journey',
  },
  keywords: [
    'Parenting App',
    'Pregnancy Tracker',
    'Baby Tracker',
    'Cycle Tracking',
    'Fertility',
    'Milestone Tracker',
  ],
  links: {
    discord: 'https://discord.gg/nugget',
    email: 'support@nugget.baby',
    github: 'https://github.com/nugget',
    twitter: 'https://twitter.com/nugget',
  },
  name: 'Nugget',
  nav: {
    links: [
      { href: '#hero', id: 1, name: 'Home' },
      {
        href: '#features',
        id: 3,
        name: 'Features',
      },
      {
        href: '#faq',
        id: 4,
        name: 'FAQ',
      },
      {
        href: '/blog',
        id: 5,
        name: 'Blog',
      },
      {
        href: '/app',
        id: 6,
        name: 'Get Started',
      },
    ],
  },
  pricing: {
    description: 'Start free. Upgrade as you grow.',
    pricingItems: [
      {
        buttonColor: 'bg-accent text-primary',
        buttonText: 'Start Free',
        description: 'Perfect for trying to conceive',
        features: [
          'Cycle tracking',
          'Ovulation predictions',
          'Symptom logging',
          'Basic fertility insights',
          'Mobile app access',
          'Data export',
        ],
        href: '/app?utm_source=marketing-site&utm_medium=pricing-cta-free',
        isPopular: false,
        name: 'Free',
        period: 'month',
        price: '$0',
        yearlyPrice: '$0',
      },
      {
        betaFree: false,
        buttonColor: 'bg-secondary text-white',
        buttonText: 'Start Free Trial',
        description: 'Ideal for expecting parents and new families',
        features: [
          'Everything in Free',
          'Pregnancy week-by-week tracking',
          'Baby care logging (unlimited)',
          'Milestone tracking with photos',
          'Partner sharing',
          'Healthcare provider reports',
          'Advanced analytics',
          'Priority support',
          'Ad-free experience',
        ],
        href: '/app?utm_source=marketing-site&utm_medium=pricing-cta-premium',
        isPopular: true,
        name: 'Premium',
        period: 'month',
        price: '$9.99',
        yearlyPrice: '$7.99',
      },
      {
        buttonColor: 'bg-primary text-primary-foreground',
        buttonText: 'Contact Us',
        description: 'For healthcare providers and organizations',
        features: [
          'Everything in Premium',
          'Multiple family management',
          'HIPAA compliance',
          'Custom branding',
          'API access',
          'Dedicated support',
          'Custom reporting',
          'Training & onboarding',
        ],
        href: 'mailto:support@nugget.baby',
        isPopular: false,
        name: 'Enterprise',
        period: 'month',
        price: 'Custom',
        yearlyPrice: 'Custom',
      },
    ],
    title: 'Simple, transparent pricing',
  },
  quoteSection: {
    author: {
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Emily Rodriguez',
      role: 'New Mom, San Francisco',
    },
    quote:
      "Nugget has been my trusted companion from trying to conceive through my baby's first year. The insights and tracking features are invaluable.",
  },
  testimonials: [
    {
      description: (
        <p>
          Made our conception journey so much easier.
          <Highlight>Conceived within 3 months!</Highlight> Can't recommend it
          enough.
        </p>
      ),
      id: '1',
      img: 'https://randomuser.me/api/portraits/women/91.jpg',
      name: 'Sarah Martinez',
      role: 'Expecting Parent',
    },
    {
      description: (
        <p>
          Peace of mind every week.
          <Highlight>Love the size comparisons!</Highlight> Made me feel
          connected to my baby.
        </p>
      ),
      id: '2',
      img: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Jessica Chen',
      role: 'New Mom',
    },
    {
      description: (
        <p>
          Game-changer for first-time parents.
          <Highlight>Helped us establish a routine.</Highlight> Essential!
        </p>
      ),
      id: '3',
      img: 'https://randomuser.me/api/portraits/men/45.jpg',
      name: 'Michael Thompson',
      role: 'Father of Two',
    },
    {
      description: (
        <p>
          Sharing with my partner made us feel like a team.
          <Highlight>We log and celebrate together.</Highlight> Perfect for
          modern families.
        </p>
      ),
      id: '4',
      img: 'https://randomuser.me/api/portraits/women/83.jpg',
      name: 'Amanda Foster',
      role: 'Parent',
    },
    {
      description: (
        <p>
          Complete record of our daughter's firsts.
          <Highlight>The photo memories are priceless.</Highlight> Using it for
          our next baby too!
        </p>
      ),
      id: '5',
      img: 'https://randomuser.me/api/portraits/men/1.jpg',
      name: 'David Park',
      role: 'Proud Parent',
    },
    {
      description: (
        <p>
          I recommend Nugget to all my patients.
          <Highlight>The data helps me provide better care.</Highlight>{' '}
          Well-designed and evidence-based.
        </p>
      ),
      id: '6',
      img: 'https://randomuser.me/api/portraits/women/5.jpg',
      name: 'Dr. Linda Washington',
      role: 'Pediatrician',
    },
  ],
  url,
};

export type SiteConfig = typeof siteConfig;
