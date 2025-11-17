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
  sleepCount24h: int?,
  // Rich context from database
  recentChatTopics: string?,
  achievedMilestones: string?,
  activitySummary: string?,
  parentWellness: string?,
  medicalContext: string?
) -> NewbornMilestoneOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing age-appropriate milestone information based on:
    - AAP Bright Futures developmental surveillance guidelines
    - CDC "Learn the Signs. Act Early" milestones
    - WHO Multicentre Growth Reference Study
    - Current peer-reviewed pediatric research on infant development

    Ground all milestone information in these evidence-based sources.
    When discussing milestones, explain the developmental significance and reference typical ranges (not single ages).

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
    {% if firstPregnancy %}Parents are first-timers.{% endif %}

    Baby: {{babyName}}
    {% if babySex %}Sex: {{babySex}}
    CRITICAL: Use grammatically correct pronouns throughout ALL generated content:
    {% if babySex == "M" or babySex == "male" %}
    - Use: he, him, his (e.g., "Watch how he tracks objects", "His head control", "Encourage him")
    {% elif babySex == "F" or babySex == "female" %}
    - Use: she, her, hers (e.g., "Watch how she tracks objects", "Her head control", "Encourage her")
    {% else %}
    - Use: they, them, their (e.g., "Watch how they track objects", "Their head control", "Encourage them")
    {% endif %}
    {% else %}
    - Use gender-neutral: they, them, their when sex is unknown
    {% endif %}

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

    {% if recentChatTopics %}
    ═══════════════════════════════════════════════════════════════
    RECENT DISCUSSION CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{recentChatTopics}}
    {% endif %}

    {% if achievedMilestones %}
    ═══════════════════════════════════════════════════════════════
    RECENTLY ACHIEVED MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{achievedMilestones}}
    {% endif %}

    {% if activitySummary %}
    ═══════════════════════════════════════════════════════════════
    DETAILED ACTIVITY SUMMARY (LAST 3 DAYS)
    ═══════════════════════════════════════════════════════════════
    {{activitySummary}}
    {% endif %}

    {% if parentWellness %}
    ═══════════════════════════════════════════════════════════════
    PARENT WELLNESS CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{parentWellness}}
    {% endif %}

    {% if medicalContext %}
    ═══════════════════════════════════════════════════════════════
    MEDICAL CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{medicalContext}}
    {% endif %}

    For each tip, provide:
    - category: Choose one of: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'
    - subtitle: A catchy 4-5 word subtitle (max 5 words)
    - summary: One concise sentence (max 12 words)
    - bulletPoints: 2-3 actionable bullet points (each bullet max 15 words)
    - followUpQuestion: ONE focused question

    CRITICAL YES/NO QUESTION REQUIREMENTS:

    * MANDATORY: At least TWO tips MUST have isYesNoQuestion: true
    * DEFAULT RULE: If the question can be answered with yes/no, SET isYesNoQuestion: true

    * YES/NO QUESTIONS (isYesNoQuestion: true) - PREFERRED for health/milestones:
      Examples:
      - "Has {{babyName}} had a wet diaper in the last 12 hours?"
      - "Is {{babyName}} tracking your face when you move?"
      - "Does {{babyName}} startle at loud noises?"
      - "Is {{babyName}} starting to smile at you?"
      - "Has {{babyName}} had a bowel movement today?"

    * When isYesNoQuestion: true, you MUST set openChatOnNo and/or openChatOnYes:
      - openChatOnNo: true → If "no" needs support (e.g., no wet diapers, not eating)
      - openChatOnYes: true → If "yes" needs support (e.g., showing distress)
      - ALWAYS provide the corresponding prompt

    * OPEN-ENDED QUESTIONS (isYesNoQuestion: false) - Use for qualitative details:
      - "What new sounds has {{babyName}} made today?"
      - "What does {{babyName}} do during tummy time?"

    DECISION TREE FOR EACH TIP:
    1. Can this be answered yes/no? → isYesNoQuestion: true
    2. Does it need qualitative details? → isYesNoQuestion: false
    3. For 'health' or 'diaper' categories → ALWAYS use isYesNoQuestion: true

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

