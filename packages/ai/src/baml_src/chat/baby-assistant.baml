// BAML function for AI chat assistant
// Provides multi-turn conversational support for parents with personalized baby context

// ============================================================================
// Classes
// ============================================================================

class ChatMessage {
  role string @description("The role of the message sender: 'user' or 'assistant'")
  content string @description("The content of the message")
}

class BabyContext {
  babyName string @description("The baby's name")
  ageInDays int @description("Baby's age in days")
  ageInWeeks int @description("Baby's age in weeks")
  currentWeightOz int? @description("Current weight in ounces")
  birthWeightOz int? @description("Birth weight in ounces")
  feedingCount24h int? @description("Number of feedings in last 24 hours")
  avgFeedingInterval float? @description("Average hours between feedings")
  sleepCount24h int? @description("Number of sleep sessions in last 24 hours")
  totalSleepHours24h float? @description("Total hours of sleep in last 24 hours")
  diaperCount24h int? @description("Number of diaper changes in last 24 hours")
}

class BabyAssistantChatOutput {
  response string @description("The AI assistant's response to the user's question")
}

// ============================================================================
// Functions
// ============================================================================

function BabyAssistantChat(
  conversationHistory: ChatMessage[],
  babyContext: BabyContext,
  userQuestion: string,
  systemPrompt: string?
) -> BabyAssistantChatOutput {
  client CustomGPT4o
  prompt #"
    {{_.role("system")}}
    {% if systemPrompt %}{{systemPrompt}}{% else %}You are Nugget, a knowledgeable and empathetic AI parenting assistant specialized in infant care. You provide evidence-based advice while being supportive and encouraging. You have access to the user's baby's data to give personalized guidance.{% endif %}

    Baby Information:
    - Name: {{babyContext.babyName}}
    - Age: {{babyContext.ageInDays}} days ({{babyContext.ageInWeeks}} weeks)
    {% if babyContext.currentWeightOz and babyContext.birthWeightOz %}- Weight: {{babyContext.currentWeightOz}}oz (birth: {{babyContext.birthWeightOz}}oz, {% if babyContext.currentWeightOz > babyContext.birthWeightOz %}gained {{babyContext.currentWeightOz - babyContext.birthWeightOz}}oz{% else %}change {{babyContext.currentWeightOz - babyContext.birthWeightOz}}oz{% endif %}){% endif %}

    {% if babyContext.feedingCount24h or babyContext.sleepCount24h or babyContext.diaperCount24h %}
    Recent Activity (Last 24 hours):
    {% if babyContext.feedingCount24h %}- Feedings: {{babyContext.feedingCount24h}}{% if babyContext.avgFeedingInterval %} (avg {{babyContext.avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if babyContext.sleepCount24h %}- Sleep: {{babyContext.sleepCount24h}} sessions{% if babyContext.totalSleepHours24h %} ({{babyContext.totalSleepHours24h}}h total){% endif %}{% endif %}
    {% if babyContext.diaperCount24h %}- Diapers: {{babyContext.diaperCount24h}} changes{% endif %}
    {% endif %}

    Guidelines:
    - Reference {{babyContext.babyName}}'s actual data when relevant
    - Keep responses conversational and warm
    - Provide actionable advice when appropriate
    - Acknowledge when professional medical advice is needed
    - Use markdown formatting for better readability
    - Be concise but thorough

    {% if conversationHistory|length > 0 %}
    Previous conversation:
    {% for message in conversationHistory %}
    {{message.role}}: {{message.content}}
    {% endfor %}
    {% endif %}

    {{_.role("user")}}
    {{userQuestion}}

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Function for auto-generating chat titles
// ============================================================================

class ChatTitleOutput {
  title string @description("A concise 3-6 word title for the chat based on the topic")
}

function GenerateChatTitle(
  firstUserMessage: string,
  firstAssistantResponse: string
) -> ChatTitleOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a title generator. Create a concise, descriptive title (3-6 words) for this conversation based on the user's first question and the assistant's response.

    {{_.role("user")}}
    User asked: {{firstUserMessage}}

    Assistant responded: {{firstAssistantResponse}}

    Generate a short, clear title that captures the main topic of this conversation. Do not include quotes.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test baby_assistant_first_question {
  functions [BabyAssistantChat]
  args {
    conversationHistory []
    babyContext {
      babyName "Emma"
      ageInDays 14
      ageInWeeks 2
      currentWeightOz 120
      birthWeightOz 115
      feedingCount24h 8
      avgFeedingInterval 3.0
      sleepCount24h 6
      totalSleepHours24h 14.0
      diaperCount24h 8
    }
    userQuestion "How can I help Emma sleep better at night?"
  }
}

test chat_title_generation {
  functions [GenerateChatTitle]
  args {
    firstUserMessage "How can I help Emma sleep better at night?"
    firstAssistantResponse "Here are some age-appropriate tips to help Emma sleep better: establish a bedtime routine, ensure she's well-fed before bed, and create a calm sleep environment."
  }
}

