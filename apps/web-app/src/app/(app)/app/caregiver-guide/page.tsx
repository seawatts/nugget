'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Textarea } from '@nugget/ui/textarea';
import {
  AlertCircle,
  Clock,
  FileText,
  Heart,
  Home,
  Loader2,
  Moon,
  Phone,
  Share2,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

export default function CaregiverGuidePage() {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGuide, setGeneratedGuide] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Important info
    allergies: 'None',
    babyAge: '6 months',
    babyName: 'Riley',
    bedtime: '7:00 PM',
    careDate: '',
    caregiverName: '',
    emergencyContact: '(555) 987-6543',
    // Activities
    favoriteActivities: 'Tummy time, reading books, playing with soft toys',
    feedingAmount: '5-6 oz per feeding',
    feedingNotes: 'Warm bottle in warm water, test temperature on wrist',
    // Feeding
    feedingSchedule: 'Every 3-4 hours',
    feedingType: 'Breast milk bottles',
    // House rules
    houseRules:
      'Shoes off at door, pets are friendly, help yourself to snacks in kitchen',
    medications: 'None',
    napTimes: '9:30 AM, 1:00 PM, 4:30 PM',
    // Contacts
    parentPhone: '(555) 123-4567',
    pediatrician: 'Dr. Smith - (555) 555-1234',
    sleepLocation: 'Crib in nursery',
    sleepNotes: 'Likes to be rocked for 5 minutes before putting down',
    // Sleep
    sleepRoutine: 'Dim lights, white noise, sleep sack, pacifier',
    soothingTechniques: 'Gentle bouncing, singing, walking around',
    specialNeeds: '',
    // Schedule
    wakeTime: '7:00 AM',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateGuide = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Create comprehensive, friendly caregiver instructions for a babysitter/nanny. Use the following information:

Baby: ${formData.babyName}, ${formData.babyAge}
Caregiver: ${formData.caregiverName}
Date: ${formData.careDate}

SCHEDULE:
- Wake time: ${formData.wakeTime}
- Nap times: ${formData.napTimes}
- Bedtime: ${formData.bedtime}

FEEDING:
- Schedule: ${formData.feedingSchedule}
- Type: ${formData.feedingType}
- Amount: ${formData.feedingAmount}
- Notes: ${formData.feedingNotes}

SLEEP:
- Routine: ${formData.sleepRoutine}
- Location: ${formData.sleepLocation}
- Notes: ${formData.sleepNotes}

ACTIVITIES & SOOTHING:
- Favorite activities: ${formData.favoriteActivities}
- Soothing techniques: ${formData.soothingTechniques}

MEDICAL:
- Allergies: ${formData.allergies}
- Medications: ${formData.medications}
- Special needs: ${formData.specialNeeds}

CONTACTS:
- Parents: ${formData.parentPhone}
- Emergency contact: ${formData.emergencyContact}
- Pediatrician: ${formData.pediatrician}

HOUSE RULES:
${formData.houseRules}

Format this as a clear, organized guide with sections, bullet points, and a warm, helpful tone. Include a welcome message and closing notes. Make it easy to scan and reference quickly.`;

      const response = await fetch('/api/generate-guide', {
        body: JSON.stringify({ prompt }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();
      setGeneratedGuide(data.text);
      setActiveTab('preview');
    } catch (error) {
      console.error('Error generating guide:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    const viewUrl = `${window.location.origin}/caregiver-guide/view`;
    if (navigator.share) {
      navigator
        .share({
          text: `Instructions for caring for ${formData.babyName}`,
          title: 'Caregiver Instructions',
          url: viewUrl,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(viewUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleViewCaregiver = () => {
    window.open('/caregiver-guide/view', '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Caregiver Instructions</h1>
          <p className="text-muted-foreground text-balance">
            Create AI-generated instructions to share with babysitters and
            caregivers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            className="flex-1"
            onClick={() => setActiveTab('form')}
            variant={activeTab === 'form' ? 'default' : 'outline'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Fill Information
          </Button>
          <Button
            className="flex-1"
            disabled={!generatedGuide}
            onClick={() => setActiveTab('preview')}
            variant={activeTab === 'preview' ? 'default' : 'outline'}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Preview Guide
          </Button>
        </div>

        {/* Form Tab */}
        {activeTab === 'form' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Basic Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="babyName">Baby's Name</Label>
                  <Input
                    id="babyName"
                    onChange={(e) =>
                      handleInputChange('babyName', e.target.value)
                    }
                    placeholder="Riley"
                    value={formData.babyName}
                  />
                </div>
                <div>
                  <Label htmlFor="babyAge">Baby's Age</Label>
                  <Input
                    id="babyAge"
                    onChange={(e) =>
                      handleInputChange('babyAge', e.target.value)
                    }
                    placeholder="6 months"
                    value={formData.babyAge}
                  />
                </div>
                <div>
                  <Label htmlFor="caregiverName">Caregiver's Name</Label>
                  <Input
                    id="caregiverName"
                    onChange={(e) =>
                      handleInputChange('caregiverName', e.target.value)
                    }
                    placeholder="Sarah"
                    value={formData.caregiverName}
                  />
                </div>
                <div>
                  <Label htmlFor="careDate">Date of Care</Label>
                  <Input
                    id="careDate"
                    onChange={(e) =>
                      handleInputChange('careDate', e.target.value)
                    }
                    type="date"
                    value={formData.careDate}
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Daily Schedule
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wakeTime">Wake Time</Label>
                  <Input
                    id="wakeTime"
                    onChange={(e) =>
                      handleInputChange('wakeTime', e.target.value)
                    }
                    placeholder="7:00 AM"
                    value={formData.wakeTime}
                  />
                </div>
                <div>
                  <Label htmlFor="napTimes">Nap Times (comma separated)</Label>
                  <Input
                    id="napTimes"
                    onChange={(e) =>
                      handleInputChange('napTimes', e.target.value)
                    }
                    placeholder="9:30 AM, 1:00 PM, 4:30 PM"
                    value={formData.napTimes}
                  />
                </div>
                <div>
                  <Label htmlFor="bedtime">Bedtime</Label>
                  <Input
                    id="bedtime"
                    onChange={(e) =>
                      handleInputChange('bedtime', e.target.value)
                    }
                    placeholder="7:00 PM"
                    value={formData.bedtime}
                  />
                </div>
              </div>
            </div>

            {/* Feeding */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Utensils className="h-5 w-5 text-feeding" />
                Feeding Instructions
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedingSchedule">Feeding Schedule</Label>
                  <Input
                    id="feedingSchedule"
                    onChange={(e) =>
                      handleInputChange('feedingSchedule', e.target.value)
                    }
                    placeholder="Every 3-4 hours"
                    value={formData.feedingSchedule}
                  />
                </div>
                <div>
                  <Label htmlFor="feedingType">Type of Food/Milk</Label>
                  <Input
                    id="feedingType"
                    onChange={(e) =>
                      handleInputChange('feedingType', e.target.value)
                    }
                    placeholder="Breast milk bottles"
                    value={formData.feedingType}
                  />
                </div>
                <div>
                  <Label htmlFor="feedingAmount">Amount per Feeding</Label>
                  <Input
                    id="feedingAmount"
                    onChange={(e) =>
                      handleInputChange('feedingAmount', e.target.value)
                    }
                    placeholder="5-6 oz"
                    value={formData.feedingAmount}
                  />
                </div>
                <div>
                  <Label htmlFor="feedingNotes">Feeding Notes</Label>
                  <Textarea
                    id="feedingNotes"
                    onChange={(e) =>
                      handleInputChange('feedingNotes', e.target.value)
                    }
                    placeholder="Special instructions, preferences, etc."
                    rows={3}
                    value={formData.feedingNotes}
                  />
                </div>
              </div>
            </div>

            {/* Sleep */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Moon className="h-5 w-5 text-sleep" />
                Sleep Routine
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sleepRoutine">Sleep Routine</Label>
                  <Textarea
                    id="sleepRoutine"
                    onChange={(e) =>
                      handleInputChange('sleepRoutine', e.target.value)
                    }
                    placeholder="Dim lights, white noise, sleep sack, pacifier"
                    rows={2}
                    value={formData.sleepRoutine}
                  />
                </div>
                <div>
                  <Label htmlFor="sleepLocation">Sleep Location</Label>
                  <Input
                    id="sleepLocation"
                    onChange={(e) =>
                      handleInputChange('sleepLocation', e.target.value)
                    }
                    placeholder="Crib in nursery"
                    value={formData.sleepLocation}
                  />
                </div>
                <div>
                  <Label htmlFor="sleepNotes">Sleep Notes</Label>
                  <Textarea
                    id="sleepNotes"
                    onChange={(e) =>
                      handleInputChange('sleepNotes', e.target.value)
                    }
                    placeholder="Special sleep preferences or tips"
                    rows={2}
                    value={formData.sleepNotes}
                  />
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" />
                Activities & Soothing
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="favoriteActivities">
                    Favorite Activities
                  </Label>
                  <Textarea
                    id="favoriteActivities"
                    onChange={(e) =>
                      handleInputChange('favoriteActivities', e.target.value)
                    }
                    placeholder="Tummy time, reading books, playing with toys"
                    rows={2}
                    value={formData.favoriteActivities}
                  />
                </div>
                <div>
                  <Label htmlFor="soothingTechniques">
                    Soothing Techniques
                  </Label>
                  <Textarea
                    id="soothingTechniques"
                    onChange={(e) =>
                      handleInputChange('soothingTechniques', e.target.value)
                    }
                    placeholder="What works when baby is fussy"
                    rows={2}
                    value={formData.soothingTechniques}
                  />
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Medical Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    onChange={(e) =>
                      handleInputChange('allergies', e.target.value)
                    }
                    placeholder="None"
                    value={formData.allergies}
                  />
                </div>
                <div>
                  <Label htmlFor="medications">Medications</Label>
                  <Input
                    id="medications"
                    onChange={(e) =>
                      handleInputChange('medications', e.target.value)
                    }
                    placeholder="None"
                    value={formData.medications}
                  />
                </div>
                <div>
                  <Label htmlFor="specialNeeds">
                    Special Needs or Conditions
                  </Label>
                  <Textarea
                    id="specialNeeds"
                    onChange={(e) =>
                      handleInputChange('specialNeeds', e.target.value)
                    }
                    placeholder="Any special considerations"
                    rows={2}
                    value={formData.specialNeeds}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Emergency Contacts
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parentPhone">Parent's Phone</Label>
                  <Input
                    id="parentPhone"
                    onChange={(e) =>
                      handleInputChange('parentPhone', e.target.value)
                    }
                    placeholder="(555) 123-4567"
                    type="tel"
                    value={formData.parentPhone}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    onChange={(e) =>
                      handleInputChange('emergencyContact', e.target.value)
                    }
                    placeholder="(555) 987-6543"
                    type="tel"
                    value={formData.emergencyContact}
                  />
                </div>
                <div>
                  <Label htmlFor="pediatrician">Pediatrician</Label>
                  <Input
                    id="pediatrician"
                    onChange={(e) =>
                      handleInputChange('pediatrician', e.target.value)
                    }
                    placeholder="Dr. Smith - (555) 555-1234"
                    value={formData.pediatrician}
                  />
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-secondary" />
                House Rules & Notes
              </h2>
              <div>
                <Label htmlFor="houseRules">House Rules</Label>
                <Textarea
                  id="houseRules"
                  onChange={(e) =>
                    handleInputChange('houseRules', e.target.value)
                  }
                  placeholder="Shoes off at door, help yourself to snacks, etc."
                  rows={3}
                  value={formData.houseRules}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full h-14 text-base"
              disabled={isGenerating}
              onClick={generateGuide}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Guide...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Caregiver Guide
                </>
              )}
            </Button>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleViewCaregiver}>
                <FileText className="h-4 w-4 mr-2" />
                View Caregiver Page
              </Button>
              <Button
                className="flex-1 bg-transparent"
                onClick={handleShare}
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Generated Guide */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedGuide}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              className="w-full"
              onClick={() => setActiveTab('form')}
              variant="outline"
            >
              Edit Information
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
