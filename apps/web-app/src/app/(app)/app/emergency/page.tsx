'use client';

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  Baby,
  ChevronRight,
  Clock,
  Droplet,
  Heart,
  MessageCircle,
  Phone,
  Pill,
  Stethoscope,
  Thermometer,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type JourneyStage = 'ttc' | 'pregnant' | 'baby' | null;
type EmergencyType =
  | 'choking'
  | 'fever'
  | 'injury'
  | 'breathing'
  | 'allergic'
  | 'poisoning'
  | 'bleeding'
  | 'contractions'
  | 'preeclampsia'
  | 'reduced-movement'
  | 'severe-pain'
  | null;

export default function EmergencyPage() {
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyType>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>(null);

  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      setJourneyStage(data.stage);
    }
  }, []);

  if (selectedEmergency) {
    return (
      <EmergencyGuide
        onBack={() => setSelectedEmergency(null)}
        type={selectedEmergency}
      />
    );
  }

  const getPageContent = () => {
    if (journeyStage === 'pregnant') {
      return {
        description: 'Select the situation that best describes your emergency',
        title: 'Pregnancy Emergency Help',
      };
    }
    if (journeyStage === 'baby') {
      return {
        description: 'Select the situation that best describes your emergency',
        title: 'Baby Emergency Help',
      };
    }
    return {
      description: 'Quick access to urgent care guidance',
      title: 'Emergency Help',
    };
  };

  const content = getPageContent();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Critical Alert Header */}
      <div className="bg-gradient-to-br from-destructive/30 to-destructive/10 px-6 py-8 border-b-4 border-destructive">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance">{content.title}</h1>
            <p className="text-sm text-muted-foreground">
              Quick access to urgent care guidance
            </p>
          </div>
        </div>

        {/* Emergency Call Button */}
        <a href="tel:911">
          <Button className="w-full bg-destructive hover:bg-destructive/90 text-white h-14 text-lg font-bold">
            <Phone className="h-5 w-5 mr-2" />
            Call 911 - Emergency Services
          </Button>
        </a>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="mx-6 mt-6 p-4 bg-card rounded-2xl border-2 border-primary relative">
          <button
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowQuickActions(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/chat">
              <Button
                className="w-full justify-start h-auto py-3 bg-transparent"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4 mr-2 text-primary" />
                <span className="text-xs">Ask AI Assistant</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                className="w-full justify-start h-auto py-3 bg-transparent"
                variant="outline"
              >
                <Phone className="h-4 w-4 mr-2 text-primary" />
                <span className="text-xs">View Contacts</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Question */}
      <div className="px-6 py-6">
        <h2 className="text-xl font-bold mb-2">What's happening?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {content.description}
        </p>

        <div className="space-y-3">
          {journeyStage === 'pregnant' ? (
            <>
              <EmergencyCard
                description="Heavy bleeding or spotting with cramping"
                icon={Droplet}
                onClick={() => setSelectedEmergency('bleeding')}
                severity="critical"
                title="Vaginal Bleeding"
              />

              <EmergencyCard
                description="Regular contractions before 37 weeks or very painful"
                icon={Activity}
                onClick={() => setSelectedEmergency('contractions')}
                severity="critical"
                title="Severe Contractions"
              />

              <EmergencyCard
                description="Severe headache, vision changes, upper abdominal pain"
                icon={AlertTriangle}
                onClick={() => setSelectedEmergency('preeclampsia')}
                severity="high"
                title="Preeclampsia Symptoms"
              />

              <EmergencyCard
                description="Baby moving less than usual or not at all"
                icon={Baby}
                onClick={() => setSelectedEmergency('reduced-movement')}
                severity="high"
                title="Reduced Baby Movement"
              />

              <EmergencyCard
                description="Intense abdominal or pelvic pain"
                icon={Heart}
                onClick={() => setSelectedEmergency('severe-pain')}
                severity="high"
                title="Severe Pain"
              />

              <EmergencyCard
                description="Temperature over 100.4°F (38°C)"
                icon={Thermometer}
                onClick={() => setSelectedEmergency('fever')}
                severity="high"
                title="High Fever"
              />
            </>
          ) : journeyStage === 'baby' ? (
            <>
              <EmergencyCard
                description="Baby is choking or can't breathe properly"
                icon={Droplet}
                onClick={() => setSelectedEmergency('choking')}
                severity="critical"
                title="Choking"
              />

              <EmergencyCard
                description="Temperature over 100.4°F (38°C)"
                icon={Thermometer}
                onClick={() => setSelectedEmergency('fever')}
                severity="high"
                title="High Fever"
              />

              <EmergencyCard
                description="Falls, cuts, or visible injuries"
                icon={Heart}
                onClick={() => setSelectedEmergency('injury')}
                severity="high"
                title="Injury or Bleeding"
              />

              <EmergencyCard
                description="Difficulty breathing, wheezing, or rapid breathing"
                icon={Baby}
                onClick={() => setSelectedEmergency('breathing')}
                severity="critical"
                title="Breathing Problems"
              />

              <EmergencyCard
                description="Rash, swelling, or reaction to food/medicine"
                icon={AlertTriangle}
                onClick={() => setSelectedEmergency('allergic')}
                severity="high"
                title="Allergic Reaction"
              />

              <EmergencyCard
                description="Swallowed something harmful"
                icon={Pill}
                onClick={() => setSelectedEmergency('poisoning')}
                severity="critical"
                title="Poisoning or Ingestion"
              />
            </>
          ) : (
            <div className="p-6 bg-card rounded-3xl border-2 border-border text-center">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up your journey stage to see relevant emergency information
              </p>
              <Link href="/settings">
                <Button className="w-full">Go to Settings</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-muted/50 rounded-2xl border border-border">
          <h3 className="font-semibold text-sm mb-3">Not an emergency?</h3>
          <div className="space-y-2">
            <Link href="/chat">
              <Button
                className="w-full justify-between h-auto py-3"
                variant="ghost"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">Chat with AI for guidance</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            {journeyStage === 'pregnant' && (
              <Link href="/postpartum">
                <Button
                  className="w-full justify-between h-auto py-3"
                  variant="ghost"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="text-sm">View pregnancy red flags</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/learning">
              <Button
                className="w-full justify-between h-auto py-3"
                variant="ghost"
              >
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-primary" />
                  <span className="text-sm">Browse learning resources</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyCard({
  icon: Icon,
  title,
  description,
  severity,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  onClick: () => void;
}) {
  const severityColors = {
    critical: 'border-destructive bg-destructive/5',
    high: 'border-secondary bg-secondary/5',
    medium: 'border-primary bg-primary/5',
  };

  return (
    <button
      className={cn(
        'w-full p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-left',
        severityColors[severity],
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
            severity === 'critical' && 'bg-destructive',
            severity === 'high' && 'bg-secondary',
            severity === 'medium' && 'bg-primary',
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

function EmergencyGuide({
  type,
  onBack,
}: {
  type: EmergencyType;
  onBack: () => void;
}) {
  const guides = {
    allergic: {
      additionalInfo:
        'Mild rashes around mouth from new foods are common. True allergic reactions involve multiple symptoms and progress quickly.',
      color: 'secondary',
      icon: AlertTriangle,
      immediateSteps: [
        'If you have an EpiPen prescribed, use it immediately for severe reactions',
        'Call 911 if baby has difficulty breathing or swelling of face/throat',
        'Remove the allergen if known (stop feeding, remove from environment)',
        'For mild reactions: Give antihistamine if prescribed by doctor',
        'Take photos of rash or reaction for doctor reference',
      ],
      title: 'Allergic Reaction',
      whenToCall: [
        'Difficulty breathing or wheezing',
        'Swelling of lips, tongue, or throat',
        'Widespread rash or hives',
        'Vomiting or diarrhea with other symptoms',
        'Baby seems weak, dizzy, or confused',
        'Any reaction after bee sting or medication',
      ],
    },
    bleeding: {
      additionalInfo:
        'Light spotting can be normal in early pregnancy, but any bleeding should be evaluated by your doctor. Heavy bleeding or bleeding with pain requires immediate medical attention.',
      color: 'destructive',
      icon: Droplet,
      immediateSteps: [
        'Call your OB/GYN or go to emergency room immediately',
        'Lie down and rest - avoid physical activity',
        'Note the amount and color of bleeding (light spotting vs heavy flow)',
        'Check for accompanying symptoms (cramping, dizziness, fever)',
        'Do not use tampons - use pads only to monitor bleeding',
      ],
      title: 'Vaginal Bleeding During Pregnancy',
      whenToCall: [
        'Heavy bleeding (soaking through a pad in an hour)',
        'Bleeding with severe cramping or pain',
        'Passing tissue or clots',
        'Bleeding in second or third trimester',
        'Bleeding with dizziness, fainting, or shoulder pain',
      ],
    },
    breathing: {
      additionalInfo:
        'Mild congestion is common in babies. Use a cool mist humidifier and saline drops. Seek immediate help for severe symptoms.',
      color: 'destructive',
      icon: Baby,
      immediateSteps: [
        "Call 911 immediately if baby's lips or face turn blue",
        'Keep baby upright in your arms or sitting position',
        'Stay calm - your anxiety can make baby more distressed',
        'Remove any tight clothing around neck and chest',
        'If you have a prescribed inhaler or nebulizer, use as directed',
      ],
      title: 'Breathing Problems',
      whenToCall: [
        'Blue or gray lips, tongue, or face',
        'Severe difficulty breathing or gasping',
        'Ribs pulling in with each breath (retractions)',
        'Breathing faster than 60 breaths per minute',
        'Grunting sounds with breathing',
        'Nostrils flaring with each breath',
      ],
    },
    choking: {
      additionalInfo:
        'If baby can cough forcefully, let them continue coughing. Do not interfere. Stay with them and be ready to help if needed.',
      color: 'destructive',
      icon: Droplet,
      immediateSteps: [
        'Call 911 immediately if baby cannot cry, cough, or breathe',
        'For infants under 1 year: Give 5 back blows between shoulder blades',
        'Then give 5 chest thrusts with 2 fingers on center of chest',
        'Repeat back blows and chest thrusts until object comes out',
        'Never do abdominal thrusts (Heimlich) on infants under 1 year',
      ],
      title: 'Choking Emergency',
      whenToCall: [
        'Baby cannot breathe, cry, or cough',
        "Baby's lips or face turn blue",
        'Baby becomes unconscious',
        "Object doesn't come out after several attempts",
      ],
    },
    contractions: {
      additionalInfo:
        'True labor contractions get longer, stronger, and closer together. Braxton Hicks contractions are irregular and usually stop with rest or hydration.',
      color: 'destructive',
      icon: Activity,
      immediateSteps: [
        'Time your contractions (start of one to start of next)',
        'Call your OB/GYN or hospital labor & delivery immediately',
        'If before 37 weeks, this could be preterm labor - seek immediate care',
        'Stay hydrated and try to rest on your left side',
        "Have your hospital bag ready if you're near your due date",
      ],
      title: 'Severe Contractions',
      whenToCall: [
        'Contractions every 5 minutes for an hour (if full term)',
        'Regular contractions before 37 weeks',
        'Contractions with vaginal bleeding',
        'Water breaks (clear or greenish fluid)',
        "Severe pain that doesn't ease between contractions",
      ],
    },
    fever: {
      additionalInfo:
        "Fever is the body's way of fighting infection. Focus on keeping baby comfortable and hydrated. Never give aspirin to children.",
      color: 'secondary',
      icon: Thermometer,
      immediateSteps: [
        "Take baby's temperature rectally for most accurate reading",
        'Remove excess clothing and blankets',
        'Give appropriate dose of infant acetaminophen or ibuprofen (if over 6 months)',
        'Offer plenty of fluids if baby is nursing or taking bottles',
        'Monitor temperature every 2-3 hours',
      ],
      title: 'High Fever',
      whenToCall: [
        'Baby under 3 months with fever over 100.4°F (38°C)',
        'Fever over 104°F (40°C) at any age',
        'Fever lasts more than 24 hours in baby under 2 years',
        'Baby is lethargic, not eating, or seems very ill',
        'Fever accompanied by rash, difficulty breathing, or seizure',
      ],
    },
    injury: {
      additionalInfo:
        'Most minor bumps and bruises are normal. Watch for changes in behavior, eating, or sleeping patterns after any injury.',
      color: 'destructive',
      icon: Heart,
      immediateSteps: [
        'For bleeding: Apply firm, direct pressure with clean cloth for 5-10 minutes',
        'Elevate injured area above heart level if possible',
        'For head injury: Keep baby still and watch for signs of concussion',
        'Apply ice wrapped in cloth to reduce swelling (never directly on skin)',
        'Clean minor cuts with soap and water, apply antibiotic ointment',
      ],
      title: 'Injury or Bleeding',
      whenToCall: [
        "Bleeding doesn't stop after 10 minutes of pressure",
        'Deep cut that may need stitches',
        'Head injury with vomiting, confusion, or loss of consciousness',
        'Injury from significant fall (more than 3 feet)',
        "Broken bone suspected (swelling, deformity, won't move limb)",
      ],
    },
    poisoning: {
      additionalInfo:
        'Keep Poison Control number saved: 1-800-222-1222. They can tell you if substance is dangerous and what to do. Time is critical.',
      color: 'destructive',
      icon: Pill,
      immediateSteps: [
        'Call Poison Control immediately: 1-800-222-1222',
        'Have the container/substance with you when you call',
        'Do NOT make baby vomit unless told to by poison control',
        'If baby is unconscious or having seizures, call 911 first',
        "Remove any remaining substance from baby's mouth with your finger",
      ],
      title: 'Poisoning or Ingestion',
      whenToCall: [
        'Baby swallowed any medication not prescribed for them',
        'Ingested cleaning products, chemicals, or plants',
        'Ate something and now seems ill or acting strange',
        "You're unsure if substance is harmful",
        'Baby is having difficulty breathing or seizures',
      ],
    },
    preeclampsia: {
      additionalInfo:
        'Preeclampsia is a serious pregnancy complication involving high blood pressure. It typically occurs after 20 weeks and requires immediate medical attention to protect both mother and baby.',
      color: 'destructive',
      icon: AlertTriangle,
      immediateSteps: [
        'Call your OB/GYN immediately or go to emergency room',
        'Check your blood pressure if you have a monitor at home',
        'Lie down on your left side and rest',
        "Note all symptoms you're experiencing",
        'Do not take any medication without doctor approval',
      ],
      title: 'Preeclampsia Warning Signs',
      whenToCall: [
        "Severe headache that won't go away",
        'Vision changes (blurriness, seeing spots, light sensitivity)',
        'Upper abdominal pain (especially under right ribs)',
        'Sudden swelling of face, hands, or feet',
        'Nausea or vomiting in second half of pregnancy',
        'Difficulty breathing or shortness of breath',
      ],
    },
    'reduced-movement': {
      additionalInfo:
        'After 28 weeks, you should feel your baby move regularly. Every baby has their own pattern. Trust your instincts - if something feels wrong, call your doctor immediately.',
      color: 'destructive',
      icon: Baby,
      immediateSteps: [
        'Drink cold water or juice and lie on your left side',
        "Focus on counting baby's movements for 2 hours",
        'Try gentle belly massage or playing music',
        "If you don't feel 10 movements in 2 hours, call your doctor immediately",
        'Do not wait until the next day - call right away if concerned',
      ],
      title: 'Reduced Baby Movement',
      whenToCall: [
        "Significant decrease in baby's usual movement pattern",
        'No movement felt for several hours (after 28 weeks)',
        'Less than 10 movements in 2 hours (after 28 weeks)',
        'Sudden change in movement pattern',
        "Any concerns about baby's wellbeing",
      ],
    },
    'severe-pain': {
      additionalInfo:
        'Severe pain during pregnancy can indicate serious complications like ectopic pregnancy, placental abruption, or other issues requiring immediate medical attention.',
      color: 'destructive',
      icon: Heart,
      immediateSteps: [
        'Call your OB/GYN immediately or go to emergency room',
        'Note the location, intensity, and type of pain',
        'Check for other symptoms (bleeding, fever, vomiting)',
        'Lie down and try to rest while waiting for medical help',
        'Do not take pain medication without doctor approval',
      ],
      title: 'Severe Abdominal or Pelvic Pain',
      whenToCall: [
        'Severe, persistent abdominal pain',
        'Pain with vaginal bleeding',
        'Pain with fever or chills',
        'Sudden, sharp pain (especially one-sided)',
        'Pain with dizziness or fainting',
        'Pain that prevents you from walking or talking',
      ],
    },
  };

  const guide = type ? guides[type] : null;
  if (!guide) {
    return null;
  }
  const Icon = guide.icon;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div
        className={cn(
          'px-6 py-8 border-b-4',
          `bg-${guide.color}/10 border-${guide.color}`,
        )}
      >
        <Button className="mb-4 -ml-2" onClick={onBack} variant="ghost">
          <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
          Back to Emergency Menu
        </Button>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center',
              `bg-${guide.color}`,
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-balance">{guide.title}</h1>
        </div>
      </div>

      {/* Emergency Call Button */}
      <div className="px-6 pt-6">
        <a href="tel:911">
          <Button className="w-full bg-destructive hover:bg-destructive/90 text-white h-14 text-lg font-bold mb-4">
            <Phone className="h-5 w-5 mr-2" />
            Call 911 Now
          </Button>
        </a>

        <a href="tel:18002221222">
          <Button className="w-full h-12 mb-6 bg-transparent" variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Call Poison Control: 1-800-222-1222
          </Button>
        </a>
      </div>

      {/* Immediate Steps */}
      <div className="px-6 pb-6 space-y-6">
        <div className="p-6 bg-card rounded-3xl border-2 border-border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Immediate Steps
          </h2>
          <ol className="space-y-3">
            {guide.immediateSteps.map((step, index) => (
              <li className="flex gap-3" key={`${guide.title}-step-${index}`}>
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-sm pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* When to Call 911 */}
        <div className="p-6 bg-destructive/5 rounded-3xl border-2 border-destructive">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Call 911 If:
          </h2>
          <ul className="space-y-2">
            {guide.whenToCall.map((item, index) => (
              <li
                className="flex gap-2 text-sm"
                key={`${guide.title}-when-${index}`}
              >
                <span className="text-destructive mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Additional Info */}
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary">
          <h2 className="font-bold mb-2">Important Information</h2>
          <p className="text-sm text-muted-foreground">
            {guide.additionalInfo}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Link href="/chat">
            <Button
              className="w-full justify-between h-12 bg-transparent"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Ask AI for More Guidance</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              className="w-full justify-between h-12 bg-transparent"
              variant="outline"
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>View Emergency Contacts</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
