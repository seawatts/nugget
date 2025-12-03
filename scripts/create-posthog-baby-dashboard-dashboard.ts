#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for Baby Dashboard component events
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-baby-dashboard-dashboard.ts
 *
 * Required environment variables (injected by Infisical):
 *   - POSTHOG_API_KEY or POSTHOG_PERSONAL_API_KEY: PostHog Personal API key
 *   - POSTHOG_HOST: PostHog host URL (defaults to https://us.posthog.com)
 *   - POSTHOG_ENV_ID: PostHog project/environment ID (optional)
 */

import {
  addInsightToDashboard,
  addTextTileToDashboard,
  createFunnelInsight,
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

const DASHBOARD_TAGS = [
  'baby-dashboard',
  'dashboard-components',
  'api-created',
];
const INSIGHT_TAGS = ['baby-dashboard', 'dashboard-components'];

async function main() {
  console.log('🚀 Creating PostHog Baby Dashboard Components Dashboard\n');

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

    // 1. Dashboard Container Initial Load Time (Average)
    const containerLoadInsightId = await upsertInsight(
      projectId,
      {
        description:
          'Average time for dashboard container initial load (before all components)',
        name: 'Dashboard Container Initial Load Time',
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
              {
                key: 'full_page_load',
                operator: 'exact',
                type: 'event',
                value: false,
              },
            ],
            series: [
              {
                event: 'dashboard.container.load',
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

    // 1b. Full Page Load Time (Average) - When ALL components finish loading
    const fullPageLoadInsightId = await upsertInsight(
      projectId,
      {
        description:
          'Average time for entire dashboard to fully load (all components + API calls)',
        name: 'Full Page Load Time',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            properties: [
              {
                key: 'full_page_load',
                operator: 'exact',
                type: 'event',
                value: true,
              },
            ],
            series: [
              {
                event: 'dashboard.container.load',
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

    // 1c. Component Load Times Breakdown
    const componentLoadTimesInsightId = await upsertInsight(
      projectId,
      {
        description: 'Average load time for each dashboard component',
        name: 'Component Load Times',
        query: {
          kind: 'InsightVizNode',
          source: {
            dateRange: { date_from: '-30d' },
            interval: 'day',
            kind: 'TrendsQuery',
            series: [
              {
                event: 'dashboard.celebrations_carousel.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.today_summary.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.activity_cards.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.learning_carousel.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.developmental_phases_carousel.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.milestones_carousel.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
              {
                event: 'dashboard.activity_timeline.load',
                kind: 'EventsNode',
                math: 'avg',
                math_property: 'duration_ms',
              },
            ],
            version: 1,
          },
          version: 1,
        },
        visualization: 'ActionsBar',
      },
      undefined,
      INSIGHT_TAGS,
    );

    // 2. Activity Cards - Activities Logged
    const activityLoggedInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_cards.activity_logged',
        'Activities Logged from Cards',
        'Number of activities logged from activity cards',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 3. Activity Timeline Filter Changes
    const timelineFilterInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_timeline.filter_change',
        'Activity Timeline Filter Changes',
        'Number of filter changes in activity timeline',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 4. Milestones Carousel Views
    const milestonesViewInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.milestones_carousel.view',
        'Milestones Carousel Views',
        'Number of times milestones carousel is viewed',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 5. Celebrations Dismissed
    const celebrationsDismissedInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.celebrations_carousel.dismissed',
        'Celebrations Dismissed',
        'Number of celebrations dismissed by users',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 6. Learning Carousel Views
    const learningViewInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.learning_carousel.view',
        'Learning Carousel Views',
        'Number of times learning carousel is viewed',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 7. Developmental Phases Carousel Views
    const phasesViewInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.developmental_phases_carousel.view',
        'Developmental Phases Carousel Views',
        'Number of times developmental phases carousel is viewed',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 8. Parent Wellness Questions Answered
    const parentWellnessInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.parent_wellness.question_answered',
        'Parent Wellness Questions Answered',
        'Number of parent wellness questions answered',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 9. Today Summary Quick Actions
    const quickActionsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.today_summary.quick_action',
        'Today Summary Quick Actions',
        'Number of quick action clicks from today summary card',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 10. Today Summary Quick Actions Breakdown by Type
    const quickActionsBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.today_summary.quick_action',
        'Today Summary Quick Actions by Type',
        'Breakdown of quick action clicks by action type',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 11. Activity Cards Quick Actions
    const activityCardsQuickActionsInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_cards.quick_action',
        'Activity Cards Quick Actions',
        'Number of quick action clicks from activity cards',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 12. Activity Cards Quick Actions Breakdown by Type
    const activityCardsQuickActionsBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_cards.quick_action',
        'Activity Cards Quick Actions by Type',
        'Breakdown of quick action clicks by activity and action type',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 13. Activity Cards Drawer Opens
    const activityCardsDrawerOpenInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_cards.drawer_open',
        'Activity Cards Drawer Opens',
        'Number of drawer opens from activity cards',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 14. Activity Cards Drawer Opens Breakdown by Activity Type
    const activityCardsDrawerOpenBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_cards.drawer_open',
        'Activity Cards Drawer Opens by Activity Type',
        'Breakdown of drawer opens by activity type',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 15. Activity Timeline Drawer Opens
    const activityTimelineDrawerOpenInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_timeline.drawer_open',
        'Activity Timeline Drawer Opens',
        'Number of drawer opens from activity timeline',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 16. Activity Timeline Drawer Opens Breakdown by Activity Type
    const activityTimelineDrawerOpenBreakdownInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.activity_timeline.drawer_open',
        'Activity Timeline Drawer Opens by Activity Type',
        'Breakdown of timeline drawer opens by activity type',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 17. Stats Drawer Opens (all types)
    const drawerOpenInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.*.drawer_open',
        'Stats Drawer Opens',
        'Total number of stats drawer opens across all activity types',
        'ActionsBar',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 10. Component Interaction Volume
    const componentVolumeInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'dashboard.container.load',
          'dashboard.activity_cards.activity_logged',
          'dashboard.activity_timeline.filter_change',
          'dashboard.milestones_carousel.view',
          'dashboard.celebrations_carousel.dismissed',
          'dashboard.learning_carousel.view',
          'dashboard.developmental_phases_carousel.view',
          'dashboard.parent_wellness.question_answered',
        ],
        'Dashboard Component Interaction Volume',
        'Total interactions across all dashboard components',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 11. Component Breakdown
    const componentBreakdownInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'dashboard.activity_cards.activity_logged',
          'dashboard.activity_timeline.filter_change',
          'dashboard.milestones_carousel.view',
          'dashboard.celebrations_carousel.dismissed',
          'dashboard.learning_carousel.view',
          'dashboard.developmental_phases_carousel.view',
          'dashboard.parent_wellness.question_answered',
        ],
        'Dashboard Component Usage Breakdown',
        'Distribution of interactions across dashboard components',
        'ActionsPie',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Number Metrics
    // 12. Total Dashboard Loads (with period comparison)
    const totalDashboardLoadsInsightId = await upsertInsight(
      projectId,
      createNumberInsight(
        'dashboard.container.load',
        'Total Dashboard Loads',
        'Total number of dashboard loads with period-over-period comparison',
        'total',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 13. Average Full Page Load Time (single number)
    const avgFullPageLoadTimeInsightId = await upsertInsight(
      projectId,
      createNumberInsight(
        'dashboard.container.load',
        'Average Full Page Load Time',
        'Average time for entire dashboard to fully load',
        'avg',
        'duration_ms',
        {
          properties: [
            {
              key: 'full_page_load',
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

    // 14. Total Component Interactions (with period comparison)
    const totalComponentInteractionsInsightId = await upsertInsight(
      projectId,
      createNumberInsight(
        'dashboard.*.load',
        'Total Component Interactions',
        'Total number of component interactions with period-over-period comparison',
        'total',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Area Charts
    // 15. Component Load Times (area chart for volume emphasis)
    const componentLoadTimesAreaInsightId = await upsertInsight(
      projectId,
      createMultiEventAreaChartInsight(
        [
          'dashboard.celebrations_carousel.load',
          'dashboard.today_summary.load',
          'dashboard.activity_cards.load',
          'dashboard.learning_carousel.load',
          'dashboard.developmental_phases_carousel.load',
          'dashboard.milestones_carousel.load',
          'dashboard.activity_timeline.load',
        ],
        'Component Load Times (Area Chart)',
        'Component load times over time with volume emphasis',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 16. User Interaction Volume Over Time
    const userInteractionVolumeAreaInsightId = await upsertInsight(
      projectId,
      createMultiEventAreaChartInsight(
        [
          'dashboard.activity_cards.activity_logged',
          'dashboard.today_summary.quick_action',
          'dashboard.activity_cards.quick_action',
          'dashboard.activity_cards.drawer_open',
          'dashboard.activity_timeline.drawer_open',
        ],
        'User Interaction Volume Over Time',
        'Total user interactions over time with volume emphasis',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Funnel
    // 17. User Journey: Dashboard Load → Component Interaction → Activity Logged
    const userJourneyFunnelInsightId = await upsertInsight(
      projectId,
      createFunnelInsight(
        [
          'dashboard.container.load',
          'dashboard.activity_cards.load',
          'dashboard.activity_cards.activity_logged',
        ],
        'User Journey: Dashboard → Component → Activity',
        'Conversion funnel from dashboard load to activity logging',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // NEW: Retention
    // 18. User Engagement Retention
    // NOTE: Retention queries require a different API format - skipping for now
    // const userEngagementRetentionInsightId = await upsertInsight(
    //   projectId,
    //   createRetentionInsight(
    //     'dashboard.container.load',
    //     'dashboard.container.load',
    //     'User Engagement Retention',
    //     'Retention rate of users who return to dashboard',
    //     'Day',
    //     11,
    //   ),
    //   undefined,
    //   INSIGHT_TAGS,
    // );

    console.log('\n📋 Upserting dashboard...\n');

    // Upsert dashboard (text tiles will be added manually in PostHog UI)
    const dashboard = await upsertDashboard(
      projectId,
      {
        description:
          'Dashboard tracking user interactions and performance metrics for baby dashboard components',
        name: 'Baby Dashboard Components',
        pinned: true,
      },
      DASHBOARD_TAGS,
    );

    console.log('\n📝 Adding text cards to dashboard...\n');

    // Add text cards to group insights
    const textTiles = [
      createTextTile('## Performance Metrics', 0, 'blue'),
      createTextTile('## Number Metrics', 3, 'green'),
      createTextTile('## Area Charts', 6, 'purple'),
      createTextTile('## User Interactions', 8, 'orange'),
      createTextTile('## Funnel Analysis', 20, 'red'),
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

    // Add insights to dashboard (organized by sections)
    const insights = [
      // Performance Metrics
      containerLoadInsightId,
      fullPageLoadInsightId,
      componentLoadTimesInsightId,
      // Number Metrics (NEW)
      totalDashboardLoadsInsightId,
      avgFullPageLoadTimeInsightId,
      totalComponentInteractionsInsightId,
      // Area Charts (NEW)
      componentLoadTimesAreaInsightId,
      userInteractionVolumeAreaInsightId,
      // User Interactions
      componentVolumeInsightId,
      activityLoggedInsightId,
      quickActionsInsightId,
      quickActionsBreakdownInsightId,
      activityCardsQuickActionsInsightId,
      activityCardsQuickActionsBreakdownInsightId,
      activityCardsDrawerOpenInsightId,
      activityCardsDrawerOpenBreakdownInsightId,
      activityTimelineDrawerOpenInsightId,
      activityTimelineDrawerOpenBreakdownInsightId,
      timelineFilterInsightId,
      milestonesViewInsightId,
      celebrationsDismissedInsightId,
      learningViewInsightId,
      phasesViewInsightId,
      parentWellnessInsightId,
      drawerOpenInsightId,
      componentBreakdownInsightId,
      // Funnel (NEW)
      userJourneyFunnelInsightId,
      // userEngagementRetentionInsightId, // Retention queries need different format
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
        'Dashboard Container Initial Load Time',
        'Full Page Load Time',
        'Component Load Times',
        'Total Dashboard Loads',
        'Average Full Page Load Time',
        'Total Component Interactions',
        'Component Load Times (Area Chart)',
        'User Interaction Volume Over Time',
        'Dashboard Component Interaction Volume',
        'Activities Logged from Cards',
        'Today Summary Quick Actions',
        'Today Summary Quick Actions by Type',
        'Activity Cards Quick Actions',
        'Activity Cards Quick Actions by Type',
        'Activity Cards Drawer Opens',
        'Activity Cards Drawer Opens by Activity Type',
        'Activity Timeline Drawer Opens',
        'Activity Timeline Drawer Opens by Activity Type',
        'Activity Timeline Filter Changes',
        'Milestones Carousel Views',
        'Celebrations Dismissed',
        'Learning Carousel Views',
        'Developmental Phases Carousel Views',
        'Parent Wellness Questions Answered',
        'Stats Drawer Opens',
        'Dashboard Component Usage Breakdown',
        'User Journey: Dashboard → Component → Activity',
      ];

      insights.forEach((insightId, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${insightId}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${insightId}\n`);
      });

      console.log(
        '   Or filter insights by tags: baby-dashboard, dashboard-components\n',
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
