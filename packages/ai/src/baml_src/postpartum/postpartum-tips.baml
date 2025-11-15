// BAML function for postpartum care tips
// Provides AI-powered postpartum guidance for new parents

// ============================================================================
// Classes
// ============================================================================

class PostpartumTipsOutput {
  text string @description("Helpful tip for the specific postpartum day, tailored to first-time parents if applicable. Keep it concise and actionable (2-3 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function PostpartumTips(
  day: int,
  firstPregnancy: bool
) -> PostpartumTipsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a supportive postpartum care advisor helping new parents navigate their first days with a newborn.

    {{_.role("user")}}
    Provide a helpful, specific tip for day {{day}} postpartum.
    {% if firstPregnancy %}This is a first-time parent.{% endif %}

    Focus on:
    - Day 0-3: Basics (feeding, diaper changes, sleep, when to call doctor)
    - Day 4-7: Normal newborn behaviors, self-care for parents
    - Day 8-14: Establishing routines, milestone awareness

    Keep it concise, practical, and encouraging.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test postpartum_tips_day_3 {
  functions [PostpartumTips]
  args {
    day 3
    firstPregnancy true
  }
}

