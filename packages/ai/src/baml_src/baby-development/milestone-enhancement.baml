// BAML function for enhancing milestone cards with rich content
// Generates bullet points and follow-up questions for milestone program cards

// ============================================================================
// Classes
// ============================================================================

class MilestoneEnhancementOutput {
  bulletPoints string[] @description("3-5 developmental tips and what parents should look for related to this milestone (each max 20 words)")
  followUpQuestion string @description("ONE focused, practical question that prompts the parent to share specific observations about this milestone")
  summary string @description("A concise 1-2 sentence summary of what this milestone means (max 30 words total)")

  // Yes/No Question Support
  isYesNoQuestion bool? @description("If true, this is a yes/no question (not open-ended). If false or omitted, it's an open-ended question.")
  openChatOnYes bool? @description("Whether to open chat dialog when user clicks 'Yes'. Only relevant if isYesNoQuestion is true.")
  openChatOnNo bool? @description("Whether to open chat dialog when user clicks 'No'. Only relevant if isYesNoQuestion is true.")
  yesResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'Yes' and openChatOnYes is true")
  noResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'No' and openChatOnNo is true")
}

// ============================================================================
// Functions
// ============================================================================

function EnhanceMilestone(
  milestoneTitle: string,
  milestoneDescription: string,
  milestoneType: string,
  ageLabel: string,
  babyName: string?,
  babySex: string?,
  ageInDays: int?,
  // Rich context from database
  recentChatTopics: string?,
  achievedMilestones: string?,
  activitySummary: string?,
  parentWellness: string?,
  medicalContext: string?
) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing warm, educational content about baby milestones to parents,
    grounded in evidence-based research from AAP, CDC, and peer-reviewed developmental psychology.

    For each milestone enhancement:
    - Explain the developmental neuroscience in accessible terms (e.g., "neural pathways", "motor cortex", "sensory integration")
    - Reference research on why this milestone matters for future development
    - Note the typical age range for this milestone (not just a single age)
    - Connect to future developmental stages this milestone prepares for
    - Distinguish evidence-based guidance from cultural practices where relevant
    - Use phrases like "Research shows...", "Developmental studies indicate...", "AAP guidelines suggest..."

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
    Enhance this milestone with rich content:

    Milestone: {{milestoneTitle}}
    Description: {{milestoneDescription}}
    Type: {{milestoneType}}
    Age: {{ageLabel}}
    {% if babyName %}Baby's name: {{babyName}}{% endif %}
    {% if babySex %}Sex: {{babySex}}
    CRITICAL: Use grammatically correct pronouns throughout ALL generated content:
    {% if babySex == "M" or babySex == "male" %}
    - Use: he, him, his (e.g., "Watch how he develops", "His progress", "Encourage him")
    {% elif babySex == "F" or babySex == "female" %}
    - Use: she, her, hers (e.g., "Watch how she develops", "Her progress", "Encourage her")
    {% else %}
    - Use: they, them, their (e.g., "Watch how they develop", "Their progress", "Encourage them")
    {% endif %}
    {% else %}
    - Use gender-neutral: they, them, their when sex is unknown
    {% endif %}
    {% if ageInDays %}Age in days: {{ageInDays}}{% endif %}

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

    Provide:

    1. **bulletPoints**: 3-5 actionable bullet points (each max 20 words) that include:
       - What parents might observe when this milestone is happening
       - Why this milestone is important for development
       - Practical suggestions for supporting this milestone
       - Things to watch for or developmental connections

    2. **followUpQuestion**: ONE focused, practical question that prompts the parent to share specific observations
       * Ask ONE question only - NO compound questions with "and" or multiple parts
       * CRITICAL: We already track COUNTS and DURATIONS (number of feedings, activities, sessions, etc.)
       * DON'T ask about quantities we're already tracking
       * DO ask about DEVELOPMENTAL OBSERVATIONS, BEHAVIORS, or MILESTONES
       * Keep it simple, direct, and non-judgmental
       * Use {% if babyName %}{{babyName}}'s{% else %}baby's{% endif %} when referring to the baby

    FOLLOW-UP QUESTION TYPE - Decide between yes/no and open-ended:

    * YES/NO QUESTIONS - Set isYesNoQuestion: true for milestone-specific binary questions:
      Examples:
      - "Is {% if babyName %}{{babyName}}{% else %}baby{% endif %} showing this milestone behavior?"
      - "Has {% if babyName %}{{babyName}}{% else %}baby{% endif %} achieved this milestone yet?"
      - "Does {% if babyName %}{{babyName}}{% else %}baby{% endif %} respond when you try this activity?"

    * For yes/no questions, decide which answer(s) should open chat:
      - openChatOnYes: true if "yes" warrants celebration or discussion
      - openChatOnNo: true if "no" warrants developmental guidance
      - Provide helpful pre-filled prompts:
        * yesResponsePrompt: Celebratory or discussion message for "yes"
        * noResponsePrompt: Supportive guidance message for "no"

    * OPEN-ENDED QUESTIONS - Set isYesNoQuestion: false for qualitative questions:
      Examples:
      - "What behaviors have you noticed related to this milestone?"
      - "How does {% if babyName %}{{babyName}}{% else %}baby{% endif %} respond when you try this activity?"

    * Question Type Guidelines:
      - Use YES/NO for: Binary milestone achievements, specific behaviors (present/not present)
      - Use OPEN-ENDED for: Qualitative observations, developmental details, parent reflections

    3. **summary**: A warm, concise summary of what this milestone means (max 30 words total)
       {% if babyName %}Use {{babyName}}'s name naturally in the summary{% endif %}

    Keep the tone:
    - Warm and supportive
    - Educational but not overwhelming
    - Evidence-based but accessible
    - Non-judgmental and reassuring
    - Emphasize that development has a range, not a rigid timeline

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test enhance_first_smile {
  functions [EnhanceMilestone]
  args {
    milestoneTitle "More Alert and Responsive"
    milestoneDescription "Baby becomes more alert and responsive to sounds and faces."
    milestoneType "cognitive"
    ageLabel "Week 1"
    babyName "Riley"
    ageInDays 7
  }
}

test enhance_head_control {
  functions [EnhanceMilestone]
  args {
    milestoneTitle "Holds Head Up During Tummy Time"
    milestoneDescription "Baby can lift and hold their head up for a few seconds during tummy time."
    milestoneType "physical"
    ageLabel "Week 6"
    babyName "Alex"
    ageInDays 42
  }
}

test enhance_social_smile {
  functions [EnhanceMilestone]
  args {
    milestoneTitle "First Social Smile"
    milestoneDescription "Baby begins smiling in response to faces and voices."
    milestoneType "social"
    ageLabel "Week 8"
    babyName null
    ageInDays null
  }
}

