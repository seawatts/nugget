'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Textarea } from '@nugget/ui/textarea';
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  Droplet,
  Heart,
  Plus,
  Sparkles,
  Syringe,
  Thermometer,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

export default function TTCPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cycle' | 'ivf' | 'tips'
  >('overview');
  const [lastPeriod, setLastPeriod] = useState('2025-01-15');
  const [cycleLength, setCycleLength] = useState(28);

  // Calculate fertile window
  const calculateFertileWindow = () => {
    const lastPeriodDate = new Date(lastPeriod);
    const ovulationDay = cycleLength - 14;
    const ovulationDate = new Date(lastPeriodDate);
    ovulationDate.setDate(lastPeriodDate.getDate() + ovulationDay);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(ovulationDate.getDate() - 5);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(ovulationDate.getDate() + 1);

    return {
      fertileEnd: fertileEnd.toLocaleDateString(),
      fertileStart: fertileStart.toLocaleDateString(),
      ovulation: ovulationDate.toLocaleDateString(),
    };
  };

  const fertileWindow = calculateFertileWindow();

  const tabs: Array<{
    id: 'overview' | 'cycle' | 'ivf' | 'tips';
    label: string;
  }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'cycle', label: 'Cycle Tracking' },
    { id: 'ivf', label: 'IVF Journey' },
    { id: 'tips', label: 'Tips & Resources' },
  ];

  const cycleData = [
    { date: 'Jan 15', flow: 'Heavy', symptoms: 'Cramps, fatigue' },
    { date: 'Jan 16', flow: 'Heavy', symptoms: 'Cramps' },
    { date: 'Jan 17', flow: 'Medium', symptoms: 'None' },
    { date: 'Jan 18', flow: 'Light', symptoms: 'None' },
    { date: 'Jan 19', flow: 'Spotting', symptoms: 'None' },
  ];

  const intimacyLog = [
    { date: 'Jan 20', notes: 'Fertile window', time: 'Evening' },
    { date: 'Jan 22', notes: 'Peak fertility', time: 'Morning' },
    { date: 'Jan 24', notes: 'Ovulation day', time: 'Evening' },
  ];

  const ivfTimeline = [
    {
      date: 'Feb 1',
      event: 'Initial Consultation',
      notes: 'Met with Dr. Smith',
      status: 'completed',
    },
    {
      date: 'Feb 15',
      event: 'Baseline Ultrasound',
      notes: 'All clear to proceed',
      status: 'completed',
    },
    {
      date: 'Feb 20',
      event: 'Start Stimulation Meds',
      notes: 'Gonal-F 150 IU daily',
      status: 'upcoming',
    },
    {
      date: 'Feb 28',
      event: 'Monitoring Appointment',
      notes: 'Check follicle growth',
      status: 'upcoming',
    },
    {
      date: 'Mar 5',
      event: 'Egg Retrieval',
      notes: 'Scheduled at 8am',
      status: 'upcoming',
    },
  ];

  return (
    <main className="px-6 pt-4 pb-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-balance">
          Trying to Conceive
        </h1>
        <p className="text-muted-foreground text-balance">
          Track your cycle, fertility, and conception journey
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            className="whitespace-nowrap"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            variant={activeTab === tab.id ? 'default' : 'outline'}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cycle Overview Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Current Cycle</h2>
                <p className="text-sm text-muted-foreground">Day 18 of 28</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Cycle Progress</span>
                <span className="text-sm font-medium">64%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: '64%' }}
                />
              </div>
            </div>
          </Card>

          {/* Fertile Window Card */}
          <Card className="p-6 border-accent">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Fertile Window</h3>
                <p className="text-sm text-muted-foreground">
                  {fertileWindow.fertileStart} - {fertileWindow.fertileEnd}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ovulation Date:</span>
                <span className="font-medium">{fertileWindow.ovulation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Days:</span>
                <span className="font-medium">2 days before ovulation</span>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  This Cycle
                </span>
              </div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Intimacy logged</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Thermometer className="h-5 w-5 text-secondary" />
                <span className="text-sm text-muted-foreground">BBT Today</span>
              </div>
              <p className="text-2xl font-bold">97.8°F</p>
              <p className="text-xs text-muted-foreground">Slightly elevated</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid gap-3">
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <Droplet className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Log Period</div>
                  <div className="text-xs text-muted-foreground">
                    Track your menstrual flow
                  </div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <Heart className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Log Intimacy</div>
                  <div className="text-xs text-muted-foreground">
                    Record conception attempts
                  </div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <Thermometer className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Log BBT</div>
                  <div className="text-xs text-muted-foreground">
                    Track basal body temperature
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Tracking Tab */}
      {activeTab === 'cycle' && (
        <div className="space-y-6">
          {/* Cycle Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cycle Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lastPeriod">Last Period Start Date</Label>
                <Input
                  className="mt-1"
                  id="lastPeriod"
                  onChange={(e) => setLastPeriod(e.target.value)}
                  type="date"
                  value={lastPeriod}
                />
              </div>
              <div>
                <Label htmlFor="cycleLength">Average Cycle Length (days)</Label>
                <Input
                  className="mt-1"
                  id="cycleLength"
                  onChange={(e) => setCycleLength(Number(e.target.value))}
                  type="number"
                  value={cycleLength}
                />
              </div>
            </div>
          </Card>

          {/* Period Log */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Period Log</h3>
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
            <div className="space-y-3">
              {cycleData.map((entry) => (
                <Card className="p-4" key={entry.date}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <Droplet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{entry.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Flow: {entry.flow}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.symptoms}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Intimacy Log */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Intimacy Log</h3>
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
            <div className="space-y-3">
              {intimacyLog.map((entry) => (
                <Card
                  className="p-4 border-accent/50"
                  key={`${entry.date}-${entry.time}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/20 rounded-xl">
                      <Heart className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{entry.date}</p>
                        <span className="text-xs text-muted-foreground">
                          {entry.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.notes}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* BBT Chart Placeholder */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Basal Body Temperature</h3>
            <div className="h-48 bg-muted/50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Thermometer className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  BBT chart will appear here
                </p>
                <Button className="mt-3" size="sm">
                  Log Temperature
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* IVF Journey Tab */}
      {activeTab === 'ivf' && (
        <div className="space-y-6">
          {/* IVF Overview */}
          <Card className="p-6 bg-gradient-to-br from-secondary/20 to-primary/20 border-secondary/30">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-secondary/20 rounded-2xl">
                <Syringe className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">IVF Cycle 1</h2>
                <p className="text-sm text-muted-foreground">
                  Started February 1, 2025
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Phase</p>
                <p className="font-semibold">Stimulation Prep</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days in Cycle</p>
                <p className="font-semibold">18 days</p>
              </div>
            </div>
          </Card>

          {/* IVF Timeline */}
          <div>
            <h3 className="font-semibold mb-4">Treatment Timeline</h3>
            <div className="space-y-4">
              {ivfTimeline.map((item, index) => (
                <div className="flex gap-4" key={`${item.date}-${item.event}`}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === 'completed'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Calendar className="h-5 w-5" />
                      )}
                    </div>
                    {index < ivfTimeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{item.event}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.date}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary/20 text-secondary'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Medication Tracker */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Current Medications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Syringe className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium">Gonal-F</p>
                    <p className="text-sm text-muted-foreground">
                      150 IU daily - Evening
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Log Dose
                </Button>
              </div>
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>
          </Card>

          {/* Notes Section */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cycle Notes</h3>
            <Textarea
              placeholder="Add notes about your IVF journey, side effects, questions for your doctor..."
              rows={4}
            />
            <Button className="mt-3 w-full">Save Notes</Button>
          </Card>
        </div>
      )}

      {/* Tips & Resources Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* Fertility Tips */}
          <div>
            <h3 className="font-semibold mb-4">Fertility Tips</h3>
            <div className="space-y-3">
              <Card className="p-4 border-primary/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Track Your Ovulation</h4>
                    <p className="text-sm text-muted-foreground text-balance">
                      The most fertile days are typically 2 days before
                      ovulation. Use ovulation predictor kits or track basal
                      body temperature for accuracy.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-secondary/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary/20 rounded-xl">
                    <Heart className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">
                      Maintain a Healthy Lifestyle
                    </h4>
                    <p className="text-sm text-muted-foreground text-balance">
                      Eat a balanced diet, exercise regularly, maintain a
                      healthy weight, and avoid smoking and excessive alcohol to
                      optimize fertility.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-accent/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/20 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Take Prenatal Vitamins</h4>
                    <p className="text-sm text-muted-foreground text-balance">
                      Start taking prenatal vitamins with folic acid at least 3
                      months before trying to conceive to support early fetal
                      development.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-primary/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Manage Stress</h4>
                    <p className="text-sm text-muted-foreground text-balance">
                      High stress levels can affect fertility. Practice
                      relaxation techniques like yoga, meditation, or deep
                      breathing exercises.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* When to See a Specialist */}
          <Card className="p-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">
                  When to See a Fertility Specialist
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>
                      Under 35 and trying for 12+ months without success
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>
                      Over 35 and trying for 6+ months without success
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>Irregular or absent menstrual cycles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>
                      Known fertility issues or previous pregnancy complications
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>
                      History of pelvic inflammatory disease or endometriosis
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <Button className="w-full mt-4" variant="destructive">
              Find a Fertility Specialist
            </Button>
          </Card>

          {/* Helpful Resources */}
          <div>
            <h3 className="font-semibold mb-4">Helpful Resources</h3>
            <div className="space-y-3">
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Understanding Your Cycle</div>
                  <div className="text-xs text-muted-foreground">
                    Learn about ovulation and fertile windows
                  </div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Fertility Testing Guide</div>
                  <div className="text-xs text-muted-foreground">
                    What to expect from fertility evaluations
                  </div>
                </div>
              </Button>
              <Button
                className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">IVF Process Overview</div>
                  <div className="text-xs text-muted-foreground">
                    Step-by-step guide to IVF treatment
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
