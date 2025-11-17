/**
 * Milestone content rules for Immediate Postbirth (Days 1-3)
 * Focus: Reflexes, alertness, feeding coordination
 */

export interface MilestoneRule {
  id: string;
  title: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  priority: 1 | 2 | 3 | 4 | 5; // 5 = critical developmental marker, 1 = nice-to-track
  expectedInStage: boolean;
  requiresYesNo: boolean;
}

export interface StageMilestoneRules {
  stage: string;
  label: string;
  ageRange: {
    minDays: number;
    maxDays: number;
  };
  developmentalFocus: string;
  milestones: MilestoneRule[];
  avoidMilestones: string[];
  evidenceBase: string[];
}

export const immediatePostbirthMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 3,
    minDays: 1,
  },
  avoidMilestones: [
    'social-smile',
    'head-control',
    'rolling-over',
    'reaches-for-objects',
    'tracks-moving-objects',
  ],
  developmentalFocus: 'Reflexes, alertness, and feeding coordination',
  evidenceBase: [
    'CDC Learn the Signs. Act Early',
    'AAP Bright Futures',
    'WHO MGRS',
  ],
  label: 'Immediate Postbirth (Days 1-3)',
  milestones: [
    {
      expectedInStage: true,
      id: 'first-meconium-diaper',
      priority: 5,
      requiresYesNo: true,
      title: 'First Meconium Diaper',
      type: 'self_care',
    },
    {
      expectedInStage: true,
      id: 'first-wet-diaper',
      priority: 5,
      requiresYesNo: true,
      title: 'First Wet Diaper',
      type: 'self_care',
    },
    {
      expectedInStage: true,
      id: 'alert-periods',
      priority: 4,
      requiresYesNo: true,
      title: 'Brief Alert Periods',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'rooting-reflex',
      priority: 4,
      requiresYesNo: true,
      title: 'Rooting Reflex',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'grasp-reflex',
      priority: 4,
      requiresYesNo: true,
      title: 'Grasp Reflex',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'moro-startle-reflex',
      priority: 4,
      requiresYesNo: true,
      title: 'Moro (Startle) Reflex',
      type: 'physical',
    },
  ],
  stage: 'immediate-postbirth',
};
