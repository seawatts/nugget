# Overdue Activity Alarms - Testing Guide

This guide provides comprehensive instructions for testing the PWA overdue activity alarms feature.

## Prerequisites

1. **Build the App:**
   ```bash
   cd apps/web-app
   bun run build
   bun run start
   ```

2. **Database Migration:**
   The alarm preference fields need to be added to the database:
   ```bash
   cd packages/db
   bun run gen-migration
   bun run migrate
   ```

3. **Environment Variables:**
   Ensure the following are set in `.env`:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - For push notifications
   - `VAPID_PRIVATE_KEY` - For server-side push
   - `VAPID_PUBLIC_KEY` - Same as NEXT_PUBLIC_VAPID_PUBLIC_KEY

## Test Scenarios

### 1. Initial Setup and Permission Request

**Steps:**
1. Open the app in a supported browser (Chrome/Edge recommended)
2. Navigate to Settings → Preferences
3. Scroll to the "Activity Alarms" section
4. Click "Enable" button for notification permission
5. Accept the browser notification permission prompt

**Expected Results:**
- ✓ Notification permission status shows "Notifications are enabled ✓"
- ✓ "Test Notification" button appears
- ✓ No errors in console

**Browser Compatibility:**
- **Chrome/Edge**: Full support for Periodic Background Sync
- **Safari iOS**: Limited support (requires PWA installation)
- **Firefox**: Partial support

### 2. Install PWA (Critical for Background Sync)

**Desktop (Chrome/Edge):**
1. Click the install icon in the address bar (⊕ icon)
2. Or go to Settings menu → Install Nugget

**Mobile (Android):**
1. Open browser menu
2. Select "Install app" or "Add to Home Screen"
3. Confirm installation

**Mobile (iOS Safari):**
1. Tap the Share button
2. Select "Add to Home Screen"
3. Confirm addition

**Expected Results:**
- ✓ App opens in standalone window (no browser UI)
- ✓ App icon appears on home screen/desktop
- ✓ Service worker is registered and active

**Verify Installation:**
```javascript
// In browser console:
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  console.log('Periodic Sync support:', 'periodicSync' in reg);
});
```

### 3. Enable Activity Alarms

**Steps:**
1. In Settings → Preferences → Activity Alarms
2. Toggle ON one or more activity types:
   - Feeding alarm
   - Sleep alarm
   - Diaper alarm
   - Pumping alarm

**Expected Results:**
- ✓ Toggle switches to enabled state
- ✓ Custom threshold input appears below each enabled alarm
- ✓ Toast notification confirms "Alarm preference updated"
- ✓ Settings persist after page refresh

### 4. Configure Custom Thresholds (Optional)

**Steps:**
1. Enable an activity alarm
2. Enter a custom threshold value (e.g., 30 minutes)
3. Tab out or click away from input

**Expected Results:**
- ✓ Value is saved
- ✓ Toast confirms "Custom threshold updated"
- ✓ Placeholder shows default threshold
- ✓ Empty input uses default age-appropriate threshold

**Test Cases:**
- Leave empty → uses default threshold
- Enter 30 → uses 30 minutes
- Enter negative number → shows error "Please enter a valid positive number"
- Enter 0 → shows error

### 5. Test Immediate Notification Check

**Steps:**
1. Ensure at least one alarm is enabled
2. Log an old activity (e.g., feeding 2 hours ago)
3. Click "Test Notification" button in alarm settings

**Expected Results:**
- ✓ Toast shows "Checking for overdue activities..."
- ✓ If activity is overdue, notification appears within seconds
- ✓ Notification shows:
  - Activity emoji and type
  - Baby name
  - Minutes overdue
  - Two action buttons: "Log [Activity]" and "Dismiss"

**Notification Example:**
```
Title: 🍼 Feeding Overdue
Body: Emma is 45 minutes overdue for feeding
Actions: [Log Feeding] [Dismiss]
```

### 6. Test Background Periodic Sync

**Important:** This requires:
- Installed PWA
- Browser with Periodic Background Sync support (Chrome/Edge)
- App must be engaged with recently (visited within last few days)

**Steps:**
1. Install the PWA (if not already)
2. Enable at least one alarm
3. Log an activity with a timestamp that will become overdue
4. Close the PWA completely
5. Wait for sync interval (15-30 minutes)

