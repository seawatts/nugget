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
  createMultiEventTrendsInsight,
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

    // 1. Dashboard Container Load Time
    const containerLoadInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'dashboard.container.load',
        'Dashboard Container Load Time',
        'Average time for dashboard container to load',
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

    // 9. Stats Drawer Opens (all types)
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

    console.log('\n📋 Upserting dashboard...\n');

    // Upsert dashboard
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

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Add insights to dashboard
    const insights = [
      componentVolumeInsightId,
      containerLoadInsightId,
      activityLoggedInsightId,
      timelineFilterInsightId,
      milestonesViewInsightId,
      celebrationsDismissedInsightId,
      learningViewInsightId,
      phasesViewInsightId,
      parentWellnessInsightId,
      drawerOpenInsightId,
      componentBreakdownInsightId,
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
        'Dashboard Component Interaction Volume',
        'Dashboard Container Load Time',
        'Activities Logged from Cards',
        'Activity Timeline Filter Changes',
        'Milestones Carousel Views',
        'Celebrations Dismissed',
        'Learning Carousel Views',
        'Developmental Phases Carousel Views',
        'Parent Wellness Questions Answered',
        'Stats Drawer Opens',
        'Dashboard Component Usage Breakdown',
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
