#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for tRPC API performance events
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-trpc-dashboard.ts
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

const DASHBOARD_TAGS = ['trpc', 'api-performance', 'api-created'];
const INSIGHT_TAGS = ['trpc', 'api-performance'];

async function main() {
  console.log('🚀 Creating PostHog tRPC API Performance Dashboard\n');

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

    // 1. tRPC Query Volume Over Time
    const queryVolumeInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.query',
        'tRPC Query Volume Over Time',
        'Total number of tRPC queries executed over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 2. tRPC Mutation Volume Over Time
    const mutationVolumeInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.mutation',
        'tRPC Mutation Volume Over Time',
        'Total number of tRPC mutations executed over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 3. tRPC Error Rate
    const errorRateInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.error',
        'tRPC Error Rate',
        'Number of tRPC errors over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 4. tRPC Query vs Mutation Comparison
    const queryVsMutationInsightId = await upsertInsight(
      projectId,
      {
        description: 'Comparison of query and mutation volumes',
        name: 'tRPC Query vs Mutation Volume',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              { event: 'trpc.*.query', kind: 'EventsNode' },
              { event: 'trpc.*.mutation', kind: 'EventsNode' },
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

    // 5. tRPC Success Rate (queries with success=true)
    const successRateInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.query',
        'tRPC Query Success Rate',
        'Percentage of successful tRPC queries',
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

    // 6. tRPC Mutation Success Rate
    const mutationSuccessRateInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.mutation',
        'tRPC Mutation Success Rate',
        'Percentage of successful tRPC mutations',
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

    // 7. tRPC Average Duration (queries)
    const queryDurationInsightId = await upsertInsight(
      projectId,
      {
        description: 'Average execution time for tRPC queries',
        name: 'tRPC Query Average Duration',
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
            series: [
              {
                event: 'trpc.*.query',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
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

    // 8. tRPC Average Duration (mutations)
    const mutationDurationInsightId = await upsertInsight(
      projectId,
      {
        description: 'Average execution time for tRPC mutations',
        name: 'tRPC Mutation Average Duration',
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
            series: [
              {
                event: 'trpc.*.mutation',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
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

    // 9. tRPC Error Breakdown by Error Code
    const errorBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.error',
        'tRPC Error Breakdown by Code',
        'Distribution of tRPC errors by error code',
        'ActionsTable',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 10. tRPC Errors by Procedure
    const errorsByProcedureInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.error',
        'tRPC Errors by Procedure',
        'Number of errors per tRPC procedure',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 11. tRPC Failed Queries/Mutations
    const failedQueriesInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.query',
        'tRPC Failed Queries',
        'Number of failed tRPC queries over time',
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

    // 12. tRPC Failed Mutations
    const failedMutationsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.*.mutation',
        'tRPC Failed Mutations',
        'Number of failed tRPC mutations over time',
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

    // 13. tRPC Total API Calls
    const totalCallsInsightId = await upsertInsight(
      projectId,
      {
        description: 'Total number of tRPC API calls (queries + mutations)',
        name: 'tRPC Total API Calls',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              { event: 'trpc.*.query', kind: 'EventsNode' },
              { event: 'trpc.*.mutation', kind: 'EventsNode' },
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

    console.log('\n📋 Upserting dashboard...\n');

    // Upsert dashboard (text tiles will be added manually in PostHog UI)
    const dashboard = await upsertDashboard(
      projectId,
      {
        description:
          'Dashboard tracking tRPC API performance, success rates, and error patterns',
        name: 'tRPC API Performance',
        pinned: true,
      },
      DASHBOARD_TAGS,
    );

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Add insights to dashboard (organized by sections)
    const insights = [
      // Performance Metrics
      queryDurationInsightId,
      mutationDurationInsightId,
      successRateInsightId,
      mutationSuccessRateInsightId,
      // Error Analysis
      errorRateInsightId,
      failedQueriesInsightId,
      failedMutationsInsightId,
      errorBreakdownInsightId,
      errorsByProcedureInsightId,
      // Volume & Usage
      totalCallsInsightId,
      queryVolumeInsightId,
      mutationVolumeInsightId,
      queryVsMutationInsightId,
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
        'tRPC Query Average Duration',
        'tRPC Mutation Average Duration',
        'tRPC Query Success Rate',
        'tRPC Mutation Success Rate',
        'tRPC Error Rate',
        'tRPC Failed Queries',
        'tRPC Failed Mutations',
        'tRPC Error Breakdown by Code',
        'tRPC Errors by Procedure',
        'tRPC Total API Calls',
        'tRPC Query Volume Over Time',
        'tRPC Mutation Volume Over Time',
        'tRPC Query vs Mutation Volume',
      ];

      insights.forEach((insightId, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${insightId}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${insightId}\n`);
      });

      console.log('   Or filter insights by tags: trpc, api-performance\n');
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
