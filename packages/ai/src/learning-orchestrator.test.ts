/**
 * Tests for learning orchestrator
 */

import { describe, expect, it } from 'vitest';
import { determineStage, LEARNING_STAGES } from './learning-stages';

describe('Learning Stages', () => {
  describe('determineStage', () => {
    it('should return immediate-postbirth for days 1-3', () => {
      expect(determineStage(1)).toBe(LEARNING_STAGES.IMMEDIATE_POSTBIRTH);
      expect(determineStage(2)).toBe(LEARNING_STAGES.IMMEDIATE_POSTBIRTH);
      expect(determineStage(3)).toBe(LEARNING_STAGES.IMMEDIATE_POSTBIRTH);
    });

    it('should return first-week for days 4-7', () => {
      expect(determineStage(4)).toBe(LEARNING_STAGES.FIRST_WEEK);
      expect(determineStage(5)).toBe(LEARNING_STAGES.FIRST_WEEK);
      expect(determineStage(7)).toBe(LEARNING_STAGES.FIRST_WEEK);
    });

    it('should return second-week for days 8-14', () => {
      expect(determineStage(8)).toBe(LEARNING_STAGES.SECOND_WEEK);
      expect(determineStage(10)).toBe(LEARNING_STAGES.SECOND_WEEK);
      expect(determineStage(14)).toBe(LEARNING_STAGES.SECOND_WEEK);
    });

    it('should return third-week for days 15-21', () => {
      expect(determineStage(15)).toBe(LEARNING_STAGES.THIRD_WEEK);
      expect(determineStage(18)).toBe(LEARNING_STAGES.THIRD_WEEK);
      expect(determineStage(21)).toBe(LEARNING_STAGES.THIRD_WEEK);
    });

    it('should return month-one for days 22-42', () => {
      expect(determineStage(22)).toBe(LEARNING_STAGES.MONTH_ONE);
      expect(determineStage(30)).toBe(LEARNING_STAGES.MONTH_ONE);
      expect(determineStage(42)).toBe(LEARNING_STAGES.MONTH_ONE);
    });

    it('should return month-two for days 43-70', () => {
      expect(determineStage(43)).toBe(LEARNING_STAGES.MONTH_TWO);
      expect(determineStage(56)).toBe(LEARNING_STAGES.MONTH_TWO);
      expect(determineStage(70)).toBe(LEARNING_STAGES.MONTH_TWO);
    });

    it('should return month-three-four for days 71-112', () => {
      expect(determineStage(71)).toBe(LEARNING_STAGES.MONTH_THREE_FOUR);
      expect(determineStage(90)).toBe(LEARNING_STAGES.MONTH_THREE_FOUR);
      expect(determineStage(112)).toBe(LEARNING_STAGES.MONTH_THREE_FOUR);
    });

    it('should default to month-three-four for ages beyond 112 days', () => {
      expect(determineStage(120)).toBe(LEARNING_STAGES.MONTH_THREE_FOUR);
      expect(determineStage(200)).toBe(LEARNING_STAGES.MONTH_THREE_FOUR);
    });

    it('should default to immediate-postbirth for age 0 or below', () => {
      expect(determineStage(0)).toBe(LEARNING_STAGES.IMMEDIATE_POSTBIRTH);
    });
  });
});

// Note: Full integration tests for generateDailyLearning would require
// mocking the BAML client and database calls, which is beyond the scope
// of this basic test file. These tests validate the stage routing logic.

