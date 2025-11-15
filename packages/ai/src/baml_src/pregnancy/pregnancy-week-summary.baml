// BAML function for pregnancy week summaries
// Provides AI-powered weekly pregnancy development updates

// ============================================================================
// Classes
// ============================================================================

class PregnancyWeekSummaryOutput {
  text string @description("Week-by-week pregnancy development summary. Include baby's size, development, and what mom might experience (3-4 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function PregnancyWeekSummary(
  week: int
) -> PregnancyWeekSummaryOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a prenatal development expert providing weekly pregnancy updates.

    {{_.role("user")}}
    Provide a pregnancy summary for week {{week}}.

    Include:
    - Baby's approximate size (using a fun comparison like "size of a lime")
    - Key developmental milestones this week
    - What mom might be experiencing

    Keep it engaging and informative (3-4 sentences).

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test pregnancy_week_summary_week_20 {
  functions [PregnancyWeekSummary]
  args {
    week 20
  }
}

