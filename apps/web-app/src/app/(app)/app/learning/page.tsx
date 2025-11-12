'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Bath,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Heart,
  Milk,
  Moon,
  Play,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

export default function LearningPage() {
  const [selectedTab, setSelectedTab] = useState<
    'courses' | 'guides' | 'milestones' | 'books'
  >('courses');
  const [journeyStage, setJourneyStage] = useState<string>('');

  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      setJourneyStage(data.stage || '');
    }
  }, []);

  const courses = [
    {
      color: 'primary',
      description: 'Everything you need to know for the first weeks',
      duration: '45 min',
      icon: Baby,
      lessons: 8,
      progress: 75,
      title: 'Newborn Care Basics',
    },
    {
      color: 'secondary',
      description: 'Tips and techniques for successful nursing',
      duration: '30 min',
      icon: Milk,
      lessons: 6,
      progress: 0,
      title: 'Breastfeeding Success',
    },
    {
      color: 'accent',
      description: 'Create a safe sleep environment for baby',
      duration: '20 min',
      icon: Moon,
      lessons: 4,
      progress: 100,
      title: 'Safe Sleep Practices',
    },
    {
      color: 'primary',
      description: 'Step-by-step bathing guide',
      duration: '15 min',
      icon: Bath,
      lessons: 3,
      progress: 0,
      title: "Baby's First Bath",
    },
  ];

  const guides = [
    {
      category: 'Feeding',
      color: 'secondary',
      icon: Milk,
      topics: [
        { duration: '5 min read', title: 'Breastfeeding Positions' },
        { duration: '4 min read', title: 'Bottle Feeding Tips' },
        { duration: '6 min read', title: 'Pumping Schedule' },
        { duration: '8 min read', title: 'Starting Solid Foods' },
      ],
    },
    {
      category: 'Sleep',
      color: 'primary',
      icon: Moon,
      topics: [
        { duration: '5 min read', title: 'Newborn Sleep Patterns' },
        { duration: '4 min read', title: 'Creating a Bedtime Routine' },
        { duration: '10 min read', title: 'Sleep Training Methods' },
        { duration: '6 min read', title: 'Dealing with Night Wakings' },
      ],
    },
    {
      category: 'Health & Safety',
      color: 'accent',
      icon: Heart,
      topics: [
        { duration: '3 min read', title: "Taking Baby's Temperature" },
        { duration: '7 min read', title: 'When to Call the Doctor' },
        { duration: '8 min read', title: 'Baby CPR Basics' },
        { duration: '6 min read', title: 'Common Illnesses' },
      ],
    },
    {
      category: 'Development',
      color: 'primary',
      icon: TrendingUp,
      topics: [
        { duration: '4 min read', title: 'Tummy Time Tips' },
        { duration: '5 min read', title: 'Encouraging Motor Skills' },
        { duration: '6 min read', title: 'Language Development' },
        { duration: '7 min read', title: 'Social & Emotional Growth' },
      ],
    },
  ];

  const milestones = [
    {
      age: '0-3 Months',
      cognitive: [
        'Recognizes familiar faces',
        'Responds to loud sounds',
        'Begins to smile socially',
        'Coos and makes sounds',
      ],
      physical: [
        'Lifts head during tummy time',
        'Opens and closes hands',
        'Brings hands to mouth',
        'Follows objects with eyes',
      ],
      social: [
        'Enjoys being held',
        'Calms when spoken to',
        'Looks at faces',
        'Smiles at people',
      ],
    },
    {
      age: '4-6 Months',
      cognitive: [
        'Responds to own name',
        'Shows curiosity',
        'Begins to pass toys between hands',
        'Looks at things nearby',
      ],
      physical: [
        'Rolls over both ways',
        'Sits with support',
        'Reaches for toys',
        'Brings objects to mouth',
      ],
      social: [
        'Knows familiar faces',
        'Likes to play with others',
        'Responds to emotions',
        'Laughs and squeals',
      ],
    },
    {
      age: '7-9 Months',
      cognitive: [
        'Looks for dropped objects',
        'Plays peek-a-boo',
        'Puts objects in mouth to explore',
        'Follows simple commands',
      ],
      physical: [
        'Sits without support',
        'Crawls or scoots',
        'Pulls to standing',
        'Picks up small objects',
      ],
      social: [
        'May be shy with strangers',
        'Shows preferences for people',
        'Repeats sounds',
        'Points at things',
      ],
    },
  ];

  const booksData = {
    baby: [
      {
        author: 'Harvey Karp',
        cover: '/happiest-baby-book.jpg',
        description:
          'The new way to calm crying and help your newborn baby sleep longer',
        link: '#',
        rating: 4.8,
        reviews: 34567,
        title: 'The Happiest Baby on the Block',
      },
      {
        author: 'Alexis Dubief',
        cover: '/baby-sleep-book.jpg',
        description: 'The complete baby sleep guide for modern parents',
        link: '#',
        rating: 4.7,
        reviews: 15234,
        title: 'Precious Little Sleep',
      },
      {
        author: 'Emily Oster',
        cover: '/parenting-data-book.jpg',
        description:
          'A data-driven guide to better, more relaxed parenting from birth to preschool',
        link: '#',
        rating: 4.6,
        reviews: 19876,
        title: 'Cribsheet',
      },
      {
        author: 'Frans Plooij',
        cover: '/wonder-weeks-book.jpg',
        description:
          "A stress-free guide to your baby's behavior and development",
        link: '#',
        rating: 4.5,
        reviews: 28901,
        title: 'The Wonder Weeks',
      },
      {
        author: 'Gill Rapley',
        cover: '/baby-led-weaning-book.jpg',
        description:
          'The essential guide to introducing solid foods and helping your baby grow up a happy eater',
        link: '#',
        rating: 4.7,
        reviews: 11234,
        title: 'Baby-Led Weaning',
      },
      {
        author: 'Daniel Siegel',
        cover: '/whole-brain-child-book.jpg',
        description:
          "12 revolutionary strategies to nurture your child's developing mind",
        link: '#',
        rating: 4.8,
        reviews: 22345,
        title: 'The Whole-Brain Child',
      },
    ],
    pregnant: [
      {
        author: 'Heidi Murkoff',
        cover: '/pregnancy-guide-book.jpg',
        description:
          "America's pregnancy bible - comprehensive week-by-week guide to pregnancy",
        link: '#',
        rating: 4.7,
        reviews: 45231,
        title: "What to Expect When You're Expecting",
      },
      {
        author: 'Emily Oster',
        cover: '/expecting-better-book.jpg',
        description:
          'Why the conventional pregnancy wisdom is wrong and what you really need to know',
        link: '#',
        rating: 4.8,
        reviews: 23456,
        title: 'Expecting Better',
      },
      {
        author: 'Genevieve Howland',
        cover: '/natural-pregnancy-book.jpg',
        description:
          'Natural pregnancy and childbirth guide with week-by-week information',
        link: '#',
        rating: 4.9,
        reviews: 18234,
        title: 'The Mama Natural Week-by-Week Guide',
      },
      {
        author: 'Ina May Gaskin',
        cover: '/childbirth-guide-book.jpg',
        description:
          "Inspiring birth stories and practical advice from America's leading midwife",
        link: '#',
        rating: 4.8,
        reviews: 12890,
        title: "Ina May's Guide to Childbirth",
      },
    ],
    ttc: [
      {
        author: 'Toni Weschler',
        cover: '/fertility-book-cover.jpg',
        description:
          'The definitive guide to natural birth control, pregnancy achievement, and reproductive health',
        link: '#',
        rating: 4.8,
        reviews: 12453,
        title: 'Taking Charge of Your Fertility',
      },
      {
        author: 'Rebecca Fett',
        cover: '/egg-quality-book.jpg',
        description:
          'How the science of egg quality can help you get pregnant naturally and improve your odds with IVF',
        link: '#',
        rating: 4.7,
        reviews: 8234,
        title: 'It Starts with the Egg',
      },
      {
        author: 'Jean Twenge',
        cover: '/getting-pregnant-guide.jpg',
        description:
          'A comprehensive guide to conception with the latest research and practical advice',
        link: '#',
        rating: 4.6,
        reviews: 5621,
        title: "The Impatient Woman's Guide to Getting Pregnant",
      },
    ],
  };

  const getCurrentBooks = () => {
    if (journeyStage === 'ttc') return booksData.ttc;
    if (journeyStage === 'pregnant') return booksData.pregnant;
    if (journeyStage === 'baby') return booksData.baby;
    return booksData.baby; // default to baby books
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-4 space-y-4">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance mb-2">
                Learning Hub
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Expert-backed courses, guides, and milestones for new parents
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'courses'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('courses')}
            type="button"
          >
            Courses
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'guides'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('guides')}
            type="button"
          >
            Quick Guides
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'milestones'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('milestones')}
            type="button"
          >
            Milestones
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'books'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('books')}
            type="button"
          >
            Books
          </button>
        </div>

        {/* Courses Tab */}
        {selectedTab === 'courses' && (
          <div className="space-y-4">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <Card
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  key={course.title}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-16 h-16 rounded-xl bg-${course.color}/10 flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-8 w-8 text-${course.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold mb-1">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.description}
                          </p>
                        </div>
                        {course.progress === 100 && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{course.lessons} lessons</span>
                        </div>
                      </div>

                      {course.progress > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className={`bg-${course.color} h-1.5 rounded-full transition-all`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {course.progress === 0 && (
                        <Button className="w-full mt-2" size="sm">
                          <Play className="h-3 w-3 mr-2" />
                          Start Course
                        </Button>
                      )}
                      {course.progress > 0 && course.progress < 100 && (
                        <Button
                          className="w-full mt-2 bg-transparent"
                          size="sm"
                          variant="outline"
                        >
                          Continue Learning
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Guides Tab */}
        {selectedTab === 'guides' && (
          <div className="space-y-4">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card className="p-4" key={guide.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full bg-${guide.color}/10 flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 text-${guide.color}`} />
                    </div>
                    <h3 className="font-semibold">{guide.category}</h3>
                  </div>

                  <div className="space-y-2">
                    {guide.topics.map((topic) => (
                      <button
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                        key={`${guide.category}-${topic.title}`}
                        type="button"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{topic.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {topic.duration}
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

        {/* Milestones Tab */}
        {selectedTab === 'milestones' && (
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Track Development</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every baby develops at their own pace. These are general
                    guidelines. Consult your pediatrician if you have concerns.
                  </p>
                </div>
              </div>
            </Card>

            {milestones.map((milestone) => (
              <Card className="p-4" key={milestone.age}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{milestone.age}</h3>
                  <Badge variant="secondary">
                    {milestone.physical.length +
                      milestone.cognitive.length +
                      milestone.social.length}{' '}
                    milestones
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-primary">
                      Physical Development
                    </h4>
                    <div className="space-y-1.5">
                      {milestone.physical.map((item) => (
                        <div
                          className="flex items-start gap-2 text-sm"
                          key={`physical-${milestone.age}-${item}`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-secondary">
                      Cognitive Development
                    </h4>
                    <div className="space-y-1.5">
                      {milestone.cognitive.map((item) => (
                        <div
                          className="flex items-start gap-2 text-sm"
                          key={`cognitive-${milestone.age}-${item}`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-accent">
                      Social & Emotional
                    </h4>
                    <div className="space-y-1.5">
                      {milestone.social.map((item) => (
                        <div
                          className="flex items-start gap-2 text-sm"
                          key={`social-${milestone.age}-${item}`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Books Tab */}
        {selectedTab === 'books' && (
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <BookMarked className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">
                    Recommended Reading
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {journeyStage === 'ttc' &&
                      'Books to help you on your conception journey'}
                    {journeyStage === 'pregnant' &&
                      'Essential pregnancy and childbirth guides'}
                    {journeyStage === 'baby' &&
                      'Expert advice for raising your baby'}
                    {!journeyStage && 'Expert advice for raising your baby'}
                  </p>
                </div>
              </div>
            </Card>

            {getCurrentBooks().map((book) => (
              <Card
                className="p-4 hover:bg-muted/50 transition-colors"
                key={book.title}
              >
                <div className="flex gap-4">
                  <img
                    alt={book.title}
                    className="w-24 h-32 object-cover rounded-lg flex-shrink-0 bg-muted"
                    src={book.cover || '/placeholder.svg'}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 text-balance">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {book.author}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">
                          {book.rating}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({book.reviews.toLocaleString()} reviews)
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {book.description}
                    </p>

                    <Button
                      asChild
                      className="w-full bg-transparent"
                      size="sm"
                      variant="outline"
                    >
                      <a
                        href={book.link}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Book
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
