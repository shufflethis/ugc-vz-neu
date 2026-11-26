'use client';

import { useEffect } from 'react';
import { trackUGCEvents } from '@/app/lib/analytics';

export default function NotFoundTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    trackUGCEvents.notFound(window.location.pathname || '/404');
  }, []);
  return null;
}
