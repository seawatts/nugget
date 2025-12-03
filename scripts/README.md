# Scripts

This directory contains utility scripts for the Nugget project.

## PostHog Dashboard Creation

### `create-posthog-mutation-dashboard.ts`

Creates a PostHog dashboard with insights for iOS PWA mutation tracking metrics.

**Usage:**

```bash
infisical run -- bun scripts/create-posthog-mutation-dashboard.ts
```

**Required Environment Variables (injected by Infisical):**

- `POSTHOG_API_KEY` - PostHog personal API key (required)
- `POSTHOG_HOST` - PostHog host URL (optional, defaults to `https://us.posthog.com`)
- `POSTHOG_PROJECT_ID` - PostHog project ID (optional, will auto-detect if not provided)

**What it creates:**

The script creates a dashboard with the following insights:

1. **Mutation Success Rate** - Percentage of mutations that complete successfully vs fail
2. **Mutation Completion Time** - Average time from mutation start to completion
3. **Page Unload During Mutation** - How often users close the app during active mutations
4. **Background Sync Success Rate** - Success rate of queued mutations processed by background sync
5. **Mutation Recovery Success Rate** - How often incomplete mutations are successfully recovered on app startup
6. **Mutation Queue Size** - Distribution of queue sizes when mutations are queued
7. **Mutation Failure Reasons** - Breakdown of why mutations fail
8. **Mutations by Activity Type** - Distribution of mutations across different activity types
9. **Mutations by Platform** - Distribution of mutations across platforms (iOS PWA, Web, etc.)
10. **Mutation Volume Over Time** - Total number of mutations started over time

**Example:**

```bash
# Using Infisical to inject secrets
infisical run -- bun scripts/create-posthog-mutation-dashboard.ts

# Or with explicit environment variables
POSTHOG_API_KEY=your_key POSTHOG_HOST=https://us.posthog.com bun scripts/create-posthog-mutation-dashboard.ts
```

The script will:
- Auto-detect your PostHog project if `POSTHOG_PROJECT_ID` is not set
- Create all insights with appropriate tags (`mutation-tracking`, `ios-pwa`)
- Create a pinned dashboard with all insights arranged in a grid layout
- Output the dashboard URL for easy access

