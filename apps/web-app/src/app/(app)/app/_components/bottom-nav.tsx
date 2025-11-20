'use client';

import { api } from '@nugget/api/react';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { cn } from '@nugget/ui/lib/utils';
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
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type FamilyTabMember,
  getFamilyTabsDataAction,
} from './family-tabs.actions';
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
        href: '/app/settings/preferences',
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

const familyMenuContainer = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      damping: 25,
      delayChildren: 0.1,
      staggerChildren: 0.06,
      stiffness: 300,
      type: 'spring' as const,
    },
    y: 0,
  },
};

const familyAvatarItem = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      damping: 22,
      stiffness: 350,
      type: 'spring' as const,
    },
    y: 0,
  },
};

function LiveBabyAge({ birthDate }: { birthDate: Date }) {
  const [age, setAge] = useState('');

  useEffect(() => {
    function updateAge() {
      const now = new Date();
      const birth = new Date(birthDate);
      const diffMs = now.getTime() - birth.getTime();

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (days > 0) {
        setAge(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setAge(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setAge(`${minutes}m ${seconds}s`);
      } else {
        setAge(`${seconds}s`);
      }
    }

    updateAge();
    const interval = setInterval(updateAge, 1000);

    return () => clearInterval(interval);
  }, [birthDate]);

  return <>{age}</>;
}

function getRoleLabel(
  role?: 'primary' | 'partner' | 'caregiver' | null,
): string {
  if (!role) return 'Member';

  const roleLabels = {
    caregiver: 'Caregiver',
    partner: 'Partner',
    primary: 'Primary',
  };

  return roleLabels[role];
}

function calculateAgeInDays(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { scrollY } = useScroll();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyTabMember[]>([]);
  const [journeyStage, setJourneyStage] = useState<string | null>(null);
  const familyMenuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // Get baby ID from URL params or fall back to most recent baby
  const { data: babies = [] } = api.babies.list.useQuery();
  const babyIdFromParams = params.userId as string | undefined;
  const mostRecentBaby = babies[0];
  const babyId = babyIdFromParams || mostRecentBaby?.id;

  // Fetch specific baby data based on URL params
  const { data: baby } = api.babies.getById.useQuery(
    { id: babyId || '' },
    { enabled: !!babyId },
  );

  const isOnboarding = pathname?.startsWith('/app/onboarding');

  // Get baby name and age from API data
  const babyName = baby?.firstName || 'Baby';
  const ageInDays = baby?.birthDate ? calculateAgeInDays(baby.birthDate) : null;
  const ageDisplay = ageInDays !== null ? `${ageInDays} days old` : undefined;
  const babyPhotoUrl = baby?.photoUrl || null;
  const babyAvatarBackgroundColor = baby?.avatarBackgroundColor || null;

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
  }, []);

  // Fetch family members data
  useEffect(() => {
    async function loadFamilyMembers() {
      try {
        const result = await getFamilyTabsDataAction();
        if (result?.data) {
          setFamilyMembers(result.data);
        }
      } catch (error) {
        console.error('Failed to load family members:', error);
      }
    }

    loadFamilyMembers();
  }, []);

  // Handle click outside to close family menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        familyMenuRef.current &&
        !familyMenuRef.current.contains(event.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(event.target as Node) &&
        showFamilyMenu
      ) {
        setShowFamilyMenu(false);
      }
    }

    if (showFamilyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFamilyMenu]);

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

      {/* Family Avatar Selector */}
      <AnimatePresence>
        {showFamilyMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setShowFamilyMenu(false)}
              transition={{
                damping: 30,
                stiffness: 300,
                type: 'spring',
              }}
            />

            {/* Family Avatars Container */}
            <motion.div
              animate="visible"
              className="fixed left-1/2 -translate-x-1/2 z-50"
              exit="hidden"
              initial="hidden"
              ref={familyMenuRef}
              style={{
                bottom: '100px', // Position above the nav bar
              }}
              variants={familyMenuContainer}
            >
              <div className="flex flex-col-reverse items-center gap-3">
                {familyMembers.map((member) => {
                  const displayName = member.firstName;
                  const initials = displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <motion.div
                      className="flex items-center gap-2 bg-card/95 backdrop-blur-lg rounded-full pl-2 py-2 shadow-xl border border-border/50 hover:scale-105 transition-transform"
                      key={member.id}
                      variants={familyAvatarItem}
                    >
                      <button
                        className="flex items-center gap-3 flex-1 cursor-pointer pr-2"
                        onClick={() => {
                          router.push(`/app/${member.userId}`);
                          setShowFamilyMenu(false);
                        }}
                        type="button"
                      >
                        <div className="flex items-center justify-center">
                          {member.type === 'baby' ? (
                            <div className="relative flex items-center justify-center size-12 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-lg shadow-primary/30">
                              <div className="size-full rounded-full bg-card flex items-center justify-center p-1">
                                <NuggetAvatar
                                  image={member.avatarUrl || undefined}
                                  name={displayName}
                                  size="sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <Avatar className="size-12">
                              <AvatarImage
                                alt={displayName}
                                src={member.avatarUrl || ''}
                              />
                              <AvatarFallback className="text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">
                            {displayName}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {member.type === 'baby' && member.birthDate ? (
                              <LiveBabyAge birthDate={member.birthDate} />
                            ) : member.type === 'user' ? (
                              getRoleLabel(member.role)
                            ) : null}
                          </span>
                        </div>
                      </button>
                      <Link
                        className="flex items-center justify-center size-8 rounded-full hover:bg-muted/50 transition-colors mr-1"
                        href={
                          member.type === 'baby'
                            ? '/app/settings/baby'
                            : '/app/settings/preferences'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFamilyMenu(false);
                        }}
                      >
                        <Settings className="size-4 text-muted-foreground" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-linear-to-t from-card via-card to-card/95 backdrop-blur-lg border-t border-border/50 z-40 shadow-lg">
        <motion.div
          animate={{
            paddingBottom: `${animations.navPaddingY}px`,
            paddingTop: `${animations.navPaddingY}px`,
          }}
          className="relative max-w-3xl mx-auto"
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Center Avatar Button - Elevated TikTok Style */}
          <motion.div
            animate={{
              scale: showFamilyMenu ? 1.1 : animations.avatarScale,
              top: `${animations.avatarTop}px`,
            }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
            transition={{
              damping: 25,
              stiffness: 300,
              type: 'spring',
            }}
          >
            <motion.button
              animate={{
                rotate: showFamilyMenu ? 0 : 0,
              }}
              className="block relative"
              onClick={() => setShowFamilyMenu(!showFamilyMenu)}
              ref={avatarButtonRef}
              transition={{
                damping: 20,
                stiffness: 400,
                type: 'spring',
              }}
              type="button"
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative group">
                {/* Glow effect */}
                <motion.div
                  animate={{
                    opacity: showFamilyMenu ? 0.4 : 0.2,
                    scale: showFamilyMenu ? 1.2 : 1,
                  }}
                  className="absolute inset-0 rounded-full bg-primary blur-xl group-hover:bg-primary transition-colors pointer-events-none"
                  transition={{
                    damping: 20,
                    stiffness: 300,
                    type: 'spring',
                  }}
                />

                {/* Avatar container */}
                <motion.div
                  animate={{
                    boxShadow: showFamilyMenu
                      ? '0 25px 50px -12px rgba(var(--primary-rgb, 99 102 241) / 0.5)'
                      : '0 20px 40px -12px rgba(var(--primary-rgb, 99 102 241) / 0.3)',
                  }}
                  className="relative flex items-center justify-center size-16 rounded-full bg-linear-to-br from-primary to-primary/80 p-[3px] cursor-pointer"
                  transition={{
                    damping: 20,
                    stiffness: 300,
                    type: 'spring',
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="size-full rounded-full bg-card flex items-center justify-center p-1">
                    <NuggetAvatar
                      backgroundColor={babyAvatarBackgroundColor || undefined}
                      image={
                        !babyAvatarBackgroundColor && babyPhotoUrl
                          ? babyPhotoUrl
                          : undefined
                      }
                      name={babyName}
                      size="lg"
                    />
                  </div>
                </motion.div>
              </div>
            </motion.button>
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
            <div className="flex flex-col justify-center items-center mt-10 z-0 pointer-events-none gap-0.5">
              {/* <motion.span
                animate={{
                  height: animations.textHeight,
                  opacity: animations.textOpacity,
                }}
                className="text-[11px] font-semibold text-foreground overflow-hidden"
                style={{ willChange: 'opacity, height' }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {babyName}
              </motion.span> */}
              {ageDisplay && (
                <motion.span
                  animate={{
                    height: animations.textHeight,
                    opacity: animations.ageOpacity,
                  }}
                  className="text-[10px] font-medium text-muted-foreground overflow-hidden"
                  style={{ willChange: 'opacity, height' }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {ageDisplay}
                </motion.span>
              )}
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
