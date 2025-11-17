// BAML function for Days 1-3 (Immediate Postbirth) learning content
// Stage-specific expertise: meconium, colostrum, cord care, jaundice, first days basics

// ============================================================================
// Functions
// ============================================================================

function GenerateLearningTip_ImmediatePostbirth(
  // Plan item from planner
  category: string,
  title: string,
  subtitle: string,
  relevance: string,
  recommendYesNo: bool,

  // Baby context
  babyName: string,
  babySex: string?,
  ageInDays: int,
  currentWeightOz: int?,
  birthWeightOz: int?,

  // Recent activity
  feedingCount24h: int?,
  avgFeedingInterval: float?,
  sleepCount24h: int?,
  diaperCount24h: int?,

  // Context for personalization
  recentChatTopics: string?,
  achievedMilestones: string?,
  medicalContext: string?
) -> LearningTip {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a newborn care expert specializing in the IMMEDIATE POSTBIRTH period (Days 1-3).

    Your expertise covers:
    - MECONIUM: First black, tarry stools and transition
    - COLOSTRUM: First milk, small amounts, importance
    - CORD CARE: Keeping dry, when it falls off, signs of infection
    - JAUNDICE: When to watch for it, normal vs concerning levels
    - FIRST FEEDING: Latching, frequency, cluster feeding
    - WEIGHT LOSS: Normal to lose 5-10% of birth weight
    - SAFE SLEEP: Back to sleep, firm surface basics
    - WHEN TO CALL DOCTOR: Red flags for Days 1-3

    Ground all information in:
    - AAP (American Academy of Pediatrics) guidelines for newborns
    - CDC infant care recommendations
    - WHO newborn care protocols for first 72 hours

    {{_.role("user")}}
    Generate ONE learning tip for {{babyName}} (Day {{ageInDays}}).

    PLANNED TOPIC:
    - Category: {{category}}
    - Title: {{title}}
    - Subtitle: {{subtitle}}
    - Relevance: {{relevance}}
    - Recommend Yes/No Question: {{recommendYesNo}}

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

    BABY CONTEXT:
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz, change: {{currentWeightOz - birthWeightOz}}oz){% endif %}
    {% if feedingCount24h %}- Feedings (24h): {{feedingCount24h}}{% if avgFeedingInterval %} (avg {{avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if sleepCount24h %}- Sleep sessions (24h): {{sleepCount24h}}{% endif %}
    {% if diaperCount24h %}- Diapers (24h): {{diaperCount24h}}{% endif %}

    {% if recentChatTopics %}Recent parent questions: {{recentChatTopics}}{% endif %}
    {% if achievedMilestones %}Achieved milestones: {{achievedMilestones}}{% endif %}
    {% if medicalContext %}Medical context: {{medicalContext}}{% endif %}

    Generate a LearningTip with:

    1. **category**: Use the planned category: {{category}}

    2. **subtitle**: Use the planned subtitle: {{subtitle}}

    3. **summary**: One sentence (max 12 words) summarizing the tip

    4. **bulletPoints**: 2-3 actionable points (each max 15 words)
       - Focus on Days 1-3 specific guidance
       - Reference {{babyName}}'s data when relevant
       - Be specific to this immediate postbirth period

    5. **followUpQuestion**: ONE focused question (max 15 words)
       {% if recommendYesNo %}
       REQUIRED: Create a YES/NO question for this {{category}} topic.
       - Set isYesNoQuestion: true
       - Examples for Days 1-3:
         * "Has {{babyName}} had a bowel movement in the last 24 hours?"
         * "Is {{babyName}} showing any yellow skin tone?"
         * "Has {{babyName}}'s umbilical cord started to dry?"
         * "Is {{babyName}} latching onto the breast/bottle?"
       {% else %}
       Create an open-ended question about observations or experiences.
       - Set isYesNoQuestion: false
       {% endif %}

    6. **isYesNoQuestion**: {% if recommendYesNo %}true{% else %}false{% endif %}

    7. **openChatOnYes** / **openChatOnNo**:
       {% if recommendYesNo %}
       Decide which answer indicates concern:
       - For health checks (diapers, feeding), openChatOnNo: true if "no" = concern
       - For warning signs (jaundice, distress), openChatOnYes: true if "yes" = concern
       {% else %}
       Leave as null
       {% endif %}

    CRITICAL GUIDELINES FOR DAYS 1-3:
    - Emphasize that many things are NORMAL (weight loss, frequent feeding, dark stools)
    - Provide red flags clearly (no wet diapers in 12h, extreme lethargy, difficulty breathing)
    - Reassure first-time parents
    - Keep language simple and direct
    - Reference AAP/CDC guidelines when giving health advice

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test immediate_postbirth_meconium {
  functions [GenerateLearningTip_ImmediatePostbirth]
  args {
    category "diaper"
    title "First Meconium Diaper"
    subtitle "Baby's First Poop"
    relevance "Riley has had 5 diapers in 24h, tracking early diaper output"
    recommendYesNo true
    babyName "Riley"
    babySex "F"
    ageInDays 2
    currentWeightOz 115
    birthWeightOz 118
    feedingCount24h 10
    diaperCount24h 5
  }
}

test immediate_postbirth_colostrum {
  functions [GenerateLearningTip_ImmediatePostbirth]
  args {
    category "feeding"
    title "Colostrum: Liquid Gold"
    subtitle "Your Baby's First Food"
    relevance "Riley is feeding frequently (10 times in 24h), learning about colostrum"
    recommendYesNo false
    babyName "Riley"
    babySex "F"
    ageInDays 1
    feedingCount24h 10
    avgFeedingInterval 2.4
  }
}

