// BAML function for enhancing milestone cards with rich content
// Generates bullet points and follow-up questions for milestone program cards

// ============================================================================
// Classes
// ============================================================================

class MilestoneEnhancementOutput {
  bulletPoints string[] @description("3-5 developmental tips and what parents should look for related to this milestone")
  followUpQuestion string @description("ONE focused, practical question that prompts the parent to share specific observations about this milestone")
  summary string @description("A concise 1-2 sentence summary of what this milestone means")
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
  ageInDays: int?
) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert providing warm, educational content about baby milestones to parents.

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
    {% if ageInDays %}Age in days: {{ageInDays}}{% endif %}

    Provide:

    1. **bulletPoints**: 3-5 actionable bullet points that include:
       - What parents might observe when this milestone is happening
       - Why this milestone is important for development
       - Practical suggestions for supporting this milestone
       - Things to watch for or developmental connections
       Keep bullet points concise and practical (1-2 sentences each)

    2. **followUpQuestion**: ONE focused, practical question that prompts the parent to share specific observations
       * Ask ONE question only - NO compound questions with "and" or multiple parts
       * CRITICAL: We already track COUNTS and DURATIONS (number of feedings, activities, sessions, etc.)
       * DON'T ask about quantities we're already tracking
       * DO ask about DEVELOPMENTAL OBSERVATIONS, BEHAVIORS, or MILESTONES we don't have:
         - What specific behaviors or reactions have you noticed?
         - How does the baby respond in certain situations?
         - What new abilities or skills have you observed?
       * Ask about developmental milestones, reactions, or behaviors that provide INSIGHT beyond raw data
       * Keep it simple, direct, and non-judgmental
       * Avoid quiz-like or educational testing questions
       * Use {% if babyName %}{{babyName}}'s{% else %}baby's{% endif %} when referring to the baby
       * IMPORTANT: Each question must stand alone and ask about ONE thing only

    3. **summary**: A warm, concise 1-2 sentence summary of what this milestone means and why it matters
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

