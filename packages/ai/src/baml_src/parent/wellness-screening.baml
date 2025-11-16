// BAML function for parent wellness screening assessments
// Provides AI-powered adaptive mental health screening based on postpartum stage

// ============================================================================
// Classes
// ============================================================================

class WellnessQuestion {
  question string @description("The wellness screening question")
  responseType string @description("RATING_0_3 for EPDS-style questions, YES_NO for binary screening")
  category string @description("Category: 'mood', 'anxiety', 'bonding', 'coping', or 'thoughts'")
  weight int @description("Scoring weight (0-3 for standard EPDS, 0-4 for anxiety items)")
  reverseScore bool @description("True if higher score is better (for positive items)")
}

class WellnessScreeningOutput {
  questions WellnessQuestion[] @description("7-10 screening questions adapted to current situation")
  scoringGuidance string @description("Brief guidance on score interpretation")
  supportResources string[] @description("3-5 relevant support resources based on postpartum stage")
}

// ============================================================================
// Functions
// ============================================================================

function WellnessScreening(
  ppDay: int,
  ppWeek: int?,
  firstPregnancy: bool,
  babyFirstName: string,
  ageInDays: int,
  previousCheckIns: string // JSON array of previous check-in history
) -> WellnessScreeningOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a perinatal mental health specialist creating adaptive wellness screenings for postpartum parents.

    Your screening should be based on validated tools like:
    - Edinburgh Postnatal Depression Scale (EPDS)
    - Generalized Anxiety Disorder-7 (GAD-7)
    - Patient Health Questionnaire-9 (PHQ-9)

    But ADAPT the questions to:
    - The specific postpartum day/week
    - The baby's name and age
    - Previous check-in patterns
    - First-time vs experienced parent
    - Cultural sensitivity

    Critical Days/Weeks:
    - Day 3-5: Baby blues peak (expected mood swings)
    - Week 2: Watch for postpartum depression onset
    - Week 6: Common time for first postpartum visit
    - Week 12: Extended screening for persistent symptoms

    Scoring guidance:
    - EPDS: 0-9 low risk, 10-12 moderate, 13+ likely depression
    - Question 10 (self-harm): Any score >0 is urgent
    - GAD items: 0-4 minimal, 5-9 mild, 10-14 moderate, 15+ severe

    Key differences in adaptation:
    - Day 3: Normalize baby blues, screen for extreme symptoms
    - Week 1-2: Standard EPDS appropriate
    - Week 4+: Add anxiety screening, bonding questions
    - Triggered (after concerning check-in): Focus on specific concerns raised

    {{_.role("user")}}
    Create a wellness screening for this parent.

    Context:
    - Postpartum day: {{ppDay}}{% if ppWeek %} (week {{ppWeek}}){% endif %}
    - Baby: {{babyFirstName}}, {{ageInDays}} days old
    {% if firstPregnancy %}- First-time parent{% endif %}
    - Previous check-ins: {{previousCheckIns}}

    {% if ppDay <= 5 %}
    NOTE: This is during the "baby blues" period. Mood swings are NORMAL. Focus on extreme or persistent symptoms.
    {% elif ppDay >= 84 %}
    NOTE: Extended postpartum period. Screen for persistent or late-onset postpartum depression.
    {% endif %}

    Create 7-10 questions that:
    - Cover mood, anxiety, bonding, and coping
    - Use {{babyFirstName}}'s name in questions when natural
    - Adapt phrasing to postpartum day (e.g., "in the past week" vs "in the past day")
    - Include at least one question about thoughts of self-harm
    - Progress from general to more sensitive topics

    For each question:
    - question: Clear, compassionate question using validated scale language
    - responseType: "RATING_0_3" (never/rarely/sometimes/often) or "YES_NO" for screening flags
    - category: The aspect being assessed
    - weight: Scoring weight (typically 0-3 for EPDS items)
    - reverseScore: True for positive items (e.g., "I have looked forward with enjoyment")

    Also provide:
    - scoringGuidance: Brief explanation of what scores mean
    - supportResources: 3-5 specific resources relevant to this postpartum stage

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test wellness_screening_day_3 {
  functions [WellnessScreening]
  args {
    ppDay 3
    firstPregnancy true
    babyFirstName "Riley"
    ageInDays 3
    previousCheckIns "[]"
  }
}

test wellness_screening_week_6 {
  functions [WellnessScreening]
  args {
    ppDay 42
    ppWeek 6
    firstPregnancy true
    babyFirstName "Riley"
    ageInDays 42
    previousCheckIns "[{\"date\": \"2024-01-15\", \"moodScore\": 3, \"concernsRaised\": [\"tired\"]}]"
  }
}

