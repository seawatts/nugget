export function clearAppLocalStorage(): void {
  const keysToRemove = [
    'onboardingData',
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
