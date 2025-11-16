// BAML function for personalized parent task suggestions
// Provides AI-powered daily task lists based on role, time of day, and baby's age

// ============================================================================
// Classes
// ============================================================================

class ParentTask {
  taskText string @description("Clear, actionable task description")
  category string @description("Category: 'baby_care', 'household', 'self_care', 'relationship', or 'preparation'")
  priority string @description("Priority: 'high', 'medium', or 'low'")
  suggestedTime string @description("Suggested time: 'morning', 'afternoon', 'evening', 'anytime'")
  estimatedMinutes int @description("Estimated time to complete in minutes")
  whyItMatters string @description("Brief explanation of why this task is important now")
}

class PersonalizedTasksOutput {
  tasks ParentTask[] @description("5-8 personalized tasks for today")
  motivationalMessage string @description("Brief, encouraging message to start the day")
}

// ============================================================================
// Functions
// ============================================================================

function PersonalizedTasks(
  babyAgeInDays: int,
  ppWeek: int,
  timeOfDay: string,
  feedingMethod: string
) -> PersonalizedTasksOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a supportive parenting coach creating personalized daily task suggestions.

    Your role is to:
    - Suggest realistic, achievable tasks for busy new parents
    - Balance baby care, household, self-care, and relationship maintenance
    - Adapt suggestions to baby's developmental stage
    - Provide context on WHY tasks matter (builds motivation)
    - Be encouraging and realistic (not overwhelming!)

    Task Guidelines:
    - Keep tasks specific and actionable
    - Consider time of day and energy levels
    - Mix quick wins (5-10 min) with longer tasks
    - Include at least one self-care item
    - Adapt to feeding method (breastfeeding vs bottle feeding logistics)
    - Reference baby's age when relevant

    Priority Guidelines:
    - HIGH: Safety, urgent medical needs, critical self-care (when exhausted)
    - MEDIUM: Routine care, household maintenance, relationship check-ins
    - LOW: Nice-to-haves, preparation for future stages

    Time-of-Day Adaptation:
    - MORNING: Energetic tasks, meal prep, planning, outdoor activities
    - AFTERNOON: Flexible tasks that can be done during naps, one-handed tasks
    - EVENING: Wind-down activities, partner connection, next-day prep
    - ANYTIME: Can be done whenever convenient

    {{_.role("user")}}
    Create 5-8 personalized tasks for a parent.

    Context:
    - Baby age: {{babyAgeInDays}} days old
    - Postpartum week: {{ppWeek}}
    - Time of day: {{timeOfDay}}
    - Feeding method: {{feedingMethod}}

    {% if babyAgeInDays <= 7 %}
    NOTE: Very early postpartum. Keep tasks minimal and focused on recovery + survival.
    {% elif babyAgeInDays <= 14 %}
    NOTE: Still early postpartum. Balance recovery with establishing routines.
    {% elif babyAgeInDays <= 42 %}
    NOTE: Mid-postpartum. Can handle more tasks but still need rest and support.
    {% else %}
    NOTE: Later postpartum. Can include more planning and preparation tasks.
    {% endif %}

    {% if feedingMethod == "breastfeeding" %}
    Consider: Nursing-friendly tasks, one-handed activities, hydration reminders
    {% elif feedingMethod == "bottle" %}
    Consider: Bottle prep/cleaning, formula organization, feeding schedule coordination
    {% else %}
    Consider: Mixed feeding logistics, both nursing and bottle needs
    {% endif %}

    For each task:
    - taskText: Specific, clear action (e.g., "Put together a snack basket for the living room" not "Get food")
    - category: What type of task it is
    - priority: How important/urgent
    - suggestedTime: Best time of day for this task
    - estimatedMinutes: Realistic time estimate
    - whyItMatters: Brief reason why this helps (builds motivation and understanding)

    Also provide:
    - motivationalMessage: An encouraging 1-2 sentence message for the parent

    Make tasks:
    - Realistic for sleep-deprived parents
    - Varied in duration and difficulty
    - Supportive, not demanding
    - Helpful reminders they might forget

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test personalized_tasks_morning_newborn {
  functions [PersonalizedTasks]
  args {
    babyAgeInDays 5
    ppWeek 1
    timeOfDay "morning"
    feedingMethod "breastfeeding"
  }
}

test personalized_tasks_evening_month_old {
  functions [PersonalizedTasks]
  args {
    babyAgeInDays 30
    ppWeek 4
    timeOfDay "evening"
    feedingMethod "mixed"
  }
}

