'use client';

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  DollarSign,
  FileText,
  Phone,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { getSetupStatus } from './actions';

type SetupTask = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  completed: boolean;
};

export default function OnboardingSetupPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [journeyStage, setJourneyStage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSetupData() {
      setIsLoading(true);
      try {
        const result = await getSetupStatus();

        if (result?.data) {
          const { journeyStage: stage, hasBabies } = result.data;
          setJourneyStage(stage || '');

          // For now, we'll check localStorage for some tasks
          // since they may not be in the database yet
          const settingsData = localStorage.getItem('settingsData');
          const hasContacts =
            settingsData && JSON.parse(settingsData).emergencyContact;

          const medicalData = localStorage.getItem('medicalRecords');
          const hasMedical =
            medicalData && JSON.parse(medicalData).vaccinations?.length > 0;

          const budgetData = localStorage.getItem('budgetData');
          const hasBudget = budgetData && JSON.parse(budgetData).monthlyBudget;

          const caregiverData = localStorage.getItem('caregiverGuide');
          const hasCaregiver =
            caregiverData && JSON.parse(caregiverData).babyName;

          const setupTasks: SetupTask[] = [
            {
              completed: hasBabies, // Check if baby exists in database
              description:
                "Add baby's details, birth information, and preferences",
              icon: <FileText className="h-5 w-5" />,
              id: 'profile',
              link: '/app',
              title: 'Complete Baby Profile',
            },
            {
              completed: !!hasContacts,
              description:
                'Pediatrician, hospital, emergency contacts, and caregivers',
              icon: <Phone className="h-5 w-5" />,
              id: 'contacts',
              link: '/app',
              title: 'Add Emergency Contacts',
            },
            {
              completed: !!hasMedical,
              description:
                'Vaccinations, allergies, medications, and insurance info',
              icon: <Stethoscope className="h-5 w-5" />,
              id: 'medical',
              link: '/app/medical',
              title: 'Set Up Medical Records',
            },
            {
              completed: !!hasBudget,
              description: 'Track expenses and plan for baby-related costs',
              icon: <DollarSign className="h-5 w-5" />,
              id: 'budget',
              link: '/app/budget',
              title: 'Create Your Budget',
            },
            {
              completed: !!hasCaregiver,
              description:
                'Create instructions for babysitters and family members',
              icon: <Users className="h-5 w-5" />,
              id: 'caregiver',
              link: '/app/caregiver-guide',
              title: 'Prepare Caregiver Guide',
            },
            {
              completed: false,
              description:
                'Notifications, reminders, and personalization options',
              icon: <Settings className="h-5 w-5" />,
              id: 'preferences',
              link: '/app',
              title: 'Configure App Settings',
            },
          ];

          setTasks(setupTasks);
        }
      } catch (error) {
        console.error('Failed to load setup status:', error);
        // Fallback to localStorage if server action fails
        const onboardingData = localStorage.getItem('onboardingData');
        if (onboardingData) {
          const data = JSON.parse(onboardingData);
          setJourneyStage(data.journeyStage);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadSetupData();
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = (completedCount / totalCount) * 100;

  const handleSkipForNow = () => {
    if (journeyStage === 'ttc') {
      router.push('/app/ttc');
    } else if (journeyStage === 'pregnant') {
      router.push('/app/pregnancy');
    } else {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h1 className="text-xl font-bold">Finish Setting Up</h1>
          </div>
          <p className="text-white/90 text-sm">
            Complete these steps to get the most out of your parenting journey
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {completedCount} of {totalCount} completed
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Setup Tasks */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading setup tasks...</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Link href={task.link} key={task.id}>
              <div
                className={cn(
                  'p-5 rounded-3xl border-2 transition-all hover:border-primary/50',
                  task.completed
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border',
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                      task.completed
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="max-w-2xl mx-auto px-6 pb-8 space-y-3">
        <Button
          className="w-full bg-transparent"
          onClick={handleSkipForNow}
          size="lg"
          variant="outline"
        >
          Skip for Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          You can always complete these steps later from Settings
        </p>
      </div>
    </div>
  );
}
