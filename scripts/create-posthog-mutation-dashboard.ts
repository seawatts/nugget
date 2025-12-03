#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for iOS PWA mutation tracking metrics
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-mutation-dashboard.ts
 *
 * Required environment variables (injected by Infisical):
 *   - POSTHOG_API_KEY or POSTHOG_PERSONAL_API_KEY: PostHog Personal API key (must have project:read scope)
 *   - POSTHOG_HOST: PostHog host URL (defaults to https://us.posthog.com)
 *   - POSTHOG_ENV_ID: PostHog project/environment ID (optional, will try to auto-detect if API key has permissions)
 */

interface PostHogInsight {
  name: string;
  description?: string;
  query: {
    kind: 'InsightVizNode';
    source: {
      kind: string;
      series?: Array<{ kind: string; event?: string; id?: string }>;
      breakdown?: string | { type: string; property: string };
      dateRange?: { date_from: string; date_to?: string };
      interval?: string;
      properties?: Array<Record<string, unknown>>;
      version?: number;
    };
    version?: number;
  };
  visualization?: string;
  filters?: Record<string, unknown>;
}

interface PostHogDashboard {
  name: string;
  description?: string;
  pinned?: boolean;
  tags?: string[];
  tiles?: Array<{
    insight?: number;
    text?: string;
    color?: string;
    layouts?: Record<string, { x: number; y: number; w: number; h: number }>;
  }>;
}

interface PostHogProject {
  id: string;
  name: string;
}

const POSTHOG_HOST =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  'https://us.posthog.com';
const POSTHOG_API_KEY =
  process.env.POSTHOG_API_KEY || process.env.POSTHOG_PERSONAL_API_KEY;

if (!POSTHOG_API_KEY) {
  console.error('❌ PostHog API key is required');
  console.error('   Set one of these via Infisical or environment variable:');
  console.error('   - POSTHOG_API_KEY');
  console.error('   - POSTHOG_PERSONAL_API_KEY');
  process.exit(1);
}

const PROJECT_ID = process.env.POSTHOG_ENV_ID || process.env.POSTHOG_PROJECT_ID;

async function fetchPostHogAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${POSTHOG_HOST.replace(/\/$/, '')}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PostHog API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

async function getProjectId(): Promise<string> {
  if (PROJECT_ID) {
    console.log(`✅ Using provided project ID: ${PROJECT_ID}`);
    return PROJECT_ID;
  }

  console.log('📋 Fetching projects...');
  try {
    const projects = await fetchPostHogAPI<PostHogProject[]>('/projects/');

    if (projects.length === 0) {
      throw new Error('No projects found in PostHog');
    }

    if (projects.length === 1) {
      console.log(
        `✅ Using project: ${projects[0]?.name} (${projects[0]?.id})`,
      );
      return projects[0]?.id;
    }

    console.log('Found multiple projects:');
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (${project.id})`);
    });

    // Use first project by default
    const selected = projects[0]!;
    console.log(`✅ Using first project: ${selected.name} (${selected.id})`);
    return selected.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission_denied')) {
      throw new Error(
        'API key missing required scope "project:read".\n' +
          'Please either:\n' +
          '  1. Use a Personal API Key with project:read scope, or\n' +
          '  2. Set POSTHOG_ENV_ID environment variable to skip project detection',
      );
    }
    throw error;
  }
}

async function findInsightByName(
  projectId: string,
  name: string,
): Promise<{ id: number } | null> {
  try {
    const response = await fetchPostHogAPI<{
      results: Array<{ id: number; name: string }>;
    }>(
      `/projects/${projectId}/insights/?search=${encodeURIComponent(name)}&limit=100`,
    );

    const found = response.results?.find((i) => i.name === name);
    return found ? { id: found.id } : null;
  } catch (error) {
    console.warn(
      `⚠️  Could not search for insight "${name}":`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

async function upsertInsight(
  projectId: string,
  insight: PostHogInsight,
  dashboardId?: number,
): Promise<number> {
  // Check if insight already exists
  const existing = await findInsightByName(projectId, insight.name);

  const payload: Record<string, unknown> = {
    ...insight,
    tags: ['mutation-tracking', 'ios-pwa'],
  };

  // Use deprecated dashboards parameter to add insight to dashboard
  if (dashboardId) {
    payload.dashboards = [dashboardId];
  }

  if (existing) {
    // Update existing insight
    const response = await fetchPostHogAPI<{ id: number }>(
      `/projects/${projectId}/insights/${existing.id}/`,
      {
        body: JSON.stringify(payload),
        method: 'PATCH',
      },
    );
    console.log(`✅ Updated insight: ${insight.name} (ID: ${response.id})`);
    return response.id;
  }
  // Create new insight
  const response = await fetchPostHogAPI<{ id: number }>(
    `/projects/${projectId}/insights/`,
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
  );
  console.log(`✅ Created insight: ${insight.name} (ID: ${response.id})`);
  return response.id;
}

async function listInsights(
  projectId: string,
): Promise<Array<{ id: number; name: string; tags?: string[] }>> {
  try {
    const response = await fetchPostHogAPI<{
      results: Array<{ id: number; name: string; tags?: string[] }>;
    }>(`/projects/${projectId}/insights/?limit=100&tags=mutation-tracking`);
    return response.results || [];
  } catch (error) {
    console.warn(
      '⚠️  Could not list insights:',
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

async function getProjectInfo(
  projectId: string,
): Promise<{ id: string; name: string } | null> {
  try {
    const project = await fetchPostHogAPI<{ id: string; name: string }>(
      `/projects/${projectId}/`,
    );
    return project;
  } catch (error) {
    console.warn(
      '⚠️  Could not fetch project info:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

async function findDashboardByName(
  projectId: string,
  name: string,
): Promise<{ id: number; short_id?: string } | null> {
  try {
    const response = await fetchPostHogAPI<{
      results: Array<{ id: number; short_id?: string; name: string }>;
    }>(`/projects/${projectId}/dashboards/?limit=100`);

    const found = response.results?.find((d) => d.name === name);
    return found ? { id: found.id, short_id: found.short_id } : null;
  } catch (error) {
    console.warn(
      `⚠️  Could not search for dashboard "${name}":`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

async function upsertDashboard(
  projectId: string,
  dashboard: PostHogDashboard,
): Promise<{ id: number; short_id?: string }> {
  // Check if dashboard already exists
  const existing = await findDashboardByName(projectId, dashboard.name);

  const payload = {
    ...dashboard,
    tags: ['mutation-tracking', 'ios-pwa', 'api-created'],
  };

  if (existing) {
    // Update existing dashboard
    const response = await fetchPostHogAPI<{ id: number; short_id?: string }>(
      `/projects/${projectId}/dashboards/${existing.id}/`,
      {
        body: JSON.stringify(payload),
        method: 'PATCH',
      },
    );
    console.log(`✅ Updated dashboard: ${dashboard.name} (ID: ${response.id})`);
    return {
      id: response.id,
      short_id: existing.short_id || response.short_id,
    };
  }
  // Create new dashboard
  const response = await fetchPostHogAPI<{ id: number; short_id?: string }>(
    `/projects/${projectId}/dashboards/`,
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
  );
  console.log(`✅ Created dashboard: ${dashboard.name} (ID: ${response.id})`);
  return response;
}

async function getDashboard(
  projectId: string,
  dashboardId: number,
): Promise<
  PostHogDashboard & { id: number; short_id?: string; tiles?: unknown[] }
> {
  const dashboard = await fetchPostHogAPI<
    PostHogDashboard & { id: number; short_id?: string; tiles?: unknown[] }
  >(`/projects/${projectId}/dashboards/${dashboardId}/`);
  console.log(
    '🔍 Dashboard structure:',
    JSON.stringify(dashboard, null, 2).slice(0, 500),
  );
  return dashboard;
}

async function updateDashboard(
  projectId: string,
  dashboardId: number,
  dashboard: Partial<PostHogDashboard>,
): Promise<void> {
  await fetchPostHogAPI(`/projects/${projectId}/dashboards/${dashboardId}/`, {
    body: JSON.stringify(dashboard),
    method: 'PATCH',
  });
}

async function addTileToDashboard(
  projectId: string,
  dashboardId: number,
  insightId: number,
  layouts: {
    lg: { x: number; y: number; w: number; h: number };
    md: { x: number; y: number; w: number; h: number };
    sm: { x: number; y: number; w: number; h: number };
    xs: { x: number; y: number; w: number; h: number };
  },
): Promise<void> {
  // Use the tiles endpoint
  await fetchPostHogAPI(
    `/projects/${projectId}/dashboards/${dashboardId}/tiles/`,
    {
      body: JSON.stringify({
        insight: insightId,
        layouts,
      }),
      method: 'POST',
    },
  );
}

async function main() {
  console.log('🚀 Creating PostHog Mutation Tracking Dashboard\n');

  try {
    const projectId = await getProjectId();

    // Verify project exists and get info
    console.log('\n🔍 Verifying project...\n');
    const projectInfo = await getProjectInfo(projectId);
    if (projectInfo) {
      console.log(`✅ Project: ${projectInfo.name} (ID: ${projectInfo.id})`);
    } else {
      console.warn(
        `⚠️  Could not verify project ${projectId}, but continuing...`,
      );
    }

    console.log('\n📊 Upserting insights...\n');

    // 1. Mutation Success Rate - Compare completed vs failed
    const successRateInsightId = await upsertInsight(projectId, {
      description: 'Percentage of mutations that complete successfully vs fail',
      name: 'Mutation Success Rate',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [
            { event: 'mutation_completed', kind: 'EventsNode' },
            { event: 'mutation_failed', kind: 'EventsNode' },
          ],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsLineGraph',
    });

    // 2. Mutation Completion Time
    const completionTimeInsightId = await upsertInsight(projectId, {
      description: 'Average time from mutation start to completion',
      name: 'Mutation Completion Time',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          properties: [
            {
              key: 'duration_ms',
              operator: 'gt',
              type: 'event',
              value: 0,
            },
          ],
          series: [{ event: 'mutation_completed', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsLineGraph',
    });

    // 3. Page Unload During Mutation Rate
    const unloadRateInsightId = await upsertInsight(projectId, {
      description: 'How often users close the app during active mutations',
      name: 'Page Unload During Mutation',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [
            { event: 'page_unload_during_mutation', kind: 'EventsNode' },
          ],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsLineGraph',
    });

    // 4. Background Sync Success Rate
    const syncSuccessInsightId = await upsertInsight(projectId, {
      description:
        'Success rate of queued mutations processed by background sync',
      name: 'Background Sync Success Rate',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'background_sync_completed', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsTable',
    });

    // 5. Recovery Success Rate
    const recoverySuccessInsightId = await upsertInsight(projectId, {
      description:
        'How often incomplete mutations are successfully recovered on app startup',
      name: 'Mutation Recovery Success Rate',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [
            { event: 'mutation_recovery_completed', kind: 'EventsNode' },
          ],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsTable',
    });

    // 6. Queue Size Distribution
    const queueSizeInsightId = await upsertInsight(projectId, {
      description: 'Distribution of queue sizes when mutations are queued',
      name: 'Mutation Queue Size',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'mutation_queued', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsBar',
    });

    // 7. Mutation Failure Reasons
    const failureReasonsInsightId = await upsertInsight(projectId, {
      description: 'Breakdown of why mutations fail',
      name: 'Mutation Failure Reasons',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'mutation_failed', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsTable',
    });

    // 8. Mutations by Activity Type
    const activityTypeInsightId = await upsertInsight(projectId, {
      description: 'Distribution of mutations across different activity types',
      name: 'Mutations by Activity Type',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'mutation_started', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsPie',
    });

    // 9. Mutations by Platform
    const platformInsightId = await upsertInsight(projectId, {
      description:
        'Distribution of mutations across platforms (iOS PWA, Web, etc.)',
      name: 'Mutations by Platform',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'mutation_started', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsPie',
    });

    // 10. Mutation Volume Over Time
    const volumeInsightId = await upsertInsight(projectId, {
      description: 'Total number of mutations started over time',
      name: 'Mutation Volume Over Time',
      query: {
        kind: 'InsightVizNode',
        source: {
          dateRange: { date_from: '-30d' },
          interval: 'day',
          kind: 'TrendsQuery',
          series: [{ event: 'mutation_started', kind: 'EventsNode' }],
          version: 1,
        },
        version: 1,
      },
      visualization: 'ActionsLineGraph',
    });

    // Verify insights were created
    console.log('\n🔍 Verifying created insights...\n');
    const createdInsights = await listInsights(projectId);
    if (createdInsights.length > 0) {
      console.log(
        `✅ Found ${createdInsights.length} insights with 'mutation-tracking' tag:`,
      );
      createdInsights.slice(0, 10).forEach((insight) => {
        console.log(`   - ${insight.name} (ID: ${insight.id})`);
      });
      if (createdInsights.length > 10) {
        console.log(`   ... and ${createdInsights.length - 10} more`);
      }
    } else {
      console.warn('⚠️  No insights found with "mutation-tracking" tag');
      console.warn(
        '   This might indicate they were created in a different project',
      );
      console.warn(`   Try searching for insights in project ${projectId}`);
    }

    console.log('\n📋 Upserting dashboard...\n');

    // Upsert dashboard first (without tiles)
    const dashboard = await upsertDashboard(projectId, {
      description:
        'Dashboard tracking mutation persistence and reliability for iOS PWA quick activities',
      name: 'iOS PWA Mutation Tracking',
      pinned: true,
    });

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Prepare tiles with layouts for reference
    const tiles = [
      {
        insight: volumeInsightId,
        layouts: {
          lg: { h: 4, w: 12, x: 0, y: 0 },
          md: { h: 4, w: 12, x: 0, y: 0 },
          sm: { h: 4, w: 12, x: 0, y: 0 },
          xs: { h: 4, w: 12, x: 0, y: 0 },
        },
      },
      {
        insight: successRateInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 0, y: 4 },
          md: { h: 4, w: 6, x: 0, y: 4 },
          sm: { h: 4, w: 12, x: 0, y: 4 },
          xs: { h: 4, w: 12, x: 0, y: 4 },
        },
      },
      {
        insight: completionTimeInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 6, y: 4 },
          md: { h: 4, w: 6, x: 6, y: 4 },
          sm: { h: 4, w: 12, x: 0, y: 8 },
          xs: { h: 4, w: 12, x: 0, y: 8 },
        },
      },
      {
        insight: unloadRateInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 0, y: 8 },
          md: { h: 4, w: 6, x: 0, y: 8 },
          sm: { h: 4, w: 12, x: 0, y: 12 },
          xs: { h: 4, w: 12, x: 0, y: 12 },
        },
      },
      {
        insight: syncSuccessInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 6, y: 8 },
          md: { h: 4, w: 6, x: 6, y: 8 },
          sm: { h: 4, w: 12, x: 0, y: 16 },
          xs: { h: 4, w: 12, x: 0, y: 16 },
        },
      },
      {
        insight: recoverySuccessInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 0, y: 12 },
          md: { h: 4, w: 6, x: 0, y: 12 },
          sm: { h: 4, w: 12, x: 0, y: 20 },
          xs: { h: 4, w: 12, x: 0, y: 20 },
        },
      },
      {
        insight: queueSizeInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 6, y: 12 },
          md: { h: 4, w: 6, x: 6, y: 12 },
          sm: { h: 4, w: 12, x: 0, y: 24 },
          xs: { h: 4, w: 12, x: 0, y: 24 },
        },
      },
      {
        insight: failureReasonsInsightId,
        layouts: {
          lg: { h: 4, w: 6, x: 0, y: 16 },
          md: { h: 4, w: 6, x: 0, y: 16 },
          sm: { h: 4, w: 12, x: 0, y: 28 },
          xs: { h: 4, w: 12, x: 0, y: 28 },
        },
      },
      {
        insight: activityTypeInsightId,
        layouts: {
          lg: { h: 4, w: 3, x: 6, y: 16 },
          md: { h: 4, w: 3, x: 6, y: 16 },
          sm: { h: 4, w: 6, x: 0, y: 32 },
          xs: { h: 4, w: 12, x: 0, y: 32 },
        },
      },
      {
        insight: platformInsightId,
        layouts: {
          lg: { h: 4, w: 3, x: 9, y: 16 },
          md: { h: 4, w: 3, x: 9, y: 16 },
          sm: { h: 4, w: 6, x: 6, y: 32 },
          xs: { h: 4, w: 12, x: 0, y: 36 },
        },
      },
    ];

    // Update each insight to add it to the dashboard using PATCH with dashboards parameter
    // According to PostHog API docs, insights can be associated with dashboards via the dashboards parameter
    let addedCount = 0;
    for (const tile of tiles) {
      try {
        await fetchPostHogAPI(
          `/projects/${projectId}/insights/${tile.insight}/`,
          {
            body: JSON.stringify({
              dashboards: [dashboard.id],
            }),
            method: 'PATCH',
          },
        );
        addedCount++;
        console.log(`✅ Added insight ${tile.insight} to dashboard`);
      } catch (error) {
        console.warn(
          `⚠️  Could not add insight ${tile.insight} to dashboard:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    if (addedCount > 0) {
      console.log(
        `\n✅ Successfully added ${addedCount} insights to dashboard`,
      );
    } else {
      console.warn('\n⚠️  Could not add insights to dashboard programmatically');
      console.warn(
        '   Insights were created successfully, but need to be added manually',
      );
    }

    const dashboardId = dashboard.short_id || dashboard.id;
    const dashboardUrl = `${POSTHOG_HOST.replace(/\/$/, '')}/project/${projectId}/dashboards/${dashboardId}`;
    const baseUrl = POSTHOG_HOST.replace(/\/$/, '');

    console.log('\n✨ Dashboard created successfully!\n');
    console.log(`📊 View dashboard: ${dashboardUrl}\n`);

    if (tiles.length > 0) {
      console.log('📋 To add insights to the dashboard:');
      console.log('   1. Open the dashboard URL above');
      console.log('   2. Click "Add insight" button');
      console.log('   3. Search for and add these insights:\n');

      const insightNames = [
        'Mutation Volume Over Time',
        'Mutation Success Rate',
        'Mutation Completion Time',
        'Page Unload During Mutation',
        'Background Sync Success Rate',
        'Mutation Recovery Success Rate',
        'Mutation Queue Size',
        'Mutation Failure Reasons',
        'Mutations by Activity Type',
        'Mutations by Platform',
      ];

      tiles.forEach((tile, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${tile.insight}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${tile.insight}\n`);
      });

      console.log(
        '   Or filter insights by tags: mutation-tracking, ios-pwa\n',
      );
    }
  } catch (error) {
    console.error('\n❌ Error creating dashboard:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

main();
