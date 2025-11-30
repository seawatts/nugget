'use client';

import { api } from '@nugget/api/react';
import { Badge } from '@nugget/ui/badge';
import { Card } from '@nugget/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import { BorderBeam } from '@nugget/ui/magicui/border-beam';
import { Confetti, type ConfettiRef } from '@nugget/ui/magicui/confetti';
import { DotPattern } from '@nugget/ui/magicui/dot-pattern';
import { Particles } from '@nugget/ui/magicui/particles';
import { ShineBorder } from '@nugget/ui/magicui/shine-border';
import { format, startOfDay, subDays } from 'date-fns';
import { CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatsDrawerWrapper } from './activities/shared/components/stats';
import type {
  Achievement,
  AchievementCategory,
} from './baby-stats-drawer/types';
import {
  calculateAchievements,
  calculateStreaks,
} from './baby-stats-drawer/utils';
import {
  filterAchievementsForProgression,
  sortAchievementsByProgression,
} from './baby-stats-drawer/utils/achievement-progression';

interface AchievementsDrawerProps {
  babyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<AchievementCategory, string> = {
  'activity-specific': 'Activity Specific',
  efficiency: 'Efficiency & Quality',
  foundation: 'Foundation',
  'parent-milestones': 'Parent Milestones',
  'personal-milestones': 'Personal Milestones',
  records: 'Records',
  special: 'Special',
  streaks: 'Streaks',
  'time-based': 'Time Based',
  volume: 'Volume Milestones',
};

const rarityColors: Record<
  Achievement['rarity'],
  { bg: string; border: string; text: string }
> = {
  common: {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
  },
  legendary: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
};

const rarityLabels: Record<Achievement['rarity'], string> = {
  common: 'Common',
  epic: 'Epic',
  legendary: 'Legendary',
  rare: 'Rare',
};

export function AchievementsDrawer({
  babyId,
  open,
  onOpenChange,
}: AchievementsDrawerProps) {
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showLocked, setShowLocked] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  // Fetch baby data
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId },
    { enabled: Boolean(babyId) && open },
  );

  // Fetch extended activities for achievements (90 days, only when drawer opens)
  const ninetyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 90)), []);
  const { data: activities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 500,
      since: ninetyDaysAgo,
    },
    {
      enabled: Boolean(babyId) && open,
      staleTime: 60000,
    },
  );

  // Calculate streaks
  const streaks = useMemo(() => calculateStreaks(activities), [activities]);

  // Calculate level based on total activities
  const level = useMemo(() => {
    const total = activities.length;
    if (total >= 5000) return { level: 10, name: 'Master Tracker' };
    if (total >= 2500) return { level: 9, name: 'Expert Parent' };
    if (total >= 1000) return { level: 8, name: 'Pro Tracker' };
    if (total >= 500) return { level: 7, name: 'Dedicated Parent' };
    if (total >= 250) return { level: 6, name: 'Consistent Tracker' };
    if (total >= 100) return { level: 5, name: 'Active Parent' };
    if (total >= 50) return { level: 4, name: 'Regular Tracker' };
    if (total >= 25) return { level: 3, name: 'Getting Started' };
    if (total >= 10) return { level: 2, name: 'New Parent' };
    return { level: 1, name: 'Just Beginning' };
  }, [activities.length]);

  // Calculate achievements
  const achievements = useMemo(() => {
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;
    const totalVolumeMl = activities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const daysTracking = sortedActivities[0]
      ? Math.floor(
          (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    return calculateAchievements(
      activities.length,
      totalVolumeMl,
      totalDiapers,
      daysTracking,
      streaks,
      activities,
      baby?.birthDate ? new Date(baby.birthDate) : null,
    );
  }, [activities, streaks, baby?.birthDate]);

  // Apply progressive disclosure - only show relevant achievements
  const visibleAchievements = useMemo(() => {
    const filtered = filterAchievementsForProgression(achievements);
    return sortAchievementsByProgression(filtered);
  }, [achievements]);

  // Group achievements by category and sort by progress (closest to completion first, earned at bottom)
  const achievementsByCategory = useMemo(() => {
    const grouped = new Map<AchievementCategory, Achievement[]>();
    visibleAchievements.forEach((achievement) => {
      if (!grouped.has(achievement.category)) {
        grouped.set(achievement.category, []);
      }
      grouped.get(achievement.category)?.push(achievement);
    });

    // Sort each category: unearned by progress (highest first), then locked (0 progress), then earned by unlock date (newest first)
    grouped.forEach((achievements, _category) => {
      achievements.sort((a, b) => {
        // Separate earned and unearned
        if (a.earned && !b.earned) return 1; // Earned goes to bottom
        if (!a.earned && b.earned) return -1; // Unearned stays on top

        if (!a.earned && !b.earned) {
          // Both unearned: sort by progress (highest first)
          // Locked achievements (0 progress) go after those with progress
          if (a.progress === 0 && b.progress > 0) return 1; // Locked after progress
          if (a.progress > 0 && b.progress === 0) return -1; // Progress before locked
          return b.progress - a.progress; // Higher progress first
        }

        // Both earned: sort by unlock date (newest first)
        if (a.earned && b.earned) {
          const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return bDate - aDate;
        }

        return 0;
      });
    });

    return grouped;
  }, [visibleAchievements]);

  // Recently earned achievements (earned in last 7 days, sorted by unlockedAt)
  const recentlyEarned = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return achievements
      .filter((a) => {
        if (!a.earned || !a.unlockedAt) return false;
        return new Date(a.unlockedAt) >= sevenDaysAgo;
      })
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return (
          new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
        );
      });
  }, [achievements]);

  // Most recent achievement for hero section
  const mostRecentAchievement = useMemo(() => {
    return recentlyEarned[0] || null;
  }, [recentlyEarned]);

  // Next up achievements (85%+ progress)
  const nextUpAchievements = useMemo(() => {
    return visibleAchievements
      .filter((a) => !a.earned && a.progress >= 85)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [visibleAchievements]);

  // Confetti effect for newly earned achievements
  useEffect(() => {
    if (!open || !mostRecentAchievement) return;

    const storageKey = `achievement_confetti_${mostRecentAchievement.id}`;
    const hasShownConfetti = localStorage.getItem(storageKey);

    if (!hasShownConfetti && mostRecentAchievement.unlockedAt) {
      const unlockedDate = new Date(mostRecentAchievement.unlockedAt);
      const daysSinceUnlocked =
        (Date.now() - unlockedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Only show confetti if unlocked in last 24 hours
      if (daysSinceUnlocked < 1) {
        const timer = setTimeout(() => {
          confettiRef.current?.fire({
            colors: ['#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b'],
            origin: { y: 0.7 },
            particleCount: 100,
            spread: 70,
          });
          localStorage.setItem(storageKey, 'true');
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [open, mostRecentAchievement]);

  // Helper to check if achievement is locked
  const isAchievementLocked = (achievement: Achievement) => {
    return (
      !achievement.earned &&
      achievement.progress === 0 &&
      !achievement.id.includes('first-') &&
      achievement.category !== 'foundation'
    );
  };

  // Filter achievements by showLocked setting
  const filteredAchievementsByCategory = useMemo(() => {
    const filtered = new Map<AchievementCategory, Achievement[]>();
    achievementsByCategory.forEach((cats, category) => {
      const filteredCats = showLocked
        ? cats
        : cats.filter((ach) => !isAchievementLocked(ach));
      if (filteredCats.length > 0) {
        filtered.set(category, filteredCats);
      }
    });
    return filtered;
  }, [achievementsByCategory, showLocked, isAchievementLocked]);

  // Statistics - count all achievements, not just visible ones
  const totalEarned = useMemo(
    () => achievements.filter((a) => a.earned).length,
    [achievements],
  );
  const totalAchievements = achievements.length;
  const completionPercentage = Math.round(
    (totalEarned / totalAchievements) * 100,
  );

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Achievements"
    >
      {/* Confetti Canvas */}
      <Confetti
        className="pointer-events-none fixed inset-0 z-50 size-full"
        manualstart
        ref={confettiRef}
      />

      <div className="space-y-6">
        {/* Quick Stats - Compact Top Section */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Level</div>
            <div className="text-xl font-bold text-foreground">
              {level.level}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {level.name}
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Earned</div>
            <div className="text-xl font-bold text-foreground">
              {totalEarned}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              of {totalAchievements}
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Progress</div>
            <div className="text-xl font-bold text-foreground">
              {completionPercentage}%
            </div>
            <div className="h-1 w-full bg-muted rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Hero Section - Most Recent Achievement */}
        {mostRecentAchievement && (
          <div className="relative">
            <AchievementHeroCard
              achievement={mostRecentAchievement}
              onClick={() => setSelectedAchievement(mostRecentAchievement)}
            />
          </div>
        )}

        {/* Visual Separator */}
        {(mostRecentAchievement || nextUpAchievements.length > 0) && (
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
          </div>
        )}

        {/* Last Accomplished Section */}
        {mostRecentAchievement && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground">
                Last Accomplished
              </h3>
            </div>
            <Card
              className="relative overflow-hidden p-4 border-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
              onClick={() => setSelectedAchievement(mostRecentAchievement)}
            >
              {/* Glow effect - matching bottom nav Nugget avatar */}
              <motion.div
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1],
                }}
                className="absolute inset-0 rounded-lg bg-primary blur-xl pointer-events-none z-0"
                transition={{
                  duration: 3,
                  ease: 'easeInOut',
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
              <DotPattern
                className="opacity-10"
                cr={0.5}
                cx={1}
                cy={1}
                height={10}
                width={10}
              />
              {/* Earned Checkmark Badge */}
              <div className="absolute top-3 right-3 z-20">
                <div className="rounded-full bg-primary p-2 shadow-lg ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <CheckCircle2 className="size-5 text-primary-foreground" />
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="text-5xl shrink-0 relative ring-2 ring-primary/20 rounded-lg p-1 bg-primary/5">
                  {mostRecentAchievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-primary">
                      {mostRecentAchievement.name}
                    </h4>
                    <Badge
                      className={cn(
                        'text-xs',
                        rarityColors[mostRecentAchievement.rarity].text,
                        rarityColors[mostRecentAchievement.rarity].bg,
                      )}
                      variant="outline"
                    >
                      {rarityLabels[mostRecentAchievement.rarity]}
                    </Badge>
                  </div>
                  {mostRecentAchievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground">
                      Earned{' '}
                      {format(
                        new Date(mostRecentAchievement.unlockedAt),
                        'MMMM d, yyyy',
                      )}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </div>
        )}

        {/* Next Up Section */}
        {nextUpAchievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Next Up</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {nextUpAchievements.map((achievement, index) => (
                <AchievementProgressCard
                  achievement={achievement}
                  index={index}
                  key={achievement.id}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Toggle for Locked Achievements */}
        <div className="flex items-center justify-between py-2">
          <h3 className="text-base font-semibold text-foreground">
            All Achievements
          </h3>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              checked={showLocked}
              className="rounded border-border"
              onChange={(e) => setShowLocked(e.target.checked)}
              type="checkbox"
            />
            Show locked
          </label>
        </div>

        {/* Achievements by Category - Clean Sections */}
        <div className="space-y-5">
          {Array.from(filteredAchievementsByCategory.entries()).map(
            ([category, cats], _categoryIndex) => {
              const earnedCount = cats.filter((a) => a.earned).length;
              const totalInCategory = cats.length;
              const categoryEarned = earnedCount === totalInCategory;

              return (
                <div
                  className={cn(
                    'relative space-y-3 rounded-xl border p-5 transition-all hover:shadow-lg',
                    categoryEarned
                      ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30'
                      : 'bg-gradient-to-br from-card/60 to-card/40 border-border',
                  )}
                  key={category}
                >
                  {/* Subtle background pattern */}
                  <DotPattern
                    className="opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]"
                    cr={1}
                    cx={1}
                    cy={1}
                    height={12}
                    width={12}
                  />

                  {/* Category Header */}
                  <div className="relative flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-foreground">
                        {categoryLabels[category]}
                      </h3>
                      <Badge
                        className={cn(
                          'text-xs font-medium',
                          categoryEarned &&
                            'bg-primary/20 text-primary border-primary/30',
                        )}
                        variant="secondary"
                      >
                        {earnedCount} / {totalInCategory}
                      </Badge>
                      {categoryEarned && (
                        <span className="text-lg animate-pulse">✨</span>
                      )}
                    </div>
                  </div>

                  {/* Achievements Grid */}
                  <div className="relative grid grid-cols-1 gap-2.5">
                    {cats.map((achievement, index) => (
                      <AchievementCard
                        achievement={achievement}
                        index={index}
                        isLocked={isAchievementLocked(achievement)}
                        key={achievement.id}
                        onClick={() =>
                          !isAchievementLocked(achievement) &&
                          setSelectedAchievement(achievement)
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* Streaks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Streaks</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Feeding Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.feeding.current} days
              </div>
              {streaks.feeding.longest > streaks.feeding.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.feeding.longest} days
                </div>
              )}
              {streaks.feeding.current >= 7 && (
                <div className="text-xs text-primary mt-1">🔥 On fire!</div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Diaper Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.diaper.current} days
              </div>
              {streaks.diaper.longest > streaks.diaper.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.diaper.longest} days
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Sleep Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.sleep.current} days
              </div>
              {streaks.sleep.longest > streaks.sleep.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.sleep.longest} days
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Perfect Day Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.perfectDay.current} days
              </div>
              {streaks.perfectDay.longest > streaks.perfectDay.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.perfectDay.longest} days
                </div>
              )}
              {streaks.perfectDay.current >= 3 && (
                <div className="text-xs text-primary mt-1">⭐ Perfect!</div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {/* Achievement Detail View */}
      {selectedAchievement && (
        <AchievementDetailView
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </StatsDrawerWrapper>
  );
}

// Hero Card Component for Most Recent Achievement
function AchievementHeroCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick: () => void;
}) {
  const rarityColor = rarityColors[achievement.rarity];
  const showParticles =
    achievement.rarity === 'legendary' || achievement.rarity === 'epic';

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-6 border-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl',
        rarityColor.bg,
        rarityColor.border,
        'animate-in fade-in slide-in-from-top-2 duration-500',
      )}
      onClick={onClick}
    >
      {achievement.earned && (
        <>
          {/* Glow effect - matching bottom nav Nugget avatar */}
          <motion.div
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
            }}
            className="absolute inset-0 rounded-xl bg-primary blur-xl pointer-events-none z-0"
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
          <ShineBorder
            borderWidth={2}
            className="z-0"
            duration={14}
            shineColor={
              achievement.rarity === 'legendary'
                ? ['#ffbe0b', '#fb5607', '#ff006e']
                : achievement.rarity === 'epic'
                  ? ['#8338ec', '#3a86ff']
                  : ['#3a86ff', '#8338ec']
            }
          />
          {showParticles && (
            <Particles
              className="absolute inset-0 pointer-events-none z-0"
              color={achievement.rarity === 'legendary' ? '#ffbe0b' : '#8338ec'}
              ease={50}
              quantity={20}
              size={1}
              staticity={50}
            />
          )}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-4 left-4 size-2 rounded-full bg-primary/30 animate-pulse" />
            <div className="absolute top-6 right-6 size-1.5 rounded-full bg-secondary/40 animate-pulse delay-100" />
            <div className="absolute bottom-4 left-6 size-1 rounded-full bg-accent/30 animate-pulse delay-200" />
            <Sparkles className="absolute top-3 right-8 size-4 text-primary/50 animate-pulse delay-75" />
            <Sparkles className="absolute bottom-3 left-8 size-3 text-secondary/50 animate-pulse delay-150" />
          </div>
        </>
      )}
      {/* Earned Checkmark Badge */}
      <div className="absolute top-4 right-4 z-30">
        <div className="rounded-full bg-primary p-2.5 shadow-xl ring-3 ring-primary/30 ring-offset-2 ring-offset-background">
          <CheckCircle2 className="size-6 text-primary-foreground" />
        </div>
      </div>
      <div className="relative z-20 flex items-center gap-5">
        <div className="text-6xl shrink-0 relative ring-2 ring-primary/20 rounded-xl p-2 bg-primary/5">
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-primary">
              {achievement.name}
            </h2>
            <Badge
              className={cn('text-xs', rarityColor.text, rarityColor.bg)}
              variant="outline"
            >
              {rarityLabels[achievement.rarity]}
            </Badge>
          </div>
          {achievement.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {achievement.description}
            </p>
          )}
          {achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground">
              Unlocked {format(new Date(achievement.unlockedAt), 'MMMM d')}
            </p>
          )}
        </div>
        <ChevronRight className="size-6 text-muted-foreground shrink-0" />
      </div>
    </Card>
  );
}

// Progress Card Component for Next Up Section
function AchievementProgressCard({
  achievement,
  index,
  onClick,
}: {
  achievement: Achievement;
  index: number;
  onClick: () => void;
}) {
  const rarityColor = rarityColors[achievement.rarity];

  return (
    <Card
      className={cn(
        'p-4 border-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg',
        rarityColor.bg,
        rarityColor.border,
        'opacity-90',
        'animate-in fade-in slide-in-from-left-2',
      )}
      onClick={onClick}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">{achievement.icon}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-bold text-foreground">
              {achievement.name}
            </div>
            <Badge
              className={cn('text-[10px]', rarityColor.text, rarityColor.bg)}
              variant="outline"
            >
              {rarityLabels[achievement.rarity]}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Progress
              </span>
              <span className="text-lg font-bold text-primary">
                {Math.round(achievement.progress)}%
              </span>
            </div>
            <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-primary via-primary to-primary/80 relative',
                )}
                style={{
                  width: `${Math.min(100, achievement.progress)}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">
                {Math.round((achievement.progress / 100) * achievement.target)}{' '}
                / {achievement.target} completed
              </p>
              <p className="text-xs font-semibold text-primary">
                {Math.ceil(
                  ((100 - achievement.progress) / 100) * achievement.target,
                )}{' '}
                more to go
              </p>
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Card>
  );
}

// Standard Achievement Card Component
function AchievementCard({
  achievement,
  index,
  isLocked,
  onClick,
}: {
  achievement: Achievement;
  index: number;
  isLocked: boolean;
  onClick: () => void;
}) {
  const rarityColor = rarityColors[achievement.rarity];
  const showParticles =
    achievement.earned &&
    (achievement.rarity === 'legendary' || achievement.rarity === 'epic');

  // Enhanced styling for earned achievements - using primary color system
  const earnedColor = achievement.earned
    ? 'border-primary/40 border-2 bg-primary/10 shadow-lg shadow-primary/10'
    : isLocked
      ? cn(rarityColor.bg, rarityColor.border, 'opacity-40 grayscale')
      : cn('bg-card/50 border-border/50 opacity-70');

  return (
    <Card
      className={cn(
        'relative p-4 border-2 transition-all overflow-hidden',
        earnedColor,
        !isLocked &&
          'cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1',
        isLocked && 'cursor-not-allowed',
        'animate-in fade-in slide-in-from-left-2',
      )}
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {achievement.earned && (
        <>
          {/* Glow effect - matching bottom nav Nugget avatar */}
          <motion.div
            animate={{
              opacity: [0.2, 0.3, 0.2],
              scale: [1, 1.05, 1],
            }}
            className="absolute inset-0 rounded-lg bg-primary blur-xl pointer-events-none z-0"
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
          {achievement.rarity === 'legendary' && (
            <BorderBeam
              anchor={90}
              borderWidth={1.5}
              className="rounded-lg"
              colorFrom="#ffbe0b"
              colorTo="#fb5607"
              delay={index * 0.2}
              duration={12}
              size={150}
            />
          )}
          {achievement.rarity === 'epic' && (
            <BorderBeam
              anchor={90}
              borderWidth={1.5}
              className="rounded-lg"
              colorFrom="#8338ec"
              colorTo="#3a86ff"
              delay={index * 0.2}
              duration={12}
              size={150}
            />
          )}
          {achievement.rarity === 'rare' && (
            <BorderBeam
              anchor={90}
              borderWidth={1}
              className="rounded-lg"
              colorFrom="#3a86ff"
              colorTo="#06b6d4"
              delay={index * 0.2}
              duration={15}
              size={120}
            />
          )}
        </>
      )}
      {showParticles && (
        <Particles
          className="absolute inset-0 pointer-events-none z-0"
          color={achievement.rarity === 'legendary' ? '#ffbe0b' : '#8338ec'}
          ease={50}
          quantity={15}
          size={0.8}
          staticity={50}
        />
      )}
      {achievement.earned && !showParticles && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <DotPattern
            className="opacity-10"
            cr={0.5}
            cx={1}
            cy={1}
            height={8}
            width={8}
          />
          <div className="absolute top-2 left-2 size-1 rounded-full bg-primary/30 animate-pulse" />
          <div className="absolute bottom-2 right-2 size-1 rounded-full bg-secondary/40 animate-pulse delay-100" />
        </div>
      )}
      {/* Earned Checkmark Badge */}
      {achievement.earned && (
        <div className="absolute top-2 right-2 z-20">
          <div className="rounded-full bg-primary p-1.5 shadow-lg ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            <CheckCircle2 className="size-4 text-primary-foreground" />
          </div>
        </div>
      )}
      <div className="relative z-10 flex items-start gap-3">
        <div
          className={cn(
            'text-3xl shrink-0 relative',
            isLocked && 'opacity-50',
            achievement.earned &&
              'ring-2 ring-primary/20 rounded-lg p-1 bg-primary/5',
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {isLocked ? '🔒' : achievement.icon}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={cn(
                'text-sm font-bold',
                achievement.earned
                  ? 'text-base text-primary'
                  : 'text-foreground',
              )}
            >
              {achievement.name}
            </div>
            {!achievement.earned && isLocked && (
              <Badge className="text-[10px]" variant="secondary">
                Locked
              </Badge>
            )}
          </div>
          {achievement.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>
          )}
          {!achievement.earned && !isLocked && achievement.progress > 0 && (
            <div className="space-y-1.5 pt-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Progress
                </span>
                <span className="text-sm font-bold text-primary">
                  {Math.round(achievement.progress)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 ease-out rounded-full relative"
                  style={{
                    width: `${Math.min(100, achievement.progress)}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {Math.round((achievement.progress / 100) * achievement.target)}{' '}
                / {achievement.target} •{' '}
                {Math.ceil(
                  ((100 - achievement.progress) / 100) * achievement.target,
                )}{' '}
                more to go
              </p>
            </div>
          )}
        </div>
        {!isLocked && (
          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </div>
    </Card>
  );
}

function AchievementDetailView({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  const rarityColor = rarityColors[achievement.rarity];
  const isLocked =
    !achievement.earned &&
    achievement.progress === 0 &&
    !achievement.id.includes('first-') &&
    achievement.category !== 'foundation';

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'text-6xl shrink-0',
              isLocked && 'opacity-50 grayscale',
            )}
          >
            {isLocked ? '🔒' : achievement.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-foreground">
                {achievement.name}
              </h2>
              <Badge
                className={cn('text-sm', rarityColor.text, rarityColor.bg)}
                variant="outline"
              >
                {rarityLabels[achievement.rarity]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {categoryLabels[achievement.category]}
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        {achievement.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Description
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {achievement.description}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Status</h3>
          {achievement.earned ? (
            <div
              className={cn(
                'p-4 rounded-lg border-2',
                rarityColor.bg,
                rarityColor.border,
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✓</span>
                <span className="font-semibold text-foreground">Earned</span>
              </div>
              {achievement.unlockedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Unlocked on{' '}
                  {format(new Date(achievement.unlockedAt), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          ) : isLocked ? (
            <div className="p-4 rounded-lg border-2 bg-muted/50 border-muted">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔒</span>
                <span className="font-semibold text-foreground">Locked</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete the previous achievement to unlock this one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={cn(
                  'p-4 rounded-lg border-2',
                  rarityColor.bg,
                  rarityColor.border,
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">
                    In Progress
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {Math.round(achievement.progress)}%
                  </span>
                </div>
                <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out relative bg-gradient-to-r from-primary via-primary to-primary/80',
                    )}
                    style={{
                      width: `${Math.min(100, achievement.progress)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(
                      (achievement.progress / 100) * achievement.target,
                    )}{' '}
                    / {achievement.target} completed
                  </span>
                  {achievement.progress < 100 && (
                    <span className="text-sm font-semibold text-primary">
                      {Math.ceil(
                        ((100 - achievement.progress) / 100) *
                          achievement.target,
                      )}{' '}
                      more needed
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">
                  <span className="font-semibold text-foreground">Target:</span>{' '}
                  {achievement.target}
                </p>
                {achievement.progress < 100 && (
                  <p>
                    <span className="font-semibold text-foreground">
                      Remaining:
                    </span>{' '}
                    {Math.max(
                      0,
                      Math.ceil(
                        ((100 - achievement.progress) / 100) *
                          achievement.target,
                      ),
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {!achievement.earned && !isLocked && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="size-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Keep Going!
                </h4>
                <p className="text-sm text-muted-foreground">
                  You're making great progress! Keep tracking your activities to
                  unlock this achievement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={(open) => !open && onClose()} open={true}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">{achievement.name}</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      dismissible={true}
      onOpenChange={(open) => !open && onClose()}
      open={true}
    >
      <DrawerContent className="max-h-[90vh] bg-background border-none p-0">
        <DrawerTitle className="sr-only">{achievement.name}</DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