**Expected Results:**
- ✓ Notification appears even when app is closed
- ✓ Clicking notification opens the app to the baby's page
- ✓ No duplicate notifications within 15 minutes

**Debug Periodic Sync:**
```javascript
// Check if periodic sync is registered:
navigator.serviceWorker.ready.then(reg => {
  reg.periodicSync.getTags().then(tags => {
    console.log('Registered sync tags:', tags);
  });
});
```

### 7. Test Notification Click Actions

**Steps:**
1. Trigger an overdue notification
2. Click on the notification body (not action buttons)

**Expected Results:**
- ✓ App opens
- ✓ Navigates to `/app/babies/{babyId}`
- ✓ Notification dismisses

**Steps for Action Buttons:**
1. Trigger an overdue notification
2. Click "Log [Activity]" button

**Expected Results:**
- ✓ App opens to the activity logging page
- ✓ Correct activity drawer opens

**Steps for Dismiss:**
1. Click "Dismiss" action

**Expected Results:**
- ✓ Notification closes
- ✓ No navigation occurs

### 8. Test Multiple Babies

**Steps:**
1. Add multiple babies to your account
2. Enable alarms
3. Log old activities for different babies
4. Trigger notification check

**Expected Results:**
- ✓ Separate notification for each baby's overdue activity
- ✓ Each notification shows correct baby name
- ✓ Clicking notification navigates to correct baby's page

### 9. Test Alarm Disable

**Steps:**
1. Enable an alarm
2. Wait for an activity to become overdue
3. Disable the alarm
4. Trigger notification check

**Expected Results:**
- ✓ No notification appears for disabled alarm
- ✓ Other enabled alarms still work
- ✓ Settings persist correctly

### 10. Test Age-Appropriate Thresholds

**Test with Different Baby Ages:**

**Newborn (0-7 days):**
- Feeding: 15 min threshold
- Sleep: 20 min threshold
- Diaper: 30 min threshold
- Pumping: 20 min threshold

**Steps:**
1. Create a baby with birthdate 3 days ago
2. Enable feeding alarm (leave threshold empty for default)
3. Log feeding 2 hours ago
4. Check notification

**Expected:** Feeding is overdue (2 hours > 15 min threshold)

**Older Baby (90+ days):**
- Feeding: 45 min threshold
- Sleep: 60 min threshold
- Diaper: 90 min threshold
- Pumping: 60 min threshold

**Steps:**
1. Create a baby with birthdate 120 days ago
2. Enable feeding alarm
3. Log feeding 30 minutes ago
4. Check notification

**Expected:** Feeding is NOT overdue (30 min < 45 min threshold)

### 11. Test Edge Cases

#### No Activities Logged Yet
**Steps:**
1. Create new baby
2. Enable alarms
3. Trigger notification check

**Expected:**
- ✓ No notifications (no baseline to predict from)
- ✓ No errors in console

#### App in Background (Not Closed)
**Steps:**
1. Open PWA
2. Switch to another app/tab
3. Wait for sync interval

**Expected:**
- ✓ Notification still appears
- ✓ App updates when brought back to foreground

#### Low Battery Mode (Mobile)
**Steps:**
1. Enable low battery mode on device
2. Close PWA
3. Wait for overdue activity

**Expected:**
- ⚠️ Background sync may be throttled or disabled
- ✓ App shows warning about low battery mode limitations

#### Permission Denied
**Steps:**
1. Deny notification permission
2. Try to enable alarms

**Expected:**
- ✓ Shows "Notifications are blocked. Please enable them in your browser settings."
- ✓ Enable button is hidden
- ✓ Instructions shown for re-enabling in browser

### 12. Test Service Worker Updates

**Steps:**
1. Make a change to `public/sw.ts`
2. Rebuild the app
3. Open the PWA
4. Wait for update prompt

**Expected Results:**
- ✓ Service worker update prompt appears
- ✓ Clicking "Update" reloads the app
- ✓ New service worker takes control
- ✓ Periodic sync continues to work

## Monitoring and Debugging

### Browser DevTools

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Check:
   - Service Workers: Should show "activated and running"
   - Periodic Background Sync: Check registered tags
   - Notifications: View notification permissions

**Console Logs:**
Service worker logs appear in:
1. Regular console when app is open
2. Service Worker console (Application → Service Workers → inspect)

