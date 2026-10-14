export const COLLAB_DEMO_ROOT = '/demo/kooperationen';
export function isCollabDemoPath(path: string): boolean {
  return path === COLLAB_DEMO_ROOT || path.startsWith(`${COLLAB_DEMO_ROOT}/`);
}
