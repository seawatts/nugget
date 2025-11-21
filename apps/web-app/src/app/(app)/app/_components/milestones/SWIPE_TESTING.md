# Milestone Swipe Cards - Testing Checklist

## Mobile Testing (iOS & Android)

### Basic Swipe Functionality
- [ ] Swipe right on milestone card shows green overlay with checkmark
- [ ] Swipe left on milestone card shows red overlay with X icon
- [ ] Swipe threshold is approximately 100px (feels natural)
- [ ] Card rotates slightly during swipe (visual feedback)
- [ ] Card springs back to center if swipe doesn't meet threshold
- [ ] Haptic feedback (vibration) occurs on successful swipe

### Swipe Thresholds & Sensitivity
- [ ] Short swipes (< 50px) don't show overlays
- [ ] Medium swipes (50-100px) show overlays but don't trigger action
- [ ] Full swipes (> 100px) trigger the action
- [ ] Swipe sensitivity feels natural on both iOS and Android
- [ ] Works well with different screen sizes (small phones to tablets)

### Card Stack Behavior
- [ ] After swiping milestone, chat card appears with slide-in animation
- [ ] Chat card displays the correct milestone title and question
- [ ] Chat card auto-sends "yes" or "no" response based on swipe direction
- [ ] AI response streams correctly in chat card
- [ ] Swiping chat card in any direction dismisses it
- [ ] Next milestone appears after dismissing chat card
- [ ] Card counter updates correctly (e.g., "1 of 5" → "2 of 5")

### Edge Cases
- [ ] Rapid swipes are debounced (only one action processes at a time)
- [ ] Swiping during card entry animation doesn't break anything
- [ ] Rotating device mid-swipe doesn't cause issues
- [ ] Swiping very slowly still works correctly
- [ ] Swiping diagonally works (uses dominant direction)
- [ ] Last milestone shows "check back later" card appropriately

### Animation Quality
- [ ] Entry animation: Card slides in from right with fade (300ms)
- [ ] Exit animation: Card continues rotating and slides off screen (300ms)
- [ ] Spring-back animation: Card bounces back smoothly if threshold not met
- [ ] Overlay icons scale up smoothly as swipe distance increases
- [ ] No jank or stuttering during animations
- [ ] Transitions feel polished and professional

### Chat Card Integration
- [ ] Chat card has same styling as milestone card (FeatureCard)
- [ ] Auto-answer works immediately after card appears
- [ ] User can continue conversation after auto-answer
- [ ] Streaming AI responses display smoothly
- [ ] Input field works correctly for follow-up questions
- [ ] Swipe to dismiss works from any position

### Milestone Completion
- [ ] Swiping right (Yes) marks milestone as complete
- [ ] Completed milestone shows green checkmark overlay
- [ ] Completion state persists after reload
- [ ] Optimistic UI updates immediately
- [ ] Completion syncs to database correctly

## Desktop Testing

### Button-Based Interaction
- [ ] Milestone cards show Yes/No buttons (not swipe UI)
- [ ] Clicking Yes opens chat drawer with auto-answer
- [ ] Clicking No opens chat drawer with auto-answer
- [ ] Chat drawer works as it did before (no regression)
- [ ] Desktop horizontal scroll still works
- [ ] All milestones visible in horizontal carousel

### Responsive Breakpoints
- [ ] Mobile swipe UI activates at 768px width and below
- [ ] Desktop button UI activates above 768px width
- [ ] Switching between mobile/desktop views works smoothly
- [ ] No layout shifts when resizing window

## Performance Testing

### Loading & Responsiveness
- [ ] Initial milestone load is fast (< 2s)
- [ ] Card transitions are smooth (60fps)
- [ ] Touch events respond immediately (no lag)
- [ ] AI chat responses stream without blocking UI
- [ ] Memory usage doesn't increase significantly with use

### Network Conditions
- [ ] Works on slow 3G connection
- [ ] Handles network failures gracefully
- [ ] Loading states display appropriately
- [ ] Retry logic works if requests fail

## Accessibility Testing

### Keyboard Navigation (Desktop)
- [ ] Can tab through buttons and interact with keyboard
- [ ] Enter/Space triggers button clicks
- [ ] Focus states are visible
- [ ] Screen reader announces card contents

### Screen Reader (Mobile)
- [ ] Milestone content is announced correctly
- [ ] Swipe instructions are announced
- [ ] Chat messages are announced
- [ ] Card transitions don't confuse screen reader

## Browser/Device Compatibility

### iOS
- [ ] Safari (iOS 15+)
- [ ] Chrome (iOS)
- [ ] Touch gestures work correctly
- [ ] Haptic feedback works (if supported)

### Android
- [ ] Chrome (Android)
- [ ] Samsung Internet
- [ ] Touch gestures work correctly
- [ ] Haptic feedback works (if supported)

### Tablets
- [ ] iPad (Safari)
- [ ] Android tablet (Chrome)
- [ ] Swipe gestures work with larger screen
- [ ] UI scales appropriately

## Known Limitations

1. **Desktop**: Swipe gestures are disabled on desktop (buttons only)
2. **Haptic Feedback**: May not work on all devices/browsers
3. **Animation Performance**: May be reduced on very low-end devices

## Recommended Thresholds (Current Values)

- **Swipe Threshold**: 100px
- **Overlay Visibility**: 50px
- **Animation Duration**: 300ms
- **Haptic Duration**: 10ms

These can be adjusted based on user feedback and testing results.

