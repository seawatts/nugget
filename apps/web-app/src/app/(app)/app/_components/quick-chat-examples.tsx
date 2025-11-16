/**
 * EXAMPLE FILE - Demonstrates how to use the Quick Chat components
 *
 * This file shows various ways to integrate chat functionality into your app.
 * You can copy these examples into your components as needed.
 */

'use client';

import { Button } from '@nugget/ui/button';
import { useState } from 'react';
import { QuickChatDialog } from './quick-chat-dialog';
import { QuickChatFab } from './quick-chat-fab';

// ============================================================================
// Example 1: Basic Quick Chat Dialog with Custom Trigger
// ============================================================================
export function BasicQuickChatExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog
      babyId={babyId}
      trigger={<Button variant="outline">💬 Ask a Question</Button>}
    />
  );
}

// ============================================================================
// Example 2: Quick Chat with Custom System Prompt (Sleep Consultant)
// ============================================================================
export function SleepConsultantExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog
      babyId={babyId}
      placeholder="Ask about sleep..."
      systemPrompt="You are a certified infant sleep consultant with 10+ years of experience. You specialize in evidence-based sleep training methods, gentle sleep techniques, and age-appropriate sleep schedules. You understand that every baby is unique and provide personalized advice based on the baby's age and context."
      title="Sleep Consultant"
      trigger={<Button>😴 Sleep Advice</Button>}
    />
  );
}

// ============================================================================
// Example 3: Feeding Specialist with Initial Question
// ============================================================================
export function FeedingSpecialistExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog
      babyId={babyId}
      initialMessages={[
        {
          content: 'How often should I be feeding my baby?',
          createdAt: new Date(),
          id: 'initial-feeding',
          role: 'user',
        },
      ]}
      placeholder="Ask about feeding..."
      systemPrompt="You are a pediatric nutritionist and lactation consultant. You provide evidence-based advice on breastfeeding, formula feeding, introducing solids, and addressing feeding challenges. You're supportive and non-judgmental about all feeding choices."
      title="Feeding Specialist"
      trigger={<Button variant="outline">🍼 Feeding Help</Button>}
    />
  );
}

// ============================================================================
// Example 4: Development Milestone Tracker
// ============================================================================
export function DevelopmentTrackerExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog
      babyId={babyId}
      placeholder="Ask about milestones..."
      systemPrompt="You are a pediatric developmental specialist. You provide guidance on age-appropriate milestones, developmental activities, and early intervention when needed. You're encouraging and help parents understand normal developmental ranges."
      title="Development Tracker"
      trigger={<Button variant="secondary">🌟 Development Milestones</Button>}
    />
  );
}

// ============================================================================
// Example 5: Floating Action Button (Always Available)
// ============================================================================
export function FloatingChatExample({ babyId }: { babyId: string }) {
  return <QuickChatFab babyId={babyId} position="bottom-right" />;
}

// ============================================================================
// Example 6: Floating Chat with Custom System Prompt
// ============================================================================
export function CustomFloatingChatExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatFab
      babyId={babyId}
      position="bottom-left"
      systemPrompt="You are a supportive parenting coach who specializes in helping new parents navigate the emotional and practical challenges of parenthood. You provide encouragement, practical tips, and evidence-based advice."
    />
  );
}

// ============================================================================
// Example 7: Multiple Specialist Buttons
// ============================================================================
export function SpecialistButtonsExample({ babyId }: { babyId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <QuickChatDialog
        babyId={babyId}
        systemPrompt="You are a pediatric sleep consultant."
        title="Sleep Expert"
        trigger={
          <Button size="sm" variant="outline">
            😴 Sleep
          </Button>
        }
      />

      <QuickChatDialog
        babyId={babyId}
        systemPrompt="You are a lactation and feeding consultant."
        title="Feeding Expert"
        trigger={
          <Button size="sm" variant="outline">
            🍼 Feeding
          </Button>
        }
      />

      <QuickChatDialog
        babyId={babyId}
        systemPrompt="You are a pediatrician specializing in infant health."
        title="Health Expert"
        trigger={
          <Button size="sm" variant="outline">
            🏥 Health
          </Button>
        }
      />

      <QuickChatDialog
        babyId={babyId}
        systemPrompt="You are a child development specialist."
        title="Development Expert"
        trigger={
          <Button size="sm" variant="outline">
            🌟 Development
          </Button>
        }
      />
    </div>
  );
}

// ============================================================================
// Example 8: Contextual Quick Chat (e.g., from a sleep tracking page)
// ============================================================================
export function ContextualSleepChatExample({ babyId }: { babyId: string }) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold">Need Help with Sleep?</h3>
      <p className="text-sm text-muted-foreground">
        Our AI sleep consultant can help you understand your baby's sleep
        patterns.
      </p>
      <QuickChatDialog
        babyId={babyId}
        initialMessages={[
          {
            content: "How is my baby's sleep looking?",
            createdAt: new Date(),
            id: 'initial-sleep',
            role: 'user',
          },
        ]}
        systemPrompt="You are a certified infant sleep consultant. The user is viewing their baby's sleep data and may have questions about sleep patterns, duration, or quality. Be specific and reference age-appropriate sleep recommendations."
        title="Sleep Analysis"
        trigger={<Button className="w-full">Get Sleep Advice</Button>}
      />
    </div>
  );
}

// ============================================================================
// Example 9: Controlled Dialog (Programmatic Control)
// ============================================================================
export function ControlledChatExample({ babyId }: { babyId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Chat</Button>

      <QuickChatDialog babyId={babyId} onOpenChange={setIsOpen} open={isOpen} />
    </>
  );
}

// ============================================================================
// Example 10: Emergency/Urgent Help Button
// ============================================================================
export function UrgentHelpExample({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog
      babyId={babyId}
      placeholder="Describe what you need help with..."
      systemPrompt="You are an experienced pediatric nurse. Provide clear, calm, evidence-based advice for common infant concerns. Always remind parents to seek immediate medical attention for emergencies or if they're unsure. You can help with questions about common issues like fever, rashes, feeding problems, etc."
      title="Quick Help"
      trigger={
        <Button size="lg" variant="destructive">
          🚨 I Need Help Now
        </Button>
      }
    />
  );
}

// ============================================================================
// HOW TO USE THESE EXAMPLES:
// ============================================================================
/**
 * 1. Import the component you want to use:
 *    import { QuickChatDialog } from '@/app/(app)/app/_components/quick-chat-dialog';
 *
 * 2. Add it to your component:
 *    <QuickChatDialog babyId={baby.id} />
 *
 * 3. Customize with system prompts, titles, and placeholders
 *
 * 4. For floating buttons, use QuickChatFab:
 *    import { QuickChatFab } from '@/app/(app)/app/_components/quick-chat-fab';
 *    <QuickChatFab babyId={baby.id} position="bottom-right" />
 *
 * KEY PROPS:
 * - babyId: (required) The baby's ID for personalized context
 * - systemPrompt: Customize the AI's behavior and expertise
 * - initialQuestion: Auto-send a question when dialog opens
 * - title: Custom dialog title
 * - placeholder: Custom input placeholder
 * - trigger: Custom trigger button
 * - open/onOpenChange: For controlled dialogs
 */
