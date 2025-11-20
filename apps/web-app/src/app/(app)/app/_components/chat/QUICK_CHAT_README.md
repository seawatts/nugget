# Quick Chat Components

A suite of portable, customizable AI chat components that can be used anywhere in the app.

## Components

### 1. `QuickChatDialog`
A complete chat dialog component with support for custom system prompts, initial questions, and responsive design.

**Features:**
- 🎨 Responsive (Dialog on desktop, Drawer on mobile)
- 🤖 Custom AI system prompts
- 💬 Initial question auto-send
- 🎯 Customizable title and placeholder
- 🔌 Controlled or uncontrolled state
- 📱 Optimistic UI updates
- ✨ Beautiful, modern design

### 2. `QuickChatFab`
A floating action button that opens a quick chat dialog.

**Features:**
- 📍 Configurable positioning (4 corners)
- 🎨 Consistent styling with your theme
- 🚀 Easy drop-in anywhere

### 3. `ChatDialog`
A full-featured chat dialog with history support (used in the main chat page).

## Installation

All components are ready to use. No additional installation required.

## Basic Usage

### Quick Chat Dialog

```tsx
import { QuickChatDialog } from '@/app/(app)/app/_components/quick-chat-dialog';

export function MyComponent({ babyId }: { babyId: string }) {
  return (
    <QuickChatDialog babyId={babyId} />
  );
}
```

### Floating Action Button

```tsx
import { QuickChatFab } from '@/app/(app)/app/_components/quick-chat-fab';

export function MyPage({ babyId }: { babyId: string }) {
  return (
    <div>
      {/* Your page content */}
      <QuickChatFab babyId={babyId} position="bottom-right" />
    </div>
  );
}
```

## Advanced Usage

### Custom System Prompt

Create specialized AI assistants with custom system prompts:

```tsx
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are a certified infant sleep consultant with 10+ years of experience. You specialize in evidence-based sleep training methods and gentle sleep techniques."
  title="Sleep Consultant"
  placeholder="Ask about sleep..."
  trigger={<Button>😴 Sleep Advice</Button>}
/>
```

### Initial Question Auto-Send

Open the chat with a pre-filled question that sends automatically:

```tsx
<QuickChatDialog
  babyId={baby.id}
  initialQuestion="How often should I be feeding my baby?"
  title="Feeding Help"
/>
```

### Controlled Dialog

Control the open/close state programmatically:

```tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <Button onClick={() => setIsOpen(true)}>
      Open Chat
    </Button>

    <QuickChatDialog
      babyId={baby.id}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  </>
);
```

### Custom Trigger Button

Replace the default trigger with your own:

```tsx
<QuickChatDialog
  babyId={baby.id}
  trigger={
    <Button variant="ghost" size="lg">
      <MessageSquare className="mr-2" />
      Ask AI Assistant
    </Button>
  }
/>
```

## Use Cases & Examples

### 1. Sleep Consultant

```tsx
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are a certified infant sleep consultant..."
  title="Sleep Consultant"
  trigger={<Button>😴 Sleep Advice</Button>}
/>
```

### 2. Feeding Specialist

```tsx
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are a pediatric nutritionist and lactation consultant..."
  title="Feeding Specialist"
  trigger={<Button>🍼 Feeding Help</Button>}
/>
```

### 3. Development Tracker

```tsx
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are a pediatric developmental specialist..."
  title="Development Tracker"
  trigger={<Button>🌟 Milestones</Button>}
/>
```

### 4. Contextual Help (from Activity Pages)

```tsx
// On a sleep tracking page
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are a sleep consultant. The user is viewing their baby's sleep data..."
  initialQuestion="How is my baby's sleep looking?"
  title="Sleep Analysis"
/>
```

### 5. Emergency Help Button

```tsx
<QuickChatDialog
  babyId={baby.id}
  systemPrompt="You are an experienced pediatric nurse. Provide clear, calm advice..."
  title="Quick Help"
  placeholder="Describe what you need help with..."
  trigger={
    <Button variant="destructive" size="lg">
      🚨 I Need Help Now
    </Button>
  }
/>
```

## API Reference

### QuickChatDialog Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `babyId` | `string` | ✅ | - | The baby's ID for personalized context |
| `systemPrompt` | `string` | ❌ | Default assistant prompt | Custom AI behavior/expertise |
| `initialQuestion` | `string` | ❌ | - | Pre-filled question to auto-send |
| `title` | `string` | ❌ | "Quick Chat" | Dialog title |
| `placeholder` | `string` | ❌ | "Ask a question..." | Input placeholder text |
| `trigger` | `ReactNode` | ❌ | Default button | Custom trigger element |
| `open` | `boolean` | ❌ | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | ❌ | - | Open state change handler |

