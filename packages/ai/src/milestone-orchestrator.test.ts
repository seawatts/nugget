/**
 * Tests for milestone orchestrator
 */

import { describe, expect, test } from 'bun:test';
import type { MilestoneContext } from './milestone-orchestrator';
import { generateMilestoneSuggestions, extractRecentMilestoneIds } from './milestone-orchestrator';

describe('Milestone Orchestrator', () => {
  describe('extractRecentMilestoneIds', () => {
    test('should extract IDs from achieved milestones', () => {
      const context: MilestoneContext = {
        babyName: 'Riley',
        ageInDays: 10,
        ageInWeeks: 1,
        achievedMilestones: [
          { id: 'm1', title: 'First smile', achievedAt: new Date('2025-11-10') },
          { id: 'm2', title: 'Tracks faces', achievedAt: new Date('2025-11-12') },
        ],
      };

      const ids = extractRecentMilestoneIds(context);
      expect(ids).toEqual(['m1', 'm2']);
    });

    test('should extract IDs from recently suggested milestones', () => {
      const context: MilestoneContext = {
        babyName: 'Jordan',
        ageInDays: 14,
        ageInWeeks: 2,
        recentlySuggestedMilestones: [
          { id: 'm3', title: 'Head lift', suggestedAt: new Date('2025-11-15') },
        ],
      };

      const ids = extractRecentMilestoneIds(context);
      expect(ids).toEqual(['m3']);
    });

    test('should combine both achieved and suggested milestone IDs', () => {
      const context: MilestoneContext = {
        babyName: 'Alex',
        ageInDays: 20,
        ageInWeeks: 3,
        achievedMilestones: [
          { id: 'm1', title: 'First smile', achievedAt: new Date('2025-11-10') },
        ],
        recentlySuggestedMilestones: [
          { id: 'm2', title: 'Head lift', suggestedAt: new Date('2025-11-15') },
        ],
      };

      const ids = extractRecentMilestoneIds(context);
      expect(ids).toEqual(['m1', 'm2']);
    });
  });

  describe('generateMilestoneSuggestions', () => {
    test('should generate milestone plan and content for week 2 baby', async () => {
      const context: MilestoneContext = {
        babyName: 'Riley',
        babySex: 'F',
        ageInDays: 14,
        ageInWeeks: 2,
        currentWeightOz: 120,
        birthWeightOz: 115,
        feedingCount24h: 9,
        sleepCount24h: 7,
        diaperCount24h: 8,
        hasTummyTimeActivity: true,
        achievedMilestones: [
          { id: 'm1', title: 'First meconium diaper', achievedAt: new Date('2025-11-03') },
        ],
      };

      const result = await generateMilestoneSuggestions(context);

      // Check plan structure
      expect(result.plan).toBeDefined();
      expect(result.plan.items).toBeArray();
      expect(result.plan.items.length).toBeGreaterThan(0);
      expect(result.plan.items.length).toBeLessThanOrEqual(3);
      expect(result.plan.reasoning).toBeString();
      expect(result.plan.coveredTypes).toBeArray();
      expect(result.plan.developmentalFocus).toBeString();

      // Check each plan item
      for (const item of result.plan.items) {
        expect(item.title).toBeString();
        expect(item.type).toBeString();
        expect(['physical', 'cognitive', 'social', 'language', 'self_care']).toContain(item.type);
        expect(item.ageLabel).toBeString();
        expect(item.relevance).toBeString();
        expect(item.priority).toBeNumber();
        expect(item.priority).toBeGreaterThanOrEqual(1);
        expect(item.priority).toBeLessThanOrEqual(5);
        expect(item.expectedInStage).toBeBoolean();
        expect(item.avoidDuplicateOf).toBeArray();
        expect(item.recommendYesNo).toBeBoolean();
      }

      // Check milestone content
      expect(result.milestones).toBeArray();
      expect(result.milestones.length).toBe(result.plan.items.length);

      for (const milestone of result.milestones) {
        expect(milestone.bulletPoints).toBeArray();
        expect(milestone.bulletPoints.length).toBeGreaterThanOrEqual(2);
        expect(milestone.bulletPoints.length).toBeLessThanOrEqual(3);
        expect(milestone.followUpQuestion).toBeString();
        expect(milestone.summary).toBeString();
        expect(milestone.isYesNoQuestion).toBeBoolean();

        // Validate yes/no question requirements
        if (milestone.isYesNoQuestion) {
          expect(milestone.openChatOnYes !== null || milestone.openChatOnNo !== null).toBe(true);
        }
      }

      console.log('\n════════════════════════════════════════════════════════════════');
      console.log('MILESTONE TEST: Week 2 Baby (Riley)');
      console.log('════════════════════════════════════════════════════════════════');
      console.log(`Plan reasoning: ${result.plan.reasoning}`);
      console.log(`Covered types: ${result.plan.coveredTypes.join(', ')}`);
      console.log(`Developmental focus: ${result.plan.developmentalFocus}`);
      console.log('\nPlanned items:');
      result.plan.items.forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.title} (${item.type})`);
        console.log(`   Relevance: ${item.relevance}`);
        console.log(`   Priority: ${item.priority}/5`);
        console.log(`   Expected in stage: ${item.expectedInStage}`);
      });
      console.log('\n════════════════════════════════════════════════════════════════');
      console.log('GENERATED MILESTONES');
      console.log('════════════════════════════════════════════════════════════════');
      result.milestones.forEach((milestone, i) => {
        console.log(`\n${i + 1}. ${result.plan.items[i]?.title}`);
        console.log(`   Summary: ${milestone.summary}`);
        console.log(`   Question: ${milestone.followUpQuestion}`);
        console.log(`   Is Yes/No: ${milestone.isYesNoQuestion}`);
        if (milestone.isYesNoQuestion) {
          console.log(`   Opens on Yes: ${milestone.openChatOnYes}`);
          console.log(`   Opens on No: ${milestone.openChatOnNo}`);
        }
      });
      console.log('════════════════════════════════════════════════════════════════\n');
    }, 30000); // 30 second timeout for AI calls

    test('should generate milestone plan for month 1 baby with tummy time context', async () => {
      const context: MilestoneContext = {
        babyName: 'Jordan',
        babySex: 'M',
        ageInDays: 28,
        ageInWeeks: 4,
        feedingCount24h: 8,
        sleepCount24h: 6,
        diaperCount24h: 7,
        hasTummyTimeActivity: true,
        achievedMilestones: [
          { id: 'm1', title: 'Tracks faces', achievedAt: new Date('2025-10-25') },
        ],
        recentChatMessages: [
          { role: 'user', content: 'When will Jordan start smiling?' },
          { role: 'assistant', content: 'Social smiles typically emerge around 6-8 weeks.' },
        ],
      };

      const result = await generateMilestoneSuggestions(context);

      expect(result.plan).toBeDefined();
      expect(result.milestones).toBeDefined();
      expect(result.plan.items.length).toBeGreaterThan(0);

      // Since parents asked about smiling, plan should consider that
      const hasSmileRelated = result.plan.items.some(
        item => item.title.toLowerCase().includes('smile')
      );

      console.log('\n════════════════════════════════════════════════════════════════');
      console.log('MILESTONE TEST: Month 1 Baby (Jordan) - Social Smile Focus');
      console.log('════════════════════════════════════════════════════════════════');
      console.log(`Plan included smile-related milestone: ${hasSmileRelated}`);
      console.log(`Plan reasoning: ${result.plan.reasoning}`);
      console.log('\nPlanned items:');
      result.plan.items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title} (Priority: ${item.priority}/5)`);
      });
      console.log('════════════════════════════════════════════════════════════════\n');
    }, 30000);
  });
});

