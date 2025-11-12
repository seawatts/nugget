'use client';

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  Baby,
  Check,
  Clock,
  Droplets,
  Milk,
  Moon,
  MoreVertical,
  Plus,
  Sparkles,
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

export default function TimelineV2Page() {
  const babyAgeDays = 3;
  const [now, setNow] = useState(new Date());
  const nextEventRef = useRef<HTMLDivElement>(null);

  // Sample past events
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      duration: 15,
      id: '1',
      isScheduled: false,
      notes: 'Left breast, hungry',
      timestamp: new Date(Date.now() - 45 * 60000),
      type: 'nursing',
    },
    {
      diaperType: 'pee',
      id: '2',
      isScheduled: false,
      timestamp: new Date(Date.now() - 90 * 60000),
      type: 'diaper',
    },
    {
      duration: 45,
      id: '3',
      isScheduled: false,
      timestamp: new Date(Date.now() - 135 * 60000),
      type: 'sleep',
    },
    {
      duration: 20,
      id: '4',
      isScheduled: false,
      notes: 'Both sides',
      timestamp: new Date(Date.now() - 210 * 60000),
      type: 'nursing',
    },
    {
      diaperType: 'both',
      id: '5',
      isScheduled: false,
      notes: 'Meconium',
      timestamp: new Date(Date.now() - 270 * 60000),
      type: 'diaper',
    },
  ]);

  // Auto-generate schedule based on baby age
  const [scheduledEvents, setScheduledEvents] = useState<TimelineEvent[]>(() =>
    generateSchedule(),
  );

  const generateSchedule = () => {
    if (!babyAgeDays) return [];

    const schedule: TimelineEvent[] = [];
    const baseTime = new Date();

    if (babyAgeDays <= 7) {
      // Newborn: Feed every 2.5 hours
      for (let i = 1; i <= 6; i++) {
        schedule.push({
          assignedTo: 'Mom',
          id: `schedule-feed-${i}`,
          isScheduled: true,
          timestamp: new Date(baseTime.getTime() + i * 2.5 * 60 * 60 * 1000),
          type: 'nursing',
        });
      }
    }

    return schedule;
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to next event on mount
  useEffect(() => {
    setTimeout(() => {
      nextEventRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 500);
  }, []);

  const allEvents = [...events, ...scheduledEvents].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const nextEventIndex = allEvents.findIndex(
    (event) => event.timestamp.getTime() > now.getTime(),
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sleep':
        return Moon;
      case 'nursing':
      case 'bottle':
        return Milk;
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
      if (absMins < 60) return `${absMins}m ago`;
      const hours = Math.floor(absMins / 60);
      const mins = absMins % 60;
      return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
    }
    if (diffMins < 60) return `in ${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  };

  const quickActions: Array<{
    icon: LucideIcon;
    label: string;
    type: TimelineEvent['type'];
  }> = [
    { icon: Milk, label: 'Feed', type: 'nursing' },
    { icon: Moon, label: 'Sleep', type: 'sleep' },
    { icon: Droplets, label: 'Diaper', type: 'diaper' },
  ];

  const markComplete = (eventId: string) => {
    const scheduled = scheduledEvents.find((e) => e.id === eventId);
    if (scheduled) {
      setScheduledEvents(scheduledEvents.filter((e) => e.id !== eventId));
      setEvents([
        { ...scheduled, isScheduled: false, timestamp: new Date() },
        ...events,
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />

      <main className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Floating Quick Actions */}
        <div className="sticky top-20 z-20 px-4 pt-4 pb-2 bg-gradient-to-b from-background via-background/95 to-transparent">
          <div className="flex gap-2 justify-center">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  className="flex-1 h-16 flex flex-col gap-1 bg-card hover:bg-card/80 border-2 border-border shadow-lg"
                  key={action.type}
                  onClick={() => {
                    const newEvent: TimelineEvent = {
                      diaperType: action.type === 'diaper' ? 'pee' : undefined,
                      id: Date.now().toString(),
                      isScheduled: false,
                      timestamp: new Date(),
                      type: action.type,
                    };
                    setEvents([newEvent, ...events]);
                  }}
                  size="lg"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 scrollbar-thin">
          <div className="max-w-2xl mx-auto space-y-3 py-4">
            {allEvents.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const isPast = event.timestamp.getTime() < now.getTime();
              const isNextEvent = index === nextEventIndex;
              const isFutureEvent = !isPast && !isNextEvent;

              const diffMs = event.timestamp.getTime() - now.getTime();
              const diffMins = Math.round(diffMs / 60000);
              const isUpcomingSoon =
                event.isScheduled && diffMins > 0 && diffMins <= 15;
              const isPastDue = event.isScheduled && diffMins < 0;

              return (
                <div key={event.id}>
                  {/* NOW Divider */}
                  {index === nextEventIndex && (
                    <div className="flex items-center gap-3 my-6">
                      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent flex-1" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent">
                        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs font-bold text-accent uppercase tracking-wide">
                          Now
                        </span>
                      </div>
                      <div className="h-[2px] bg-gradient-to-r from-accent via-transparent to-transparent flex-1" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'relative rounded-3xl border-2 transition-all duration-300',
                      isPast && 'opacity-40 bg-muted/30 border-muted',
                      isNextEvent &&
                        'bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border-accent shadow-xl shadow-accent/20 scale-[1.02]',
                      isFutureEvent &&
                        'bg-card/50 border-dashed border-muted-foreground/30',
                      isPastDue && 'border-destructive bg-destructive/10',
                    )}
                    ref={isNextEvent ? nextEventRef : null}
                  >
                    {/* Urgent Badge */}
                    {isUpcomingSoon && isNextEvent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          COMING UP
                        </div>
                      </div>
                    )}

                    <div className={cn('p-5', isNextEvent && 'p-6')}>
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            'rounded-2xl p-3 bg-gradient-to-br flex-shrink-0 transition-all',
                            event.type === 'sleep' &&
                              'from-sleep/20 to-sleep/40 text-sleep',
                            event.type === 'nursing' &&
                              'from-feeding/20 to-feeding/40 text-feeding',
                            event.type === 'bottle' &&
                              'from-feeding/20 to-feeding/40 text-feeding',
                            event.type === 'diaper' &&
                              'from-diaper/20 to-diaper/40 text-diaper',
                            event.type === 'solids' &&
                              'from-solids/20 to-solids/40 text-solids',
                            event.type === 'activity' &&
                              'from-pumping/20 to-pumping/40 text-pumping',
                            isNextEvent && 'scale-110',
                          )}
                        >
                          <Icon
                            className={cn(
                              'transition-all',
                              isNextEvent ? 'h-7 w-7' : 'h-6 w-6',
                            )}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3
                                className={cn(
                                  'font-semibold capitalize text-foreground',
                                  isNextEvent ? 'text-lg' : 'text-base',
                                )}
                              >
                                {event.type}
                              </h3>
                              <p
                                className={cn(
                                  'text-muted-foreground mt-0.5',
                                  isNextEvent ? 'text-base' : 'text-sm',
                                )}
                              >
                                {formatTime(event.timestamp)}
                                <span className="mx-1.5">•</span>
                                <span
                                  className={cn(
                                    isPastDue &&
                                      'text-destructive font-semibold',
                                  )}
                                >
                                  {formatRelativeTime(event.timestamp)}
                                </span>
                              </p>

                              {/* Countdown Banner for Next Event */}
                              {(isUpcomingSoon || isPastDue) && isNextEvent && (
                                <div
                                  className={cn(
                                    'mt-3 px-4 py-3 rounded-2xl font-bold flex items-center gap-2.5 text-lg',
                                    isPastDue
                                      ? 'bg-destructive/20 text-destructive'
                                      : 'bg-accent/30 text-accent-foreground',
                                  )}
                                >
                                  {isPastDue ? (
                                    <>
                                      <AlertCircle className="h-5 w-5" />
                                      <span>
                                        Overdue by {Math.abs(diffMins)} min
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-5 w-5" />
                                      <span>{diffMins} minutes away</span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Details */}
                              {(event.notes ||
                                event.duration ||
                                event.assignedTo) && (
                                <div className="mt-3 space-y-1.5">
                                  {event.duration && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      {event.duration} min
                                    </div>
                                  )}
                                  {event.assignedTo && (
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <User className="h-3.5 w-3.5 text-primary" />
                                      <span className="text-primary font-medium">
                                        {event.assignedTo}
                                      </span>
                                    </div>
                                  )}
                                  {event.notes && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {event.notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {isPastDue && (
                              <Button
                                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg flex-shrink-0"
                                onClick={() => markComplete(event.id)}
                                size="lg"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                            )}
                            {!isPastDue && !isPast && (
                              <Button
                                className="flex-shrink-0"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreVertical className="h-5 w-5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Spacer */}
            <div className="h-20" />
          </div>
        </div>

        {/* Floating Add Button */}
        <div className="absolute bottom-24 right-6 z-20">
          <Button
            className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl hover:shadow-primary/50 transition-all hover:scale-110"
            size="lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
