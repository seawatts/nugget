#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for application errors and exceptions
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-errors-dashboard.ts
 *
 * Required environment variables (injected by Infisical):
 *   - POSTHOG_API_KEY or POSTHOG_PERSONAL_API_KEY: PostHog Personal API key
 *   - POSTHOG_HOST: PostHog host URL (defaults to https://us.posthog.com)
 *   - POSTHOG_ENV_ID: PostHog project/environment ID (optional)
 */

import {
  addInsightToDashboard,
  addTextTileToDashboard,
  createMultiEventAreaChartInsight,
  createMultiEventTrendsInsight,
  createNumberInsight,
  createTextTile,
  createTrendsInsight,
  getPostHogHost,
  getProjectId,
  getProjectInfo,
  upsertDashboard,
  upsertInsight,
} from './posthog-dashboard-utils';

const DASHBOARD_TAGS = ['errors', 'exceptions', 'api-created'];
const INSIGHT_TAGS = ['errors', 'exceptions'];

async function main() {
  console.log('🚀 Creating PostHog Errors & Exceptions Dashboard\n');

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

    // 1. Total Errors Over Time (all error sources)
    const totalErrorsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          '$exception', // PostHog exception events
          'trpc.error',
          'mutation_failed',
          'mutation_recovery_failed',
        ],
        'Total Errors Over Time',
        'Total number of errors and exceptions across all sources',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 2. Error Breakdown by Source
    const errorBreakdownInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          '$exception',
          'trpc.error',
          'mutation_failed',
          'mutation_recovery_failed',
        ],
        'Error Breakdown by Source',
        'Distribution of errors by source type',
        'ActionsPie',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 3. PostHog Exceptions
    const exceptionsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        '$exception',
        'PostHog Exceptions',
        'Number of exceptions captured by PostHog',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 4. tRPC Errors
    const trpcErrorsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.error',
        'tRPC Errors',
        'Number of tRPC errors over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 5. Mutation Errors
    const mutationErrorsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        ['mutation_failed', 'mutation_recovery_failed'],
        'Mutation Errors',
        'Number of mutation failures and recovery failures',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 6. Failed Server Actions (errors with success=false)
    const serverActionErrorsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'server_action.*',
        'Failed Server Actions',
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

    // 7. Failed tRPC Queries/Mutations
    const failedTrpcInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        ['trpc.*.query', 'trpc.*.mutation'],
        'Failed tRPC Calls',
        'Number of failed tRPC queries and mutations',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 8. Error Rate Trend
    const errorRateTrendInsightId = await upsertInsight(
      projectId,
      {
        description: 'Percentage of operations that result in errors',
        name: 'Error Rate Trend',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              {
                event: '$exception',
                kind: 'EventsNode',
              },
              {
                event: 'trpc.error',
                kind: 'EventsNode',
              },
              {
                event: 'mutation_failed',
                kind: 'EventsNode',
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

    // 9. Most Common Error Messages
    const commonErrorsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        '$exception',
        'Most Common Error Messages',
        'Top error messages by frequency',
        'ActionsTable',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 10. Errors by Error Code (tRPC)
    const errorsByCodeInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'trpc.error',
        'Errors by Error Code',
        'Distribution of errors by error code',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Number Metrics
    // 11. Total Errors (with period comparison)
    const totalErrorsNumberInsightId = await upsertInsight(
      projectId,
      createNumberInsight(
        '$exception',
        'Total Errors',
        'Total number of errors and exceptions with period-over-period comparison',
        'total',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 12. Error Rate % (single number)
    const errorRateNumberInsightId = await upsertInsight(
      projectId,
      {
        description: 'Percentage of operations that result in errors',
        name: 'Error Rate',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              {
                event: '$exception',
                kind: 'EventsNode',
              },
            ],
            version: 1,
          },
          version: 1,
        },
        visualization: 'Number',
      },
      undefined,
      INSIGHT_TAGS,
    );

    // 13. Critical Errors Count (single number)
    const criticalErrorsNumberInsightId = await upsertInsight(
      projectId,
      createNumberInsight(
        '$exception',
        'Critical Errors Count',
        'Total number of critical errors',
        'total',
        undefined,
        {
          properties: [
            {
              key: 'level',
              operator: 'exact',
              type: 'event',
              value: 'error',
            },
          ],
        },
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Area Charts
    // 14. Error Volume Over Time (area chart)
    const errorVolumeAreaInsightId = await upsertInsight(
      projectId,
      createMultiEventAreaChartInsight(
        [
          '$exception',
          'trpc.error',
          'mutation_failed',
          'mutation_recovery_failed',
        ],
        'Error Volume Over Time',
        'Total errors and exceptions over time with volume emphasis',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 15. Error Breakdown by Source (stacked area)
    const errorBreakdownAreaInsightId = await upsertInsight(
      projectId,
      createMultiEventAreaChartInsight(
        [
          '$exception',
          'trpc.error',
          'mutation_failed',
          'mutation_recovery_failed',
        ],
        'Error Breakdown by Source (Stacked Area)',
        'Distribution of errors by source type over time',
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
          'Dashboard tracking all application errors, exceptions, and failures across tRPC, server actions, mutations, and PostHog exceptions',
        name: 'Errors & Exceptions',
        pinned: true,
      },
      DASHBOARD_TAGS,
    );

    console.log('\n📝 Adding text cards to dashboard...\n');

    // Add text cards to group insights
    const textTiles = [
      createTextTile('## Number Metrics', 0, 'green'),
      createTextTile('## Area Charts', 3, 'purple'),
      createTextTile('## Error Breakdown', 5, 'orange'),
      createTextTile('## Error Sources', 8, 'red'),
      createTextTile('## Error Analysis', 12, 'blue'),
    ];

    let textTileCount = 0;
    for (const textTile of textTiles) {
      try {
        await addTextTileToDashboard(projectId, dashboard.id, textTile);
        textTileCount++;
        console.log(`✅ Added text card: ${textTile.text}`);
      } catch (error) {
        console.warn(
          `⚠️  Could not add text card "${textTile.text}":`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Add insights to dashboard
    const insights = [
      // Number Metrics (NEW)
      totalErrorsNumberInsightId,
      errorRateNumberInsightId,
      criticalErrorsNumberInsightId,
      // Area Charts (NEW)
      errorVolumeAreaInsightId,
      errorBreakdownAreaInsightId,
      // Existing Insights
      totalErrorsInsightId,
      errorBreakdownInsightId,
      exceptionsInsightId,
      trpcErrorsInsightId,
      mutationErrorsInsightId,
      serverActionErrorsInsightId,
      failedTrpcInsightId,
      errorRateTrendInsightId,
      commonErrorsInsightId,
      errorsByCodeInsightId,
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
        'Total Errors',
        'Error Rate',
        'Critical Errors Count',
        'Error Volume Over Time',
        'Error Breakdown by Source (Stacked Area)',
        'Total Errors Over Time',
        'Error Breakdown by Source',
        'PostHog Exceptions',
        'tRPC Errors',
        'Mutation Errors',
        'Failed Server Actions',
        'Failed tRPC Calls',
        'Error Rate Trend',
        'Most Common Error Messages',
        'Errors by Error Code',
      ];

      insights.forEach((insightId, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${insightId}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${insightId}\n`);
      });

      console.log('   Or filter insights by tags: errors, exceptions\n');
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
