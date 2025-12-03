#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for Server Actions events
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-server-actions-dashboard.ts
 *
 * Required environment variables (injected by Infisical):
 *   - POSTHOG_API_KEY or POSTHOG_PERSONAL_API_KEY: PostHog Personal API key
 *   - POSTHOG_HOST: PostHog host URL (defaults to https://us.posthog.com)
 *   - POSTHOG_ENV_ID: PostHog project/environment ID (optional)
 */

import {
  addInsightToDashboard,
  createTrendsInsight,
  getPostHogHost,
  getProjectId,
  getProjectInfo,
  upsertDashboard,
  upsertInsight,
} from './posthog-dashboard-utils';

const DASHBOARD_TAGS = ['server-actions', 'api-performance', 'api-created'];
const INSIGHT_TAGS = ['server-actions', 'api-performance'];

async function main() {
  console.log('🚀 Creating PostHog Server Actions Dashboard\n');

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

    // 1. Server Actions Volume Over Time
    const volumeInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Volume Over Time',
        'Total number of server actions executed over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 2. Server Actions Success Rate
    const successRateInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Success Rate',
        'Percentage of successful server actions',
        'ActionsLineGraph',
        {
          properties: [
            {
              key: 'success',
              operator: 'exact',
              type: 'event',
              value: true,
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 3. Server Actions Error Rate
    const errorRateInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Error Rate',
        'Number of failed server actions over time',
        'ActionsLineGraph',
        {
          properties: [
            {
              key: 'success',
              operator: 'exact',
              type: 'event',
              value: false,
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 4. Server Actions Average Duration
    const durationInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Average Duration',
        'Average execution time for server actions',
        'ActionsLineGraph',
        {
          properties: [
            {
              key: 'duration_ms',
              operator: 'gt',
              type: 'event',
              value: 0,
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 5. Server Actions Success vs Failure Comparison
    const successVsFailureInsightId = await upsertInsight(
      projectId,
      {
        description: 'Comparison of successful vs failed server actions',
        name: 'Server Actions Success vs Failure',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              {
                event: 'server_action.*',
                kind: 'EventsNode',
                properties: [
                  {
                    key: 'success',
                    operator: 'exact',
                    type: 'event',
                    value: true,
                  },
                ],
              },
              {
                event: 'server_action.*',
                kind: 'EventsNode',
                properties: [
                  {
                    key: 'success',
                    operator: 'exact',
                    type: 'event',
                    value: false,
                  },
                ],
              },
            ],
            version: 1,
          },
          version: 1,
        },
        visualization: 'ActionsLineGraph',
      },
      undefined,
      INSIGHT_TAGS,
    );

    // 6. Server Actions Error Breakdown
    const errorBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Error Breakdown',
        'Breakdown of server action errors',
        'ActionsTable',
        {
          properties: [
            {
              key: 'success',
              operator: 'exact',
              type: 'event',
              value: false,
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 7. Server Actions by Action Name (top actions)
    const topActionsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Top Server Actions by Volume',
        'Most frequently used server actions',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 8. Server Actions Duration Distribution
    const durationDistributionInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Server Actions Duration Distribution',
        'Distribution of server action execution times',
        'ActionsBar',
        {
          properties: [
            {
              key: 'duration_ms',
              operator: 'gt',
              type: 'event',
              value: 0,
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    console.log('\n📋 Upserting dashboard...\n');

    // Upsert dashboard
    const dashboard = await upsertDashboard(
      projectId,
      {
        description:
          'Dashboard tracking server action performance, success rates, and error patterns',
        name: 'Server Actions Performance',
        pinned: true,
      },
      DASHBOARD_TAGS,
    );

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Add insights to dashboard
    const insights = [
      volumeInsightId,
      successRateInsightId,
      errorRateInsightId,
      successVsFailureInsightId,
      durationInsightId,
      durationDistributionInsightId,
      topActionsInsightId,
      errorBreakdownInsightId,
    ];

    let addedCount = 0;
    for (const insightId of insights) {
      try {
        await addInsightToDashboard(projectId, dashboard.id, insightId);
        addedCount++;
        console.log(`✅ Added insight ${insightId} to dashboard`);
      } catch (error) {
        console.warn(
          `⚠️  Could not add insight ${insightId} to dashboard:`,
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
    const dashboardUrl = `${getPostHogHost()}/project/${projectId}/dashboards/${dashboardId}`;
    const baseUrl = getPostHogHost();

    console.log('\n✨ Dashboard created successfully!\n');
    console.log(`📊 View dashboard: ${dashboardUrl}\n`);

    if (insights.length > 0) {
      console.log('📋 Created insights:');
      const insightNames = [
        'Server Actions Volume Over Time',
        'Server Actions Success Rate',
        'Server Actions Error Rate',
        'Server Actions Success vs Failure',
        'Server Actions Average Duration',
        'Server Actions Duration Distribution',
        'Top Server Actions by Volume',
        'Server Actions Error Breakdown',
      ];

      insights.forEach((insightId, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${insightId}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${insightId}\n`);
      });

      console.log(
        '   Or filter insights by tags: server-actions, api-performance\n',
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
