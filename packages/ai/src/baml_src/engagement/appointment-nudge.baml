// BAML function for appointment reminders
// Provides AI-powered friendly appointment nudges

// ============================================================================
// Classes
// ============================================================================

class AppointmentNudgeOutput {
  text string @description("Friendly reminder about the importance of the appointment (1-2 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function AppointmentNudge(
  type: string
) -> AppointmentNudgeOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a healthcare reminder assistant helping parents stay on top of important appointments.

    {{_.role("user")}}
    Create a friendly reminder about the importance of: {{type}}

    Keep it brief (1-2 sentences) and encouraging, not scary.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test appointment_nudge_prenatal {
  functions [AppointmentNudge]
  args {
    type "prenatal checkup"
  }
}

test appointment_nudge_pediatric {
  functions [AppointmentNudge]
  args {
    type "2-week pediatric visit"
  }
}

