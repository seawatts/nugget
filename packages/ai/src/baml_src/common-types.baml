// Common types shared across BAML functions

// ============================================================================
// Classes
// ============================================================================

class LearningTip {
  category string @description("Category: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'")
  subtitle string @description("A catchy subtitle (max 5 words)")
  summary string @description("One concise sentence (max 12 words)")
  bulletPoints string[] @description("2-3 actionable bullet points (each max 15 words)")
  followUpQuestion string @description("A focused follow-up question (max 15 words)")

  // Yes/No Question Support
  isYesNoQuestion bool? @description("If true, this is a yes/no question (not open-ended). If false or omitted, it's an open-ended question.")
  openChatOnYes bool? @description("Whether to open chat dialog when user clicks 'Yes'. Only relevant if isYesNoQuestion is true.")
  openChatOnNo bool? @description("Whether to open chat dialog when user clicks 'No'. Only relevant if isYesNoQuestion is true.")
  yesResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'Yes' and openChatOnYes is true")
  noResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'No' and openChatOnNo is true")
}

