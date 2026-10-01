'use client';

import Link from 'next/link';
import { trackUGCEvents } from '../lib/analytics';

export default function ArticleAction({ slug, target, placement, href, children }: {
  slug: string;
  target: 'creator' | 'brand';
  placement: string;
  href: string;
  children: React.ReactNode;
}) {
  return <Link href={href} onClick={() => trackUGCEvents.articleCTA(slug, target, placement)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-geo-violet px-5 py-3 text-center font-semibold text-white hover:bg-geo-violet-soft focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2">{children}</Link>;
}
