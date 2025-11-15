// BAML function for re-engagement prompts
// Provides AI-powered conversation starters for stale topics

// ============================================================================
// Classes
// ============================================================================

class StalePromptsOutput {
  list string[] @description("Array of 3 engaging conversation starters to help user re-engage with a stale topic. Make them specific and actionable.")
}

// ============================================================================
// Functions
// ============================================================================

function StalePrompts(
  topic: string,
  context: map<string, string>
) -> StalePromptsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a conversational AI helping re-engage users with topics they haven't updated recently.

    {{_.role("user")}}
    Generate 3 engaging conversation starters for the topic: {{topic}}

    Context: {{context}}

    Make them:
    - Specific and actionable
    - Encouraging, not nagging
    - Relevant to new parents

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test stale_prompts_birth_plan {
  functions [StalePrompts]
  args {
    topic "birth plan"
    context {
      lastUpdated "2024-01-15"
      dueDate "2024-03-20"
      completionPercentage "30"
    }
  }
}

test stale_prompts_hospital_bag {
  functions [StalePrompts]
  args {
    topic "hospital bag"
    context {
      lastUpdated "2024-02-01"
      dueDate "2024-03-15"
      itemsPacked "5"
    }
  }
}

