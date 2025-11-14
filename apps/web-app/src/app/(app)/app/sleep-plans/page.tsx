'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

const weeksData = [
  {
    days: [
      {
        completed: true,
        day: 1,
        name: 'Monday',
        schedule: [
          {
            activity: 'Morning Wake & Feed',
            color: 'feeding',
            icon: Sun,
            time: '7:00 AM',
          },
          {
            activity: 'Morning Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '9:00 AM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '10:30 AM' },
          {
            activity: 'Afternoon Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '1:00 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '2:30 PM' },
          {
            activity: 'Evening Catnap',
            color: 'sleep',
            duration: '30m',
            icon: Moon,
            time: '4:30 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '5:30 PM' },
          {
            activity: 'Bedtime Routine & Sleep',
            color: 'pumping',
            icon: Moon,
            time: '7:00 PM',
          },
        ],
      },
      {
        completed: true,
        day: 2,
        name: 'Tuesday',
        schedule: [
          {
            activity: 'Morning Wake & Feed',
            color: 'feeding',
            icon: Sun,
            time: '7:00 AM',
          },
          {
            activity: 'Morning Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '9:00 AM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '10:30 AM' },
          {
            activity: 'Afternoon Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '1:00 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '2:30 PM' },
          {
            activity: 'Evening Catnap',
            color: 'sleep',
            duration: '30m',
            icon: Moon,
            time: '4:30 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '5:30 PM' },
          {
            activity: 'Bedtime Routine & Sleep',
            color: 'pumping',
            icon: Moon,
            time: '7:00 PM',
          },
        ],
      },
      {
        completed: false,
        day: 3,
        name: 'Wednesday',
        schedule: [
          {
            activity: 'Morning Wake & Feed',
            color: 'feeding',
            icon: Sun,
            time: '7:00 AM',
          },
          {
            activity: 'Morning Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '9:00 AM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '10:30 AM' },
          {
            activity: 'Afternoon Nap',
            color: 'sleep',
            duration: '1.5h',
            icon: Moon,
            time: '1:00 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '2:30 PM' },
          {
            activity: 'Evening Catnap',
            color: 'sleep',
            duration: '30m',
            icon: Moon,
            time: '4:30 PM',
          },
          { activity: 'Feed', color: 'feeding', icon: Sun, time: '5:30 PM' },
          {
            activity: 'Bedtime Routine & Sleep',
            color: 'pumping',
            icon: Moon,
            time: '7:00 PM',
          },
        ],
      },
      { completed: false, day: 4, name: 'Thursday', schedule: [] },
      { completed: false, day: 5, name: 'Friday', schedule: [] },
      { completed: false, day: 6, name: 'Saturday', schedule: [] },
      { completed: false, day: 7, name: 'Sunday', schedule: [] },
    ],
    id: 1,
    subtitle: 'Getting Started',
    title: 'Week 1',
  },
  {
    days: [
      { completed: false, day: 1, name: 'Monday', schedule: [] },
      { completed: false, day: 2, name: 'Tuesday', schedule: [] },
      { completed: false, day: 3, name: 'Wednesday', schedule: [] },
      { completed: false, day: 4, name: 'Thursday', schedule: [] },
      { completed: false, day: 5, name: 'Friday', schedule: [] },
      { completed: false, day: 6, name: 'Saturday', schedule: [] },
      { completed: false, day: 7, name: 'Sunday', schedule: [] },
    ],
    id: 2,
    subtitle: 'Building Routine',
    title: 'Week 2',
  },
  {
    days: [
      { completed: false, day: 1, name: 'Monday', schedule: [] },
      { completed: false, day: 2, name: 'Tuesday', schedule: [] },
      { completed: false, day: 3, name: 'Wednesday', schedule: [] },
      { completed: false, day: 4, name: 'Thursday', schedule: [] },
      { completed: false, day: 5, name: 'Friday', schedule: [] },
      { completed: false, day: 6, name: 'Saturday', schedule: [] },
      { completed: false, day: 7, name: 'Sunday', schedule: [] },
    ],
    id: 3,
    subtitle: 'Consistency',
    title: 'Week 3',
  },
  {
    days: [
      { completed: false, day: 1, name: 'Monday', schedule: [] },
      { completed: false, day: 2, name: 'Tuesday', schedule: [] },
      { completed: false, day: 3, name: 'Wednesday', schedule: [] },
      { completed: false, day: 4, name: 'Thursday', schedule: [] },
      { completed: false, day: 5, name: 'Friday', schedule: [] },
      { completed: false, day: 6, name: 'Saturday', schedule: [] },
      { completed: false, day: 7, name: 'Sunday', schedule: [] },
    ],
    id: 4,
    subtitle: 'Mastering the Schedule',
    title: 'Week 4',
  },
];

export default function SleepPlansPage() {
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const [selectedDay, setSelectedDay] = useState<{
    weekId: number;
    dayIndex: number;
  } | null>(null);

  const toggleWeek = (weekId: number) => {
    setOpenWeek(openWeek === weekId ? null : weekId);
  };

  const selectDay = (weekId: number, dayIndex: number) => {
    setSelectedDay({ dayIndex, weekId });
  };

  const getSelectedDayData = () => {
    if (!selectedDay) return null;
    const week = weeksData.find((w) => w.id === selectedDay.weekId);
    if (!week) return null;
    return week.days[selectedDay.dayIndex];
  };

  const selectedDayData = getSelectedDayData();

  return (
    <main className="px-4 space-y-6">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-balance">Plan</h1>
        <p className="text-muted-foreground text-balance">
          Your personalized weekly schedule and daily routines
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="p-6 bg-gradient-to-br from-sleep/20 to-sleep/5 border-sleep/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-sleep/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-sleep" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Active Plan</h2>
              <p className="text-sm text-muted-foreground">
                4-6 Month Schedule
              </p>
            </div>
          </div>
          <Button
            className="border-sleep/30 bg-transparent"
            size="sm"
            variant="outline"
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Daily Sleep Goal</p>
            <p className="text-2xl font-bold">14-15h</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Naps per Day</p>
            <p className="text-2xl font-bold">3-4</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Weekly Schedule</h3>

        <div className="space-y-2">
          {weeksData.map((week) => (
            <div className="space-y-2" key={week.id}>
              {/* Week Header Button */}
              <button
                className="w-full"
                onClick={() => toggleWeek(week.id)}
                type="button"
              >
                <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{week.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {week.subtitle}
                        </p>
                      </div>
                    </div>
                    {openWeek === week.id ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </Card>
              </button>

              {/* Days List (Accordion Content) */}
              {openWeek === week.id && (
                <div className="pl-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {week.days.map((day, dayIndex) => (
                    <button
                      className="w-full"
                      key={`${week.id}-${day.day}`}
                      onClick={() => selectDay(week.id, dayIndex)}
                      type="button"
                    >
                      <Card
                        className={`p-3 bg-card border-border hover:border-primary/50 transition-colors ${
                          selectedDay?.weekId === week.id &&
                          selectedDay?.dayIndex === dayIndex
                            ? 'border-primary/50 bg-primary/5'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                day.completed ? 'bg-primary/20' : 'bg-muted'
                              }`}
                            >
                              {day.completed ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                Day {day.day} - {day.name}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDayData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Day {selectedDayData.day} - {selectedDayData.name}
            </h3>
            {selectedDayData.completed && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                Completed
              </span>
            )}
          </div>

          {selectedDayData.schedule.length > 0 ? (
            <div className="space-y-2">
              {selectedDayData.schedule.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card
                    className="p-4 bg-card border-border"
                    key={`${item.activity}-${item.time}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div
                          className={`h-10 w-10 rounded-full bg-${item.color}/20 flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`h-5 w-5 text-${item.color}`} />
                        </div>
                        {index < selectedDayData.schedule.length - 1 && (
                          <div className="w-0.5 h-8 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{item.activity}</p>
                            {item.duration && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Duration: {item.duration}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono shrink-0">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 bg-card border-border">
              <div className="text-center space-y-2">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  Schedule details coming soon
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Sleep Tips */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Tips for Success</h3>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Watch Wake Windows</p>
              <p className="text-sm text-muted-foreground text-balance">
                At this age, babies typically stay awake for 2-2.5 hours between
                naps. Watch for sleepy cues before this window closes.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <Baby className="h-5 w-5 text-secondary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Consistent Bedtime Routine</p>
              <p className="text-sm text-muted-foreground text-balance">
                Create a calming routine: bath, massage, feeding, and quiet
                time. This signals to your baby that sleep is coming.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
