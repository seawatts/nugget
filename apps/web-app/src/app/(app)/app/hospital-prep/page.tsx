'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  Baby,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  FileText,
  Heart,
  MapPin,
  Phone,
  Pill,
  User,
} from 'lucide-react';
import { useState } from 'react';

export default function HospitalPrepPage() {
  const [selectedTab, setSelectedTab] = useState<
    'bags' | 'birth-plan' | 'when-to-go'
  >('bags');
  const [expandedBag, setExpandedBag] = useState<string | null>('mom');

  const hospitalBags = {
    baby: {
      color: 'primary',
      icon: Baby,
      items: [
        { category: 'Safety', checked: true, name: 'Car Seat (installed)' },
        {
          category: 'Clothing',
          checked: false,
          name: 'Going-Home Outfit (2 sizes)',
        },
        { category: 'Comfort', checked: false, name: 'Swaddle Blankets (2-3)' },
        { category: 'Essentials', checked: false, name: 'Newborn Diapers' },
        { category: 'Essentials', checked: false, name: 'Baby Wipes' },
        { category: 'Comfort', checked: false, name: 'Pacifiers (if using)' },
        { category: 'Clothing', checked: false, name: 'Mittens & Hat' },
        { category: 'Feeding', checked: false, name: 'Burp Cloths' },
      ],
    },
    mom: {
      color: 'accent',
      icon: User,
      items: [
        { category: 'Documents', checked: true, name: 'ID & Insurance Cards' },
        { category: 'Documents', checked: true, name: 'Birth Plan (2 copies)' },
        { category: 'Clothing', checked: false, name: 'Comfortable Robe' },
        { category: 'Clothing', checked: false, name: 'Nursing Bras (2-3)' },
        {
          category: 'Clothing',
          checked: false,
          name: 'Comfortable Going-Home Outfit',
        },
        { category: 'Clothing', checked: true, name: 'Slippers & Socks' },
        {
          category: 'Personal Care',
          checked: false,
          name: 'Toiletries & Hair Ties',
        },
        { category: 'Electronics', checked: true, name: 'Phone Charger' },
        { category: 'Food', checked: false, name: 'Snacks & Water Bottle' },
        {
          category: 'Feeding',
          checked: false,
          name: 'Breast Pump (if planning to use)',
        },
        { category: 'Personal Care', checked: false, name: 'Nipple Cream' },
        { category: 'Personal Care', checked: false, name: 'Maternity Pads' },
      ],
    },
    partner: {
      color: 'secondary',
      icon: Briefcase,
      items: [
        { category: 'Clothing', checked: false, name: 'Change of Clothes' },
        { category: 'Personal Care', checked: false, name: 'Toiletries' },
        { category: 'Food', checked: true, name: 'Snacks & Drinks' },
        { category: 'Electronics', checked: true, name: 'Phone Charger' },
        {
          category: 'Electronics',
          checked: false,
          name: 'Camera/Video Camera',
        },
        {
          category: 'Comfort',
          checked: false,
          name: 'Entertainment (book, tablet)',
        },
        { category: 'Comfort', checked: false, name: 'Pillow' },
        {
          category: 'Essentials',
          checked: false,
          name: 'Cash for Parking/Vending',
        },
      ],
    },
  };

  const birthPlanOptions = {
    delivery: [
      { option: 'Delayed cord clamping', selected: true },
      { option: 'Skin-to-skin immediately', selected: true },
      { option: 'Partner cuts cord', selected: true },
      { option: 'Collect cord blood', selected: false },
    ],
    labor: [
      { option: 'Freedom to move around', selected: true },
      { option: 'Dim lighting', selected: true },
      { option: 'Music', selected: false },
      { option: 'Limited visitors', selected: true },
    ],
    pain: [
      { option: 'Epidural', selected: false },
      { option: 'Natural pain management', selected: true },
      { option: 'Nitrous oxide', selected: false },
      { option: 'Water therapy', selected: true },
    ],
  };

  const whenToGoSigns = [
    {
      description:
        '5 minutes apart, lasting 1 minute each, for at least 1 hour',
      title: 'Contractions',
      urgent: false,
    },
    {
      description:
        'Clear or slightly pink fluid - call your provider immediately',
      title: 'Water Breaks',
      urgent: true,
    },
    {
      description:
        'More than period-like bleeding - go to hospital immediately',
      title: 'Heavy Bleeding',
      urgent: true,
    },
    {
      description: 'Less than 10 movements in 2 hours - call your provider',
      title: 'Decreased Baby Movement',
      urgent: true,
    },
    {
      description: 'With vision changes or severe swelling - call immediately',
      title: 'Severe Headache',
      urgent: true,
    },
  ];

  const getBagProgress = (bagType: keyof typeof hospitalBags) => {
    const items = hospitalBags[bagType].items;
    const checked = items.filter((item) => item.checked).length;
    return Math.round((checked / items.length) * 100);
  };

  return (
    <main className="px-4 pt-4 space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance mb-2">
              Hospital Preparation
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get ready for the big day with our comprehensive checklist and
              birth plan builder
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'bags'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('bags')}
          type="button"
        >
          Hospital Bags
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'birth-plan'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('birth-plan')}
          type="button"
        >
          Birth Plan
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTab === 'when-to-go'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setSelectedTab('when-to-go')}
          type="button"
        >
          When to Go
        </button>
      </div>

      {/* Hospital Bags Tab */}
      {selectedTab === 'bags' && (
        <div className="space-y-4">
          {(Object.keys(hospitalBags) as Array<keyof typeof hospitalBags>).map(
            (bagType) => {
              const bag = hospitalBags[bagType];
              const Icon = bag.icon;
              const progress = getBagProgress(bagType);
              const isExpanded = expandedBag === bagType;

              return (
                <Card className="overflow-hidden" key={bagType}>
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedBag(isExpanded ? null : bagType)}
                    type="button"
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-${bag.color}/10 flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-6 w-6 text-${bag.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">
                          {bagType}'s Bag
                        </h3>
                        <Badge variant="secondary">{progress}%</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`bg-${bag.color} h-2 rounded-full transition-all`}
                          style={{ width: `${progress}%` }}
                        />
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
                      {bag.items.map((item) => (
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          key={`${bagType}-${item.name}`}
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
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.category}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            },
          )}
        </div>
      )}

      {/* Birth Plan Tab */}
      {selectedTab === 'birth-plan' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Birth Plan</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Customize your preferences for labor and delivery. Remember,
              flexibility is key!
            </p>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Labor Preferences</h4>
                <div className="space-y-2">
                  {birthPlanOptions.labor.map((item) => (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      key={`labor-${item.option}`}
                    >
                      {item.selected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">{item.option}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Pain Management</h4>
                <div className="space-y-2">
                  {birthPlanOptions.pain.map((item) => (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      key={`pain-${item.option}`}
                    >
                      {item.selected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">{item.option}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">
                  Delivery Preferences
                </h4>
                <div className="space-y-2">
                  {birthPlanOptions.delivery.map((item) => (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      key={`delivery-${item.option}`}
                    >
                      {item.selected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">{item.option}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button className="w-full mt-6">Download Birth Plan PDF</Button>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Remember</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Birth plans are guidelines, not guarantees. Stay flexible and
                  trust your medical team to make the best decisions for you and
                  your baby.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* When to Go Tab */}
      {selectedTab === 'when-to-go' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Signs It's Time to Go</h3>
            <div className="space-y-3">
              {whenToGoSigns.map((sign) => (
                <div
                  className={`p-4 rounded-lg ${
                    sign.urgent
                      ? 'bg-destructive/10 border border-destructive/20'
                      : 'bg-muted/50'
                  }`}
                  key={sign.title}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        sign.urgent ? 'bg-destructive/20' : 'bg-primary/20'
                      }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${sign.urgent ? 'text-destructive' : 'text-primary'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{sign.title}</p>
                        {sign.urgent && (
                          <Badge className="text-xs" variant="destructive">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sign.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Hospital Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Women's Hospital</p>
                  <p className="text-xs text-muted-foreground">
                    123 Medical Center Dr
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Labor & Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    (555) 123-4567
                  </p>
                </div>
              </div>
            </div>
            <Button className="w-full mt-4 bg-transparent" variant="outline">
              Edit Hospital Info
            </Button>
          </Card>

          <Card className="p-4 bg-accent/5 border-accent/20">
            <div className="flex gap-3">
              <Pill className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Pro Tip</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Call your hospital ahead of time to understand their admission
                  process and parking situation. This will reduce stress when
                  the time comes!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
