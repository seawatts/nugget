import { describe, expect, it } from 'vitest';
import {
  calculateBabyAgeDays,
  calculatePumpingVolumes,
  isColostrumPhase,
  mlToOz,
  ozToMl,
} from './pumping-volume-calculator';

describe('pumping-volume-calculator', () => {
  describe('calculatePumpingVolumes', () => {
    it('should calculate very small volumes for day 1 (colostrum)', () => {
      const result = calculatePumpingVolumes(1, 20);
      expect(result.isColostrum).toBe(true);
      expect(result.totalMl).toBeLessThan(20);
      expect(result.leftMl).toBeCloseTo(result.rightMl, 0);
    });

    it('should calculate small volumes for day 3 (early colostrum)', () => {
      const result = calculatePumpingVolumes(3, 20);
      expect(result.isColostrum).toBe(true);
      expect(result.totalMl).toBeGreaterThan(10);
      expect(result.totalMl).toBeLessThan(30);
    });

    it('should calculate transitional volumes for day 7', () => {
      const result = calculatePumpingVolumes(7, 20);
      expect(result.isColostrum).toBe(false);
      expect(result.totalMl).toBeGreaterThan(60); // 2+ oz
      expect(result.totalMl).toBeLessThan(100); // < 3.5 oz
    });

    it('should calculate mature milk volumes for 2 weeks', () => {
      const result = calculatePumpingVolumes(14, 20);
      expect(result.isColostrum).toBe(false);
      expect(result.totalMl).toBeGreaterThan(60);
    });

    it('should scale volumes proportionally with duration', () => {
      const result10min = calculatePumpingVolumes(14, 10);
      const result20min = calculatePumpingVolumes(14, 20);
      const result30min = calculatePumpingVolumes(14, 30);

      // 10 min should be approximately half of 20 min
      expect(result10min.totalMl).toBeLessThan(result20min.totalMl);
      // 30 min should be approximately 1.5x of 20 min
      expect(result30min.totalMl).toBeGreaterThan(result20min.totalMl);
    });

    it('should use baby mlPerPump setting for older babies', () => {
      const customMlPerPump = 120;
      const result = calculatePumpingVolumes(60, 20, customMlPerPump);
      expect(result.totalMl).toBe(customMlPerPump);
    });

    it('should split volumes equally between breasts', () => {
      const result = calculatePumpingVolumes(30, 20);
      expect(result.leftMl).toEqual(result.rightMl);
      expect(result.leftMl + result.rightMl).toEqual(result.totalMl);
    });
  });

  describe('isColostrumPhase', () => {
    it('should return true for days 0-5', () => {
      expect(isColostrumPhase(0)).toBe(true);
      expect(isColostrumPhase(1)).toBe(true);
      expect(isColostrumPhase(5)).toBe(true);
    });

    it('should return false for day 6+', () => {
      expect(isColostrumPhase(6)).toBe(false);
      expect(isColostrumPhase(10)).toBe(false);
      expect(isColostrumPhase(30)).toBe(false);
    });
  });

  describe('mlToOz', () => {
    it('should convert ml to oz correctly', () => {
      expect(mlToOz(30)).toBeCloseTo(1, 0);
      expect(mlToOz(60)).toBeCloseTo(2, 0);
      expect(mlToOz(90)).toBeCloseTo(3, 0);
    });

    it('should use 0.1 oz precision for small volumes (< 15ml)', () => {
      // Very small volume should not round to 0
      expect(mlToOz(5)).toBeGreaterThan(0);
      expect(mlToOz(5)).toBeCloseTo(0.2, 1);

      // 10ml should be ~0.3 oz
      expect(mlToOz(10)).toBeGreaterThan(0);
      expect(mlToOz(10)).toBeCloseTo(0.3, 1);
    });

    it('should use 0.5 oz precision for larger volumes (>= 15ml)', () => {
      const result = mlToOz(45);
      expect(result % 0.5).toBe(0);
    });

    it('should never return 0 for non-zero input', () => {
      // Even 1ml should show something in oz
      expect(mlToOz(1)).toBeGreaterThan(0);
    });
  });

  describe('ozToMl', () => {
    it('should convert oz to ml correctly', () => {
      expect(ozToMl(1)).toBeCloseTo(30, 0);
      expect(ozToMl(2)).toBeCloseTo(59, 0);
      expect(ozToMl(3)).toBeCloseTo(89, 0);
    });
  });

  describe('calculateBabyAgeDays', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setDate(today.getDate() - 10);

      const age = calculateBabyAgeDays(birthDate);
      expect(age).toBe(10);
    });

    it('should return null for null birthDate', () => {
      expect(calculateBabyAgeDays(null)).toBeNull();
    });

    it('should calculate age for newborn (today)', () => {
      const today = new Date();
      const age = calculateBabyAgeDays(today);
      expect(age).toBe(0);
    });
  });

  describe('volume progression scenarios', () => {
    it('should show realistic progression from day 1 to 1 month', () => {
      const day1 = calculatePumpingVolumes(1, 20);
      const day3 = calculatePumpingVolumes(3, 20);
      const day7 = calculatePumpingVolumes(7, 20);
      const day14 = calculatePumpingVolumes(14, 20);
      const day30 = calculatePumpingVolumes(30, 20);

      // Volumes should increase over time
      expect(day1.totalMl).toBeLessThan(day3.totalMl);
      expect(day3.totalMl).toBeLessThan(day7.totalMl);
      expect(day7.totalMl).toBeLessThan(day14.totalMl);
      expect(day14.totalMl).toBeLessThanOrEqual(day30.totalMl);
    });

    it('should handle different durations realistically', () => {
      const durations = [10, 15, 20, 30];
      const volumes = durations.map((duration) =>
        calculatePumpingVolumes(14, duration),
      );

      // Each subsequent duration should produce more or equal volume
      for (let i = 1; i < volumes.length; i++) {
        expect(volumes[i]?.totalMl).toBeGreaterThanOrEqual(
          volumes[i - 1]?.totalMl ?? 0,
        );
      }
    });
  });

  describe('10-minute pumping session scenarios (bug fix verification)', () => {
    it('should show non-zero oz values for 10-minute sessions at all ages', () => {
      const ages = [1, 3, 7, 14, 21, 30];

      ages.forEach((ageDays) => {
        const volumes = calculatePumpingVolumes(ageDays, 10);
        const leftOz = mlToOz(volumes.leftMl);
        const rightOz = mlToOz(volumes.rightMl);

        // Should never show 0 oz (the bug we're fixing)
        expect(leftOz).toBeGreaterThan(0);
        expect(rightOz).toBeGreaterThan(0);

        console.log(
          `Age ${ageDays} days, 10 min: ${leftOz} oz / ${rightOz} oz (${volumes.leftMl} ml / ${volumes.rightMl} ml)`,
        );
      });
    });

    it('should calculate reasonable values for 1-2 week old baby with 10-min session', () => {
      // This is the reported scenario - user gets ~3 oz total for 10 min
      const result = calculatePumpingVolumes(10, 10); // 10 days old, 10 minutes
      const leftOz = mlToOz(result.leftMl);
      const rightOz = mlToOz(result.rightMl);
      const totalOz = leftOz + rightOz;

      // Should show realistic values matching user's actual output
      expect(leftOz).toBeGreaterThan(0);
      expect(totalOz).toBeGreaterThan(2.5); // At least 2.5 oz total
      expect(totalOz).toBeLessThan(4); // Less than 4 oz total
    });

    it('should show appropriate values for all standard duration options', () => {
      const durations = [10, 15, 20]; // Standard options in UI
      const ageDays = 14; // 2 weeks old

      durations.forEach((duration) => {
        const volumes = calculatePumpingVolumes(ageDays, duration);
        const totalOz = mlToOz(volumes.totalMl);

        expect(totalOz).toBeGreaterThan(0);
        console.log(
          `${duration} min session: ${totalOz} oz (${volumes.totalMl} ml)`,
        );
      });
    });
  });
});
