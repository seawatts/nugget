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
  addTextTileToDashboard,
  createTextTile,
  createTrendsInsight,
  createTrpcMultiTypeInsight,
  createTrpcTypeInsight,
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

    console.log('\n📊 Upserting insights (parallelizing for speed)...\n');

    // Create all insights in parallel for better performance
    const insightPromises = [
      // 1. tRPC Query Volume Over Time
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
          'tRPC Query Volume Over Time',
          'Total number of tRPC queries executed over time',
          'ActionsLineGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 2. tRPC Mutation Volume Over Time
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'mutation',
          'tRPC Mutation Volume Over Time',
          'Total number of tRPC mutations executed over time',
          'ActionsLineGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 3. tRPC Error Rate
      upsertInsight(
        projectId,
        createTrendsInsight(
          'trpc.error',
          'tRPC Error Rate',
          'Number of tRPC errors over time',
          'ActionsLineGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 4. tRPC Query vs Mutation Comparison
      upsertInsight(
        projectId,
        createTrpcMultiTypeInsight(
          'tRPC Query vs Mutation Volume',
          'Comparison of query and mutation volumes',
          'ActionsLineGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 5. tRPC Success Rate (queries with success=true)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
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
      ),
      // 6. tRPC Mutation Success Rate
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'mutation',
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
      ),
      // 7. tRPC Average Duration (queries)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
          'tRPC Query Average Duration',
          'Average execution time for tRPC queries',
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
            series: [
              {
                event: '$pageview',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
            ],
          },
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 8. tRPC Average Duration (mutations)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'mutation',
          'tRPC Mutation Average Duration',
          'Average execution time for tRPC mutations',
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
            series: [
              {
                event: '$pageview',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
            ],
          },
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 9. tRPC Error Breakdown by Error Code
      upsertInsight(
        projectId,
        createTrendsInsight(
          'trpc.error',
          'tRPC Error Breakdown by Code',
          'Distribution of tRPC errors by error code',
          'ActionsTable',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 10. tRPC Errors by Procedure
      upsertInsight(
        projectId,
        createTrendsInsight(
          'trpc.error',
          'tRPC Errors by Procedure',
          'Number of errors per tRPC procedure',
          'ActionsBar',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 11. tRPC Failed Queries/Mutations
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
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
      ),
      // 12. tRPC Failed Mutations
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'mutation',
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
      ),
      // 13. tRPC Total API Calls
      upsertInsight(
        projectId,
        createTrpcMultiTypeInsight(
          'tRPC Total API Calls',
          'Total number of tRPC API calls (queries + mutations)',
          'ActionsLineGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // NEW: Number Metrics
      // 14. Total tRPC Calls (with period comparison)
      upsertInsight(
        projectId,
        {
          description:
            'Total number of tRPC API calls with period-over-period comparison',
          name: 'Total tRPC Calls',
          query: {
            kind: 'InsightVizNode',
            source: {
              dateRange: { date_from: '-30d' },
              interval: 'day',
              kind: 'TrendsQuery',
              properties: [
                {
                  key: '$event_name',
                  operator: 'icontains',
                  type: 'event',
                  value: 'trpc.',
                },
              ],
              series: [
                { event: '$pageview', kind: 'EventsNode', math: 'total' },
              ],
              version: 1,
            },
            version: 1,
          },
          visualization: 'Number',
        },
        undefined,
        INSIGHT_TAGS,
      ),
      // 15. Query Success Rate % (single number)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
          'tRPC Query Success Rate',
          'Percentage of successful tRPC queries',
          'Number',
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
      ),
      // 16. Mutation Success Rate % (single number)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'mutation',
          'tRPC Mutation Success Rate',
          'Percentage of successful tRPC mutations',
          'Number',
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
      ),
      // 17. Average Query Duration (single number)
      upsertInsight(
        projectId,
        createTrpcTypeInsight(
          'query',
          'tRPC Average Query Duration',
          'Average execution time for tRPC queries',
          'Number',
          {
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
                event: '$pageview',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
            ],
          },
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // NEW: Area Charts
      // 18. tRPC Volume Over Time (queries + mutations)
      upsertInsight(
        projectId,
        createTrpcMultiTypeInsight(
          'tRPC Volume Over Time',
          'Total tRPC API calls over time with volume emphasis',
          'ActionsAreaGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
      // 19. Query vs Mutation Volume Comparison
      upsertInsight(
        projectId,
        createTrpcMultiTypeInsight(
          'tRPC Query vs Mutation Volume',
          'Comparison of query and mutation volumes over time',
          'ActionsAreaGraph',
        ),
        undefined,
        INSIGHT_TAGS,
      ),
    ];

    // Wait for all insights to be created in parallel
    console.log(
      `   Creating ${insightPromises.length} insights in parallel...`,
    );
    const insightIds = await Promise.all(insightPromises);
    console.log(`✅ Created ${insightIds.length} insights\n`);

    // Destructure insight IDs
    const [
      queryVolumeInsightId,
      mutationVolumeInsightId,
      errorRateInsightId,
      queryVsMutationInsightId,
      successRateInsightId,
      mutationSuccessRateInsightId,
      queryDurationInsightId,
      mutationDurationInsightId,
      errorBreakdownInsightId,
      errorsByProcedureInsightId,
      failedQueriesInsightId,
      failedMutationsInsightId,
      totalCallsInsightId,
      totalTrpcCallsNumberInsightId,
      querySuccessRateNumberInsightId,
      mutationSuccessRateNumberInsightId,
      avgQueryDurationNumberInsightId,
      trpcVolumeAreaInsightId,
      queryVsMutationVolumeAreaInsightId,
    ] = insightIds;

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

    console.log('\n📝 Adding text cards to dashboard (parallelizing)...\n');

    // Add text cards to group insights - create all in parallel
    const textTiles = [
      createTextTile('## Number Metrics', 0, 'green'),
      createTextTile('## Performance Metrics', 4, 'blue'),
      createTextTile('## Area Charts', 8, 'purple'),
      createTextTile('## Error Analysis', 10, 'orange'),
      createTextTile('## Volume & Usage', 14, 'teal'),
    ];

    const textTilePromises = textTiles.map((textTile) =>
      addTextTileToDashboard(projectId, dashboard.id, textTile).catch(
        (error) => {
          console.warn(
            `⚠️  Could not add text card "${textTile.text}":`,
            error instanceof Error ? error.message : String(error),
          );
          return null;
        },
      ),
    );

    const textTileResults = await Promise.all(textTilePromises);
    const textTileCount = textTileResults.filter((r) => r !== null).length;
    console.log(`✅ Added ${textTileCount} text cards to dashboard\n`);

    console.log('\n🔗 Adding insights to dashboard (parallelizing)...\n');

    // Add insights to dashboard (organized by sections) - add all in parallel
    const insights = [
      // Number Metrics (NEW)
      totalTrpcCallsNumberInsightId,
      querySuccessRateNumberInsightId,
      mutationSuccessRateNumberInsightId,
      avgQueryDurationNumberInsightId,
      // Performance Metrics
      queryDurationInsightId,
      mutationDurationInsightId,
      successRateInsightId,
      mutationSuccessRateInsightId,
      // Area Charts (NEW)
      trpcVolumeAreaInsightId,
      queryVsMutationVolumeAreaInsightId,
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

    const insightAddPromises = insights.map((insightId) =>
      addInsightToDashboard(projectId, dashboard.id, insightId).catch(
        (error) => {
          console.warn(
            `⚠️  Could not add insight ${insightId} to dashboard:`,
            error instanceof Error ? error.message : String(error),
          );
          return null;
        },
      ),
    );

    const insightAddResults = await Promise.all(insightAddPromises);
    const addedCount = insightAddResults.filter((r) => r !== null).length;

    if (addedCount > 0) {
      console.log(`✅ Successfully added ${addedCount} insights to dashboard`);
    } else {
      console.warn('\n⚠️  Could not add insights to dashboard programmatically');
      console.warn(
        '   Insights were created successfully, but need to be added manually',
      );
    }

    if (textTileCount > 0) {
      console.log(
        `\n✅ Successfully added ${textTileCount} text cards to dashboard`,
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
        'Total tRPC Calls',
        'tRPC Query Success Rate',
        'tRPC Mutation Success Rate',
        'tRPC Average Query Duration',
        'tRPC Query Average Duration',
        'tRPC Mutation Average Duration',
        'tRPC Query Success Rate',
        'tRPC Mutation Success Rate',
        'tRPC Volume Over Time',
        'tRPC Query vs Mutation Volume',
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
