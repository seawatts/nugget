// BAML function for daily learning content for Days 1-14
// Provides AI-powered daily educational content for new parents

// ============================================================================
// Classes
// ============================================================================

class DailyLearningOutput {
  title string @description("Engaging title for today's learning topic")
  summary string @description("2-3 sentence overview of today's focus")
  keyPoints string[] @description("3-5 research-backed key points")
  practicalTips string[] @description("2-3 actionable tips for today")
  researchNote string @description("Brief mention of supporting research or guidelines")
  developmentalContext string @description("Why this matters for baby's development")
  tips LearningTip[] @description("Array of 2-3 interactive learning tips with follow-up questions")
}

// ============================================================================
// Functions
// ============================================================================

function DailyLearningContent(
  postpartumDay: int,
  babyName: string,
  babySex: string?,
  firstTimeParent: bool,
  // Rich context from database
  recentChatTopics: string?,
  achievedMilestones: string?,
  activitySummary: string?,
  parentWellness: string?,
  medicalContext: string?
) -> DailyLearningOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a newborn care educator providing daily, evidence-based learning content for new parents.

    Ground all information in:
    - AAP (American Academy of Pediatrics) guidelines
    - CDC infant care recommendations
    - WHO newborn care protocols
    - Current peer-reviewed research on infant development and postpartum care

    For each day, provide focused, actionable content that:
    - Addresses what parents need to know TODAY
    - Explains the "why" behind recommendations
    - Builds confidence through knowledge
    - Uses accessible language without oversimplifying
    - References authoritative sources when making health/safety recommendations

    {{_.role("user")}}
    Create educational content for Day {{postpartumDay}} postpartum.

    Baby: {{babyName}}
    {% if babySex %}Sex: {{babySex}}
    CRITICAL: Use grammatically correct pronouns throughout ALL generated content:
    {% if babySex == "M" or babySex == "male" %}
    - Use: he, him, his (e.g., "Watch how he feeds", "His sleep patterns", "Support him")
    {% elif babySex == "F" or babySex == "female" %}
    - Use: she, her, hers (e.g., "Watch how she feeds", "Her sleep patterns", "Support her")
    {% else %}
    - Use: they, them, their (e.g., "Watch how they feed", "Their sleep patterns", "Support them")
    {% endif %}
    {% else %}
    - Use gender-neutral: they, them, their when sex is unknown
    {% endif %}
    {% if firstTimeParent %}This is a first-time parent who needs foundational information.{% endif %}

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

    Content Focus by Day Range:
    - Days 1-3: Immediate postbirth basics - feeding initiation, diaper output expectations, when to call doctor, cord care, jaundice awareness
    - Days 4-7: Establishing routines - milk coming in, cluster feeding, day/night confusion, safe sleep, normal newborn behaviors
    - Days 8-11: Building confidence - reading baby's cues, developmental observations, feeding efficiency, bonding activities
    - Days 12-14: Two-week milestone - preparing for pediatrician visit, what to track, recognizing red flags, developmental expectations

    Provide:

    1. **title**: Engaging, specific title for today's topic (e.g., "Day 3: When Milk Comes In", "Day 10: Reading Your Baby's Cues")

    2. **summary**: 2-3 sentences setting context for today's focus and why it matters now

    3. **keyPoints**: 3-5 research-backed key points parents should know today
       - Start with evidence when available: "AAP recommends...", "Research shows...", "WHO guidelines indicate..."
       - Explain the developmental or physiological basis
       - Address common misconceptions
       - Include normal ranges, not single expectations

    4. **practicalTips**: 2-3 concrete, actionable tips parents can implement today
       - Specific and achievable
       - Evidence-based when possible
       - Relevant to {{babyName}}'s current age

    5. **researchNote**: One concise sentence citing supporting research or guidelines
       - Reference specific organizations (AAP, CDC, WHO, ACOG)
       - Mention relevant studies or guidelines when appropriate
       - Example: "These recommendations align with AAP's newborn care guidelines and CDC feeding best practices."

    6. **developmentalContext**: 2-3 sentences explaining WHY this matters for {{babyName}}'s short and long-term development
       - Connect today's content to developmental milestones
       - Explain underlying neuroscience or physiology in accessible terms
       - Build parent's understanding of cause and effect

    7. **tips**: Array of 2-3 interactive learning tips with follow-up questions
       For each tip:
       - category: Choose one of: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'
       - subtitle: A catchy 4-5 word subtitle (max 5 words)
       - summary: One concise sentence (max 12 words)
       - bulletPoints: 2-3 actionable points (each bullet max 15 words)
       - followUpQuestion: A thoughtful question to engage the parent

       CRITICAL YES/NO QUESTION REQUIREMENTS:

       * MANDATORY: At least ONE tip MUST have isYesNoQuestion: true
       * DEFAULT RULE: If the question can be answered with yes/no, SET isYesNoQuestion: true

       * YES/NO QUESTIONS (isYesNoQuestion: true) - Use for health/safety/binary checks:
         - Health: "Has {{babyName}} had a bowel movement today?"
         - Safety: "Is {{babyName}} showing signs of jaundice?"
         - Binary: "Does {{babyName}} startle at loud noises?"
         - Feeding: "Is {{babyName}} latching well during feedings?"

       * When isYesNoQuestion: true, you MUST set openChatOnNo and/or openChatOnYes:
         - openChatOnNo: true → If "no" needs support (e.g., no wet diapers, not eating)
         - openChatOnYes: true → If "yes" needs support (e.g., showing distress, jaundice)
         - ALWAYS provide the corresponding prompt (noResponsePrompt or yesResponsePrompt)

       * OPEN-ENDED QUESTIONS (isYesNoQuestion: false) - Use for qualitative details:
         - "What feeding cues did {{babyName}} show?"
         - "How does {{babyName}} respond during tummy time?"

       DECISION TREE FOR EACH TIP:
       1. Can this be answered yes/no? → isYesNoQuestion: true
       2. Does it need qualitative details? → isYesNoQuestion: false
       3. For 'diaper' or 'health' categories → PREFER isYesNoQuestion: true

    Keep tone:
    - Supportive and educational
    - Confident but not prescriptive
    - Evidence-based but empathetic
    - Empowering rather than overwhelming

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test daily_learning_day_3 {
  functions [DailyLearningContent]
  args {
    postpartumDay 3
    babyName "Riley"
    babySex "F"
    firstTimeParent true
  }
}

test daily_learning_day_7 {
  functions [DailyLearningContent]
  args {
    postpartumDay 7
    babyName "Jordan"
    babySex "M"
    firstTimeParent false
  }
}

test daily_learning_day_14 {
  functions [DailyLearningContent]
  args {
    postpartumDay 14
    babyName "Alex"
    babySex null
    firstTimeParent true
  }
}

