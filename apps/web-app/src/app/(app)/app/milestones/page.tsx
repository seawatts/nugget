'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Checkbox } from '@nugget/ui/checkbox';
import { Label } from '@nugget/ui/label';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Baby,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Heart,
  Lightbulb,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

const ageRanges = [
  { id: '0-3', label: '0-3 Months', months: [0, 3] },
  { id: '4-6', label: '4-6 Months', months: [4, 6] },
  { id: '7-9', label: '7-9 Months', months: [7, 9] },
  { id: '10-12', label: '10-12 Months', months: [10, 12] },
  { id: '13-18', label: '13-18 Months', months: [13, 18] },
  { id: '19-24', label: '19-24 Months', months: [19, 24] },
];

type AgeRangeId = (typeof ageRanges)[number]['id'];
type MilestoneCategory = 'cognitive' | 'language' | 'physical' | 'social';

interface Milestone {
  id: number;
  text: string;
  completed: boolean;
}

type MilestoneGroup = Record<MilestoneCategory, Milestone[]>;

const milestonesByAge: Record<AgeRangeId, MilestoneGroup> = {
  '0-3': {
    cognitive: [
      { completed: true, id: 6, text: 'Recognizes familiar faces' },
      { completed: true, id: 7, text: 'Responds to loud sounds' },
      { completed: true, id: 8, text: 'Watches faces intently' },
      { completed: false, id: 9, text: 'Begins to follow things with eyes' },
    ],
    language: [
      { completed: true, id: 10, text: 'Coos and makes gurgling sounds' },
      { completed: false, id: 11, text: 'Turns head toward sounds' },
      { completed: true, id: 12, text: 'Begins to smile socially' },
    ],
    physical: [
      { completed: true, id: 1, text: 'Lifts head during tummy time' },
      { completed: true, id: 2, text: 'Opens and closes hands' },
      { completed: false, id: 3, text: 'Brings hands to mouth' },
      { completed: true, id: 4, text: 'Follows objects with eyes' },
      {
        completed: false,
        id: 5,
        text: 'Pushes down on legs when feet on hard surface',
      },
    ],
    social: [
      { completed: true, id: 13, text: 'Enjoys being held' },
      { completed: true, id: 14, text: 'Calms when spoken to or picked up' },
      { completed: true, id: 15, text: 'Looks at faces' },
      { completed: true, id: 16, text: 'Smiles at people' },
    ],
  },
  '4-6': {
    cognitive: [
      { completed: false, id: 22, text: 'Responds to own name' },
      { completed: false, id: 23, text: 'Shows curiosity about things' },
      { completed: false, id: 24, text: 'Begins to pass toys between hands' },
      { completed: false, id: 25, text: 'Looks at things nearby' },
    ],
    language: [
      { completed: false, id: 26, text: 'Responds to sounds by making sounds' },
      {
        completed: false,
        id: 27,
        text: 'Strings vowels together when babbling',
      },
      { completed: false, id: 28, text: 'Takes turns making sounds with you' },
    ],
    physical: [
      { completed: false, id: 17, text: 'Rolls over both ways' },
      { completed: false, id: 18, text: 'Sits with support' },
      { completed: false, id: 19, text: 'Reaches for toys with one hand' },
      { completed: false, id: 20, text: 'Brings objects to mouth' },
      {
        completed: false,
        id: 21,
        text: 'Pushes up with straight arms when on tummy',
      },
    ],
    social: [
      { completed: false, id: 29, text: 'Knows familiar faces' },
      { completed: false, id: 30, text: 'Likes to play with others' },
      { completed: false, id: 31, text: "Responds to other people's emotions" },
      { completed: false, id: 32, text: 'Laughs and squeals' },
    ],
  },
  '7-9': {
    cognitive: [
      { completed: false, id: 37, text: 'Looks for dropped objects' },
      { completed: false, id: 38, text: 'Plays peek-a-boo' },
      { completed: false, id: 39, text: 'Puts objects in mouth to explore' },
      { completed: false, id: 40, text: 'Follows simple commands' },
    ],
    language: [
      { completed: false, id: 41, text: "Understands 'no'" },
      {
        completed: false,
        id: 42,
        text: "Makes different sounds like 'mamamama' and 'bababababa'",
      },
      { completed: false, id: 43, text: 'Copies sounds and gestures' },
    ],
    physical: [
      { completed: false, id: 33, text: 'Sits without support' },
      { completed: false, id: 34, text: 'Crawls or scoots' },
      { completed: false, id: 35, text: 'Pulls to standing' },
      {
        completed: false,
        id: 36,
        text: 'Picks up small objects with thumb and finger',
      },
    ],
    social: [
      {
        completed: false,
        id: 44,
        text: 'May be shy or anxious with strangers',
      },
      {
        completed: false,
        id: 45,
        text: 'Shows preferences for certain people',
      },
      {
        completed: false,
        id: 46,
        text: 'Repeats sounds or actions to get attention',
      },
      { completed: false, id: 47, text: 'Points at things' },
    ],
  },
  '10-12': {
    cognitive: [
      { completed: false, id: 52, text: 'Explores things in different ways' },
      { completed: false, id: 53, text: 'Finds hidden things easily' },
      {
        completed: false,
        id: 54,
        text: 'Looks at the right picture when named',
      },
      { completed: false, id: 55, text: 'Copies gestures' },
    ],
    language: [
      {
        completed: false,
        id: 56,
        text: "Says 'mama' and 'dada' to the right person",
      },
      { completed: false, id: 57, text: 'Tries to say words you say' },
      { completed: false, id: 58, text: 'Responds to simple spoken requests' },
    ],
    physical: [
      { completed: false, id: 48, text: 'Stands alone' },
      {
        completed: false,
        id: 49,
        text: 'Takes a few steps without holding on',
      },
      { completed: false, id: 50, text: 'Drinks from a cup' },
      {
        completed: false,
        id: 51,
        text: 'Picks things up between thumb and pointer finger',
      },
    ],
    social: [
      { completed: false, id: 59, text: 'Has favorite things and people' },
      { completed: false, id: 60, text: 'Shows fear in some situations' },
      {
        completed: false,
        id: 61,
        text: 'Hands you a book when wanting to hear a story',
      },
      { completed: false, id: 62, text: 'Cries when mom or dad leaves' },
    ],
  },
  '13-18': {
    cognitive: [
      { completed: false, id: 68, text: 'Knows what ordinary things are for' },
      { completed: false, id: 69, text: 'Points to get attention of others' },
      {
        completed: false,
        id: 70,
        text: 'Shows interest in dolls or stuffed animals',
      },
      { completed: false, id: 71, text: 'Scribbles on own' },
    ],
    language: [
      { completed: false, id: 72, text: 'Says several single words' },
      { completed: false, id: 73, text: "Says and shakes head 'no'" },
      {
        completed: false,
        id: 74,
        text: 'Points to show someone what they want',
      },
    ],
    physical: [
      { completed: false, id: 63, text: 'Walks alone' },
      { completed: false, id: 64, text: 'Pulls toys while walking' },
      { completed: false, id: 65, text: 'Drinks from a cup' },
      { completed: false, id: 66, text: 'Eats with a spoon' },
      { completed: false, id: 67, text: 'Climbs onto and down from furniture' },
    ],
    social: [
      {
        completed: false,
        id: 75,
        text: 'Likes to hand things to others as play',
      },
      { completed: false, id: 76, text: 'May have temper tantrums' },
      { completed: false, id: 77, text: 'May be afraid of strangers' },
      { completed: false, id: 78, text: 'Shows affection to familiar people' },
    ],
  },
  '19-24': {
    cognitive: [
      {
        completed: false,
        id: 84,
        text: 'Finds things even when hidden under covers',
      },
      { completed: false, id: 85, text: 'Begins to sort shapes and colors' },
      {
        completed: false,
        id: 86,
        text: 'Completes sentences in familiar books',
      },
      { completed: false, id: 87, text: 'Plays simple make-believe games' },
    ],
    language: [
      {
        completed: false,
        id: 88,
        text: 'Points to things or pictures when named',
      },
      {
        completed: false,
        id: 89,
        text: 'Knows names of familiar people and body parts',
      },
      { completed: false, id: 90, text: 'Says sentences with 2-4 words' },
      { completed: false, id: 91, text: 'Follows simple instructions' },
    ],
    physical: [
      { completed: false, id: 79, text: 'Stands on tiptoe' },
      { completed: false, id: 80, text: 'Kicks a ball' },
      { completed: false, id: 81, text: 'Begins to run' },
      {
        completed: false,
        id: 82,
        text: 'Climbs onto and down from furniture without help',
      },
      { completed: false, id: 83, text: 'Walks up and down stairs holding on' },
    ],
    social: [
      {
        completed: false,
        id: 92,
        text: 'Copies others, especially adults and older children',
      },
      {
        completed: false,
        id: 93,
        text: 'Gets excited when with other children',
      },
      { completed: false, id: 94, text: 'Shows more independence' },
      { completed: false, id: 95, text: 'Shows defiant behavior' },
    ],
  },
};

