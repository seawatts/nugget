#!/usr/bin/env bun

/**
 * Script to create a PostHog dashboard for User/Organization events (Clerk webhooks)
 *
 * Usage:
 *   infisical run -- bun scripts/create-posthog-user-org-dashboard.ts
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

const DASHBOARD_TAGS = ['user-org', 'clerk-webhooks', 'api-created'];
const INSIGHT_TAGS = ['user-org', 'clerk-webhooks'];

async function main() {
  console.log('🚀 Creating PostHog User/Organization Events Dashboard\n');

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

    // 1. User Events Volume
    const userEventsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        ['user_created', 'user_updated', 'user_deleted'],
        'User Events Volume',
        'Total user lifecycle events (created, updated, deleted)',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 2. Organization Events Volume
    const orgEventsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'organization_created',
          'organization_updated',
          'organization_membership_created',
          'organization_membership_updated',
          'organization_membership_deleted',
          'organization_invitation_accepted',
        ],
        'Organization Events Volume',
        'Total organization lifecycle events',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 3. Session Events Volume
    const sessionEventsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        ['session_created', 'session_ended'],
        'Session Events Volume',
        'Total session lifecycle events',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 4. User Created Events
    const userCreatedInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'user_created',
        'Users Created',
        'Number of new users created over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 5. User Updated Events
    const userUpdatedInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'user_updated',
        'Users Updated',
        'Number of user updates over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 6. Organization Created Events
    const orgCreatedInsightId = await upsertInsight(
      projectId,
      createTrendsInsight(
        'organization_created',
        'Organizations Created',
        'Number of new organizations created over time',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 7. Organization Membership Events
    const membershipEventsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'organization_membership_created',
          'organization_membership_updated',
          'organization_membership_deleted',
        ],
        'Organization Membership Events',
        'Total organization membership changes',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 8. Session Created vs Ended
    const sessionComparisonInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        ['session_created', 'session_ended'],
        'Session Created vs Ended',
        'Comparison of session creation and termination',
        'ActionsLineGraph',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 9. Event Type Breakdown
    const eventBreakdownInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'user_created',
          'user_updated',
          'user_deleted',
          'organization_created',
          'organization_updated',
          'organization_membership_created',
          'organization_membership_updated',
          'organization_membership_deleted',
          'organization_invitation_accepted',
          'session_created',
          'session_ended',
        ],
        'User/Org Event Type Breakdown',
        'Distribution of different user and organization event types',
        'ActionsPie',
      ),
      undefined,
      INSIGHT_TAGS,
    );

    // 10. Total Events Volume
    const totalEventsInsightId = await upsertInsight(
      projectId,
      createMultiEventTrendsInsight(
        [
          'user_created',
          'user_updated',
          'user_deleted',
          'organization_created',
          'organization_updated',
          'organization_membership_created',
          'organization_membership_updated',
          'organization_membership_deleted',
          'organization_invitation_accepted',
          'session_created',
          'session_ended',
        ],
        'Total User/Org Events Volume',
        'Total number of all user and organization events',
        'ActionsLineGraph',
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
          'Dashboard tracking user and organization lifecycle events from Clerk webhooks',
        name: 'User/Organization Events',
        pinned: true,
      },
      DASHBOARD_TAGS,
    );

    console.log('\n🔗 Adding insights to dashboard...\n');

    // Add insights to dashboard
    const insights = [
      totalEventsInsightId,
      userEventsInsightId,
      orgEventsInsightId,
      sessionEventsInsightId,
      userCreatedInsightId,
      userUpdatedInsightId,
      orgCreatedInsightId,
      membershipEventsInsightId,
      sessionComparisonInsightId,
      eventBreakdownInsightId,
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
        'Total User/Org Events Volume',
        'User Events Volume',
        'Organization Events Volume',
        'Session Events Volume',
        'Users Created',
        'Users Updated',
        'Organizations Created',
        'Organization Membership Events',
        'Session Created vs Ended',
        'User/Org Event Type Breakdown',
      ];

      insights.forEach((insightId, index) => {
        const insightUrl = `${baseUrl}/project/${projectId}/insights/${insightId}`;
        console.log(`   ${index + 1}. ${insightNames[index]}`);
        console.log(`      URL: ${insightUrl}`);
        console.log(`      ID: ${insightId}\n`);
      });

      console.log('   Or filter insights by tags: user-org, clerk-webhooks\n');
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
