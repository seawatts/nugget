'use client';

import { Badge } from '@nugget/ui/badge';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Coffee,
  Dumbbell,
  Heart,
  Home,
  MessageCircle,
  Moon,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function PartnerSupportPage() {
  const [selectedTab, setSelectedTab] = useState<
    'tasks' | 'tips' | 'bonding' | 'wellness'
  >('tasks');

  const dailyTasks = [
    {
      category: 'Morning Routine',
      icon: Coffee,
      tasks: [
        { checked: true, task: 'Prepare breakfast for mom', time: '7:00 AM' },
        { checked: true, task: "Change baby's diaper", time: '7:30 AM' },
        { checked: false, task: 'Burp baby after feeding', time: '8:00 AM' },
      ],
    },
    {
      category: 'Daytime Support',
      icon: Home,
      tasks: [
        { checked: false, task: 'Do laundry (baby clothes)', time: '10:00 AM' },
        { checked: false, task: 'Prepare lunch', time: '12:00 PM' },
        { checked: false, task: 'Hold baby for nap', time: '2:00 PM' },
        { checked: false, task: 'Grocery shopping', time: '3:00 PM' },
      ],
    },
    {
      category: 'Evening Care',
      icon: Moon,
      tasks: [
        { checked: false, task: 'Give baby a bath', time: '6:00 PM' },
        { checked: false, task: 'Prepare dinner', time: '6:30 PM' },
        { checked: false, task: 'Take over night shift', time: '10:00 PM' },
      ],
    },
  ];

  const supportTips = [
    {
      color: 'primary',
      icon: Baby,
      tips: [
        'Attend prenatal appointments together',
        'Help with household chores without being asked',
        'Learn about pregnancy symptoms and be empathetic',
        'Prepare meals and healthy snacks',
        'Give foot massages and back rubs',
        'Take childbirth classes together',
      ],
      title: 'During Pregnancy',
    },
    {
      color: 'accent',
      icon: Heart,
      tips: [
        'Take night shifts so mom can sleep',
        'Bring baby to mom for feedings',
        'Change diapers without being asked',
        'Handle visitors and set boundaries',
        'Do household chores proactively',
        'Watch for signs of postpartum depression',
      ],
      title: 'After Birth',
    },
    {
      color: 'secondary',
      icon: MessageCircle,
      tips: [
        'Listen without trying to fix everything',
        'Validate her feelings and experiences',
        'Offer encouragement and praise',
        'Be patient with mood changes',
        "Ask 'How can I help?' regularly",
        'Show appreciation for her efforts',
      ],
      title: 'Emotional Support',
    },
  ];

  const bondingActivities = [
    {
      activity: 'Skin-to-Skin Contact',
      benefits: ['Regulates temperature', 'Calms baby', 'Strengthens bond'],
      description:
        'Hold baby against your bare chest for bonding and regulation',
      duration: '20-30 min',
      frequency: 'Daily',
    },
    {
      activity: 'Bath Time',
      benefits: ['Quality time', 'Builds trust', 'Fun interaction'],
      description: 'Make bath time your special routine with baby',
      duration: '10-15 min',
      frequency: '2-3x per week',
    },
    {
      activity: 'Reading Together',
      benefits: ['Language development', 'Routine building', 'Calm bonding'],
      description:
        'Read books to baby, even newborns benefit from hearing your voice',
      duration: '10-15 min',
      frequency: 'Daily',
    },
    {
      activity: 'Tummy Time',
      benefits: ['Motor development', 'Engagement', 'Playful bonding'],
      description: 'Supervise and encourage baby during tummy time',
      duration: '5-10 min',
      frequency: '3-4x per day',
    },
    {
      activity: 'Baby Wearing',
      benefits: ['Closeness', 'Calms fussy baby', 'Practical bonding'],
      description: 'Use a carrier to keep baby close while being hands-free',
      duration: '30-60 min',
      frequency: 'As needed',
    },
  ];

  const wellnessResources = [
    {
      category: 'Mental Health',
      icon: Brain,
      resources: [
        {
          contact: '1-800-944-4773',
          title: 'Postpartum Support International',
          type: 'Hotline',
        },
        {
          link: 'Read More',
          title: "Dad's Mental Health Guide",
          type: 'Article',
        },
        {
          link: 'Take Quiz',
          title: 'Partner Depression Screening',
          type: 'Tool',
        },
      ],
    },
    {
      category: 'Physical Health',
      icon: Dumbbell,
      resources: [
        { link: 'Learn More', title: 'Sleep When Baby Sleeps', type: 'Tip' },
        { link: 'Watch', title: 'Quick Workouts for New Dads', type: 'Video' },
        { link: 'Read', title: 'Nutrition for Energy', type: 'Guide' },
      ],
    },
    {
      category: 'Relationship',
      icon: Heart,
      resources: [
        {
          link: 'Find Help',
          title: 'Couples Counseling Finder',
          type: 'Directory',
        },
        { link: 'Read', title: 'Communication Tips', type: 'Article' },
        { link: 'View', title: 'Date Night Ideas at Home', type: 'List' },
      ],
    },
  ];

  return (
    <main className="px-4 pt-4 space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance mb-2">
              Partner Support
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Resources and guidance for partners to support mom and bond with
              baby
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'tasks'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('tasks')}
          type="button"
        >
          Daily Tasks
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'tips'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('tips')}
          type="button"
        >
          Support Tips
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'bonding'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('bonding')}
          type="button"
        >
          Bonding
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'wellness'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('wellness')}
          type="button"
        >
          Wellness
        </button>
      </div>

      {/* Daily Tasks Tab */}
      {selectedTab === 'tasks' && (
        <div className="space-y-4">
          <Card className="p-4 bg-secondary/5 border-secondary/20">
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Your Daily Contribution
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Small actions make a big difference. Check off tasks as you
                  complete them to support your family.
                </p>
              </div>
            </div>
          </Card>

          {dailyTasks.map((section) => {
            const Icon = section.icon;
            const completed = section.tasks.filter((t) => t.checked).length;
            const total = section.tasks.length;

            return (
              <Card className="p-4" key={section.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{section.category}</h3>
                    <p className="text-xs text-muted-foreground">
                      {completed} of {total} completed
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round((completed / total) * 100)}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  {section.tasks.map((item) => (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      key={`${section.category}-${item.task}`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.task}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Support Tips Tab */}
      {selectedTab === 'tips' && (
        <div className="space-y-4">
          {supportTips.map((section) => {
            const Icon = section.icon;
            return (
              <Card className="p-4" key={section.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full bg-${section.color}/10 flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 text-${section.color}`} />
                  </div>
                  <h3 className="font-semibold">{section.title}</h3>
                </div>

                <div className="space-y-2">
                  {section.tips.map((tip) => (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      key={`${section.title}-${tip}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full bg-${section.color} mt-2 flex-shrink-0`}
                      />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bonding Tab */}
      {selectedTab === 'bonding' && (
        <div className="space-y-4">
          <Card className="p-4 bg-accent/5 border-accent/20">
            <div className="flex gap-3">
              <Heart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Building Your Bond</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bonding with your baby takes time and consistency. These
                  activities help create a strong connection while supporting
                  baby's development.
                </p>
              </div>
            </div>
          </Card>

          {bondingActivities.map((activity) => (
            <Card
              className="p-4 hover:bg-muted/50 transition-colors"
              key={activity.activity}
            >
              <div className="mb-3">
                <h3 className="font-semibold mb-1">{activity.activity}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
              </div>

              <div className="flex gap-4 mb-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-medium">{activity.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency: </span>
                  <span className="font-medium">{activity.frequency}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Benefits:</p>
                <div className="flex flex-wrap gap-2">
                  {activity.benefits.map((benefit) => (
                    <Badge
                      className="text-xs"
                      key={`${activity.activity}-${benefit}`}
                      variant="secondary"
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Wellness Tab */}
      {selectedTab === 'wellness' && (
        <div className="space-y-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Take Care of Yourself Too
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You can't pour from an empty cup. Your mental and physical
                  health matters for your family's wellbeing.
                </p>
              </div>
            </div>
          </Card>

          {wellnessResources.map((section) => {
            const Icon = section.icon;
            return (
              <Card className="p-4" key={section.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{section.category}</h3>
                </div>

                <div className="space-y-2">
                  {section.resources.map((resource) => (
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      key={`${section.category}-${resource.title}`}
                      type="button"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.type}
                          {resource.contact && ` • ${resource.contact}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
