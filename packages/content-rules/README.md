# @nugget/content-rules

Type-safe content rules engine for dynamic, contextual content delivery with BAML AI integration.

## Features

- **Type-safe DSL** for defining content rules
- **Condition builders** for time-based, progress-based, and state-based rules
- **AI integration** via BAML with TTL caching
- **Priority-based evaluation** for selecting the best content
- **Series generators** for creating multiple time-based rules easily

## Usage

```typescript
import { Program, Screen, Slot, Scope, week, scope, postpartum } from '@nugget/content-rules';

const P = new Program();

// Define a rule
P.add(
  P.rule()
    .slot(Screen.Learning, Slot.Header)
    .when(scope(Scope.Postpartum), postpartum.day.eq(3))
    .show({
      template: 'Card.WeekSummary',
      props: {
        title: 'Day 3 Tips',
        body: 'Content here...'
      }
    })
    .priority(50)
    .build()
);

// Evaluate rules
const context = { scope: Scope.Postpartum, ppDay: 3 };
const card = await pickForSlot(P.build(), Screen.Learning, Slot.Header, context, cache);
```

## Architecture

- `dynamic.ts` - Core DSL, builder, and evaluator
- `dynamic-baml.ts` - BAML integration with caching
- `cache-adapter.ts` - TTL-based caching implementation
- `learning-ai-program.ts` - AI-powered learning content program
- `milestones-ai-program.ts` - AI-powered milestones program

