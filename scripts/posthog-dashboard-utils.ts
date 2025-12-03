/**
 * Shared utilities for PostHog dashboard creation scripts
 *
 * Provides common functions for interacting with PostHog API,
 * creating/updating insights and dashboards with upsert functionality.
 */

export interface PostHogInsight {
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

export interface PostHogDashboard {
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

export async function fetchPostHogAPI<T>(
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

export async function getProjectId(): Promise<string> {
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
    const selected = projects[0];
    if (!selected) {
      throw new Error('No projects found');
    }
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

export async function getProjectInfo(
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

export async function upsertInsight(
  projectId: string,
  insight: PostHogInsight,
  dashboardId: number | undefined,
  tags: string[],
): Promise<number> {
  // Check if insight already exists
  const existing = await findInsightByName(projectId, insight.name);

  const payload: Record<string, unknown> = {
    ...insight,
    tags,
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

export async function upsertDashboard(
  projectId: string,
  dashboard: PostHogDashboard,
  tags: string[],
): Promise<{ id: number; short_id?: string }> {
  // Check if dashboard already exists
  const existing = await findDashboardByName(projectId, dashboard.name);

  const payload = {
    ...dashboard,
    tags,
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

export async function addInsightToDashboard(
  projectId: string,
  dashboardId: number,
  insightId: number,
): Promise<void> {
  try {
    await fetchPostHogAPI(`/projects/${projectId}/insights/${insightId}/`, {
      body: JSON.stringify({
        dashboards: [dashboardId],
      }),
      method: 'PATCH',
    });
  } catch (error) {
    console.warn(
      `⚠️  Could not add insight ${insightId} to dashboard:`,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Helper to create a TrendsQuery insight
 */
export function createTrendsInsight(
  event: string,
  name: string,
  description?: string,
  visualization = 'ActionsLineGraph',
  additionalProperties?: Record<string, unknown>,
): PostHogInsight {
  return {
    description,
    name,
    query: {
      kind: 'InsightVizNode',
      source: {
        dateRange: { date_from: '-30d' },
        interval: 'day',
        kind: 'TrendsQuery',
        series: [{ event, kind: 'EventsNode' }],
        version: 1,
        ...(additionalProperties || {}),
      },
      version: 1,
    },
    visualization,
  };
}

/**
 * Helper to create a multi-event TrendsQuery insight
 */
export function createMultiEventTrendsInsight(
  events: string[],
  name: string,
  description?: string,
  visualization = 'ActionsLineGraph',
  additionalProperties?: Record<string, unknown>,
): PostHogInsight {
  return {
    description,
    name,
    query: {
      kind: 'InsightVizNode',
      source: {
        dateRange: { date_from: '-30d' },
        interval: 'day',
        kind: 'TrendsQuery',
        series: events.map((event) => ({
          event,
          kind: 'EventsNode',
        })),
        version: 1,
        ...additionalProperties,
      },
      version: 1,
    },
    visualization,
  };
}

export function getPostHogHost(): string {
  return POSTHOG_HOST.replace(/\/$/, '');
}
