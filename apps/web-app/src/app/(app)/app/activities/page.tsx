'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  MapPin,
  Music,
  Palette,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [babyAge, setBabyAge] = useState<number>(0);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('onboardingData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.birthDate) {
          const birth = new Date(parsed.birthDate);
          const today = new Date();
          const ageInMonths = Math.floor(
            (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
          );
          setBabyAge(ageInMonths);
        }
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }
  }, []);

  const getAgeGroup = () => {
    if (babyAge < 3) return '0-3 months';
    if (babyAge < 6) return '3-6 months';
    if (babyAge < 9) return '6-9 months';
    if (babyAge < 12) return '9-12 months';
    if (babyAge < 18) return '12-18 months';
    return '18+ months';
  };

  const activities = {
    '0-3 months': [
      {
        benefits: [
          'Strengthens neck',
          'Prevents flat spots',
          'Motor development',
        ],
        description:
          'Place baby on tummy while awake to strengthen neck and shoulder muscles',
        duration: '3-5 minutes',
        id: 'tummy-time',
        title: 'Tummy Time',
      },
      {
        benefits: ['Visual tracking', 'Focus development', 'Brain stimulation'],
        description:
          'Show black and white patterns to stimulate visual development',
        duration: '5-10 minutes',
        id: 'high-contrast',
        title: 'High Contrast Cards',
      },
      {
        benefits: ['Language development', 'Bonding', 'Auditory processing'],
        description: "Sing songs and talk to baby about what you're doing",
        duration: 'Throughout day',
        id: 'singing',
        title: 'Singing & Talking',
      },
    ],
    '3-6 months': [
      {
        benefits: ['Hand-eye coordination', 'Motor skills', 'Problem solving'],
        description:
          'Hold toys just out of reach to encourage reaching and grasping',
        duration: '10-15 minutes',
        id: 'reaching',
        title: 'Reaching Games',
      },
      {
        benefits: ['Self-awareness', 'Visual tracking', 'Social development'],
        description: 'Let baby look at themselves in a baby-safe mirror',
        duration: '5-10 minutes',
        id: 'mirror-play',
        title: 'Mirror Play',
      },
      {
        benefits: ['Sensory development', 'Tactile awareness', 'Curiosity'],
        description:
          'Let baby touch different safe textures (soft, bumpy, smooth)',
        duration: '10 minutes',
        id: 'texture-exploration',
        title: 'Texture Exploration',
      },
    ],
    '6-9 months': [
      {
        benefits: ['Object permanence', 'Social skills', 'Cause and effect'],
        description: 'Play peek-a-boo to teach object permanence',
        duration: '5-10 minutes',
        id: 'peek-a-boo',
        title: 'Peek-a-Boo',
      },
      {
        benefits: ['Fine motor skills', 'Problem solving', 'Spatial awareness'],
        description: 'Stack soft blocks or cups and let baby knock them down',
        duration: '10-15 minutes',
        id: 'stacking',
        title: 'Stacking Toys',
      },
      {
        benefits: ['Gross motor skills', 'Coordination', 'Independence'],
        description: 'Place toys just out of reach to encourage crawling',
        duration: '15-20 minutes',
        id: 'crawling-games',
        title: 'Crawling Encouragement',
      },
    ],
    '9-12 months': [
      {
        benefits: ['Problem solving', 'Fine motor skills', 'Shape recognition'],
        description: 'Practice with shape sorters to develop problem-solving',
        duration: '10-15 minutes',
        id: 'shape-sorter',
        title: 'Shape Sorting',
      },
      {
        benefits: ['Rhythm', 'Coordination', 'Joy and bonding'],
        description: 'Dance and move to music together',
        duration: '15 minutes',
        id: 'music-movement',
        title: 'Music & Movement',
      },
      {
        benefits: ['Language', 'Fine motor skills', 'Attention span'],
        description: 'Read books with flaps, textures, and simple pictures',
        duration: '10-15 minutes',
        id: 'simple-books',
        title: 'Interactive Books',
      },
    ],
    '12-18 months': [
      {
        benefits: ['Gross motor skills', 'Balance', 'Confidence'],
        description: 'Encourage walking with push toys and holding hands',
        duration: '20-30 minutes',
        id: 'walking-practice',
        title: 'Walking Practice',
      },
      {
        benefits: ['Imagination', 'Social skills', 'Language'],
        description: 'Play with toy phones, kitchen sets, or dolls',
        duration: '15-20 minutes',
        id: 'pretend-play',
        title: 'Pretend Play',
      },
      {
        benefits: ['Sensory input', 'Curiosity', 'Physical activity'],
        description: 'Explore nature, collect leaves, watch birds',
        duration: '30 minutes',
        id: 'outdoor-exploration',
        title: 'Outdoor Exploration',
      },
    ],
    '18+ months': [
      {
        benefits: ['Creativity', 'Fine motor skills', 'Self-expression'],
        description: 'Finger painting, coloring, play dough',
        duration: '20-30 minutes',
        id: 'art-activities',
        title: 'Art & Crafts',
      },
      {
        benefits: [
          'Gross motor skills',
          'Problem solving',
          'Physical activity',
        ],
        description:
          'Create simple obstacle courses with pillows and furniture',
        duration: '20-30 minutes',
        id: 'obstacle-course',
        title: 'Indoor Obstacle Course',
      },
      {
        benefits: ['Cognitive skills', 'Classification', 'Focus'],
        description: 'Sort by color, size, or type',
        duration: '15-20 minutes',
        id: 'sorting-games',
        title: 'Sorting & Matching',
      },
    ],
  };

  const sensoryIdeas = [
    {
      ageRange: '6+ months',
      description:
        'Fill a shallow container with water and add cups, sponges, or toys',
      materials: ['Water', 'Containers', 'Toys'],
      title: 'Water Play',
    },
    {
      ageRange: '12+ months',
      description:
        'Fill bins with rice, pasta, or beans (supervised) for tactile exploration',
      materials: ['Container', 'Rice/pasta', 'Scoops'],
      title: 'Sensory Bins',
    },
    {
      ageRange: '3+ months',
      description: 'Blow bubbles for baby to watch, reach for, and pop',
      materials: ['Bubble solution', 'Wand'],
      title: 'Bubble Play',
    },
    {
      ageRange: '6+ months',
      description:
        'Create a board with different textures to touch and explore',
      materials: ['Cardboard', 'Fabric scraps', 'Glue'],
      title: 'Texture Board',
    },
  ];

  const toyRecommendations = [
    {
      category: '0-6 months',
      toys: [
        {
          benefit: 'Visual development',
          name: 'High contrast cards',
          price: '$10-15',
        },
        { benefit: 'Grasping and sound', name: 'Soft rattles', price: '$8-12' },
        {
          benefit: 'Tummy time and reaching',
          name: 'Play gym',
          price: '$40-80',
        },
        { benefit: 'Oral exploration', name: 'Teething toys', price: '$5-15' },
      ],
    },
    {
      category: '6-12 months',
      toys: [
        { benefit: 'Problem solving', name: 'Stacking cups', price: '$10-15' },
        {
          benefit: 'Fine motor skills',
          name: 'Activity cube',
          price: '$25-40',
        },
        {
          benefit: 'Language development',
          name: 'Board books',
          price: '$5-10 each',
        },
        { benefit: 'Walking support', name: 'Push walker', price: '$30-60' },
      ],
    },
    {
      category: '12-18 months',
      toys: [
        { benefit: 'Cognitive skills', name: 'Shape sorter', price: '$15-25' },
        {
          benefit: 'Rhythm and creativity',
          name: 'Musical instruments',
          price: '$20-40',
        },
        {
          benefit: 'Spatial awareness',
          name: 'Building blocks',
          price: '$15-30',
        },
        { benefit: 'Imagination', name: 'Pretend play sets', price: '$20-50' },
      ],
    },
  ];

  const playdates = [
    {
      ageRange: '6-12 months',
      attendees: 4,
      date: 'Tomorrow, 10:00 AM',
      host: 'Sarah M.',
      id: 1,
      location: 'Central Park Playground',
      status: 'confirmed',
    },
    {
      ageRange: '12-18 months',
      attendees: 6,
      date: 'Friday, 2:00 PM',
      host: 'Emily R.',
      id: 2,
      location: 'Little Sprouts Play Cafe',
      status: 'pending',
    },
    {
      ageRange: '9-15 months',
      attendees: 3,
      date: 'Next Monday, 11:00 AM',
      host: 'You',
      id: 3,
      location: 'Your Home',
      status: 'hosting',
    },
  ];

  const classes = [
    {
      ageRange: '0-18 months',
      enrolled: true,
      id: 1,
      location: 'Community Center',
      name: 'Baby Music Together',
      price: '$120/8 weeks',
      rating: 4.8,
      schedule: 'Tuesdays, 10:00 AM',
      type: 'Music',
    },
    {
      ageRange: '6-24 months',
      enrolled: false,
      id: 2,
      location: 'Aquatic Center',
      name: 'Infant Swimming',
      price: '$150/6 weeks',
      rating: 4.9,
      schedule: 'Saturdays, 9:00 AM',
      type: 'Swimming',
    },
    {
      ageRange: '3-12 months',
      enrolled: true,
      id: 3,
      location: 'Yoga Studio',
      name: 'Mommy & Me Yoga',
      price: '$100/8 weeks',
      rating: 4.7,
      schedule: 'Thursdays, 11:00 AM',
      type: 'Movement',
    },
    {
      ageRange: '6-18 months',
      enrolled: false,
      id: 4,
      location: 'Library',
      name: 'Baby Sign Language',
      price: 'Free',
      rating: 4.6,
      schedule: 'Wednesdays, 10:30 AM',
      type: 'Language',
    },
  ];

  const currentActivities =
    activities[getAgeGroup() as keyof typeof activities] || [];

  return (
    <main className="px-4 pt-4 pb-8">
      {/* Age Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl border border-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Baby className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Activities for</p>
            <p className="text-lg font-semibold">
              {babyAge} months old ({getAgeGroup()})
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { icon: Sparkles, id: 'suggestions', label: 'Daily Activities' },
          { icon: Palette, id: 'sensory', label: 'Sensory Play' },
          { icon: Baby, id: 'toys', label: 'Toy Guide' },
          { icon: Users, id: 'playdates', label: 'Playdates' },
          { icon: Music, id: 'classes', label: 'Classes' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              className="flex-shrink-0"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'default' : 'outline'}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Daily Activities Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommended Activities</h2>
            <span className="text-sm text-muted-foreground">
              {currentActivities.length} activities
            </span>
          </div>

          {currentActivities.map((activity) => (
            <Card
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              key={activity.id}
              onClick={() =>
                setSelectedActivity(
                  selectedActivity === activity.id ? null : activity.id,
                )
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {activity.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{activity.duration}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    selectedActivity === activity.id ? 'rotate-90' : ''
                  }`}
                />
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {activity.description}
              </p>

              {selectedActivity === activity.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Benefits:</p>
                  <div className="flex flex-wrap gap-2">
                    {activity.benefits.map((benefit) => (
                      <span
                        className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        key={benefit}
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                  <Button className="w-full mt-4">Mark as Done Today</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Sensory Play Tab */}
      {activeTab === 'sensory' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Sensory Play Ideas</h2>
          {sensoryIdeas.map((idea) => (
            <Card className="p-4" key={idea.title}>
              <div className="flex items-start gap-3">
                <div className="p-3 bg-accent/20 rounded-xl">
                  <Palette className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {idea.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Baby className="h-3 w-3" />
                      {idea.ageRange}
                    </span>
                    <span>Materials: {idea.materials.join(', ')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Toy Recommendations Tab */}
      {activeTab === 'toys' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Age-Appropriate Toys</h2>
          {toyRecommendations.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-lg mb-3">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.toys.map((toy) => (
                  <Card className="p-4" key={toy.name}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{toy.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {toy.benefit}
                        </p>
                        <span className="text-sm font-medium text-primary">
                          {toy.price}
                        </span>
                      </div>
                      <Star className="h-5 w-5 text-secondary fill-secondary" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playdates Tab */}
      {activeTab === 'playdates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Playdates</h2>
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New
            </Button>
          </div>

          {playdates.map((playdate) => (
            <Card className="p-4" key={playdate.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold mb-1">
                    {playdate.status === 'hosting'
                      ? "You're hosting!"
                      : `Hosted by ${playdate.host}`}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span>{playdate.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{playdate.location}</span>
                  </div>
                </div>
                {playdate.status === 'confirmed' ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : playdate.status === 'hosting' ? (
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <Users className="h-4 w-4 inline mr-1" />
                    {playdate.attendees} families
                  </span>
                  <span className="text-muted-foreground">
                    Ages: {playdate.ageRange}
                  </span>
                </div>
                {playdate.status === 'pending' && (
                  <Button size="sm" variant="outline">
                    RSVP
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Local Classes</h2>
            <Button size="sm" variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {classes.map((classItem) => (
            <Card className="p-4" key={classItem.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{classItem.name}</h3>
                    {classItem.enrolled && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                        Enrolled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {classItem.type}
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-secondary fill-secondary" />
                  <span className="text-sm font-medium">
                    {classItem.rating}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Ages: {classItem.ageRange}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-primary">
                    {classItem.price}
                  </span>
                </div>
                {!classItem.enrolled && (
                  <Button size="sm" variant="outline">
                    Enroll
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
