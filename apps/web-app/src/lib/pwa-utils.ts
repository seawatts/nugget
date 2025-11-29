/**
 * Utility functions for PWA detection and handling
 */

/**
 * Detects if the app is running as a Progressive Web App (PWA)
 * Checks for standalone display mode, iOS standalone, or Android app referrer
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Sets a flag to force account selection on next sign-in
 * This is used after logout in PWA context to ensure users can select a different Google account
 */
export function setForceAccountSelection(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('force-account-selection', 'true');
}

/**
 * Checks if account selection should be forced
 */
export function shouldForceAccountSelection(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('force-account-selection') === 'true';
}

/**
 * Clears the force account selection flag
 */
export function clearForceAccountSelection(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('force-account-selection');
}
