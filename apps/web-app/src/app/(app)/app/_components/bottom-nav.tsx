'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  AlertTriangle,
  Baby,
  BarChart3,
  Blocks,
  BookOpen,
  Briefcase,
  Calculator,
  CalendarDays,
  Camera,
  DollarSign,
  FileHeart,
  FileText,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  HomeIcon,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  Utensils,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useScroll } from './scroll-provider';

function getUserJourneyStage() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('onboardingData');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

const navGroups = [
  {
    items: [
      {
        href: '/app/ttc',
        icon: HeartHandshake,
        id: 'ttc',
        label: 'Trying to Conceive',
      },
    ],
    showFor: ['ttc'],
    title: 'Pre-Pregnancy',
  },
  {
    items: [
      { href: '/app', icon: Home, id: 'home', label: 'Home' },
      {
        href: '/app/timeline',
        icon: CalendarDays,
        id: 'timeline',
        label: 'Timeline',
      },
      {
        href: '/app/reports',
        icon: BarChart3,
        id: 'reports',
        label: 'Reports',
      },
      { href: '/app/sleep-plans', icon: FileText, id: 'plans', label: 'Plans' },
      {
        href: '/app/insights',
        icon: Lightbulb,
        id: 'insights',
        label: 'Insights',
      },
      {
        href: '/app/milestones',
        icon: TrendingUp,
        id: 'milestones',
        label: 'Milestones',
      },
      {
        href: '/app/activities',
        icon: Blocks,
        id: 'activities',
        label: 'Activities',
      },
      {
        href: '/app/feed-calculator',
        icon: Calculator,
        id: 'feed-calc',
        label: 'Feed Calculator',
      }, // Added feed calculator
    ],
    showFor: ['born'],
    title: 'Baby Tracking',
  },
  {
    items: [
      {
        href: '/app/pregnancy',
        icon: Baby,
        id: 'pregnancy',
        label: 'Pregnancy',
      },
      { href: '/app/names', icon: Sparkles, id: 'names', label: 'Baby Names' },
      {
        href: '/app/hospital-prep',
        icon: Briefcase,
        id: 'hospital',
        label: 'Hospital Prep',
      },
      {
        href: '/app/nursery-prep',
        icon: HomeIcon,
        id: 'nursery',
        label: 'Nursery Setup',
      },
    ],
    showFor: ['ttc', 'pregnant'],
    title: 'Pregnancy & Prep',
  },
  {
    items: [
      {
        href: '/app/learning',
        icon: GraduationCap,
        id: 'learning',
        label: 'Learning Hub',
      },
      {
        href: '/app/partner-support',
        icon: Users,
        id: 'partner',
        label: 'Partner Support',
      },
      {
        href: '/app/postpartum',
        icon: Heart,
        id: 'postpartum',
        label: 'Postpartum Care',
      },
      {
        href: '/app/nutrition',
        icon: Utensils,
        id: 'nutrition',
        label: 'Nutrition',
      },
      { href: '/app/chat', icon: MessageCircle, id: 'chat', label: 'AI Chat' },
    ],
    showFor: ['ttc', 'pregnant', 'born'],
    title: 'Learning & Support',
  },
  {
    items: [
      {
        href: '/app/medical',
        icon: FileHeart,
        id: 'medical',
        label: 'Medical Records',
      },
      {
        href: '/app/providers',
        icon: Stethoscope,
        id: 'providers',
        label: 'Providers',
      }, // Added Providers page
      {
        href: '/app/products',
        icon: ShoppingBag,
        id: 'products',
        label: 'Products',
      }, // Added Products page
      {
        href: '/app/budget',
        icon: DollarSign,
        id: 'budget',
        label: 'Budget & Finance',
      },
      {
        href: '/app/calendar',
        icon: CalendarDays,
        id: 'calendar',
        label: 'Family Calendar',
      },
    ],
    showFor: ['ttc', 'pregnant', 'born'],
    title: 'Health & Planning',
  },
  {
    items: [
      {
        href: '/app/memories',
        icon: Camera,
        id: 'memories',
        label: 'Memory Journal',
      },
      {
        href: '/app/community',
        icon: UsersRound,
        id: 'community',
        label: 'Community',
      },
      {
        href: '/app/caregiver-guide',
        icon: FileText,
        id: 'caregiver',
        label: 'Caregiver Guide',
      },
      {
        href: '/app/invite',
        icon: UserPlus,
        id: 'invite',
        label: 'Invite Others',
      },
      {
        href: '/app/help',
        icon: BookOpen,
        id: 'help',
        label: 'Help & Resources',
      },
      {
        href: '/app/emergency',
        icon: AlertTriangle,
        id: 'emergency',
        label: 'Emergency Help',
      },
      {
        href: '/app/settings',
        icon: Settings,
        id: 'settings',
        label: 'Settings',
      },
      {
        href: '/app/admin/rules',
        icon: Settings,
        id: 'admin',
        label: 'Admin Rules',
      },
    ],
    showFor: ['ttc', 'pregnant', 'born'],
    title: 'Community & Memories',
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [showDrawer, setShowDrawer] = useState(false);
  const [journeyStage, setJourneyStage] = useState<string | null>(null);
  const [babyName, setBabyName] = useState('Baby');
  const [ageDisplay, setAgeDisplay] = useState<string | undefined>(undefined);
  const [babyPhotoUrl, setBabyPhotoUrl] = useState<string | null>(null);

  // Fetch baby data to get profile picture
  const { data: babies = [] } = api.babies.list.useQuery();
  const mostRecentBaby = babies[0];

  const isOnboarding = pathname?.startsWith('/app/onboarding');

  // Calculate animation values based on scroll position (0-150px range for gradual transitions)
  const animations = useMemo(() => {
    const scrollProgress = Math.min(scrollY / 150, 1); // Normalize to 0-1 over 150px
    const easeProgress = scrollProgress * scrollProgress; // Ease-in for smoother start

    return {
      ageOpacity: 1 - easeProgress,
      avatarScale: 1 - easeProgress * 0.25, // Scale from 1 to 0.75
      avatarTop: -12 - easeProgress * 4, // Move up slightly when shrinking
      iconScale: 1 - easeProgress * 0.05, // Subtle scale from 1 to 0.95
      navPaddingY: 12 - easeProgress * 4, // From py-3 (12px) to py-2 (8px)
      textHeight: easeProgress < 0.5 ? 'auto' : '0px', // Collapse after halfway
      textOpacity: 1 - easeProgress,
    };
  }, [scrollY]);

  useEffect(() => {
    const userData = getUserJourneyStage();
    setJourneyStage(userData?.journeyStage || 'born'); // Default to "born" if not set

    // Get baby name and birthdate
    const data = localStorage.getItem('onboardingData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const firstName = parsed.firstName || parsed.babyName || 'Baby';
        setBabyName(firstName);

        // Calculate age if birthdate exists
        if (parsed.birthDate || parsed.dueDate) {
          const birthDate = new Date(parsed.birthDate || parsed.dueDate);
          const now = new Date();
          const age = formatDistanceToNowStrict(birthDate, {
            addSuffix: false,
          });

          // Add context based on whether baby is born or not
          if (birthDate > now) {
            setAgeDisplay(`${age} until due`);
          } else {
            setAgeDisplay(`${age} old`);
          }
        }
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }
  }, []);

  // Update baby photo when data changes
  useEffect(() => {
    if (mostRecentBaby?.photoUrl) {
      setBabyPhotoUrl(mostRecentBaby.photoUrl);
    }
  }, [mostRecentBaby?.photoUrl]);

  if (isOnboarding) return null;

  const filteredNavGroups = navGroups.filter((group) => {
    if (!journeyStage) return true;
    return group.showFor.includes(journeyStage);
  });

  const getMainNavItems = () => {
    if (journeyStage === 'ttc') {
      return [
        { href: '/app/ttc', icon: HeartHandshake, id: 'ttc', label: 'TTC' },
        {
          href: '/app/pregnancy',
          icon: Baby,
          id: 'pregnancy',
          label: 'Pregnancy',
        },
        {
          href: '/app/learning',
          icon: GraduationCap,
          id: 'learning',
          label: 'Learning',
        },
      ];
    }
    if (journeyStage === 'pregnant') {
      return [
        {
          href: '/app/pregnancy',
          icon: Baby,
          id: 'pregnancy',
          label: 'Pregnancy',
        },
        {
          href: '/app/hospital-prep',
          icon: Briefcase,
          id: 'hospital',
          label: 'Hospital',
        },
        {
          href: '/app/learning',
          icon: GraduationCap,
          id: 'learning',
          label: 'Learning',
        },
      ];
    }
    // Default "born" stage
    return [
      { href: '/app', icon: Home, id: 'home', label: 'Home' },
      {
        href: '/app/timeline',
        icon: CalendarDays,
        id: 'timeline',
        label: 'Timeline',
      },
      {
        href: '/app/reports',
        icon: BarChart3,
        id: 'reports',
        label: 'Reports',
      },
    ];
  };

  const mainNavItems = getMainNavItems();

  const handleOverlayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowDrawer(false);
    }
  };

  return (
    <>
      {showDrawer && (
        <>
          <button
            aria-label="Close navigation drawer"
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setShowDrawer(false)}
            onKeyDown={handleOverlayKeyDown}
            type="button"
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 z-50">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Pages</h2>
              <Button
                onClick={() => setShowDrawer(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-4 space-y-6 pb-24">
              {filteredNavGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          href={item.href}
                          key={item.id}
                          onClick={() => setShowDrawer(false)}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-3 p-4 rounded-2xl border transition-all',
                              isActive
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-muted/50 border-transparent hover:bg-muted hover:border-border',
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-medium text-balance">
                              {item.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-card via-card to-card/95 backdrop-blur-lg border-t border-border/50 z-40 shadow-lg">
        <motion.div
          animate={{
            paddingBottom: `${animations.navPaddingY}px`,
            paddingTop: `${animations.navPaddingY}px`,
          }}
          className="relative max-w-7xl mx-auto"
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Center Avatar Button - Elevated TikTok Style */}
          <motion.div
            animate={{
              scale: animations.avatarScale,
              top: `${animations.avatarTop}px`,
            }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link className="block relative" href="/app/settings">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all pointer-events-none" />

                {/* Avatar container */}
                <div className="relative flex items-center justify-center size-16 rounded-full bg-linear-to-br from-primary to-primary/80 p-[3px] shadow-2xl shadow-primary/50 transition-all group-hover:scale-105 group-hover:shadow-primary/70 cursor-pointer">
                  <div className="size-full rounded-full bg-card flex items-center justify-center p-1">
                    <NuggetAvatar
                      image={babyPhotoUrl || undefined}
                      name={babyName}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Navigation Items Grid */}
          <div className="grid grid-cols-5 gap-1 px-2 pb-safe">
            {/* Left Nav Items (2 items) */}
            {mainNavItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  className="flex justify-center"
                  href={item.href}
                  key={item.id}
                >
                  <Button
                    className={cn(
                      'flex flex-col items-center gap-1.5 h-auto py-2 px-2 rounded-xl transition-all w-full',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                    variant="ghost"
                  >
                    <motion.div
                      animate={{ scale: animations.iconScale }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <Icon className="size-5" />
                    </motion.div>
                    <motion.span
                      animate={{
                        height: animations.textHeight,
                        opacity: animations.textOpacity,
                      }}
                      className="text-[10px] font-medium overflow-hidden"
                      style={{ willChange: 'opacity, height' }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      {item.label}
                    </motion.span>
                  </Button>
                </Link>
              );
            })}

            {/* Center Spacer for Avatar */}
            <div className="flex justify-center items-end -mb-1 z-0 pointer-events-none">
              <motion.span
                animate={{
                  height: animations.textHeight,
                  opacity: animations.ageOpacity,
                }}
                className="text-[12px] font-medium text-muted-foreground overflow-hidden"
                style={{ willChange: 'opacity, height' }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {ageDisplay}
              </motion.span>
            </div>

            {/* Right Nav Item (1 item) */}
            {mainNavItems.slice(2, 3).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  className="flex justify-center"
                  href={item.href}
                  key={item.id}
                >
                  <Button
                    className={cn(
                      'flex flex-col items-center gap-1.5 h-auto py-2 px-2 rounded-xl transition-all w-full',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                    variant="ghost"
                  >
                    <motion.div
                      animate={{ scale: animations.iconScale }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <Icon className="size-5" />
                    </motion.div>
                    <motion.span
                      animate={{
                        height: animations.textHeight,
                        opacity: animations.textOpacity,
                      }}
                      className="text-[10px] font-medium overflow-hidden"
                      style={{ willChange: 'opacity, height' }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      {item.label}
                    </motion.span>
                  </Button>
                </Link>
              );
            })}

            {/* More Button */}
            <div className="flex justify-center">
              <Button
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all w-full"
                onClick={() => setShowDrawer(true)}
                variant="ghost"
              >
                <motion.div
                  animate={{ scale: animations.iconScale }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <MoreHorizontal className="size-5" />
                </motion.div>
                <motion.span
                  animate={{
                    height: animations.textHeight,
                    opacity: animations.textOpacity,
                  }}
                  className="text-[10px] font-medium overflow-hidden"
                  style={{ willChange: 'opacity, height' }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  More
                </motion.span>
              </Button>
            </div>
          </div>
        </motion.div>
      </nav>
    </>
  );
}
