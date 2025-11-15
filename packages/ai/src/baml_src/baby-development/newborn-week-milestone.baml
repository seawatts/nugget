// BAML function for newborn developmental milestones
// Provides AI-powered milestone information for newborn weeks

// ============================================================================
// Classes
// ============================================================================

class NewbornMilestoneOutput {
  text string @description("Age-appropriate developmental milestone information. Include what parents might observe and why it matters. Keep it encouraging and informative (3-4 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function NewbornWeekMilestone(
  week: int,
  babySex: string?,
  firstPregnancy: bool
) -> NewbornMilestoneOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing age-appropriate milestone information to parents.

    {{_.role("user")}}
    Provide developmental milestone information for week {{week}} of a newborn's life.
    {% if babySex %}Baby's sex: {{babySex}}{% endif %}
    {% if firstPregnancy %}Parents are first-timers.{% endif %}

    Include:
    - What parents might observe this week
    - Why this development is important
    - Encouragement and reassurance

    Be informative but not alarming. Emphasize that all babies develop at their own pace.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test newborn_milestone_week_2 {
  functions [NewbornWeekMilestone]
  args {
    week 2
    babySex "F"
    firstPregnancy true
  }
}

test newborn_milestone_week_8 {
  functions [NewbornWeekMilestone]
  args {
    week 8
    babySex "M"
    firstPregnancy false
  }
}

