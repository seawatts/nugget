'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import {
  AlertCircle,
  Baby,
  CheckCircle,
  Circle,
  Heart,
  Phone,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

const tabs = [
  { id: 'recovery', label: 'Recovery' },
  { id: 'screening', label: 'Screening' },
  { id: 'breastfeeding', label: 'Feeding' },
  { id: 'warning', label: 'Red Flags' },
];

const screeningQuestions = [
  { id: 1, text: 'I have been able to laugh and see the funny side of things' },
  { id: 2, text: 'I have looked forward with enjoyment to things' },
  { id: 3, text: 'I have blamed myself unnecessarily when things went wrong' },
  { id: 4, text: 'I have been anxious or worried for no good reason' },
  { id: 5, text: 'I have felt scared or panicky for no good reason' },
  { id: 6, text: 'Things have been getting on top of me' },
  { id: 7, text: 'I have been so unhappy that I have had difficulty sleeping' },
  { id: 8, text: 'I have felt sad or miserable' },
  { id: 9, text: 'I have been so unhappy that I have been crying' },
  { id: 10, text: 'The thought of harming myself has occurred to me' },
];

const recoveryMetrics = [
  {
    color: 'text-green-400',
    label: 'Bleeding',
    status: 'normal',
    value: 'Moderate',
  },
  {
    color: 'text-green-400',
    label: 'Pain Level',
    status: 'normal',
    value: '3/10',
  },
  {
    color: 'text-green-400',
    label: 'Incision Healing',
    status: 'normal',
    value: 'Good',
  },
  {
    color: 'text-primary',
    label: 'Days Postpartum',
    status: 'info',
    value: '12',
  },
];

const breastfeedingTips = [
  {
    description:
      'Baby should have a wide mouth with lips flanged out. You should hear swallowing, not clicking.',
    icon: Baby,
    title: 'Latch Issues',
  },
  {
    description:
      'Apply warm compress before feeding, cold compress after. Hand express a bit before latching.',
    icon: Heart,
    title: 'Engorgement',
  },
  {
    description:
      'Check latch position. Use lanolin cream after each feeding. Air dry when possible.',
    icon: AlertCircle,
    title: 'Sore Nipples',
  },
  {
    description:
      'Feed on demand (8-12 times/day). Stay hydrated. Consider lactation consultant if concerned.',
    icon: CheckCircle,
    title: 'Low Supply Concerns',
  },
];

const redFlags = [
  {
    category: 'Physical',
    items: [
      'Heavy bleeding (soaking a pad in 1 hour)',
      'Large blood clots (bigger than a golf ball)',
      'Fever over 100.4°F',
      'Severe abdominal pain',
      'Foul-smelling discharge',
      "Incision that's red, swollen, or leaking",
    ],
    urgent: true,
  },
  {
    category: 'Mental Health',
    items: [
      'Thoughts of harming yourself or baby',
      'Severe anxiety or panic attacks',
      'Inability to care for yourself or baby',
      'Hallucinations or delusions',
    ],
    urgent: true,
  },
  {
    category: 'Breastfeeding',
    items: [
      'Severe breast pain or red streaks',
      'Flu-like symptoms with breast pain',
      'Baby not wetting 6+ diapers per day',
      'Baby seems lethargic or unresponsive',
    ],
    urgent: false,
  },
];

