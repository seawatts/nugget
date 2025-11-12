'use client';

import {
  Activity,
  AlertTriangle,
  Baby,
  BookOpen,
  Brain,
  ChevronRight,
  Droplets,
  Heart,
  Moon,
  Phone,
  Pill,
  Scale,
  Shield,
  Stethoscope,
  Thermometer,
} from 'lucide-react';
import Link from 'next/link';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

const resourceCategories = [
  {
    color: 'bg-destructive/10 text-destructive',
    description: 'Important warning signs and when to seek help',
    icon: AlertTriangle,
    resources: [
      {
        description: 'Immediate guidance for urgent situations',
        href: '/emergency',
        icon: AlertTriangle,
        title: 'Emergency Help',
      },
      {
        description: "Warning signs for mom's health",
        href: '/postpartum?tab=red-flags',
        icon: Heart,
        title: 'Postpartum Red Flags',
      },
      {
        description: 'Baby health concerns checklist',
        href: '/help/when-to-call-doctor',
        icon: Phone,
        title: 'When to Call Doctor',
      },
      {
        description: 'Temperature guidelines by age',
        href: '/help/fever-guide',
        icon: Thermometer,
        title: 'Fever Guide',
      },
    ],
    title: 'Health Concerns & Red Flags',
  },
  {
    color: 'bg-feeding/10 text-feeding',
    description: 'Breastfeeding, bottles, and solid foods',
    icon: Droplets,
    resources: [
      {
        description: 'Common issues and solutions',
        href: '/postpartum?tab=breastfeeding',
        icon: Droplets,
        title: 'Breastfeeding Troubleshooting',
      },
      {
        description: 'Formula preparation and feeding tips',
        href: '/learning?category=feeding',
        icon: Baby,
        title: 'Bottle Feeding Guide',
      },
      {
        description: 'Introduction to solid foods',
        href: '/learning?category=feeding',
        icon: BookOpen,
        title: 'Starting Solids',
      },
    ],
    title: 'Feeding & Nutrition',
  },
  {
    color: 'bg-sleep/10 text-sleep',
    description: 'Sleep training, schedules, and milestones',
    icon: Moon,
    resources: [
      {
        description: 'Age-appropriate sleep schedules',
        href: '/sleep-plans',
        icon: Moon,
        title: 'Sleep Plans',
      },
      {
        description: 'SIDS prevention and safety',
        href: '/learning?category=sleep',
        icon: Shield,
        title: 'Safe Sleep Practices',
      },
      {
        description: 'What to expect by age',
        href: '/learning?tab=milestones',
        icon: Activity,
        title: 'Developmental Milestones',
      },
    ],
    title: 'Sleep & Development',
  },
  {
    color: 'bg-primary/10 text-primary',
    description: 'Appointments, medications, and growth tracking',
    icon: Stethoscope,
    resources: [
      {
        description: 'Immunization timeline',
        href: '/help/vaccination-schedule',
        icon: Pill,
        title: 'Vaccination Schedule',
      },
      {
        description: 'Weight, height, and percentiles',
        href: '/help/growth-charts',
        icon: Scale,
        title: 'Growth Tracking',
      },
      {
        description: 'Pregnancy checkup schedule',
        href: '/pregnancy?tab=appointments',
        icon: Stethoscope,
        title: 'Prenatal Appointments',
      },
    ],
    title: 'Medical & Healthcare',
  },
  {
    color: 'bg-accent/10 text-accent',
    description: 'Emotional wellbeing for parents',
    icon: Brain,
    resources: [
      {
        description: 'Edinburgh scale assessment',
        href: '/postpartum?tab=mental-health',
        icon: Brain,
        title: 'Postpartum Depression Screening',
      },
      {
        description: 'Help for dads and partners',
        href: '/partner-support',
        icon: Heart,
        title: 'Partner Support Resources',
      },
      {
        description: 'Connect with other parents',
        href: '/community',
        icon: BookOpen,
        title: 'Community Support',
      },
    ],
    title: 'Mental Health & Support',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balance">Help & Resources</h1>
          <p className="text-muted-foreground text-balance">
            Quick access to important information, guides, and support resources
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/emergency">
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-destructive/20 transition-colors">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <span className="text-sm font-semibold text-destructive text-center">
                Emergency Help
              </span>
            </div>
          </Link>
          <Link href="/chat">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/20 transition-colors">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-primary text-center">
                Ask AI
              </span>
            </div>
          </Link>
        </div>

        {/* Resource Categories */}
        <div className="space-y-6">
          {resourceCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div className="space-y-3" key={category.title}>
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${category.color}`}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-balance">
                      {category.title}
                    </h2>
                    <p className="text-xs text-muted-foreground text-balance">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Resource Links */}
                <div className="space-y-2">
                  {category.resources.map((resource) => {
                    const ResourceIcon = resource.icon;
                    return (
                      <Link href={resource.href} key={resource.title}>
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors group">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/70 transition-colors">
                            <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-balance">
                              {resource.title}
                            </h3>
                            <p className="text-xs text-muted-foreground text-balance">
                              {resource.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Help */}
        <div className="bg-muted/50 rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold">Need More Help?</h3>
          <p className="text-sm text-muted-foreground text-balance">
            Can't find what you're looking for? Try our AI chat for personalized
            guidance or check your emergency contacts in settings.
          </p>
          <div className="flex gap-2">
            <Link className="flex-1" href="/chat">
              <button
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                type="button"
              >
                Chat with AI
              </button>
            </Link>
            <Link className="flex-1" href="/settings?tab=contacts">
              <button
                className="w-full bg-card border border-border text-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                type="button"
              >
                View Contacts
              </button>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
