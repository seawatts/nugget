'use client';

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  Baby,
  Bold as Bottle,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Columns3,
  Droplets,
  LayoutList,
  Moon,
  RefreshCw,
  Settings,
  User,
  Utensils,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

interface TimelineEvent {
  id: string;
  type: 'sleep' | 'nursing' | 'bottle' | 'diaper' | 'solids' | 'activity';
  timestamp: Date;
  isScheduled: boolean;
  assignedTo?: string;
  duration?: number;
  notes?: string;
  amount?: number;
  diaperType?: 'pee' | 'poop' | 'both';
}

export default function TimelinePage() {
  const babyAgeDays = 21;
  const [viewMode, setViewMode] = useState<'timeline' | 'columns'>('timeline');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'pee',
    'poop',
    'feeding',
  ]);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const nextEventRef = useRef<HTMLDivElement>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([
    // Past hour
    {
      duration: 15,
      id: '1',
      isScheduled: false,
      notes: 'Left side, very hungry',
      timestamp: new Date(Date.now() - 45 * 60000), // 45 min ago
      type: 'nursing',
    },
    // 1-2 hours ago
    {
      diaperType: 'pee',
      id: '2',
      isScheduled: false,
      notes: 'Wet',
      timestamp: new Date(Date.now() - 90 * 60000), // 1.5 hours ago
      type: 'diaper',
    },
    {
      duration: 10,
      id: '3',
      isScheduled: false,
      notes: 'Tummy time',
      timestamp: new Date(Date.now() - 105 * 60000), // 1h 45m ago
      type: 'activity',
    },
    // 2-3 hours ago
    {
      duration: 45,
      id: '4',
      isScheduled: false,
      notes: 'Nap in crib',
      timestamp: new Date(Date.now() - 135 * 60000), // 2h 15m ago
      type: 'sleep',
    },
    {
      amount: 4,
      id: '5',
      isScheduled: false,
      notes: 'Formula',
      timestamp: new Date(Date.now() - 165 * 60000), // 2h 45m ago
      type: 'bottle',
    },
    // 3-4 hours ago
    {
      diaperType: 'poop',
      id: '6',
      isScheduled: false,
      notes: 'Dirty diaper',
      timestamp: new Date(Date.now() - 195 * 60000), // 3h 15m ago
      type: 'diaper',
    },
    {
      duration: 15,
      id: '7',
      isScheduled: false,
      notes: 'Playtime with toys',
      timestamp: new Date(Date.now() - 210 * 60000), // 3h 30m ago
      type: 'activity',
    },
    {
      duration: 20,
      id: '8',
      isScheduled: false,
      notes: 'Both sides',
      timestamp: new Date(Date.now() - 240 * 60000), // 4 hours ago
      type: 'nursing',
    },
    // 4-5 hours ago
    {
      diaperType: 'pee',
      id: '9',
      isScheduled: false,
      notes: 'Wet',
      timestamp: new Date(Date.now() - 255 * 60000), // 4h 15m ago
      type: 'diaper',
    },
    {
      duration: 90,
      id: '10',
      isScheduled: false,
      notes: 'Long nap',
      timestamp: new Date(Date.now() - 270 * 60000), // 4h 30m ago
      type: 'sleep',
    },
    // 5-6 hours ago
    {
      amount: 5,
      id: '11',
      isScheduled: false,
      notes: 'Breast milk',
      timestamp: new Date(Date.now() - 330 * 60000), // 5h 30m ago
      type: 'bottle',
    },
    {
      diaperType: 'both',
      id: '12',
      isScheduled: false,
      notes: 'Both',
      timestamp: new Date(Date.now() - 345 * 60000), // 5h 45m ago
      type: 'diaper',
    },
    // 6-7 hours ago
    {
      duration: 20,
      id: '13',
      isScheduled: false,
      notes: 'Reading books together',
      timestamp: new Date(Date.now() - 375 * 60000), // 6h 15m ago
      type: 'activity',
    },
    {
      duration: 18,
      id: '14',
      isScheduled: false,
      notes: 'Right side',
      timestamp: new Date(Date.now() - 405 * 60000), // 6h 45m ago
      type: 'nursing',
    },
    // 7-8 hours ago
    {
      diaperType: 'pee',
      id: '15',
      isScheduled: false,
      notes: 'Wet',
      timestamp: new Date(Date.now() - 435 * 60000), // 7h 15m ago
      type: 'diaper',
    },
    {
      duration: 60,
      id: '16',
      isScheduled: false,
      notes: 'Morning nap',
      timestamp: new Date(Date.now() - 465 * 60000), // 7h 45m ago
      type: 'sleep',
    },
    // 8-9 hours ago
    {
      amount: 4,
      id: '17',
      isScheduled: false,
      notes: 'Formula',
      timestamp: new Date(Date.now() - 495 * 60000), // 8h 15m ago
      type: 'bottle',
    },
    {
      diaperType: 'poop',
      id: '18',
      isScheduled: false,
      notes: 'Dirty',
      timestamp: new Date(Date.now() - 510 * 60000), // 8h 30m ago
      type: 'diaper',
    },
    // 9-10 hours ago
    {
      duration: 25,
      id: '19',
      isScheduled: false,
      notes: 'Bath time',
      timestamp: new Date(Date.now() - 555 * 60000), // 9h 15m ago
      type: 'activity',
    },
    {
      duration: 22,
      id: '20',
      isScheduled: false,
      notes: 'Both sides, sleepy',
      timestamp: new Date(Date.now() - 585 * 60000), // 9h 45m ago
      type: 'nursing',
    },
    // 10-11 hours ago
    {
      diaperType: 'pee',
      id: '21',
      isScheduled: false,
      notes: 'Wet',
      timestamp: new Date(Date.now() - 615 * 60000), // 10h 15m ago
      type: 'diaper',
    },
    {
      duration: 120,
      id: '22',
      isScheduled: false,
      notes: 'Night sleep segment',
      timestamp: new Date(Date.now() - 645 * 60000), // 10h 45m ago
      type: 'sleep',
    },
    // 11-12 hours ago
    {
      amount: 3,
      id: '23',
      isScheduled: false,
      notes: 'Dream feed',
      timestamp: new Date(Date.now() - 675 * 60000), // 11h 15m ago
      type: 'bottle',
    },
    {
      diaperType: 'pee',
      id: '24',
      isScheduled: false,
      notes: 'Night change',
      timestamp: new Date(Date.now() - 690 * 60000), // 11h 30m ago
      type: 'diaper',
    },
  ]);

  const [scheduledEvents, setScheduledEvents] = useState<TimelineEvent[]>(() =>
    generateSchedule(babyAgeDays),
  );

  function generateSchedule(age: number | null): TimelineEvent[] {
    if (!age) return [];

    const schedule: TimelineEvent[] = [];
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (age <= 7) {
      for (let hour = 0; hour < 24; hour += 2.5) {
        const feedTime = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
        if (feedTime > now) {
          schedule.push({
            assignedTo: 'Mom',
            id: `auto-feed-${hour}`,
            isScheduled: true,
            notes: 'Newborn feeding schedule',
            timestamp: feedTime,
            type: 'nursing',
          });
        }
      }

      for (let hour = 1; hour < 24; hour += 3) {
        const diaperTime = new Date(
          startOfDay.getTime() + hour * 60 * 60 * 1000,
        );
        if (diaperTime > now) {
          schedule.push({
            assignedTo: 'Parent',
            diaperType: 'both',
            id: `auto-diaper-${hour}`,
            isScheduled: true,
            notes: 'Check diaper',
            timestamp: diaperTime,
            type: 'diaper',
          });
        }
      }
    } else if (age <= 28) {
      for (let hour = 0; hour < 24; hour += 3) {
        const feedTime = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
        if (feedTime > now) {
          schedule.push({
            assignedTo: 'Mom',
            id: `auto-feed-${hour}`,
            isScheduled: true,
            timestamp: feedTime,
            type: age > 14 ? 'bottle' : 'nursing',
          });
        }
      }
    } else if (age <= 90) {
      for (let hour = 0; hour < 24; hour += 3.5) {
        const feedTime = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
        if (feedTime > now) {
          schedule.push({
            assignedTo: 'Parent',
            id: `auto-feed-${hour}`,
            isScheduled: true,
            timestamp: feedTime,
            type: 'bottle',
          });
        }
      }
    } else {
      for (let hour = 7; hour < 20; hour += 4) {
        const feedTime = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
        if (feedTime > now) {
          schedule.push({
            assignedTo: 'Parent',
            id: `auto-feed-${hour}`,
            isScheduled: true,
            timestamp: feedTime,
            type: hour === 11 || hour === 15 ? 'solids' : 'bottle',
          });
        }
      }
    }

    return schedule;
  }

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sleep':
        return Moon;
      case 'nursing':
      case 'bottle':
        return Bottle;
      case 'diaper':
        return Droplets;
      case 'solids':
        return Utensils;
      case 'activity':
        return Activity;
      default:
        return Baby;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'sleep':
        return 'bg-sleep text-sleep-foreground';
      case 'nursing':
      case 'bottle':
        return 'bg-feeding text-feeding-foreground';
      case 'diaper':
        return 'bg-diaper text-diaper-foreground';
      case 'solids':
        return 'bg-solids text-solids-foreground';
      case 'activity':
        return 'bg-pumping text-pumping-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date) => {
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) return `${absMins} min ago`;
      const hours = Math.floor(absMins / 60);
      return `${hours}h ago`;
    }
    if (diffMins < 60) return `in ${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    return `in ${hours}h`;
  };

  const quickActions: Array<{
    color: string;
    icon: LucideIcon;
    label: string;
    type: TimelineEvent['type'];
  }> = [
    { color: 'bg-feeding', icon: Bottle, label: 'Nursing', type: 'nursing' },
    { color: 'bg-sleep', icon: Moon, label: 'Sleep', type: 'sleep' },
    { color: 'bg-diaper', icon: Droplets, label: 'Diaper', type: 'diaper' },
    { color: 'bg-feeding', icon: Bottle, label: 'Bottle', type: 'bottle' },
  ];

  const allEvents = [...events, ...scheduledEvents].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const nextEventIndex = allEvents.findIndex(
    (event) => event.timestamp.getTime() > now.getTime(),
  );

  useEffect(() => {
    if (viewMode !== 'timeline') {
      return;
    }

    if (nextEventIndex < 0) {
      return;
    }

    const timeout = setTimeout(() => {
      nextEventRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [viewMode, nextEventIndex]);

  const getColumnData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = events.filter((e) => {
      const eventDate = new Date(e.timestamp);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    return {
      activity: todayEvents.filter((e) => e.type === 'activity'),
      feeding: todayEvents.filter(
        (e) =>
          e.type === 'nursing' || e.type === 'bottle' || e.type === 'solids',
      ),
      pee: todayEvents.filter(
        (e) =>
          e.type === 'diaper' &&
          (e.diaperType === 'pee' || e.diaperType === 'both'),
      ),
      poop: todayEvents.filter(
        (e) =>
          e.type === 'diaper' &&
          (e.diaperType === 'poop' || e.diaperType === 'both'),
      ),
      sleep: todayEvents.filter((e) => e.type === 'sleep'),
    };
  };

  const columnData = getColumnData();

  const availableColumns = [
    { color: 'bg-diaper', icon: Droplets, id: 'pee', label: 'Pee' },
    { color: 'bg-diaper', icon: Droplets, id: 'poop', label: 'Poop' },
    { color: 'bg-feeding', icon: Bottle, id: 'feeding', label: 'Feeding' },
    { color: 'bg-sleep', icon: Moon, id: 'sleep', label: 'Sleep' },
    { color: 'bg-pumping', icon: Activity, id: 'activity', label: 'Activity' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const currentScrollY = container.scrollTop;

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="px-4 pt-4 h-[calc(100vh-8rem)] flex flex-col">
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            isHeaderVisible
              ? 'max-h-[500px] opacity-100 mb-4'
              : 'max-h-0 opacity-0 mb-0',
          )}
        >
          {babyAgeDays !== null && (
            <div className="mb-4 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">
                    Day {babyAgeDays} Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated based on baby's age
                  </p>
                </div>
                <Button
                  className="bg-background/50"
                  onClick={() => {
                    const newSchedule = generateSchedule(babyAgeDays);
                    setScheduledEvents(newSchedule);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('timeline')}
                size="sm"
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
              >
                <LayoutList className="h-4 w-4 mr-1" />
                Timeline
              </Button>
              <Button
                onClick={() => setViewMode('columns')}
                size="sm"
                variant={viewMode === 'columns' ? 'default' : 'outline'}
              >
                <Columns3 className="h-4 w-4 mr-1" />
                Columns
              </Button>
            </div>
            {viewMode === 'columns' && (
              <Button
                onClick={() => setShowColumnConfig(true)}
                size="sm"
                variant="ghost"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Quick Log
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    className={cn(
                      'flex flex-col h-auto py-3 gap-1',
                      action.color,
                    )}
                    key={action.type}
                    onClick={() => {
                      const newEvent: TimelineEvent = {
                        diaperType:
                          action.type === 'diaper' ? 'both' : undefined,
                        id: Date.now().toString(),
                        isScheduled: false,
                        timestamp: new Date(),
                        type: action.type,
                      };
                      setEvents([newEvent, ...events]);
                    }}
                    variant="outline"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent text-white"
              onClick={() => {
                // This button is no longer used for adding custom schedules,
                // but keeping it for now as it might be re-introduced or removed.
                // setShowScheduleDrawer(true);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add Custom Schedule
            </Button>
          </div>
        </div>

        {viewMode === 'columns' ? (
          <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
            <h2 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background z-10 pb-2">
              Timeline
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {visibleColumns.map((columnId) => {
                const column = availableColumns.find((c) => c.id === columnId);
                if (!column) return null;

                const Icon = column.icon;
                const columnEvents =
                  columnData[columnId as keyof typeof columnData] || [];

                return (
                  <div
                    className="rounded-2xl border border-border bg-card p-4"
                    key={columnId}
                  >
                    <div
                      className={cn(
                        'rounded-full p-2 w-fit mb-3',
                        column.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{column.label}</h3>
                    <p className="text-3xl font-bold mb-4">
                      {columnEvents.length}
                    </p>
                    <div className="space-y-2">
                      {columnEvents.slice(0, 5).map((event) => (
                        <div
                          className="text-xs text-muted-foreground border-l-2 border-border pl-2"
                          key={event.id}
                        >
                          {formatTime(event.timestamp)}
                          {event.notes && (
                            <span className="ml-1">• {event.notes}</span>
                          )}
                        </div>
                      ))}
                      {columnEvents.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{columnEvents.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2" ref={scrollContainerRef}>
            <h2 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background z-10 pb-2">
              Timeline
            </h2>

            {allEvents.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const lastHistoricalEvent =
                events.length > 0 ? events.at(-1) : null;
              const isNow =
                index > 0 &&
                lastHistoricalEvent?.id === event.id &&
                scheduledEvents.length > 0;
              const diffMs = event.timestamp.getTime() - now.getTime();
              const diffMins = Math.round(diffMs / 60000);
              const isUpcomingSoon =
                event.isScheduled && diffMins > 0 && diffMins <= 15;
              const isPastDue = event.isScheduled && diffMins < 0;
              const showCountdown = isUpcomingSoon || isPastDue;
              const isPast = event.timestamp.getTime() < now.getTime();
              const isNextEvent = index === nextEventIndex;
              const isFutureEvent = !isPast && !isNextEvent;

              return (
                <div key={event.id}>
                  {isNow && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-xs font-medium text-primary">
                        NOW
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-2xl border transition-all',
                      isPast &&
                        !event.isScheduled &&
                        'opacity-40 bg-muted/20 border-muted-foreground/20',
                      isNextEvent &&
                        'border-accent border-solid bg-accent/20 border-2 shadow-lg shadow-accent/20',
                      isFutureEvent &&
                        event.isScheduled &&
                        'bg-primary/5 border-primary/30 border-dashed',
                      event.isScheduled && !isNextEvent && !isFutureEvent
                        ? 'bg-muted/30 border-dashed border-muted-foreground/30'
                        : !isPast && !isNextEvent && 'bg-card border-border',
                      isUpcomingSoon && isNextEvent && 'border-accent',
                      isPastDue &&
                        'border-destructive border-solid bg-destructive/10 border-2',
                    )}
                    ref={isNextEvent ? nextEventRef : null}
                  >
                    <div
                      className={cn(
                        'flex items-start gap-3',
                        showCountdown || isNextEvent ? 'p-6' : 'p-4',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-full',
                          showCountdown || isNextEvent ? 'p-3' : 'p-2',
                          getEventColor(event.type),
                          isPast && !event.isScheduled && 'opacity-50',
                        )}
                      >
                        <Icon
                          className={cn(
                            showCountdown || isNextEvent
                              ? 'h-6 w-6'
                              : 'h-4 w-4',
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className={cn(
                                'font-medium capitalize',
                                (showCountdown || isNextEvent) && 'text-lg',
                                isNextEvent && 'flex items-center gap-2',
                              )}
                            >
                              {isNextEvent && (
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-accent text-accent-foreground">
                                  NEXT UP
                                </span>
                              )}
                              {event.type}
                            </h3>
                            <p
                              className={cn(
                                'text-muted-foreground mt-1',
                                showCountdown || isNextEvent
                                  ? 'text-base'
                                  : 'text-sm',
                              )}
                            >
                              {formatTime(event.timestamp)} •{' '}
                              {formatRelativeTime(event.timestamp)}
                            </p>
                            {(showCountdown || isNextEvent) && (
                              <div
                                className={cn(
                                  'mt-3 px-4 py-3 rounded-xl font-bold flex items-center gap-2',
                                  isPastDue &&
                                    'bg-destructive/20 text-destructive',
                                  !isPastDue &&
                                    isNextEvent &&
                                    'bg-accent/30 text-accent-foreground',
                                  isUpcomingSoon &&
                                    !isNextEvent &&
                                    'bg-primary/20 text-primary',
                                )}
                              >
                                {isPastDue ? (
                                  <>
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="text-xl">
                                      Past due by {Math.abs(diffMins)} min
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-5 w-5" />
                                    <span className="text-xl">
                                      In {diffMins} minutes
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {event.isScheduled && event.assignedTo && (
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-full',
                                showCountdown || isNextEvent
                                  ? 'text-sm bg-primary/20 text-primary'
                                  : 'text-xs bg-primary/10 text-primary',
                              )}
                            >
                              <User
                                className={cn(
                                  showCountdown || isNextEvent
                                    ? 'h-4 w-4'
                                    : 'h-3 w-3',
                                )}
                              />
                              {event.assignedTo}
                            </div>
                          )}
                        </div>

                        <div
                          className={cn(
                            'space-y-1',
                            showCountdown || isNextEvent ? 'mt-3' : 'mt-2',
                          )}
                        >
                          {event.duration && (
                            <p
                              className={cn(
                                'text-muted-foreground flex items-center gap-1',
                                showCountdown || isNextEvent
                                  ? 'text-base'
                                  : 'text-sm',
                              )}
                            >
                              <Clock
                                className={cn(
                                  showCountdown || isNextEvent
                                    ? 'h-4 w-4'
                                    : 'h-3 w-3',
                                )}
                              />
                              {event.duration} minutes
                            </p>
                          )}
                          {event.notes && (
                            <p
                              className={cn(
                                'text-muted-foreground',
                                showCountdown || isNextEvent
                                  ? 'text-base'
                                  : 'text-sm',
                              )}
                            >
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {isPastDue ? (
                        <Button
                          className="bg-accent hover:bg-accent/80 flex-shrink-0"
                          onClick={() => {
                            setScheduledEvents(
                              scheduledEvents.filter((e) => e.id !== event.id),
                            );
                            const completedEvent = {
                              ...event,
                              isScheduled: false,
                              timestamp: new Date(),
                            };
                            setEvents([completedEvent, ...events]);
                          }}
                          size={showCountdown || isNextEvent ? 'default' : 'sm'}
                        >
                          <Check
                            className={cn(
                              showCountdown || isNextEvent
                                ? 'h-5 w-5'
                                : 'h-4 w-4',
                            )}
                          />
                        </Button>
                      ) : (
                        <ChevronRight
                          className={cn(
                            'text-muted-foreground flex-shrink-0',
                            showCountdown || isNextEvent
                              ? 'h-6 w-6'
                              : 'h-5 w-5',
                            isPast && 'opacity-30',
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showColumnConfig && (
        <button
          aria-label="Close column configuration"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setShowColumnConfig(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setShowColumnConfig(false);
            }
          }}
          type="button"
        >
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Configure Columns
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose which columns to display
                </p>
              </div>

              <div className="space-y-2">
                {availableColumns.map((column) => {
                  const Icon = column.icon;
                  const isVisible = visibleColumns.includes(column.id);

                  return (
                    <button
                      className={cn(
                        'w-full p-4 rounded-xl border transition-all flex items-center gap-3',
                        isVisible
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background',
                      )}
                      key={column.id}
                      onClick={() => {
                        if (isVisible) {
                          setVisibleColumns(
                            visibleColumns.filter((id) => id !== column.id),
                          );
                        } else {
                          setVisibleColumns([...visibleColumns, column.id]);
                        }
                      }}
                      type="button"
                    >
                      <div className={cn('rounded-full p-2', column.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{column.label}</span>
                      {isVisible && (
                        <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-primary-foreground">
                            ✓
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full"
                onClick={() => setShowColumnConfig(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </button>
      )}

      <BottomNav />
    </div>
  );
}
