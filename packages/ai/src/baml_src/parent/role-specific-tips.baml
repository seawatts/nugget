// BAML function for role-specific parent tips
// Provides AI-powered tips tailored to parent role (mom, partner, caregiver)

// ============================================================================
// Classes
// ============================================================================

class ParentTip {
  title string @description("Catchy 4-6 word title")
  content string @description("2-3 sentences with practical advice")
  actionItems string[] @description("1-3 specific action items")
  relevantToRole string @description("Why this tip matters for this specific role")
}

class RoleSpecificTipsOutput {
  tips ParentTip[] @description("3-5 role-specific tips")
}

// ============================================================================
// Functions
// ============================================================================

function RoleSpecificTips(
  parentRole: string,
  ppDay: int?,
  babyAgeInDays: int,
  babyName: string?,
  babySex: string?,
  topic: string,
  recentSleepHours: float?,
  concerns: string[]?,
  // Rich context from database
  recentChatTopics: string?,
  achievedMilestones: string?,
  activitySummary: string?,
  parentWellness: string?,
  medicalContext: string?
) -> RoleSpecificTipsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a specialized parenting coach providing role-specific support and guidance grounded in evidence-based research.

    Your expertise includes:
    - Postpartum recovery for birthing parents
    - Partner support strategies
    - Sleep deprivation coping
    - Mental health awareness
    - Bonding and attachment
    - Relationship maintenance during postpartum
    - Practical household management

    Role Differences:

    PRIMARY CAREGIVER (usually mom):
    - Physical recovery from birth
    - Breastfeeding challenges and support
    - Hormonal changes and mood
    - Primary bonding and constant care
    - Need for support and breaks
    - Identity adjustment

    PARTNER:
    - Supporting the primary caregiver
    - Finding their role and bonding
    - Feeling left out or uncertain
    - Managing household and logistics
    - Their own mental health
    - Maintaining relationship

    CAREGIVER (grandparent, nanny, etc.):
    - Supporting parents' approach
    - Respecting boundaries
    - Providing practical help
    - Not overstepping
    - Updated baby care info

    {{_.role("user")}}
    Create 3-5 tips for this parent.

    Context:
    - Role: {{parentRole}}
    {% if ppDay %}- Postpartum day: {{ppDay}}{% endif %}
    - Baby age: {{babyAgeInDays}} days
    {% if babyName %}- Baby: {{babyName}}{% endif %}
    {% if babySex %}Sex: {{babySex}}
    CRITICAL: Use grammatically correct pronouns when referencing the baby:
    {% if babySex == "M" or babySex == "male" %}
    - Use: he, him, his (e.g., "When he cries", "Comfort him", "His needs")
    {% elif babySex == "F" or babySex == "female" %}
    - Use: she, her, hers (e.g., "When she cries", "Comfort her", "Her needs")
    {% else %}
    - Use: they, them, their (e.g., "When they cry", "Comfort them", "Their needs")
    {% endif %}
    {% else %}
    - Use gender-neutral: they, them, their when sex is unknown
    {% endif %}
    - Topic focus: {{topic}}
    {% if recentSleepHours %}- Recent sleep: {{recentSleepHours}}h{% endif %}
    {% if concerns and concerns|length > 0 %}- Recent concerns: {{concerns|join(", ")}}{% endif %}

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

    Topic Guidance:
    {% if topic == "sleep_deprivation" %}
    Focus on: Coping strategies, sleep optimization, when to ask for help, safety while exhausted
    {% elif topic == "postpartum_recovery" %}
    Focus on: Physical healing, warning signs, self-care, managing expectations, when to call doctor
    {% elif topic == "partner_support" %}
    Focus on: How to help effectively, bonding with baby, supporting birthing parent, maintaining connection
    {% elif topic == "mental_health_support" %}
    Focus on: Recognizing warning signs, coping strategies, when to seek help, reducing stigma
    {% elif topic == "feeding_support" %}
    Focus on: Common challenges, when to seek help, supporting parent's choice, practical tips
    {% else %}
    Focus on: Practical, actionable advice relevant to their role and baby's age
    {% endif %}

    For each tip:
    - title: Clear, engaging title
    - content: 2-3 sentences explaining the tip
    - actionItems: 1-3 specific things they can do NOW
    - relevantToRole: One sentence on why this matters for THEIR specific role

    Make tips:
    - Evidence-based when possible - reference research findings
    - Cite AAP, WHO, or ACOG guidelines for medical/health advice
    - Distinguish between "research shows" and "many parents find"
    - Acknowledge where evidence is limited
    - Include phrases like "Studies suggest", "Research indicates", "AAP recommends"
    - Specific to their role's unique needs and challenges
    - Actionable and practical (not just "be positive")
    - Empathetic and non-judgmental
    - Acknowledge the difficulty of their situation
    - Empower them with knowledge and choices

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test role_tips_mom_postpartum_recovery {
  functions [RoleSpecificTips]
  args {
    parentRole "primary"
    ppDay 7
    babyAgeInDays 7
    topic "postpartum_recovery"
    recentSleepHours 5.5
  }
}

test role_tips_partner_support {
  functions [RoleSpecificTips]
  args {
    parentRole "partner"
    ppDay 14
    babyAgeInDays 14
    topic "partner_support"
    recentSleepHours 6.0
  }
}

test role_tips_sleep_deprivation {
  functions [RoleSpecificTips]
  args {
    parentRole "primary"
    ppDay 21
    babyAgeInDays 21
    topic "sleep_deprivation"
    recentSleepHours 3.5
    concerns ["exhausted", "overwhelmed"]
  }
}

