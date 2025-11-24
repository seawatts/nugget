import type {
  LearningContent,
  QuickButton,
} from '../activities/feeding/learning-content';

/**
 * Convert volume values in learning content based on unit preference
 * This handles converting "4oz (120ml)" to just "120ml" or "4oz" based on preference
 */
export function convertLearningContentUnits(
  content: LearningContent,
  unit: 'ML' | 'OZ',
): LearningContent {
  if (!content.quickButtons) return content;

  const convertedButtons = content.quickButtons.map((button) =>
    convertQuickButtonUnits(button, unit),
  );

  return {
    ...content,
    quickButtons: convertedButtons,
  };
}

/**
 * Convert a single quick button's value based on unit preference
 */
function convertQuickButtonUnits(
  button: QuickButton,
  unit: 'ML' | 'OZ',
): QuickButton {
  const { value } = button;

  // Pattern matches:
  // - "4oz (120ml)" -> extract ml and convert if needed
  // - "25 min" -> leave as is
  // - "1h" -> leave as is
  // - "Wet" / "Dirty" / "Both" -> leave as is
  // - "Live" -> leave as is

  // Check if this is a volume value
  const volumeMatch = value.match(/(\d+(?:\.\d+)?)oz\s*\((\d+)ml\)/);

  if (volumeMatch) {
    const ozValue = Number.parseFloat(volumeMatch[1]);
    const mlValue = Number.parseInt(volumeMatch[2], 10);

    if (unit === 'OZ') {
      return {
        ...button,
        value: `${ozValue}oz`,
      };
    }
    return {
      ...button,
      value: `${mlValue}ml`,
    };
  }

  // If it's not a volume, return as is
  return button;
}
