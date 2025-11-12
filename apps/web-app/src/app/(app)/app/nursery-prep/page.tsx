'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Home,
  Shield,
  Sparkles,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

export default function NurseryPrepPage() {
  const [selectedTab, setSelectedTab] = useState<
    'registry' | 'nursery' | 'safety'
  >('registry');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'essential' | 'nice-to-have'
  >('all');

  const registryItems = [
    // Essentials
    {
      category: 'Nursery',
      checked: true,
      name: 'Crib with mattress',
      price: 300,
      priority: 'essential',
    },
    {
      category: 'Travel',
      checked: true,
      name: 'Car seat',
      price: 200,
      priority: 'essential',
    },
    {
      category: 'Travel',
      checked: false,
      name: 'Stroller',
      price: 250,
      priority: 'essential',
    },
    {
      category: 'Diapering',
      checked: false,
      name: 'Diapers (newborn & size 1)',
      price: 50,
      priority: 'essential',
    },
    {
      category: 'Diapering',
      checked: false,
      name: 'Wipes',
      price: 20,
      priority: 'essential',
    },
    {
      category: 'Clothing',
      checked: true,
      name: 'Onesies (0-3 months)',
      price: 40,
      priority: 'essential',
    },
    {
      category: 'Clothing',
      checked: false,
      name: 'Sleepers (0-3 months)',
      price: 35,
      priority: 'essential',
    },
    {
      category: 'Sleep',
      checked: false,
      name: 'Swaddle blankets',
      price: 30,
      priority: 'essential',
    },
    {
      category: 'Feeding',
      checked: false,
      name: 'Bottles & nipples',
      price: 40,
      priority: 'essential',
    },
    {
      category: 'Feeding',
      checked: false,
      name: 'Burp cloths',
      price: 15,
      priority: 'essential',
    },
    {
      category: 'Bath',
      checked: false,
      name: 'Baby bathtub',
      price: 25,
      priority: 'essential',
    },
    {
      category: 'Health',
      checked: false,
      name: 'Thermometer',
      price: 20,
      priority: 'essential',
    },

    // Nice to Have
    {
      category: 'Nursery',
      checked: false,
      name: 'Baby monitor',
      price: 150,
      priority: 'nice-to-have',
    },
    {
      category: 'Nursery',
      checked: false,
      name: 'Changing table',
      price: 180,
      priority: 'nice-to-have',
    },
    {
      category: 'Nursery',
      checked: false,
      name: 'Rocking chair',
      price: 300,
      priority: 'nice-to-have',
    },
    {
      category: 'Diapering',
      checked: false,
      name: 'Diaper pail',
      price: 50,
      priority: 'nice-to-have',
    },
    {
      category: 'Travel',
      checked: false,
      name: 'Baby carrier/wrap',
      price: 80,
      priority: 'nice-to-have',
    },
    {
      category: 'Play',
      checked: false,
      name: 'Bouncer seat',
      price: 60,
      priority: 'nice-to-have',
    },
    {
      category: 'Play',
      checked: false,
      name: 'Play gym',
      price: 50,
      priority: 'nice-to-have',
    },
    {
      category: 'Sleep',
      checked: false,
      name: 'White noise machine',
      price: 30,
      priority: 'nice-to-have',
    },
    {
      category: 'Feeding',
      checked: false,
      name: 'Nursing pillow',
      price: 40,
      priority: 'nice-to-have',
    },
    {
      category: 'Feeding',
      checked: false,
      name: 'Bottle warmer',
      price: 35,
      priority: 'nice-to-have',
    },
  ];

  const nurserySetupSteps = [
    {
      completed: true,
      description:
        'Pick a room close to your bedroom, away from windows and heating vents',
      title: 'Choose a Safe Location',
    },
    {
      completed: true,
      description:
        'Use low-VOC paint and allow 2-3 weeks for proper ventilation',
      title: 'Paint & Ventilate',
    },
    {
      completed: false,
      description:
        'Anchor all furniture to walls, especially dressers and changing tables',
      title: 'Install Furniture',
    },
    {
      completed: false,
      description:
        'Place crib away from windows, cords, and ensure firm mattress fits snugly',
      title: 'Set Up Sleep Area',
    },
    {
      completed: false,
      description:
        'Arrange diapers, wipes, and clothes within easy reach of changing area',
      title: 'Organize Storage',
    },
    {
      completed: false,
      description:
        'Install dimmer switches or use soft nightlights for nighttime care',
      title: 'Add Lighting',
    },
  ];

  const safetyChecklist = [
    {
      category: 'Sleep Safety',
      items: [
        {
          checked: true,
          critical: true,
          item: 'Crib meets current safety standards',
        },
        {
          checked: true,
          critical: true,
          item: 'Firm mattress with fitted sheet',
        },
        {
          checked: false,
          critical: true,
          item: 'No pillows, blankets, or toys in crib',
        },
        {
          checked: true,
          critical: true,
          item: 'Crib slats no more than 2⅜ inches apart',
        },
        {
          checked: false,
          critical: false,
          item: 'Mattress at lowest setting once baby can sit',
        },
      ],
    },
    {
      category: 'Furniture Safety',
      items: [
        {
          checked: false,
          critical: true,
          item: 'All furniture anchored to walls',
        },
        { checked: true, critical: true, item: 'No furniture near windows' },
        {
          checked: false,
          critical: true,
          item: 'Changing table has safety straps',
        },
        {
          checked: false,
          critical: false,
          item: 'Drawers have safety latches',
        },
      ],
    },
    {
      category: 'Electrical & Cords',
      items: [
        { checked: false, critical: true, item: 'Outlet covers installed' },
        {
          checked: false,
          critical: true,
          item: 'Cords secured and out of reach',
        },
        {
          checked: false,
          critical: true,
          item: 'Baby monitor cords 3+ feet from crib',
        },
      ],
    },
    {
      category: 'Temperature & Air',
      items: [
        { checked: true, critical: false, item: 'Room temperature 68-72°F' },
        {
          checked: true,
          critical: true,
          item: 'Smoke detector installed and tested',
        },
        {
          checked: true,
          critical: true,
          item: 'Carbon monoxide detector installed',
        },
      ],
    },
  ];

  const filteredItems = registryItems.filter(
    (item) => selectedCategory === 'all' || item.priority === selectedCategory,
  );

  const essentialProgress = Math.round(
    (registryItems.filter((i) => i.priority === 'essential' && i.checked)
      .length /
      registryItems.filter((i) => i.priority === 'essential').length) *
      100,
  );

  const totalCost = registryItems.reduce(
    (sum, item) => sum + (item.checked ? 0 : item.price),
    0,
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-4 space-y-4">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Home className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance mb-2">
                Home & Nursery Prep
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Everything you need to prepare your home for baby's arrival
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'registry'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('registry')}
            type="button"
          >
            Registry
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'nursery'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('nursery')}
            type="button"
          >
            Nursery Setup
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTab === 'safety'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSelectedTab('safety')}
            type="button"
          >
            Safety
          </button>
        </div>

        {/* Registry Tab */}
        {selectedTab === 'registry' && (
          <div className="space-y-4">
            {/* Progress Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Essential Items
                  </p>
                  <p className="text-2xl font-bold">{essentialProgress}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Remaining Cost
                  </p>
                  <p className="text-2xl font-bold">${totalCost}</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${essentialProgress}%` }}
                />
              </div>
            </Card>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedCategory('all')}
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
              >
                All Items
              </Button>
              <Button
                onClick={() => setSelectedCategory('essential')}
                size="sm"
                variant={
                  selectedCategory === 'essential' ? 'default' : 'outline'
                }
              >
                <Star className="h-3 w-3 mr-1" />
                Essential
              </Button>
              <Button
                onClick={() => setSelectedCategory('nice-to-have')}
                size="sm"
                variant={
                  selectedCategory === 'nice-to-have' ? 'default' : 'outline'
                }
              >
                Nice to Have
              </Button>
            </div>

            {/* Registry Items */}
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card className="p-4" key={item.name}>
                  <div className="flex items-start gap-3">
                    {item.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-xs" variant="outline">
                              {item.category}
                            </Badge>
                            {item.priority === 'essential' && (
                              <Badge
                                className="text-xs bg-primary/10 text-primary border-primary/20"
                                variant="secondary"
                              >
                                <Star className="h-2.5 w-2.5 mr-1" />
                                Essential
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${item.checked ? 'text-muted-foreground' : ''}`}
                          >
                            ${item.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Nursery Setup Tab */}
        {selectedTab === 'nursery' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-secondary" />
                <h3 className="font-semibold">Setup Steps</h3>
              </div>

              <div className="space-y-3">
                {nurserySetupSteps.map((step) => (
                  <div
                    className={`p-4 rounded-lg ${
                      step.completed
                        ? 'bg-primary/5 border border-primary/20'
                        : 'bg-muted/50'
                    }`}
                    key={step.title}
                  >
                    <div className="flex items-start gap-3">
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium text-sm mb-1 ${step.completed ? 'text-muted-foreground' : ''}`}
                        >
                          {step.title}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-secondary/5 border-secondary/20">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Design Tip</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Keep the nursery simple and functional. You can always add
                    decorative elements later. Focus on safety and comfort
                    first!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Safety Tab */}
        {selectedTab === 'safety' && (
          <div className="space-y-4">
            {safetyChecklist.map((section) => (
              <Card className="p-4" key={section.category}>
                <h3 className="font-semibold mb-4">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        item.critical && !item.checked
                          ? 'bg-destructive/5 border border-destructive/20'
                          : 'bg-muted/30'
                      }`}
                      key={`${section.category}-${item.item}`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.item}
                          </p>
                          {item.critical && !item.checked && (
                            <Badge className="text-xs" variant="destructive">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              Critical
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <Card className="p-4 bg-destructive/5 border-destructive/20">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Safety First</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete all critical safety items before baby arrives.
                    These are non-negotiable for your baby's wellbeing and
                    safety.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