const redFlags: Record<AgeRangeId, string[]> = {
  '0-3': [
    "Doesn't respond to loud sounds",
    "Doesn't watch things as they move",
    "Doesn't smile at people",
    "Doesn't bring hands to mouth",
  ],
  '4-6': [
    "Doesn't try to get things in reach",
    'Shows no affection for caregivers',
    "Doesn't respond to sounds around them",
    'Has difficulty getting things to mouth',
  ],
  '7-9': [
    "Doesn't bear weight on legs with support",
    "Doesn't sit with help",
    "Doesn't babble",
    "Doesn't play games involving back-and-forth play",
  ],
  '10-12': [
    "Doesn't crawl",
    "Can't stand when supported",
    "Doesn't search for things they see you hide",
    "Doesn't say single words like 'mama' or 'dada'",
  ],
  '13-18': [
    "Doesn't point to show things to others",
    "Can't walk",
    "Doesn't know what familiar things are for",
    "Doesn't copy others",
    "Doesn't gain new words",
  ],
  '19-24': [
    "Doesn't use 2-word phrases",
    "Doesn't know what to do with common things",
    "Doesn't copy actions and words",
    "Doesn't follow simple instructions",
    "Doesn't walk steadily",
  ],
};

const developmentTips: Record<AgeRangeId, string[]> = {
  '0-3': [
    'Give plenty of tummy time to strengthen neck and shoulder muscles',
    'Talk, sing, and read to your baby to encourage language development',
    "Make eye contact and respond to your baby's coos and sounds",
    'Provide high-contrast toys and objects to look at',
  ],
  '4-6': [
    'Encourage reaching and grasping with colorful toys',
    'Play peek-a-boo and other interactive games',
    'Read books with simple pictures and textures',
    'Provide safe spaces for rolling and moving',
  ],
  '7-9': [
    'Create safe spaces for crawling and exploring',
    'Play games that involve taking turns',
    'Name objects and body parts during daily routines',
    'Encourage standing with support',
  ],
  '10-12': [
    'Provide push toys to encourage walking',
    'Read books and name pictures',
    'Play simple games like pat-a-cake',
    'Encourage self-feeding with finger foods',
  ],
  '13-18': [
    'Provide crayons and paper for scribbling',
    'Read books and ask simple questions',
    'Encourage pretend play with dolls and toys',
    'Take walks and name things you see',
  ],
  '19-24': [
    'Encourage physical activity like running and climbing',
    'Read books and have conversations',
    'Provide puzzles and shape sorters',
    'Sing songs and do finger plays together',
  ],
};

