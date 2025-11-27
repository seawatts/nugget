'use client';

import { createSelectors } from '@nugget/zustand';
import { create } from 'zustand';
import type { SubPhaseType } from '~/app/(app)/app/_components/developmental-phases/phase-data';

interface SubPhaseState {
  checklist: Set<string>;
  isComplete: boolean;
}

interface OptimisticDevelopmentalPhaseState {
  phases: Record<string, SubPhaseState>;
  getSubPhaseState: (
    phaseId: string,
    subPhaseType: SubPhaseType,
  ) => SubPhaseState | undefined;
  removeSubPhaseState: (phaseId: string, subPhaseType: SubPhaseType) => void;
  getChecklist: (phaseId: string, subPhaseType: SubPhaseType) => string[];
  isSubPhaseComplete: (phaseId: string, subPhaseType: SubPhaseType) => boolean;
  setChecklist: (
    phaseId: string,
    subPhaseType: SubPhaseType,
    checklistIds: string[],
  ) => void;
  setIsComplete: (
    phaseId: string,
    subPhaseType: SubPhaseType,
    isComplete: boolean,
  ) => void;
  toggleChecklistItem: (
    phaseId: string,
    subPhaseType: SubPhaseType,
    checklistId: string,
    checked: boolean,
  ) => void;
  clear: () => void;
}

const keyFor = (phaseId: string, subPhaseType: SubPhaseType) =>
  `${phaseId}:${subPhaseType}`;

const ensureSubPhase = (
  state: OptimisticDevelopmentalPhaseState,
  key: string,
): SubPhaseState => {
  if (!state.phases[key]) {
    state.phases[key] = {
      checklist: new Set<string>(),
      isComplete: false,
    };
  }
  return state.phases[key];
};

const useOptimisticDevelopmentalPhasesBase =
  create<OptimisticDevelopmentalPhaseState>((set, get) => ({
    clear: () => set({ phases: {} }),
    getChecklist: (phaseId, subPhaseType) => {
      const key = keyFor(phaseId, subPhaseType);
      const subPhase = get().phases[key];
      if (!subPhase) return [];
      return Array.from(subPhase.checklist);
    },
    getSubPhaseState: (phaseId, subPhaseType) => {
      const key = keyFor(phaseId, subPhaseType);
      return get().phases[key];
    },
    isSubPhaseComplete: (phaseId, subPhaseType) => {
      const key = keyFor(phaseId, subPhaseType);
      return get().phases[key]?.isComplete ?? false;
    },
    phases: {},
    removeSubPhaseState: (phaseId, subPhaseType) => {
      set((state) => {
        const key = keyFor(phaseId, subPhaseType);
        if (!state.phases[key]) return state;
        const next = { ...state.phases };
        delete next[key];
        return { phases: next };
      });
    },
    setChecklist: (phaseId, subPhaseType, checklistIds) => {
      set((state) => {
        const key = keyFor(phaseId, subPhaseType);
        const next: Record<string, SubPhaseState> = { ...state.phases };
        const existing = ensureSubPhase({ ...state, phases: next }, key);
        existing.checklist = new Set(checklistIds);
        next[key] = existing;
        return { phases: next };
      });
    },
    setIsComplete: (phaseId, subPhaseType, isComplete) => {
      set((state) => {
        const key = keyFor(phaseId, subPhaseType);
        const next: Record<string, SubPhaseState> = { ...state.phases };
        const existing = ensureSubPhase({ ...state, phases: next }, key);
        existing.isComplete = isComplete;
        next[key] = existing;
        return { phases: next };
      });
    },
    toggleChecklistItem: (phaseId, subPhaseType, checklistId, checked) => {
      set((state) => {
        const key = keyFor(phaseId, subPhaseType);
        const next: Record<string, SubPhaseState> = { ...state.phases };
        const existing = ensureSubPhase({ ...state, phases: next }, key);
        const updated = new Set(existing.checklist);
        if (checked) {
          updated.add(checklistId);
        } else {
          updated.delete(checklistId);
        }
        existing.checklist = updated;
        // When a checkbox changes we assume completion should be recalculated client-side
        existing.isComplete = false;
        next[key] = existing;
        return { phases: next };
      });
    },
  }));

export const useOptimisticDevelopmentalPhasesStore = createSelectors(
  useOptimisticDevelopmentalPhasesBase,
);
