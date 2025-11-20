// BAML function for generating intelligent contextual questions for celebrations
// Plans 3 types of questions: milestone-focused, memory-creation, and guidance

// ============================================================================
// Classes
// ============================================================================

class CelebrationQuestion {
  question string @description("The question to ask (max 25 words)")
  systemPrompt string @description("Custom system prompt for AI chat context (2-3 sentences)")
  buttonLabel string @description("Short button text (max 3 words, e.g., 'Track Milestone', 'Share Memory', 'Get Advice')")
  icon string @description("Emoji icon for the button")
}

class CelebrationQuestionsOutput {
  milestone CelebrationQuestion @description("Yes/no or observational question about baby's development")
  memory CelebrationQuestion @description("Open-ended question to capture special moments and memories")
  guidance CelebrationQuestion @description("Forward-looking question about what to expect or tips")
}

// ============================================================================
// Functions
// ============================================================================

function PlanCelebrationQuestions(
  babyName: string,
  ageInDays: int,
  ageLabel: string,
  celebrationType: string,
  celebrationTitle: string,
  babyId: string,
  birthDate: string,
  gender: string?,
  currentWeightOz: float?,
  birthWeightOz: float?,
  activitySummary: string?,
  achievedMilestones: string?,
  medicalRecords: string?,
  parentWellness: string?,
  recentChatTopics: string?
) -> CelebrationQuestionsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are an AI planning assistant that generates intelligent, contextual questions for parents celebrating their baby's milestones.

    Your role:
    - Analyze all available context about the baby, parents, and their journey
    - Generate 3 distinct types of questions that are personalized and relevant
    - Each question should feel natural and purposeful
    - Questions should encourage engagement and conversation

    QUESTION TYPES:

    1. **Milestone Question**:
       - Focus on developmental observations
       - Can be yes/no ("Has {{babyName}} started...?") or observational
       - Grounded in age-appropriate milestones
       - Helps parents track development

    2. **Memory Question**:
       - Open-ended and emotional
       - Encourages parents to capture special moments
       - Personal and reflective
       - Creates lasting memories

    3. **Guidance Question**:
       - Forward-looking and practical
       - About what's coming next or current challenges
       - Actionable advice-seeking
       - Empowers parents with knowledge

    For each question:
    - Keep questions under 25 words
    - Use {{babyName}}'s name when natural
    - Make it specific to their situation
    - Create a custom system prompt that gives AI context for answering
    - Choose a button label (max 3 words)
    - Pick a relevant emoji icon

    {{_.role("user")}}
    Generate celebration questions for {{babyName}}.

    ═══════════════════════════════════════════════════════════════
    CELEBRATION CONTEXT
    ═══════════════════════════════════════════════════════════════
    Type: {{celebrationType}}
    Title: {{celebrationTitle}}
    Age: {{ageInDays}} days ({{ageLabel}})

    ═══════════════════════════════════════════════════════════════
    BABY DETAILS
    ═══════════════════════════════════════════════════════════════
    Baby ID: {{babyId}}
    Birth Date: {{birthDate}}
    {% if gender %}Gender: {{gender}}{% endif %}
    {% if currentWeightOz %}Current Weight: {{currentWeightOz}} oz{% endif %}
    {% if birthWeightOz %}Birth Weight: {{birthWeightOz}} oz{% endif %}

    {% if activitySummary %}
    ═══════════════════════════════════════════════════════════════
    RECENT ACTIVITIES (48H)
    ═══════════════════════════════════════════════════════════════
    {{activitySummary}}
    {% endif %}

    {% if achievedMilestones %}
    ═══════════════════════════════════════════════════════════════
    ACHIEVED MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{achievedMilestones}}
    {% endif %}

    {% if medicalRecords %}
    ═══════════════════════════════════════════════════════════════
    MEDICAL CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{medicalRecords}}
    {% endif %}

    {% if parentWellness %}
    ═══════════════════════════════════════════════════════════════
    PARENT WELLNESS
    ═══════════════════════════════════════════════════════════════
    {{parentWellness}}
    {% endif %}

    {% if recentChatTopics %}
    ═══════════════════════════════════════════════════════════════
    RECENT CHAT TOPICS
    ═══════════════════════════════════════════════════════════════
    {{recentChatTopics}}
    {% endif %}

    Generate 3 distinct, personalized questions:

    1. **milestone**: A development-tracking question appropriate for {{ageLabel}}
       - System prompt should give AI context about developmental expectations

    2. **memory**: An open-ended question to capture this special moment
       - System prompt should make AI warm and memory-focused

    3. **guidance**: A forward-looking question about what's next
       - System prompt should give AI context to provide actionable advice

    Make each question:
    - Specific to {{babyName}}'s age and context
    - Natural and conversational
    - Purposeful and engaging
    - Under 25 words
  "#
}

