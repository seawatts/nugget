/**
 * Dashboard Load Tracker
 * Tracks when all dashboard components have finished loading
 * Uses component mount detection and query completion tracking
 */

'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import posthog from 'posthog-js';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface ComponentLoadState {
  celebrations: boolean;
  todaySummary: boolean;
  activityCards: boolean;
  learningCarousel: boolean;
  developmentalPhases: boolean;
  milestones: boolean;
  timeline: boolean;
}

interface DashboardLoadTrackerContextValue {
  markComponentLoaded: (component: keyof ComponentLoadState) => void;
}

const DashboardLoadTrackerContext =
  createContext<DashboardLoadTrackerContextValue | null>(null);

export function useDashboardLoadTracker() {
  const context = useContext(DashboardLoadTrackerContext);
  return context; // Return null if not provided (optional)
}

interface DashboardLoadTrackerProviderProps {
  babyId: string;
  hasActivityCards: boolean;
  hasTimeline: boolean;
  children: React.ReactNode;
}

export function DashboardLoadTrackerProvider({
  babyId,
  hasActivityCards,
  hasTimeline,
  children,
}: DashboardLoadTrackerProviderProps) {
  const loadStartTime = useRef(Date.now());
  const [componentStates, setComponentStates] = useState<ComponentLoadState>({
    activityCards: false,
    celebrations: false,
    developmentalPhases: false,
    learningCarousel: false,
    milestones: false,
    timeline: false,
    todaySummary: false,
  });
  const hasTrackedFullLoad = useRef(false);
  const componentLoadTimes = useRef<Record<keyof ComponentLoadState, number>>({
    activityCards: 0,
    celebrations: 0,
    developmentalPhases: 0,
    learningCarousel: 0,
    milestones: 0,
    timeline: 0,
    todaySummary: 0,
  });

  const markComponentLoaded = (component: keyof ComponentLoadState) => {
    const now = Date.now();
    const loadTime = now - loadStartTime.current;

    setComponentStates((prev) => {
      // Don't update if already loaded
      if (prev[component]) return prev;

      componentLoadTimes.current[component] = loadTime;

      // Track individual component load time
      const componentEventName = buildDashboardEvent(
        component === 'todaySummary'
          ? 'today_summary'
          : component === 'activityCards'
            ? 'activity_cards'
            : component === 'learningCarousel'
              ? 'learning_carousel'
              : component === 'developmentalPhases'
                ? 'developmental_phases_carousel'
                : component === 'milestones'
                  ? 'milestones_carousel'
                  : component === 'celebrations'
                    ? 'celebrations_carousel'
                    : 'activity_timeline',
        DASHBOARD_ACTION.LOAD,
      );

      posthog.capture(componentEventName, {
        baby_id: babyId,
        component_name: component,
        duration_ms: loadTime,
      });

      const updated = { ...prev, [component]: true };
      return updated;
    });
  };

  // Check if all required components are loaded
  const isFullyLoaded = (() => {
    const requiredComponents: (keyof ComponentLoadState)[] = [
      'celebrations',
      'todaySummary',
      'learningCarousel',
      'developmentalPhases',
      'milestones',
    ];

    if (hasActivityCards) {
      requiredComponents.push('activityCards');
    }

    if (hasTimeline) {
      requiredComponents.push('timeline');
    }

    return requiredComponents.every((component) => componentStates[component]);
  })();

  // Track full page load when all components are ready
  useEffect(() => {
    if (isFullyLoaded && !hasTrackedFullLoad.current) {
      const fullLoadTime = Date.now() - loadStartTime.current;
      const loadedComponents = Object.entries(componentStates).filter(
        ([, loaded]) => loaded,
      );

      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.CONTAINER,
          DASHBOARD_ACTION.LOAD,
        ),
        {
          baby_id: babyId,
          component_count: loadedComponents.length,
          component_load_times: componentLoadTimes.current,
          duration_ms: fullLoadTime,
          fastest_component_ms: Math.min(
            ...Object.values(componentLoadTimes.current).filter((t) => t > 0),
            Number.POSITIVE_INFINITY,
          ),
          full_page_load: true,
          slowest_component_ms: Math.max(
            ...Object.values(componentLoadTimes.current).filter((t) => t > 0),
            0,
          ),
        },
      );

      hasTrackedFullLoad.current = true;
    }
  }, [isFullyLoaded, babyId, componentStates]);

  return (
    <DashboardLoadTrackerContext.Provider value={{ markComponentLoaded }}>
      {children}
    </DashboardLoadTrackerContext.Provider>
  );
}
