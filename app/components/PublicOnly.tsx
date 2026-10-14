'use client';

import { usePathname } from 'next/navigation';
import { isCollabDemoPath } from '@/app/lib/collab-demo-path';
import { isCollaborationPath } from '@/app/lib/collaborations/model';

/** Keep public navigation and live agent tools out of the private simulator. */
export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isCollabDemoPath(pathname || '') || isCollaborationPath(pathname || '') ? null : <>{children}</>;
}
