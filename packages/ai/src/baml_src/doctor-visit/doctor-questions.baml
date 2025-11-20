// BAML function for generating doctor visit prep questions
// Provides AI-powered summary and questions based on baby's activity patterns

// ============================================================================
// Classes
// ============================================================================

class DoctorQuestionsOutput {
  summary string @description("Brief 2-3 sentence overview of baby's patterns during the period (feeding, sleep, diaper). Focus on notable trends or changes.")
  questions string[] @description("5-8 specific, actionable questions to ask the doctor based on the baby's patterns and age. Each question should be clear and relevant.")
  concerns string[] @description("0-3 potential concerns flagged based on patterns (e.g., low diaper output, unusual sleep, feeding irregularities). Empty array if no concerns.")
}

// ============================================================================
// Functions
// ============================================================================

function GenerateDoctorQuestions(
  // Baby info
  babyName: string,
  babySex: string?,
  ageInDays: int,

  // Date range context
  dayCount: int,

  // Activity statistics
  totalFeedings: int,
  averageFeedingsPerDay: float,
  totalFeedingMl: float,
  averageMlPerFeeding: float,

  totalSleeps: int,
  totalSleepHours: float,
  averageSleepHoursPerDay: float,
  longestSleepHours: float,

  totalDiapers: int,
  averageDiapersPerDay: float,
  wetDiapers: int,
  dirtyDiapers: int,
  bothDiapers: int
) -> DoctorQuestionsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric healthcare assistant helping parents prepare for doctor visits.

    Your role is to:
    - Summarize baby's activity patterns during the tracking period
    - Generate relevant, age-appropriate questions for the doctor
    - Flag any potential concerns based on developmental norms
    - Help parents advocate for their baby's health

    Base all guidance on AAP, CDC, and WHO guidelines for infant development.

    {{_.role("user")}}
    Generate a doctor visit prep summary for {{babyName}} ({{ageInDays}} days old).

    {% if babySex %}
    Sex: {{babySex}}
    {% if babySex == "M" or babySex == "male" %}
    Use: he, him, his
    {% elif babySex == "F" or babySex == "female" %}
    Use: she, her, hers
    {% else %}
    Use: they, them, their
    {% endif %}
    {% else %}
    Use: they, them, their
    {% endif %}

    TRACKING PERIOD: {{dayCount}} days

    FEEDING PATTERNS:
    - Total feedings: {{totalFeedings}} (avg {{averageFeedingsPerDay | round(1)}} per day)
    - Total volume: {{totalFeedingMl | round(0)}} ml (avg {{averageMlPerFeeding | round(0)}} ml per feeding)

    SLEEP PATTERNS:
    - Total sleep sessions: {{totalSleeps}}
    - Total sleep: {{totalSleepHours | round(1)}} hours (avg {{averageSleepHoursPerDay | round(1)}} hours per day)
    - Longest sleep stretch: {{longestSleepHours | round(1)}} hours

    DIAPER CHANGES:
    - Total diapers: {{totalDiapers}} (avg {{averageDiapersPerDay | round(1)}} per day)
    - Breakdown: {{wetDiapers}} wet, {{dirtyDiapers}} dirty, {{bothDiapers}} both

    Generate a DoctorQuestionsOutput with:

    1. **summary**:
       - 2-3 sentences summarizing the patterns
       - Highlight notable trends (e.g., "feeding well", "sleep improving", "consistent output")
       - Keep positive but factual tone

    2. **questions**:
       - 5-8 specific questions to ask the doctor
       - Prioritize age-appropriate developmental milestones
       - Include nutrition/growth questions if relevant
       - Ask about any concerning patterns
       - Make questions actionable and specific

       Age-appropriate focus areas:
       {% if ageInDays < 14 %}
       - Newborn concerns: jaundice, weight gain, feeding latch, umbilical cord
       - Sleep: normal newborn sleep patterns, safe sleep
       - Feeding: cluster feeding, frequency, wet/dirty diapers
       {% elif ageInDays < 60 %}
       - 2-month milestones: social smiles, head control, tracking
       - Feeding: growth trajectory, sleep extending
       - Vaccines: 2-month vaccine schedule
       {% elif ageInDays < 120 %}
       - 4-month milestones: rolling, reaching, babbling
       - Sleep: 4-month sleep regression
       - Introduction to solids preparation
       {% else %}
       - Continued motor development
       - Nutrition: solid food introduction and progression
       - Sleep consolidation
       {% endif %}

    3. **concerns**:
       - Flag 0-3 concerns if patterns suggest medical attention needed
       - Only flag genuine concerns, not minor variations
       - Examples of flaggable concerns:
         * Very low diaper output (< 6 per day for newborn)
         * Extremely low or high feeding frequency
         * Significant sleep issues affecting development
         * Concerning patterns in stool output
       - If everything looks normal, return empty array

    TONE: Supportive, evidence-based, empowering parents to ask good questions

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test doctor_questions_newborn {
  functions [GenerateDoctorQuestions]
  args {
    babyName "Emma"
    babySex "F"
    ageInDays 10
    dayCount 7
    totalFeedings 56
    averageFeedingsPerDay 8.0
    totalFeedingMl 1400.0
    averageMlPerFeeding 25.0
    totalSleeps 42
    totalSleepHours 112.0
    averageSleepHoursPerDay 16.0
    longestSleepHours 4.5
    totalDiapers 49
    averageDiapersPerDay 7.0
    wetDiapers 28
    dirtyDiapers 14
    bothDiapers 7
  }
}

test doctor_questions_two_month {
  functions [GenerateDoctorQuestions]
  args {
    babyName "Liam"
    babySex "M"
    ageInDays 60
    dayCount 14
    totalFeedings 98
    averageFeedingsPerDay 7.0
    totalFeedingMl 4200.0
    averageMlPerFeeding 42.9
    totalSleeps 70
    totalSleepHours 210.0
    averageSleepHoursPerDay 15.0
    longestSleepHours 6.0
    totalDiapers 84
    averageDiapersPerDay 6.0
    wetDiapers 50
    dirtyDiapers 20
    bothDiapers 14
  }
}