export default function PostpartumPage() {
  const [activeTab, setActiveTab] = useState('recovery');
  const [screeningAnswers, setScreeningAnswers] = useState<
    Record<number, number>
  >({});

  const handleScreeningAnswer = (questionId: number, score: number) => {
    setScreeningAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const totalScore = Object.values(screeningAnswers).reduce(
    (sum, score) => sum + score,
    0,
  );
  const isScreeningComplete =
    Object.keys(screeningAnswers).length === screeningQuestions.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Postpartum Care
            </h1>
            <p className="text-muted-foreground">
              Track your recovery and get support
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

          {/* Recovery Tab */}
          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Recovery Progress
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {recoveryMetrics.map((metric) => (
                    <div
                      className="bg-card/50 rounded-lg p-4"
                      key={metric.label}
                    >
                      <p className="text-sm text-muted-foreground mb-1">
                        {metric.label}
                      </p>
                      <p className={cn('text-2xl font-bold', metric.color)}>
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Daily Check-in
                </h3>
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-sm text-muted-foreground mb-2"
                      id="daily-mood-label"
                    >
                      How are you feeling today?
                    </p>
                    <div className="flex gap-2">
                      {['😊', '😐', '😔', '😰'].map((emoji) => (
                        <Button
                          aria-labelledby="daily-mood-label"
                          className="text-2xl h-14 w-14 bg-transparent"
                          key={`mood-${emoji}`}
                          variant="outline"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-sm text-muted-foreground mb-2 block"
                      htmlFor="daily-pain-level"
                    >
                      Pain level (0-10)
                    </label>
                    <input
                      className="w-full"
                      id="daily-pain-level"
                      max="10"
                      min="0"
                      style={{
                        accentColor: 'oklch(var(--primary))',
                      }}
                      type="range"
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm text-muted-foreground mb-2 block"
                      htmlFor="daily-notes"
                    >
                      Notes
                    </label>
                    <textarea
                      className="w-full bg-muted rounded-lg p-3 text-foreground min-h-[100px] border border-border"
                      id="daily-notes"
                      placeholder="Any concerns or observations..."
                    />
                  </div>
                  <Button className="w-full">Save Check-in</Button>
                </div>
              </Card>
            </div>
          )}

          {/* Screening Tab */}
          {activeTab === 'screening' && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Edinburgh Postnatal Depression Scale
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This screening helps identify signs of postpartum depression.
                  Answer based on how you've felt in the past 7 days.
                </p>
                {isScreeningComplete && (
                  <div className="bg-card rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Your Score</p>
                    <p className="text-3xl font-bold text-primary">
                      {totalScore}/30
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {totalScore >= 13
                        ? 'Please contact your healthcare provider to discuss these results.'
                        : 'Your score suggests you may be coping well, but reach out if you need support.'}
                    </p>
                  </div>
                )}
              </Card>

              <div className="space-y-4">
                {screeningQuestions.map((question, idx) => (
                  <Card className="p-4" key={question.id}>
                    <p className="text-sm text-foreground mb-3">
                      {idx + 1}. {question.text}
                    </p>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map((score) => (
                        <Button
                          className="flex-1"
                          key={score}
                          onClick={() =>
                            handleScreeningAnswer(question.id, score)
                          }
                          size="sm"
                          variant={
                            screeningAnswers[question.id] === score
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-4 bg-muted border-border">
                <p className="text-xs text-muted-foreground">
                  This screening is not a diagnosis. If you're concerned about
                  your mental health, please contact your healthcare provider or
                  call the Postpartum Support International helpline:
                  1-800-944-4773
                </p>
              </Card>
            </div>
          )}

          {/* Breastfeeding Tab */}
          {activeTab === 'breastfeeding' && (
            <div className="space-y-4">
              {breastfeedingTips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <Card className="p-6" key={tip.title}>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/20 rounded-full p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {tip.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Need More Help?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Consider reaching out to a lactation consultant for
                  personalized support.
                </p>
                <Button className="w-full">Find Lactation Consultant</Button>
              </Card>
            </div>
          )}

          {/* Red Flags Tab */}
          {activeTab === 'warning' && (
            <div className="space-y-4">
              <Card className="p-6 bg-destructive/20 border-destructive/30">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <h2 className="text-xl font-semibold text-foreground">
                    When to Call Your Doctor
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you experience any of these symptoms, contact your
                  healthcare provider immediately.
                </p>
              </Card>

              {redFlags.map((section) => (
                <Card className="p-6" key={section.category}>
                  <div className="flex items-center gap-2 mb-4">
                    {section.urgent && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <h3 className="text-lg font-semibold text-foreground">
                      {section.category}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li
                        className="flex items-start gap-3"
                        key={`${section.category}-${item}`}
                      >
                        <Circle className="h-2 w-2 mt-2 text-primary fill-current" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}

              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Emergency Contacts
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Your OB/GYN</span>
                    <Button size="sm" variant="outline">
                      Call
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">
                      Emergency (911)
                    </span>
                    <Button size="sm" variant="destructive">
                      Call
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">
                      PSI Helpline
                    </span>
                    <Button size="sm" variant="outline">
                      1-800-944-4773
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
