'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { Camera, Heart, ImageIcon, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

const tabs = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'photos', label: 'Photos' },
  { id: 'growth', label: 'Growth' },
];

const milestones = [
  {
    age: '6 weeks',
    category: 'Social',
    completed: true,
    date: '2 weeks ago',
    id: 1,
    image: '/baby-smiling.jpg',
    title: 'First Smile',
  },
  {
    age: '7 weeks',
    category: 'Physical',
    completed: true,
    date: '1 week ago',
    id: 2,
    image: '/baby-tummy-time.jpg',
    title: 'Holds Head Up',
  },
  {
    age: 'Expected: 3-4 months',
    category: 'Social',
    completed: false,
    date: null,
    id: 3,
    image: null,
    title: 'First Laugh',
  },
  {
    age: 'Expected: 4-6 months',
    category: 'Physical',
    completed: false,
    date: null,
    id: 4,
    image: null,
    title: 'Rolls Over',
  },
];

const memories = [
  {
    date: 'Today',
    id: 1,
    note: 'Riley loved watching the trees and hearing the birds. Such a peaceful afternoon together.',
    photos: 3,
    tags: ['outdoor', 'first'],
    time: '2:30 PM',
    title: 'First time at the park',
  },
  {
    date: 'Yesterday',
    id: 2,
    note: 'Held head up for 30 seconds! So proud of this little one.',
    photos: 2,
    tags: ['milestone', 'development'],
    time: '10:15 AM',
    title: 'Tummy time success',
  },
  {
    date: '3 days ago',
    id: 3,
    note: 'The biggest smiles during bath time. This is becoming our favorite part of the day.',
    photos: 5,
    tags: ['bath', 'happy'],
    time: '6:45 PM',
    title: 'Bath time giggles',
  },
];

const growthData = [
  { age: 'Birth', head: '13.5 in', length: '19.5 in', weight: '7.2 lbs' },
  { age: '2 weeks', head: '13.8 in', length: '20 in', weight: '7.8 lbs' },
  { age: '1 month', head: '14.2 in', length: '21 in', weight: '9.1 lbs' },
  { age: '2 months', head: '15 in', length: '22.5 in', weight: '11.3 lbs' },
];

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Memory Journal
            </h1>
            <p className="text-muted-foreground">
              Capture precious moments and milestones
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

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <Button className="w-full" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Memory
              </Button>

              {memories.map((memory) => (
                <Card className="p-6" key={memory.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {memory.date}
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        {memory.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">{memory.photos}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-3">{memory.note}</p>
                  <div className="flex gap-2">
                    {memory.tags.map((tag) => (
                      <span
                        className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Milestone Tracker
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track and celebrate your baby's developmental milestones
                </p>
              </Card>

              {milestones.map((milestone) => (
                <Card
                  className={cn(
                    'p-6',
                    milestone.completed && 'border-primary/50',
                  )}
                  key={milestone.id}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {milestone.image ? (
                        <img
                          alt={milestone.title}
                          className="w-20 h-20 rounded-lg object-cover"
                          src={milestone.image || '/placeholder.svg'}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {milestone.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {milestone.age}
                          </p>
                        </div>
                        {milestone.completed ? (
                          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium">
                            Completed
                          </div>
                        ) : (
                          <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                            Upcoming
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          {milestone.category}
                        </span>
                        {milestone.date && (
                          <span className="text-xs text-muted-foreground">
                            {milestone.date}
                          </span>
                        )}
                      </div>
                      {!milestone.completed && (
                        <Button size="sm" variant="outline">
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <Button className="w-full" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Add Photos
              </Button>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Monthly Photos
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((month) => (
                    <div className="relative aspect-square" key={month}>
                      <img
                        alt={`Month ${month}`}
                        className="w-full h-full object-cover rounded-lg"
                        src={`/baby-month-.jpg?height=200&width=200&query=baby month ${month}`}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                        {month}m
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Recent Photos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((idx) => (
                    <img
                      alt={`Recent memory ${idx}`}
                      className="w-full aspect-square object-cover rounded-lg"
                      key={`recent-photo-${idx}`}
                      src={`/baby-photo-.jpg?height=300&width=300&query=baby photo ${idx}`}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Growth Tab */}
          {activeTab === 'growth' && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Growth Tracking
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Weight
                    </p>
                    <p className="text-2xl font-bold text-primary">11.3 lbs</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Length
                    </p>
                    <p className="text-2xl font-bold text-accent">22.5 in</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Head Circ.
                    </p>
                    <p className="text-2xl font-bold text-secondary">15 in</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Growth History
                </h3>
                <div className="space-y-4">
                  {growthData.map((entry) => (
                    <div
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      key={entry.age}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.age}
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Weight:{' '}
                          </span>
                          <span className="text-foreground font-medium">
                            {entry.weight}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Length:{' '}
                          </span>
                          <span className="text-foreground font-medium">
                            {entry.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Head: </span>
                          <span className="text-foreground font-medium">
                            {entry.head}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Button className="w-full">Add Growth Entry</Button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
