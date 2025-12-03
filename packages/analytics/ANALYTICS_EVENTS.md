# Analytics Events Documentation

This document outlines all the PostHog analytics events being tracked in the Nugget web application.

## Navigation Events

### Main Navigation
- **`navigation_logo_clicked`** - When user clicks the Nugget logo
  - Properties: None
  - Location: App sidebar logo

- **`navigation_main_menu_clicked`** - When user clicks on main navigation items
  - Properties:
    - `menu_item`: The name of the menu item (e.g., "Dashboard", "Events", "API Keys", "Settings")
    - `url`: The destination URL
  - Location: Main sidebar navigation

- **`navigation_external_link_clicked`** - When user clicks on external links
  - Properties:
    - `link_title`: The title of the external link (e.g., "GitHub", "Docs")
    - `url`: The external URL
  - Location: Secondary sidebar navigation

- **`navigation_settings_tab_clicked`** - When user switches between settings tabs
  - Properties:
    - `tab_name`: The name of the tab (e.g., "Organization", "Billing")
    - `tab_value`: The internal tab value
  - Location: Settings page tabs

## Dashboard Events

### Dashboard Actions
- **`dashboard_view_all_events_clicked`** - When user clicks "View All Events" button
  - Properties: None
  - Location: Dashboard recent events table

- **`dashboard_event_view_clicked`** - When user clicks to view event details
  - Properties:
    - `event_id`: The ID of the event being viewed
    - `source`: Source component (e.g., "recent_events_table")
  - Location: Dashboard recent events table

- **`dashboard_event_replay_clicked`** - When user clicks to replay an event
  - Properties:
    - `event_id`: The ID of the event being replayed
    - `source`: Source component (e.g., "recent_events_table")
  - Location: Dashboard recent events table

## Events Page

### Event Management
- **`events_page_event_view_clicked`** - When user clicks to view event details on events page
  - Properties:
    - `event_id`: The ID of the event being viewed
    - `source`: Source component (e.g., "events_table")
  - Location: Events page table

- **`events_page_event_replay_clicked`** - When user clicks to replay an event on events page
  - Properties:
    - `event_id`: The ID of the event being replayed
    - `source`: Source component (e.g., "events_table")
  - Location: Events page table

- **`events_deleted`** - When user deletes an event
  - Properties:
    - `event_id`: The ID of the deleted event
    - `event_name`: The name/type of the deleted event
  - Location: Events page delete dialog

## API Keys Management

### API Key Operations
- **`api_keys_created`** - When user creates a new API key
  - Properties:
    - `api_key_name`: The name given to the new API key
  - Location: Create API key dialog

- **`api_keys_updated`** - When user updates an API key name
  - Properties:
    - `api_key_id`: The ID of the updated API key
    - `old_name`: The previous name
    - `new_name`: The new name
  - Location: API keys table inline editing

- **`api_keys_deleted`** - When user deletes an API key
  - Properties:
    - `api_key_id`: The ID of the deleted API key
    - `api_key_name`: The name of the deleted API key
  - Location: Delete API key dialog

- **`api_keys_visibility_toggled`** - When user toggles API key visibility
  - Properties:
    - `api_key_id`: The ID of the API key
    - `new_visibility`: Whether the key is now visible (true) or hidden (false)
  - Location: API keys table visibility toggle

## Playground

### Webhook Testing
- **`playground_webhook_sent`** - When user sends a webhook from the playground
  - Properties:
    - `webhook_id`: The ID of the webhook being tested
    - `service`: The service being tested (e.g., "github", "stripe", "clerk")
    - `event_type`: The type of event being sent
    - `payload_size`: The size of the JSON payload in characters
  - Location: Webhook playground send button

## Mutation Tracking (iOS PWA)

### Mutation Lifecycle Events
- **`mutation_started`** - When an activity mutation begins
  - Properties:
    - `activity_type`: Type of activity (nursing, diaper, sleep, etc.)
    - `source`: Where mutation originated (today_summary, activity_cards, etc.)
    - `platform`: Platform identifier (ios_pwa, ios_safari, android_pwa, web, etc.)
    - `is_optimistic`: Whether optimistic update was used
    - `mutation_id`: Unique identifier for the mutation
  - Location: Activity mutation hooks