### QuickChatFab Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `babyId` | `string` | ✅ | - | The baby's ID for personalized context |
| `systemPrompt` | `string` | ❌ | Default assistant prompt | Custom AI behavior/expertise |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | ❌ | "bottom-right" | FAB position |
| `className` | `string` | ❌ | - | Additional CSS classes |

## System Prompt Best Practices

When creating custom system prompts, follow these guidelines:

### 1. Define Role Clearly
```
"You are a [specific role] with [credentials/experience]."
```

### 2. Specify Expertise
```
"You specialize in [specific areas]."
```

### 3. Set Tone
```
"You are supportive, empathetic, and encouraging."
```

### 4. Add Constraints
```
"Always remind parents to seek immediate medical attention for emergencies."
```

### 5. Reference Context
```
"The user is viewing their baby's sleep data. Reference age-appropriate recommendations."
```

### Example: Complete System Prompt

```typescript
const sleepConsultantPrompt = `
You are a certified infant sleep consultant with 10+ years of experience.
You specialize in evidence-based sleep training methods, gentle sleep techniques,
and age-appropriate sleep schedules.

You understand that every baby is unique and provide personalized advice based
on the baby's age and context. You are supportive and non-judgmental about
different parenting approaches.

You always:
- Reference age-appropriate sleep needs
- Suggest gentle, evidence-based techniques
- Acknowledge that every baby is different
- Encourage parents to trust their instincts

You never:
- Judge parenting choices
- Recommend unsafe sleep practices
- Guarantee specific outcomes
`;
```

## Integration Examples

### In a Feature Page

```tsx
// app/(app)/app/sleep/page.tsx
export default function SleepPage({ params }: { params: { babyId: string } }) {
  return (
    <div>
      <h1>Sleep Tracking</h1>
      {/* Your sleep tracking UI */}

      <QuickChatFab
        babyId={params.babyId}
        systemPrompt="You are a sleep consultant..."
        position="bottom-right"
      />
    </div>
  );
}
```

### In a Card Component

```tsx
export function SleepHelpCard({ babyId }: { babyId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Sleep Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Our AI sleep consultant can provide personalized advice.</p>
        <QuickChatDialog
          babyId={babyId}
          systemPrompt="You are a sleep consultant..."
          initialQuestion="How can I improve my baby's sleep?"
          trigger={<Button className="w-full mt-4">Get Sleep Advice</Button>}
        />
      </CardContent>
    </Card>
  );
}
```

### As a Menu Item

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Help</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <QuickChatDialog
        babyId={babyId}
        trigger={
          <button className="w-full text-left">
            💬 Chat with AI Assistant
          </button>
        }
      />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Technical Details

### How It Works

1. **Baby Context**: Each chat automatically includes the baby's context (age, weight, recent activities, etc.)
2. **System Prompt**: Customizes the AI's behavior without changing the underlying model
3. **Message Storage**: Messages are saved to the database for potential history access
4. **Optimistic UI**: Shows user messages immediately for better UX
5. **Streaming**: AI responses are streamed back (future enhancement)

### Data Flow

```
User Input → Server Action → BAML AI Function → Database → Response
```

### Performance

- Lazy loading: Components are client-side only
- Optimistic updates: Instant UI feedback
- Efficient re-renders: Uses React best practices
- Responsive: Adapts to screen size

## Migration from Old ChatDialog

If you were using the old `ChatDialog`:

**Before:**
```tsx
<ChatDialog
  babyId={baby.id}
  initialQuestion="Help me..."
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

**After (unchanged, now supports systemPrompt):**
```tsx
<ChatDialog
  babyId={baby.id}
  initialQuestion="Help me..."
  systemPrompt="You are a specialist..."  // NEW
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

## Troubleshooting

### Chat not opening
- Check that `babyId` is valid
- Ensure user is authenticated
- Check browser console for errors

### Messages not sending
- Verify database connection
- Check BAML configuration
- Ensure AI API keys are set

### Styling issues
- Component uses Tailwind CSS
- Check that your theme is properly configured
- Customize with `className` prop

## Future Enhancements

- [ ] Real-time streaming responses
- [ ] Voice input support
- [ ] Message reactions
- [ ] Share conversations
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Suggested questions
- [ ] Rich media support (images, charts)

## Support

For issues or questions, please refer to the main project documentation or create an issue.

