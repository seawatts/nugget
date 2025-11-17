// BAML function for milestone explanations
// Provides AI-powered explanations when parents click on a milestone

// ============================================================================
// Classes
// ============================================================================

class MilestoneExplanationOutput {
  explanation string @description("A warm explanation of what this milestone means (2 sentences, max 40 words)")
  whyItMatters string @description("Why this milestone is important (1 sentence, max 25 words)")
  whatToExpect string @description("What parents might observe or what happens next (1 sentence, max 25 words)")
  tips string[] @description("2-3 practical tips (each max 12 words)")
  reassurance string @description("A reassuring message (1 sentence, max 20 words)")
}

// ============================================================================
// Functions
// ============================================================================

function MilestoneExplanation(
  milestoneTitle: string,
  milestoneType: string,
  babyName: string,
  ageInDays: int,
  ageInWeeks: int,
  currentWeightOz: int?,
  birthWeightOz: int?,
  feedingCount24h: int?,
  sleepCount24h: int?,
  diaperCount24h: int?
) -> MilestoneExplanationOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing warm, educational explanations about baby milestones to parents.

    {{_.role("user")}}
    A parent is asking about this milestone: "{{milestoneTitle}}"
    Milestone type: {{milestoneType}}

    Baby: {{babyName}}
    Age: {{ageInDays}} days ({{ageInWeeks}} weeks)

    {% if currentWeightOz and birthWeightOz %}
    Weight context: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz)
    {% endif %}

    {% if feedingCount24h or sleepCount24h or diaperCount24h %}
    Recent activity (24h):
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% endif %}
    {% if sleepCount24h %}- Sleep sessions: {{sleepCount24h}}{% endif %}
    {% if diaperCount24h %}- Diaper changes: {{diaperCount24h}}{% endif %}
    {% endif %}

    Provide a concise but accessible explanation that includes:

    1. **explanation**: What this milestone is in simple terms. Use {{babyName}}'s name naturally (2 sentences, max 40 words).

    2. **whyItMatters**: Why this milestone matters for {{babyName}}'s growth (1 sentence, max 25 words).

    3. **whatToExpect**: What parents might observe now or what comes next (1 sentence, max 25 words).

    4. **tips**: 2-3 practical tips (each max 12 words).

    5. **reassurance**: A brief, reassuring message (1 sentence, max 20 words).

    Keep the tone:
    - Warm and supportive
    - Educational but not overwhelming
    - Specific to {{babyName}}'s age and context
    - Evidence-based but accessible
    - Non-judgmental and reassuring

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test explain_first_meconium {
  functions [MilestoneExplanation]
  args {
    milestoneTitle "First Meconium Diaper"
    milestoneType "physical"
    babyName "Riley"
    ageInDays 1
    ageInWeeks 0
    currentWeightOz 115
    birthWeightOz 115
    feedingCount24h 8
    sleepCount24h 10
    diaperCount24h 3
  }
}

test explain_first_smile {
  functions [MilestoneExplanation]
  args {
    milestoneTitle "First Social Smile"
    milestoneType "social"
    babyName "Riley"
    ageInDays 14
    ageInWeeks 2
    currentWeightOz 125
    birthWeightOz 115
    feedingCount24h 9
    sleepCount24h 7
    diaperCount24h 8
  }
}

test explain_tummy_time {
  functions [MilestoneExplanation]
  args {
    milestoneTitle "Holds Head Up During Tummy Time"
    milestoneType "physical"
    babyName "Alex"
    ageInDays 42
    ageInWeeks 6
    currentWeightOz 145
    birthWeightOz 120
    feedingCount24h 8
    sleepCount24h 6
    diaperCount24h 7
  }
}