- **`mutation_completed`** - When a mutation succeeds
  - Properties:
    - `activity_type`: Type of activity
    - `source`: Where mutation originated
    - `platform`: Platform identifier
    - `duration_ms`: Time taken for mutation to complete
    - `mutation_id`: Unique identifier for the mutation
  - Location: Activity mutation hooks

- **`mutation_failed`** - When a mutation fails
  - Properties:
    - `activity_type`: Type of activity
    - `source`: Where mutation originated
    - `platform`: Platform identifier
    - `error_message`: Error message
    - `duration_ms`: Time taken before failure
    - `retry_count`: Number of retry attempts
    - `mutation_id`: Unique identifier for the mutation
  - Location: Activity mutation hooks

- **`mutation_queued`** - When a mutation is queued for background sync
  - Properties:
    - `activity_type`: Type of activity
    - `source`: Where mutation originated
    - `platform`: Platform identifier
    - `queue_length`: Number of items in queue
    - `mutation_id`: Unique identifier for the mutation
  - Location: Background sync manager

### Page Visibility Events
- **`page_visibility_change`** - When app backgrounds/foregrounds
  - Properties:
    - `hidden`: Whether page is now hidden
    - `pending_mutations_count`: Number of pending mutations
    - `activity_types`: Array of activity types in pending mutations
    - `platform`: Platform identifier
  - Location: Mutation tracker

- **`page_unload_during_mutation`** - When app closes during active mutation
  - Properties:
    - `pending_mutations_count`: Number of pending mutations
    - `activity_types`: Array of activity types in pending mutations
    - `platform`: Platform identifier
  - Location: Mutation tracker

### Background Sync Events
- **`background_sync_registered`** - When background sync is registered
  - Properties:
    - `queue_length`: Number of items in queue
    - `method`: HTTP method of queued request
  - Location: Background sync manager

- **`background_sync_completed`** - When background sync processes queue
  - Properties:
    - `processed_count`: Number of successfully processed mutations
    - `failed_count`: Number of failed mutations
    - `queue_length`: Remaining items in queue
  - Location: Background sync manager

### Recovery Events
- **`mutation_recovery_started`** - When recovery process begins on app startup
  - Properties:
    - `pending_count`: Number of pending mutations
    - `queued_count`: Number of queued mutations
  - Location: Mutation recovery handler

- **`mutation_recovery_completed`** - When recovery finishes
  - Properties:
    - `recovered_count`: Number of successfully recovered mutations
    - `failed_count`: Number of failed recoveries
    - `pending_count`: Original number of pending mutations
    - `queued_count`: Original number of queued mutations
  - Location: Mutation recovery handler

- **`mutation_recovery_failed`** - When recovery fails for specific mutation
  - Properties:
    - `mutation_id`: Unique identifier for the mutation
    - `activity_type`: Type of activity
    - `error_message`: Error message
    - `retry_count`: Number of retry attempts
  - Location: Mutation recovery handler

## Event Properties Guidelines

### Common Properties
- **`event_id`**: Unique identifier for events, webhooks, or API keys
- **`source`**: Component or location where the action originated
- **`url`**: Destination URL for navigation events
- **`menu_item`**: Name of the navigation item clicked

### Naming Conventions
- Event names use snake_case
- Event names are descriptive and action-oriented
- Properties use snake_case for consistency
- Source tracking helps identify user interaction patterns

## Implementation Notes

### MetricLink Component
The `MetricLink` component automatically tracks navigation events when used instead of regular Next.js `Link` components. It extends the Link functionality with PostHog analytics tracking.

### Manual Tracking
For actions that don't involve navigation (like button clicks, form submissions), PostHog events are manually captured using `posthog.capture()`.

### Event Consistency
All events follow a consistent pattern:
- Descriptive event names
- Relevant properties for context
- Source tracking for analytics
- User action focus rather than system events

## Usage Examples

### Using MetricLink for Navigation
```tsx
import { MetricLink } from '@nugget/analytics';

<MetricLink
  href="/app/dashboard"
  metric="navigation_dashboard_clicked"
>
  Dashboard
</MetricLink>
```

### Manual Event Tracking
```tsx
import posthog from 'posthog-js';

const handleAction = () => {
  posthog.capture('user_action_performed', {
    action_type: 'button_click',
    component: 'dashboard'
  });
  // Perform action...
};
```
