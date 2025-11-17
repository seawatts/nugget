// Common types shared across BAML functions

// ============================================================================
// Classes
// ============================================================================

class LearningTip {
  category string @description("Category: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'")
  subtitle string @description("A 4-5 word catchy subtitle that captures the essence of the tip")
  summary string @description("One concise sentence summarizing the tip")
  bulletPoints string[] @description("2-3 actionable bullet points")
  followUpQuestion string @description("A thoughtful follow-up question to engage the parent")
  
  // Yes/No Question Support
  isYesNoQuestion bool? @description("If true, this is a yes/no question (not open-ended). If false or omitted, it's an open-ended question.")
  openChatOnYes bool? @description("Whether to open chat dialog when user clicks 'Yes'. Only relevant if isYesNoQuestion is true.")
  openChatOnNo bool? @description("Whether to open chat dialog when user clicks 'No'. Only relevant if isYesNoQuestion is true.")
  yesResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'Yes' and openChatOnYes is true")
  noResponsePrompt string? @description("Pre-filled chat message to show if user clicks 'No' and openChatOnNo is true")
}

