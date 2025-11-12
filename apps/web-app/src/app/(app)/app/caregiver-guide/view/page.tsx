'use client';

import { Button } from '@nugget/ui/button';
import {
  AlertCircle,
  Clock,
  Heart,
  Home,
  Moon,
  Phone,
  Printer,
  Utensils,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type CaregiverGuide = {
  allergies: string;
  babyAge: string;
  babyName: string;
  bedtime: string;
  careDate: string;
  caregiverName: string;
  emergencyContact: string;
  favoriteActivities: string;
  feedingAmount: string;
  feedingNotes: string;
  feedingSchedule: string;
  feedingType: string;
  houseRules: string;
  medications: string;
  napTimes: string;
  parentPhone: string;
  pediatrician: string;
  sleepLocation: string;
  sleepNotes: string;
  sleepRoutine: string;
  soothingTechniques: string;
  specialNeeds: string;
  wakeTime: string;
};

export default function CaregiverViewPage() {
  const [guideData, setGuideData] = useState<CaregiverGuide | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from localStorage, URL params, or a database
    // For now, we'll use mock data
    const mockData: CaregiverGuide = {
      allergies: 'None',
      babyAge: '6 months',
      babyName: 'Riley',
      bedtime: '7:00 PM',
      careDate: '2025-01-15',
      caregiverName: 'Sarah',
      emergencyContact: '(555) 987-6543',
      favoriteActivities: 'Tummy time, reading books, playing with soft toys',
      feedingAmount: '5-6 oz per feeding',
      feedingNotes: 'Warm bottle in warm water, test temperature on wrist',
      feedingSchedule: 'Every 3-4 hours',
      feedingType: 'Breast milk bottles',
      houseRules:
        'Shoes off at door, pets are friendly, help yourself to snacks in kitchen',
      medications: 'None',
      napTimes: '9:30 AM, 1:00 PM, 4:30 PM',
      parentPhone: '(555) 123-4567',
      pediatrician: 'Dr. Smith - (555) 555-1234',
      sleepLocation: 'Crib in nursery',
      sleepNotes: 'Likes to be rocked for 5 minutes before putting down',
      sleepRoutine: 'Dim lights, white noise, sleep sack, pacifier',
      soothingTechniques: 'Gentle bouncing, singing, walking around',
      specialNeeds: '',
      wakeTime: '7:00 AM',
    };
    setGuideData(mockData);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!guideData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          Loading caregiver instructions...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header - hidden when printing */}
      <div className="bg-card border-b border-border p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Caregiver Instructions</h1>
            <p className="text-sm text-muted-foreground">
              For {guideData.caregiverName} -{' '}
              {new Date(guideData.careDate).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={handlePrint} size="sm" variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Emergency Contacts - Always at top */}
        <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Emergency Contacts
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
              <div>
                <p className="text-sm text-muted-foreground">Parents</p>
                <p className="font-semibold">{guideData.parentPhone}</p>
              </div>
              <Button asChild size="sm" variant="destructive">
                <a href={`tel:${guideData.parentPhone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Emergency Contact
                </p>
                <p className="font-semibold">{guideData.emergencyContact}</p>
              </div>
              <Button asChild size="sm" variant="destructive">
                <a href={`tel:${guideData.emergencyContact}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
              <div>
                <p className="text-sm text-muted-foreground">Pediatrician</p>
                <p className="font-semibold">{guideData.pediatrician}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${guideData.pediatrician.split('-')[1]?.trim()}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
            </div>
            <div className="bg-destructive/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-semibold">Emergency: 911</p>
              <p className="text-xs text-muted-foreground mt-1">
                Call 911 immediately for any life-threatening emergency
              </p>
            </div>
          </div>
        </div>

        {/* Baby Info */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">About {guideData.babyName}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-semibold">{guideData.babyAge}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allergies</p>
              <p className="font-semibold">{guideData.allergies || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medications</p>
              <p className="font-semibold">{guideData.medications || 'None'}</p>
            </div>
            {guideData.specialNeeds && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Special Needs</p>
                <p className="font-semibold">{guideData.specialNeeds}</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Daily Schedule
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-lg p-2 mt-1">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Wake Time</p>
                <p className="text-muted-foreground">{guideData.wakeTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-sleep/10 rounded-lg p-2 mt-1">
                <Moon className="h-5 w-5 text-sleep" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Nap Times</p>
                <p className="text-muted-foreground">{guideData.napTimes}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-sleep/10 rounded-lg p-2 mt-1">
                <Moon className="h-5 w-5 text-sleep" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Bedtime</p>
                <p className="text-muted-foreground">{guideData.bedtime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feeding Instructions */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-feeding" />
            Feeding Instructions
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Schedule</p>
              <p className="font-semibold">{guideData.feedingSchedule}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold">{guideData.feedingType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-semibold">{guideData.feedingAmount}</p>
            </div>
            {guideData.feedingNotes && (
              <div className="bg-feeding/10 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold mb-2">Important Notes:</p>
                <p className="text-sm text-muted-foreground">
                  {guideData.feedingNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sleep Routine */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Moon className="h-6 w-6 text-sleep" />
            Sleep Routine
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Sleep Location</p>
              <p className="font-semibold">{guideData.sleepLocation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Routine</p>
              <p className="font-semibold">{guideData.sleepRoutine}</p>
            </div>
            {guideData.sleepNotes && (
              <div className="bg-sleep/10 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold mb-2">Sleep Tips:</p>
                <p className="text-sm text-muted-foreground">
                  {guideData.sleepNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activities & Soothing */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-6 w-6 text-accent" />
            Activities & Soothing
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Favorite Activities
              </p>
              <p className="font-semibold">{guideData.favoriteActivities}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Soothing Techniques
              </p>
              <p className="font-semibold">{guideData.soothingTechniques}</p>
            </div>
          </div>
        </div>

        {/* House Rules */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Home className="h-6 w-6 text-secondary" />
            House Rules & Notes
          </h2>
          <p className="text-muted-foreground">{guideData.houseRules}</p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-6 print:hidden">
          <p>Thank you for taking care of {guideData.babyName}!</p>
          <p className="mt-2">Questions? Call the parents anytime.</p>
        </div>
      </main>

      {/* Print Styles */}
      <style global jsx>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
