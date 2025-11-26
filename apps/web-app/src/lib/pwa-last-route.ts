const BABY_DASHBOARD_REGEX = /^\/app\/babies\/[^/]+\/dashboard$/;
const FAMILY_ROUTE_REGEX = /^\/app\/family\/[^/]+/;

export const LAST_ROUTE_STORAGE_KEY = 'nugget:last-dashboard-route';
export const LAST_ROUTE_MESSAGE = 'SET_LAST_ROUTE';

export function isPersistableAppPath(pathname: string | null): boolean {
  if (!pathname?.startsWith('/app')) {
    return false;
  }

  if (BABY_DASHBOARD_REGEX.test(pathname)) {
    return true;
  }

  if (FAMILY_ROUTE_REGEX.test(pathname)) {
    return true;
  }

  return false;
}
