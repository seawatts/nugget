'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const tabs = [
  { id: 'groups', label: 'Groups' },
  { id: 'local', label: 'Local Resources' },
  { id: 'experts', label: 'Ask Experts' },
  { id: 'events', label: 'Events' },
];

const groups = [
  {
    category: 'Support',
    description:
      'Connect with other first-time parents navigating this journey together',
    id: 1,
    joined: true,
    members: 1243,
    name: 'First Time Parents 2025',
    newPosts: 12,
  },
  {
    category: 'Feeding',
    description:
      'Share tips, ask questions, and get support with breastfeeding',
    id: 2,
    joined: true,
    members: 856,
    name: 'Breastfeeding Support Circle',
    newPosts: 5,
  },
  {
    category: 'Sleep',
    description: 'Discuss sleep training methods and share success stories',
    id: 3,
    joined: false,
    members: 2104,
    name: 'Sleep Training Success',
    newPosts: 0,
  },
  {
    category: 'Work-Life',
    description:
      'Balance career and parenting with support from others who understand',
    id: 4,
    joined: false,
    members: 1567,
    name: 'Working Parents Network',
    newPosts: 0,
  },
];

const localResources = [
  {
    accepting: true,
    distance: '0.8 miles',
    icon: Stethoscope,
    id: 1,
    name: 'Dr. Sarah Johnson',
    rating: 4.9,
    reviews: 234,
    type: 'Pediatrician',
  },
  {
    accepting: true,
    distance: '1.2 miles',
    icon: Baby,
    id: 2,
    name: 'Lactation Consultant - Maria Garcia',
    rating: 5.0,
    reviews: 89,
    type: 'Lactation Consultant',
  },
  {
    accepting: false,
    distance: '2.1 miles',
    icon: Users,
    id: 3,
    name: 'Little Sprouts Daycare',
    rating: 4.7,
    reviews: 156,
    type: 'Daycare',
  },
  {
    accepting: true,
    distance: '1.5 miles',
    icon: Heart,
    id: 4,
    name: 'Parent & Baby Yoga Studio',
    rating: 4.8,
    reviews: 67,
    type: 'Activity',
  },
];

const expertQuestions = [
  {
    answered: true,
    answers: 3,
    category: 'Feeding',
    expert: 'Dr. Emily Chen, Pediatrician',
    id: 1,
    likes: 45,
    question: 'When should I start introducing solid foods?',
  },
  {
    answered: true,
    answers: 5,
    category: 'Sleep',
    expert: 'Sleep Consultant Sarah Miller',
    id: 2,
    likes: 78,
    question: 'Is it normal for my baby to wake up every 2 hours?',
  },
  {
    answered: false,
    answers: 0,
    category: 'Health',
    expert: 'Pending Expert Response',
    id: 3,
    likes: 12,
    question: 'How can I tell if my baby has colic?',
  },
];

const events = [
  {
    attendees: 12,
    category: 'Support',
    date: 'Tomorrow, 10:00 AM',
    id: 1,
    location: 'Community Center',
    title: 'New Parent Support Group',
    type: 'In-Person',
  },
  {
    attendees: 45,
    category: 'Education',
    date: 'This Saturday, 2:00 PM',
    id: 2,
    location: 'Online',
    title: 'Baby Sign Language Workshop',
    type: 'Virtual',
  },
  {
    attendees: 8,
    category: 'Safety',
    date: 'Next Monday, 6:00 PM',
    id: 3,
    location: 'Local Hospital',
    title: 'Infant CPR & Safety Class',
    type: 'In-Person',
  },
  {
    attendees: 15,
    category: 'Wellness',
    date: 'Next Wednesday, 9:00 AM',
    id: 4,
    location: 'Fitness Studio',
    title: 'Postpartum Fitness Class',
    type: 'In-Person',
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('groups');

  return (
    <main className="px-4 pt-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Community & Resources
          </h1>
          <p className="text-muted-foreground">
            Connect with parents and find local support
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

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground border border-border"
                placeholder="Search groups..."
                type="text"
              />
            </div>

            {groups.map((group) => (
              <Card className="p-6" key={group.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {group.name}
                      </h3>
                      {group.joined && group.newPosts > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                          {group.newPosts} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.members.toLocaleString()} members</span>
                      </div>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                        {group.category}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={group.joined ? 'outline' : 'default'}
                >
                  {group.joined ? 'View Group' : 'Join Group'}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Local Resources Tab */}
        {activeTab === 'local' && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Nearby Resources
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Find pediatricians, lactation consultants, and more in your area
              </p>
            </Card>

            {localResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Card className="p-6" key={resource.id}>
                  <div className="flex gap-4">
                    <div className="bg-primary/20 rounded-full p-3 h-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {resource.type}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{resource.distance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>
                            {resource.rating} ({resource.reviews})
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          className="flex-1 bg-transparent"
                          size="sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </div>
                      {!resource.accepting && (
                        <p className="text-xs text-destructive mt-2">
                          Not accepting new patients
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Ask Experts Tab */}
        {activeTab === 'experts' && (
          <div className="space-y-4">
            <Button className="w-full" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Ask a Question
            </Button>

            <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Expert Q&A
              </h2>
              <p className="text-sm text-muted-foreground">
                Get answers from pediatricians, lactation consultants, and sleep
                experts
              </p>
            </Card>

            {expertQuestions.map((item) => (
              <Card className="p-6" key={item.id}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-primary/20 rounded-full p-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {item.question}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.answered
                        ? `Answered by ${item.expert}`
                        : item.expert}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{item.answers} answers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{item.likes} likes</span>
                      </div>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-transparent"
                  size="sm"
                  variant="outline"
                >
                  View Answers
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Events
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Join classes, workshops, and support groups in your area
              </p>
            </Card>

            {events.map((event) => (
              <Card className="p-6" key={event.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {event.title}
                    </h3>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {event.type}
                      </span>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                        {event.category}
                      </span>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Register</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