export default function MilestonesPage() {
  const [selectedAge, setSelectedAge] = useState<AgeRangeId>('0-3');
  const [expandedSections, setExpandedSections] = useState<MilestoneCategory[]>(
    ['physical', 'cognitive', 'language', 'social'],
  );
  const [milestones, setMilestones] =
    useState<Record<AgeRangeId, MilestoneGroup>>(milestonesByAge);

  const currentMilestones = (milestones[selectedAge] ??
    milestonesByAge[selectedAge]) as MilestoneGroup;
  const currentRedFlags: string[] = redFlags[selectedAge] ?? [];
  const currentTips: string[] = developmentTips[selectedAge] ?? [];

  const toggleSection = (section: MilestoneCategory) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const toggleMilestone = (
    category: MilestoneCategory,
    milestoneId: number,
  ) => {
    setMilestones((prev) => {
      const ageMilestones = prev[selectedAge];
      if (!ageMilestones) {
        return prev;
      }
      const updatedCategory: Milestone[] = ageMilestones[category].map(
        (milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone,
      );

      return {
        ...prev,
        [selectedAge]: {
          ...ageMilestones,
          [category]: updatedCategory,
        },
      };
    });
  };

  const calculateProgress = () => {
    const allMilestones = [
      ...currentMilestones.physical,
      ...currentMilestones.cognitive,
      ...currentMilestones.language,
      ...currentMilestones.social,
    ];
    const completed = allMilestones.filter((m) => m.completed).length;
    return Math.round((completed / allMilestones.length) * 100);
  };

  const getCategoryProgress = (category: MilestoneCategory) => {
    const categoryMilestones = currentMilestones[category];
    const completed = categoryMilestones.filter(
      (milestone) => milestone.completed,
    ).length;
    return `${completed}/${categoryMilestones.length}`;
  };

  const categories: Array<{
    color: string;
    icon: LucideIcon;
    id: MilestoneCategory;
    label: string;
  }> = [
    {
      color: 'primary',
      icon: Baby,
      id: 'physical',
      label: 'Physical Development',
    },
    {
      color: 'secondary',
      icon: Brain,
      id: 'cognitive',
      label: 'Cognitive Development',
    },
    {
      color: 'accent',
      icon: MessageSquare,
      id: 'language',
      label: 'Language & Communication',
    },
    {
      color: 'chart-4',
      icon: Heart,
      id: 'social',
      label: 'Social & Emotional',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-4 space-y-4">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-balance mb-2">
                Developmental Milestones
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Track your baby's progress across key developmental areas
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="font-medium text-primary">
                      {calculateProgress()}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Age Range Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {ageRanges.map((range) => (
            <Button
              className="whitespace-nowrap"
              key={range.id}
              onClick={() => setSelectedAge(range.id)}
              size="sm"
              variant={selectedAge === range.id ? 'default' : 'outline'}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Milestone Categories */}
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedSections.includes(category.id);
            const categoryMilestones =
              currentMilestones[category.id as keyof typeof currentMilestones];

            return (
              <Card className="overflow-hidden" key={category.id}>
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(category.id)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-${category.color}/10 flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 text-${category.color}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{category.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryProgress(category.id)} completed
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {categoryMilestones.map((milestone) => {
                      const checkboxId = `milestone-${category.id}-${milestone.id}`;
                      return (
                        <div
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg transition-colors',
                            milestone.completed
                              ? 'bg-primary/5'
                              : 'bg-muted/30',
                          )}
                          key={milestone.id}
                        >
                          <Checkbox
                            checked={milestone.completed}
                            className="mt-0.5"
                            id={checkboxId}
                            onCheckedChange={() =>
                              toggleMilestone(category.id, milestone.id)
                            }
                          />
                          <Label
                            className={cn(
                              'text-sm flex-1 cursor-pointer',
                              milestone.completed
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground',
                            )}
                            htmlFor={checkboxId}
                          >
                            {milestone.text}
                          </Label>
                          {milestone.completed && (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Red Flags */}
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">
                When to Be Concerned
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Contact your pediatrician if your baby shows any of these signs:
              </p>
              <div className="space-y-2">
                {currentRedFlags.map((flag) => (
                  <div
                    className="flex items-start gap-2 text-sm"
                    key={`red-flag-${flag}`}
                  >
                    <Circle className="h-1.5 w-1.5 fill-destructive text-destructive mt-1.5 flex-shrink-0" />
                    <span className="text-foreground">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Development Tips */}
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex gap-3">
            <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-accent mb-1">
                Tips to Encourage Development
              </h3>
              <div className="space-y-2 mt-3">
                {currentTips.map((tip) => (
                  <div
                    className="flex items-start gap-2 text-sm"
                    key={`development-tip-${tip}`}
                  >
                    <Circle className="h-1.5 w-1.5 fill-accent text-accent mt-1.5 flex-shrink-0" />
                    <span className="text-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Info Note */}
        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Remember:</strong> Every baby
            develops at their own pace. These milestones are general guidelines.
            If you have concerns about your baby's development, always consult
            with your pediatrician.
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
