export function clearAppLocalStorage(): void {
  const keysToRemove = [
    'onboardingData',
    'onboarding_wizard_state',
    'nugget-sync-queue',
    'nugget-install-prompt-dismissed',
    'milkInventory',
    'allergenTracker',
    'foodReactions',
    'feedCalculatorState',
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}
