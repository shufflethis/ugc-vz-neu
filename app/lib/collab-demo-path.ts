export const COLLAB_DEMO_ROOT = '/demo/kooperationen';
export const SITE_DEMO_ROOT = '/demo';

export function isCollabDemoPath(path: string): boolean {
  return path === COLLAB_DEMO_ROOT || path.startsWith(`${COLLAB_DEMO_ROOT}/`);
}

export function isSiteDemoPath(path: string): boolean {
  return (path === SITE_DEMO_ROOT || path.startsWith(`${SITE_DEMO_ROOT}/`)) && !isCollabDemoPath(path);
}

export function isProtectedDemoPath(path: string): boolean {
  return path === SITE_DEMO_ROOT || path.startsWith(`${SITE_DEMO_ROOT}/`);
}
