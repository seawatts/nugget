/**
 * INTEGRATION EXAMPLE
 *
 * This file shows how to integrate Quick Chat components into a real page.
 * Copy and adapt this code for your specific use case.
 */

'use client';

import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { Baby, Brain, Heart, Moon, Utensils } from 'lucide-react';
import { QuickChatDialog, QuickChatFab } from './index';

interface PageWithQuickChatProps {
  babyId: string;
  babyName: string;
}

/**
 * Example 1: Dashboard with Multiple Specialist Buttons
 *
 * Shows how to create a "Expert Help" section with multiple specialized chat options
 */
export function DashboardWithSpecialists({
  babyId,
  babyName,
}: PageWithQuickChatProps) {
  return (
    <div className="space-y-6">
      <h1>Welcome to {babyName}'s Dashboard</h1>

      {/* Regular dashboard content */}
      <div className="grid gap-4">{/* Your existing dashboard cards */}</div>

      {/* Expert Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Get Expert Help</CardTitle>
          <CardDescription>
            Chat with AI specialists for personalized advice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickChatDialog
              babyId={babyId}
              placeholder="Ask about sleep..."
              systemPrompt="You are a certified infant sleep consultant with expertise in evidence-based sleep training methods, gentle approaches, and age-appropriate schedules."
              title="Sleep Consultant"
              trigger={
                <Button
                  className="h-auto py-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-sm">Sleep</span>
                </Button>
              }
            />

            <QuickChatDialog
              babyId={babyId}
              placeholder="Ask about feeding..."
              systemPrompt="You are a pediatric nutritionist and lactation consultant specializing in breastfeeding, formula feeding, and introducing solids."
              title="Feeding Specialist"
              trigger={
                <Button
                  className="h-auto py-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Utensils className="w-6 h-6" />
                  <span className="text-sm">Feeding</span>
                </Button>
              }
            />

            <QuickChatDialog
              babyId={babyId}
              placeholder="Ask about health..."
              systemPrompt="You are a pediatrician with expertise in infant health, common illnesses, and preventive care."
              title="Health Expert"
              trigger={
                <Button
                  className="h-auto py-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Heart className="w-6 h-6" />
                  <span className="text-sm">Health</span>
                </Button>
              }
            />

            <QuickChatDialog
              babyId={babyId}
              placeholder="Ask about milestones..."
              systemPrompt="You are a child development specialist focusing on infant milestones, developmental activities, and early intervention."
              title="Development Expert"
              trigger={
                <Button
                  className="h-auto py-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Brain className="w-6 h-6" />
                  <span className="text-sm">Development</span>
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example 2: Sleep Tracking Page with Contextual Help
 *
 * Shows how to add contextual chat that references the current page context
 */
export function SleepTrackingPage({
  babyId,
  babyName,
}: PageWithQuickChatProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>{babyName}'s Sleep</h1>

        {/* Quick access to sleep consultant */}
        <QuickChatDialog
          babyId={babyId}
          systemPrompt="You are a sleep consultant. The user is viewing their baby's sleep tracking data. You can reference their recent sleep patterns to provide personalized advice."
          title="Sleep Consultant"
          trigger={
            <Button variant="outline">
              <Moon className="w-4 h-4 mr-2" />
              Ask Sleep Expert
            </Button>
          }
        />
      </div>

      {/* Sleep tracking charts and data */}
      <div className="grid gap-4">{/* Your sleep tracking UI */}</div>

      {/* Contextual help card */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Analysis & Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get personalized advice based on {babyName}'s sleep patterns
          </p>
          <QuickChatDialog
            babyId={babyId}
            initialMessages={[
              {
                content:
                  "How is my baby's sleep looking? Any suggestions for improvement?",
                createdAt: new Date(),
                id: 'initial-1',
                role: 'user',
              },
            ]}
            systemPrompt="You are a sleep consultant analyzing a baby's sleep data. The user wants to understand their baby's sleep patterns and get improvement suggestions. Reference age-appropriate sleep needs and be encouraging."
            title="Sleep Analysis"
            trigger={
              <Button className="w-full">Get Personalized Sleep Advice</Button>
            }
          />
        </CardContent>
      </Card>

      {/* Floating button for quick access anywhere on the page */}
      <QuickChatFab
        babyId={babyId}
        position="bottom-right"
        systemPrompt="You are a sleep consultant available to answer any sleep-related questions."
      />
    </div>
  );
}

/**
 * Example 3: Activity Logging with Smart Suggestions
 *
 * Shows how to use chat for activity-specific help
 */
export function ActivityLoggingPage({
  babyId,
  babyName,
}: PageWithQuickChatProps) {
  return (
    <div className="space-y-6">
      <h1>Log Activity for {babyName}</h1>

      {/* Activity logging form */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {/* Activity buttons with contextual help */}
            <Button variant="outline">
              <Baby className="w-4 h-4 mr-2" />
              Log Feeding
            </Button>
            <QuickChatDialog
              babyId={babyId}
              initialMessages={[
                {
                  content: 'I need help logging a feeding',
                  createdAt: new Date(),
                  id: 'initial-2',
                  role: 'user',
                },
              ]}
              systemPrompt="You are a feeding specialist. Help the user log a feeding activity and answer questions about feeding schedules, amounts, and best practices."
              title="Feeding Help"
              trigger={
                <Button size="sm" variant="ghost">
                  Need Help?
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* General help always available */}
      <QuickChatFab babyId={babyId} position="bottom-right" />
    </div>
  );
}

/**
 * Example 4: Simple Integration - Just Add FAB
 *
 * The easiest way to add chat to any page
 */
export function SimplePageWithChat({ babyId }: PageWithQuickChatProps) {
  return (
    <div>
      {/* Your regular page content */}
      <h1>My Page</h1>
      <p>Regular content here...</p>

      {/* Add this single line for instant chat functionality */}
      <QuickChatFab babyId={babyId} position="bottom-right" />
    </div>
  );
}

/**
 * Example 5: Emergency/Urgent Help
 *
 * Shows how to create a prominent help button for urgent situations
 */
export function PageWithUrgentHelp({ babyId }: PageWithQuickChatProps) {
  return (
    <div className="space-y-6">
      {/* Regular content */}

      {/* Prominent urgent help button */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            Need Immediate Help?
          </CardTitle>
          <CardDescription>
            For emergencies, call 911. For non-emergency concerns, chat with our
            AI nurse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickChatDialog
            babyId={babyId}
            placeholder="Describe what's happening..."
            systemPrompt="You are an experienced pediatric nurse. Provide clear, calm advice for common infant concerns. Always remind parents to seek immediate medical attention for true emergencies. Help with questions about fever, rashes, feeding issues, crying, etc."
            title="Urgent Help"
            trigger={
              <Button className="w-full" size="lg" variant="destructive">
                🚨 I Need Help Now
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * HOW TO USE IN YOUR PAGE:
 *
 * 1. Import the components at the top of your file:
 *    import { QuickChatDialog, QuickChatFab } from '@/app/(app)/app/_components';
 *
 * 2. Add to your component JSX:
 *    <QuickChatFab babyId={babyId} position="bottom-right" />
 *
 * 3. Customize with system prompts for specialized help:
 *    <QuickChatDialog
 *      babyId={babyId}
 *      systemPrompt="You are a sleep consultant..."
 *      title="Sleep Help"
 *    />
 *
 * That's it! The components handle everything else.
 */
