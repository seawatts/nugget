'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

type View = 'day' | 'week' | 'month' | 'list';

export default function FamilyCalendarPage() {
  const [view, setView] = useState<View>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  const viewOptions = [
    { id: 'day' as View, label: 'Day' },
    { id: 'week' as View, label: 'Week' },
    { id: 'month' as View, label: 'Month' },
    { id: 'list' as View, label: 'List' },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-balance">Family Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Coordinate schedules and appointments
            </p>
          </div>

          {/* View Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {viewOptions.map((option) => (
              <Button
                className="whitespace-nowrap"
                key={option.id}
                onClick={() => setView(option.id)}
                variant={view === option.id ? 'default' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Date Navigation */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => navigateDate('prev')}
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <p className="font-semibold">{formatDate(currentDate)}</p>
                <Button
                  className="text-xs"
                  onClick={() => setCurrentDate(new Date())}
                  size="sm"
                  variant="ghost"
                >
                  Today
                </Button>
              </div>
              <Button
                onClick={() => navigateDate('next')}
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          {/* View Content */}
          {view === 'day' && <DayView />}
          {view === 'week' && <WeekView />}
          {view === 'month' && <MonthView />}
          {view === 'list' && <ListView />}

          {/* Add Event Button */}
          <Button className="w-full" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function DayView() {
  const events = [
    {
      color: 'bg-primary',
      id: 'event-pediatrician',
      location: "Children's Medical Center",
      person: 'Riley',
      time: '9:00 AM',
      title: 'Pediatrician Appointment',
      type: 'medical',
    },
    {
      color: 'bg-secondary',
      id: 'event-feeding-time',
      person: 'Riley',
      time: '11:30 AM',
      title: 'Feeding Time',
      type: 'feeding',
    },
    {
      color: 'bg-sleep',
      duration: '2 hours',
      id: 'event-nap-time',
      person: 'Riley',
      time: '1:00 PM',
      title: 'Nap Time',
      type: 'sleep',
    },
    {
      color: 'bg-accent',
      id: 'event-music-class',
      location: 'Little Maestros Studio',
      person: 'Riley',
      time: '3:30 PM',
      title: 'Music Class',
      type: 'activity',
    },
    {
      color: 'bg-chart-4',
      id: 'event-family-dinner',
      person: 'Everyone',
      time: '6:00 PM',
      title: 'Family Dinner',
      type: 'family',
    },
  ];

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card className="p-4 hover:shadow-md transition-shadow" key={event.id}>
          <div className="flex items-start gap-4">
            <div className="text-center min-w-[70px]">
              <p className="text-sm font-semibold">{event.time}</p>
              {event.duration && (
                <p className="text-xs text-muted-foreground">
                  {event.duration}
                </p>
              )}
            </div>
            <div className={`w-1 rounded-full ${event.color}`} />
            <div className="flex-1">
              <h3 className="font-semibold">{event.title}</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{event.person}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
            <Button size="icon" variant="ghost">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WeekView() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekEvents = [
    { day: 0, events: 2 },
    { day: 1, events: 4 },
    { day: 2, events: 3 },
    { day: 3, events: 5 },
    { day: 4, events: 2 },
    { day: 5, events: 1 },
    { day: 6, events: 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayEvent = weekEvents.find((event) => event.day === index);
          const eventsCount = dayEvent?.events ?? 0;
          const indicatorKeys = Array.from(
            { length: Math.min(eventsCount, 3) },
            (_, indicatorIndex) => `${day}-dot-${indicatorIndex}`,
          );

          return (
            <Card className="p-3 text-center" key={day}>
              <p className="text-xs text-muted-foreground mb-1">{day}</p>
              <p className="text-lg font-bold">{index + 10}</p>
              {eventsCount > 0 && (
                <div className="mt-2 flex justify-center gap-1">
                  {indicatorKeys.map((indicatorKey) => (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      key={indicatorKey}
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold mb-3">This Week's Highlights</h3>
        <div className="space-y-2">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pediatrician Checkup</p>
                <p className="text-sm text-muted-foreground">Monday, 9:00 AM</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Swimming Lesson</p>
                <p className="text-sm text-muted-foreground">
                  Wednesday, 10:30 AM
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Playdate with Emma</p>
                <p className="text-sm text-muted-foreground">Friday, 2:00 PM</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-chart-4" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MonthView() {
  const daysInMonth = 31;
  const startDay = 3; // Wednesday
  const weeks = [];
  let currentWeek = Array(startDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const hasEvent = (day: number | null) => {
    if (!day) return false;
    return [5, 10, 12, 15, 18, 22, 25, 28].includes(day);
  };

  const weekRows = weeks.map((week, weekIdx) => ({
    days: week.map((day, dayIdx) => ({
      id:
        day !== null
          ? `day-${day}`
          : `empty-${weekIdx}-${dayIdx}-${week.join('-')}`,
      value: day,
    })),
    id: `week-${weekIdx}-${week.map((day) => day ?? 'empty').join('-')}`,
  }));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              className="text-center text-xs font-medium text-muted-foreground"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>
        {weekRows.map((week) => (
          <div className="grid grid-cols-7 gap-2 mb-2" key={week.id}>
            {week.days.map((day) => (
              <div
                className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                  day.value
                    ? day.value === 15
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'hover:bg-muted cursor-pointer'
                    : ''
                }`}
                key={day.id}
              >
                {day.value && (
                  <div className="relative">
                    <span>{day.value}</span>
                    {hasEvent(day.value) && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Upcoming This Month</h3>
        <div className="space-y-2">
          <Card className="p-3">
            <p className="font-medium text-sm">4 Doctor Appointments</p>
          </Card>
          <Card className="p-3">
            <p className="font-medium text-sm">8 Activity Classes</p>
          </Card>
          <Card className="p-3">
            <p className="font-medium text-sm">2 Family Events</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ListView() {
  const upcomingEvents = [
    {
      date: 'Today',
      events: [
        {
          color: 'bg-primary',
          time: '9:00 AM',
          title: 'Pediatrician Appointment',
          type: 'medical',
        },
        {
          color: 'bg-accent',
          time: '3:30 PM',
          title: 'Music Class',
          type: 'activity',
        },
      ],
    },
    {
      date: 'Tomorrow',
      events: [
        {
          color: 'bg-secondary',
          time: '10:00 AM',
          title: 'Feeding Schedule',
          type: 'feeding',
        },
        {
          color: 'bg-chart-4',
          time: '2:00 PM',
          title: 'Playdate',
          type: 'social',
        },
      ],
    },
    {
      date: 'Wednesday, March 20',
      events: [
        {
          color: 'bg-accent',
          time: '11:00 AM',
          title: 'Swimming Lesson',
          type: 'activity',
        },
        {
          color: 'bg-muted',
          time: '4:00 PM',
          title: 'Grocery Shopping',
          type: 'chore',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {upcomingEvents.map((day) => (
        <div key={day.date}>
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {day.date}
          </h3>
          <div className="space-y-2">
            {day.events.map((event) => (
              <Card className="p-4" key={`${day.date}-${event.title}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-12 rounded-full ${event.color}`} />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.time}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
