// BAML function for enhancing milestone cards with rich content
// Generates bullet points and follow-up questions for milestone program cards

// ============================================================================
// Classes
// ============================================================================

class MilestoneEnhancementOutput {
  subtitle string @description("A catchy subtitle (max 5 words)")
  summary string @description("One sentence summary (max 20 words)")
  bulletPoints string[] @description("2-3 developmental tips (each max 12 words)")
  followUpQuestion string @description("ONE focused question (max 15 words)")

  // Yes/No Question Support - MANDATORY for milestones
  isYesNoQuestion bool @description("MUST be true for all milestone questions. Milestones require yes/no answers to track achievement.")
  openChatOnYes bool? @description("Whether to open chat dialog when user clicks 'Yes'. Set to true for celebration/discussion.")
  openChatOnNo bool? @description("Whether to open chat dialog when user clicks 'No'. Set to true for guidance/support.")
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

    1. **subtitle**: A catchy subtitle (max 5 words)
       - Captures the essence of the milestone
       - Engaging and memorable for parents

    2. **summary**: One sentence (max 20 words)
       {% if babyName %}Use {{babyName}}'s name{% endif %}

    3. **bulletPoints**: 2-3 actionable bullet points (each max 12 words):
       - What parents might observe
       - Why this milestone matters
       - One practical suggestion

    4. **followUpQuestion**: ONE focused question (max 15 words)
       * Ask ONE question only - NO compound questions
       * Use {% if babyName %}{{babyName}}'s{% else %}baby's{% endif %} name

    CRITICAL YES/NO QUESTION REQUIREMENTS:

    * MANDATORY RULE: isYesNoQuestion MUST ALWAYS be true for ALL milestones
    * Milestones track binary achievement - always ask yes/no questions
    * Open-ended questions are NOT ALLOWED for milestone cards

    * YES/NO QUESTION EXAMPLES (isYesNoQuestion: true) - REQUIRED:
      - "Is {% if babyName %}{{babyName}}{% else %}baby{% endif %} showing this behavior?"
      - "Has {% if babyName %}{{babyName}}{% else %}baby{% endif %} achieved this milestone?"
      - "Does {% if babyName %}{{babyName}}{% else %}baby{% endif %} do this during activities?"
      - "Have you noticed {% if babyName %}{{babyName}}{% else %}baby{% endif %} doing this?"

    * When isYesNoQuestion: true, you MUST set openChatOnYes or openChatOnNo (or both):
      - openChatOnYes: true → For celebration/discussion (milestone achieved)
      - openChatOnNo: true → For guidance (milestone not yet seen)
      - Both can be true if discussion is valuable either way

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

