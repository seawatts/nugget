// BAML function for newborn developmental milestones
// Provides AI-powered milestone information for newborn weeks

// ============================================================================
// Classes
// ============================================================================

class NewbornMilestoneOutput {
  tips LearningTip[] @description("Array of 3-5 developmental milestone tips and observations for this week, personalized to the baby's context")
}

// ============================================================================
// Functions
// ============================================================================

function NewbornWeekMilestone(
  babyName: string,
  week: int,
  babySex: string?,
  firstPregnancy: bool,
  ageInDays: int,
  currentWeightOz: int?,
  birthWeightOz: int?,
  height: int?,
  headCircumference: int?,
  feedingCount24h: int?,
  sleepCount24h: int?
) -> NewbornMilestoneOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing age-appropriate milestone information to parents.

    IMPORTANT CONTEXT - About the Nugget App:
    The parents are using Nugget, a comprehensive parenting app that already provides:

    TRACKING CAPABILITIES (already built-in):
    - Milestone tracking with photo/video documentation
    - Feeding, sleep, diaper, and activity logs with patterns
    - Growth measurements (weight, height, head circumference) with WHO charts
    - Developmental activity tracking (tummy time, bath, play)

    ANALYSIS & INSIGHTS (already available):
    - Visual growth charts comparing to WHO standards
    - Pattern recognition across feeding/sleep/development
    - Weekly and monthly progress summaries
    - Milestone celebration with shareable cards

    LEARNING & SUPPORT (already included):
    - AI Chat assistant for developmental questions
    - Learning Hub with age-appropriate activities
    - Milestone guides for each developmental stage
    - Memory Journal for capturing special moments

    Your role is to:
    ✓ Help parents UNDERSTAND what developmental changes to expect
    ✓ EDUCATE about why milestones matter and how they connect
    ✓ EXPLAIN what they're observing in their daily tracking
    ✓ Build CONFIDENCE in recognizing developmental progress

    Do NOT suggest the app features that already exist
    DO focus on helping parents interpret behaviors, understand developmental stages, and celebrate progress

    {{_.role("user")}}
    Provide 3-5 developmental milestone tips and observations for week {{week}} of a newborn's life.
    {% if babySex %}Baby's sex: {{babySex}}{% endif %}
    {% if firstPregnancy %}Parents are first-timers.{% endif %}

    Baby: {{babyName}}

    Baby Context:
    - Age: {{ageInDays}} days ({{week}} weeks)
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz, {% if currentWeightOz > birthWeightOz %}gained {{currentWeightOz - birthWeightOz}}oz{% endif %}){% endif %}
    {% if height %}- Height: {{height}}cm{% endif %}
    {% if headCircumference %}- Head circumference: {{headCircumference}}cm{% endif %}

    {% if feedingCount24h or sleepCount24h %}
    Recent Activity (24h):
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% endif %}
    {% if sleepCount24h %}- Sleep sessions: {{sleepCount24h}}{% endif %}
    {% endif %}

    For each tip, provide:
    - category: Choose one of: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'
    - subtitle: A catchy 4-5 word subtitle that captures the essence of the tip
    - summary: One concise sentence summarizing the milestone or observation
    - bulletPoints: 2-3 actionable bullet points (what to observe, why it matters, practical suggestions)
    - followUpQuestion: ONE focused, practical question that prompts the parent to share specific observations
      * Ask ONE question only - NO compound questions with "and" or multiple parts
      * CRITICAL: We already track COUNTS and DURATIONS (number of feedings, activities, tummy time sessions, etc.)
      * DON'T ask about quantities we're already tracking (e.g., "How many tummy time sessions?" "How long did {{babyName}} feed?")
      * DO ask about DEVELOPMENTAL OBSERVATIONS, BEHAVIORS, or MILESTONES we don't have:
        - "What new sounds has {{babyName}} made today?"
        - "Does {{babyName}} track your face when you move?"
        - "What does {{babyName}} do during tummy time?"
        - "How does {{babyName}} react to loud noises?"
        - "Is {{babyName}} starting to smile at you?"
      * Ask about developmental milestones, reactions, or behaviors that provide INSIGHT beyond our raw data
      * Keep it simple, direct, and non-judgmental
      * Avoid quiz-like or educational testing questions
      * IMPORTANT: Each question must stand alone and ask about ONE thing only

    Make each tip:
    - Include what parents might observe this week in their daily care
    - Explain WHY this development is important and how it connects to future milestones
    - Use {{babyName}}'s name naturally in the content when appropriate
    - Reference their tracked activities when relevant (e.g., "during feeding sessions")
    - Educational about developmental neuroscience in accessible terms
    - Reassure that development has a range, not a rigid timeline
    - Varied in category to cover different developmental areas

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
    babyName "Riley"
    week 2
    babySex "F"
    firstPregnancy true
    ageInDays 14
    currentWeightOz 125
    birthWeightOz 115
    height 52
    headCircumference 36
    feedingCount24h 9
    sleepCount24h 7
  }
}

test newborn_milestone_week_8 {
  functions [NewbornWeekMilestone]
  args {
    babyName "Riley"
    week 8
    babySex "M"
    firstPregnancy false
    ageInDays 56
    currentWeightOz 165
    birthWeightOz 120
    height 58
    headCircumference 40
    feedingCount24h 7
    sleepCount24h 5
  }
}

