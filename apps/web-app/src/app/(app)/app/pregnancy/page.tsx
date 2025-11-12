'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Activity,
  Baby,
  Calendar,
  ChevronRight,
  Heart,
  Plus,
  Scale,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

export default function PregnancyPage() {
  const [currentWeek] = useState(24);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'symptoms' | 'appointments'
  >('overview');

  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const daysUntilDue = (40 - currentWeek) * 7;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-4 space-y-4">
        {/* Current Week Card */}
        <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-muted-foreground">
                  Trimester {trimester}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-balance">
                Week {currentWeek}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {daysUntilDue} days until due date
              </p>
            </div>
            <Badge
              className="bg-accent/20 text-accent-foreground border-accent/30"
              variant="secondary"
            >
              {Math.round((currentWeek / 40) * 100)}% Complete
            </Badge>
          </div>

          <div className="bg-card/50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium">Baby's Development</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your baby is about the size of a cantaloupe! They're developing
              taste buds and can now hear sounds from outside the womb. Their
              lungs are maturing and they're practicing breathing movements.
            </p>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Scale className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">145</p>
            <p className="text-xs text-muted-foreground">lbs</p>
          </Card>
          <Card className="p-4 text-center">
            <Activity className="h-5 w-5 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">kicks/hr</p>
          </Card>
          <Card className="p-4 text-center">
            <Heart className="h-5 w-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold">72</p>
            <p className="text-xs text-muted-foreground">bpm</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('overview')}
            type="button"
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'symptoms'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('symptoms')}
            type="button"
          >
            Symptoms
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'appointments'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('appointments')}
            type="button"
          >
            Appointments
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* Week by Week Guide */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Week by Week Guide</h3>
                <Button size="sm" variant="ghost">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  { current: true, title: 'Baby can hear you!', week: 24 },
                  {
                    current: false,
                    title: 'Rapid brain development',
                    week: 25,
                  },
                  { current: false, title: 'Eyes begin to open', week: 26 },
                ].map((item) => (
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      item.current ? 'bg-primary/10' : 'bg-muted/50'
                    }`}
                    key={item.week}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.week}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Week {item.week}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </Card>

            {/* What to Expect */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">What to Expect This Week</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Baby className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">For Baby</p>
                    <p className="text-sm text-muted-foreground">
                      Developing sleep patterns and responding to light
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">For Mom</p>
                    <p className="text-sm text-muted-foreground">
                      You may experience Braxton Hicks contractions
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {selectedTab === 'symptoms' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Track Your Symptoms</h3>
                <Button className="gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    severity: 'Moderate',
                    symptom: 'Back Pain',
                    time: '2 hours ago',
                    trend: 'up',
                  },
                  {
                    severity: 'Mild',
                    symptom: 'Fatigue',
                    time: '5 hours ago',
                    trend: 'down',
                  },
                  {
                    severity: 'Mild',
                    symptom: 'Heartburn',
                    time: 'Yesterday',
                    trend: 'same',
                  },
                ].map((item) => (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    key={`${item.symptom}-${item.time}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.symptom}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                    <Badge className="text-xs" variant="outline">
                      {item.severity}
                    </Badge>
                    <TrendingUp
                      className={`h-4 w-4 ${
                        item.trend === 'up'
                          ? 'text-destructive'
                          : item.trend === 'down'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Common Symptoms This Week</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'Back Pain',
                  'Swelling',
                  'Braxton Hicks',
                  'Heartburn',
                  'Fatigue',
                  'Leg Cramps',
                ].map((symptom) => (
                  <Badge className="text-xs" key={symptom} variant="secondary">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        )}

        {selectedTab === 'appointments' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Upcoming Appointments</h3>
                <Button className="gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    date: 'Nov 8, 2025',
                    doctor: 'Dr. Sarah Johnson',
                    location: "Women's Health Center",
                    time: '10:00 AM',
                    type: 'Prenatal Checkup',
                  },
                  {
                    date: 'Nov 15, 2025',
                    doctor: 'Dr. Sarah Johnson',
                    location: 'Lab - Building B',
                    time: '9:30 AM',
                    type: 'Glucose Screening',
                  },
                ].map((apt) => (
                  <div
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                    key={`${apt.type}-${apt.date}-${apt.time}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{apt.type}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {apt.date} at {apt.time}
                          </span>
                        </div>
                      </div>
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{apt.doctor}</p>
                      <p>{apt.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recommended Tests</h3>
              <div className="space-y-2">
                {[
                  'Glucose Screening (24-28 weeks)',
                  'Rh Antibody Screen (if Rh negative)',
                  'Ultrasound (if not done recently)',
                ].map((test) => (
                  <div className="flex items-center gap-2 text-sm" key={test}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{test}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
