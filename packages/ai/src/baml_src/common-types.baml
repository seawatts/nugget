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
}

