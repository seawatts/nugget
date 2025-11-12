'use client';

import { Button } from '@nugget/ui/button';
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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';

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
        href: '/ttc',
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
      { href: '/', icon: Home, id: 'home', label: 'Home' },
      {
        href: '/timeline',
        icon: CalendarDays,
        id: 'timeline',
        label: 'Timeline',
      },
      { href: '/reports', icon: BarChart3, id: 'reports', label: 'Reports' },
      { href: '/sleep-plans', icon: FileText, id: 'plans', label: 'Plans' },
      { href: '/insights', icon: Lightbulb, id: 'insights', label: 'Insights' },
      {
        href: '/milestones',
        icon: TrendingUp,
        id: 'milestones',
        label: 'Milestones',
      },
      {
        href: '/activities',
        icon: Blocks,
        id: 'activities',
        label: 'Activities',
      },
      {
        href: '/feed-calculator',
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
      { href: '/pregnancy', icon: Baby, id: 'pregnancy', label: 'Pregnancy' },
      { href: '/names', icon: Sparkles, id: 'names', label: 'Baby Names' },
      {
        href: '/hospital-prep',
        icon: Briefcase,
        id: 'hospital',
        label: 'Hospital Prep',
      },
      {
        href: '/nursery-prep',
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
        href: '/learning',
        icon: GraduationCap,
        id: 'learning',
        label: 'Learning Hub',
      },
      {
        href: '/partner-support',
        icon: Users,
        id: 'partner',
        label: 'Partner Support',
      },
      {
        href: '/postpartum',
        icon: Heart,
        id: 'postpartum',
        label: 'Postpartum Care',
      },
      {
        href: '/nutrition',
        icon: Utensils,
        id: 'nutrition',
        label: 'Nutrition',
      },
      { href: '/chat', icon: MessageCircle, id: 'chat', label: 'AI Chat' },
    ],
    showFor: ['ttc', 'pregnant', 'born'],
    title: 'Learning & Support',
  },
  {
    items: [
      {
        href: '/medical',
        icon: FileHeart,
        id: 'medical',
        label: 'Medical Records',
      },
      {
        href: '/providers',
        icon: Stethoscope,
        id: 'providers',
        label: 'Providers',
      }, // Added Providers page
      {
        href: '/products',
        icon: ShoppingBag,
        id: 'products',
        label: 'Products',
      }, // Added Products page
      {
        href: '/budget',
        icon: DollarSign,
        id: 'budget',
        label: 'Budget & Finance',
      },
      {
        href: '/calendar',
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
        href: '/memories',
        icon: Camera,
        id: 'memories',
        label: 'Memory Journal',
      },
      {
        href: '/community',
        icon: UsersRound,
        id: 'community',
        label: 'Community',
      },
      {
        href: '/caregiver-guide',
        icon: FileText,
        id: 'caregiver',
        label: 'Caregiver Guide',
      },
      { href: '/invite', icon: UserPlus, id: 'invite', label: 'Invite Others' },
      { href: '/help', icon: BookOpen, id: 'help', label: 'Help & Resources' },
      {
        href: '/emergency',
        icon: AlertTriangle,
        id: 'emergency',
        label: 'Emergency Help',
      },
      { href: '/settings', icon: Settings, id: 'settings', label: 'Settings' },
      {
        href: '/admin/rules',
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
  const [showDrawer, setShowDrawer] = useState(false);
  const [journeyStage, setJourneyStage] = useState<string | null>(null);

  useEffect(() => {
    const userData = getUserJourneyStage();
    setJourneyStage(userData?.journeyStage || 'born'); // Default to "born" if not set
  }, []);

  const filteredNavGroups = navGroups.filter((group) => {
    if (!journeyStage) return true;
    return group.showFor.includes(journeyStage);
  });

  const getMainNavItems = () => {
    if (journeyStage === 'ttc') {
      return [
        { href: '/ttc', icon: HeartHandshake, id: 'ttc', label: 'TTC' },
        { href: '/pregnancy', icon: Baby, id: 'pregnancy', label: 'Pregnancy' },
        { href: '/names', icon: Sparkles, id: 'names', label: 'Names' },
        {
          href: '/learning',
          icon: GraduationCap,
          id: 'learning',
          label: 'Learning',
        },
        { href: '/chat', icon: MessageCircle, id: 'chat', label: 'AI Chat' },
      ];
    }
    if (journeyStage === 'pregnant') {
      return [
        { href: '/pregnancy', icon: Baby, id: 'pregnancy', label: 'Pregnancy' },
        {
          href: '/hospital-prep',
          icon: Briefcase,
          id: 'hospital',
          label: 'Hospital',
        },
        {
          href: '/nursery-prep',
          icon: HomeIcon,
          id: 'nursery',
          label: 'Nursery',
        },
        {
          href: '/learning',
          icon: GraduationCap,
          id: 'learning',
          label: 'Learning',
        },
        { href: '/chat', icon: MessageCircle, id: 'chat', label: 'AI Chat' },
      ];
    }
    return [
      { href: '/', icon: Home, id: 'home', label: 'Home' },
      {
        href: '/timeline',
        icon: CalendarDays,
        id: 'timeline',
        label: 'Timeline',
      },
      { href: '/reports', icon: BarChart3, id: 'reports', label: 'Reports' },
      { href: '/insights', icon: Lightbulb, id: 'insights', label: 'Insights' },
      { href: '/chat', icon: MessageCircle, id: 'chat', label: 'AI Chat' },
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
                            <Icon className="h-5 w-5 flex-shrink-0" />
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
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card z-40">
        <div className="flex items-center justify-around px-1 py-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.id}>
                <Button
                  className={cn(
                    'flex flex-col items-center gap-1 h-auto py-2 px-2',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  variant="ghost"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          <Button
            className="flex flex-col items-center gap-1 h-auto py-2 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowDrawer(true)}
            variant="ghost"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </Button>
        </div>
      </nav>
    </>
  );
}