**Key Log Messages:**
```
[Service Worker] Install
[Service Worker] Activate
[Service Worker] Checking for overdue activities
[Service Worker] Found overdue activities: 2
```

### Testing Sync Timing

**Force Sync Immediately:**
```javascript
// In browser console:
navigator.serviceWorker.ready.then(reg => {
  reg.active.postMessage({ type: 'CHECK_OVERDUE_NOW' });
});
```

**Register Periodic Sync Manually:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.periodicSync.register('check-overdue-activities', {
    minInterval: 15 * 60 * 1000 // 15 minutes
  }).then(() => {
    console.log('Periodic sync registered');
  });
});
```

### API Endpoint Testing

**Test Overdue Check API:**
```bash
# Must be authenticated (use browser session)
curl http://localhost:3000/api/activities/check-overdue \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "overdueActivities": [
    {
      "activityType": "feeding",
      "babyName": "Emma",
      "babyId": "baby_123",
      "overdueMinutes": 45,
      "nextExpectedTime": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

## Common Issues and Solutions

### Issue: No Notifications Appear

**Checklist:**
1. ✓ Notification permission granted?
2. ✓ At least one alarm enabled?
3. ✓ PWA installed? (Required for background sync)
4. ✓ Activity is actually overdue per threshold?
5. ✓ Service worker registered and active?

**Solution:**
- Check browser console for errors
- Verify service worker is running
- Test with "Test Notification" button first

### Issue: Background Sync Not Working

**Possible Causes:**
1. PWA not installed (required)
2. Browser doesn't support Periodic Background Sync (Safari, Firefox)
3. Low engagement score (browser throttles)
4. Low battery mode enabled

**Solution:**
- Ensure PWA is installed
- Use Chrome/Edge for full support
- Interact with app regularly to maintain engagement
- Check if periodic sync is registered

### Issue: Duplicate Notifications

**Cause:** Multiple sync checks within 15 minutes

**Solution:**
- Service worker already prevents duplicates within 15 min
- Check IndexedDB for last notification time
- May indicate multiple service workers running (check DevTools)

### Issue: Wrong Baby Shown in Notification

**Checklist:**
1. ✓ Correct baby selected in family?
2. ✓ Activities logged for correct baby?
3. ✓ Multiple babies with same name?

**Solution:**
- Check `babyId` in notification data
- Verify API returns correct baby information

## Performance Considerations

### Battery Impact
- Sync check runs every 15-30 minutes
- Each check makes one API request
- Minimal battery drain when properly implemented

### Network Usage
- ~1-5 KB per sync check
- Only runs when device has network
- Respects low-data mode on most browsers

### Storage
- Service worker: ~50 KB
- IndexedDB: ~1 KB for settings
- Cached assets: varies by usage

## Production Checklist

Before deploying to production:

- [ ] VAPID keys configured in environment
- [ ] Database migration applied
- [ ] Service worker builds correctly
- [ ] PWA manifest includes notifications permission
- [ ] Tested on Chrome/Edge desktop
- [ ] Tested on Chrome Android
- [ ] Tested on Safari iOS
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics events added for alarm usage
- [ ] User documentation updated
- [ ] Support team trained on feature

## Success Metrics

Track these metrics to measure feature success:

1. **Adoption Rate:**
   - % of users who enable at least one alarm
   - Most popular alarm types

2. **Engagement:**
   - Notification click-through rate
   - Action button usage (Log vs Dismiss)

3. **Effectiveness:**
   - Average time between notification and logging activity
   - Reduction in overdue activities after enabling alarms

4. **Technical:**
   - Service worker registration success rate
   - Periodic sync success rate
   - Notification delivery rate

## Support and Troubleshooting

### User Reports Issue

**Collect Information:**
1. Browser and version
2. Device type (desktop/mobile)
3. PWA installed? (yes/no)
4. Which alarms enabled?
5. Screenshot of alarm settings
6. Browser console logs

### Debug Steps:**
1. Check notification permission status
2. Verify service worker is registered
3. Test with "Test Notification" button
4. Check API endpoint manually
5. Review service worker console logs

## Additional Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Periodic Background Sync API](https://web.dev/periodic-background-sync/)
- [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers)
- [PWA Install Criteria](https://web.dev/install-criteria/)

