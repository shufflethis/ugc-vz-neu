'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { isCollabDemoPath } from '@/app/lib/collab-demo-path';
import { isCollaborationPath } from '@/app/lib/collaborations/model';

export default function SiteAnalytics() {
  const pathname = usePathname();
  if (isCollabDemoPath(pathname || '') || isCollaborationPath(pathname || '') || /^\/konto(\/|$)/.test(pathname || '')) return null;
  return <>
    <Script id="agent-tracking" data-domain="ugc-vz.de" src="https://agenttracking.co/agent.js" strategy="afterInteractive" />
    <Script id="plausible-script" src="https://analytics.polymarkt.de/js/pa-PUMsAuyv9o4MglSBuGfwG.js" strategy="afterInteractive" />
    <Script id="plausible-init" strategy="afterInteractive">{'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()'}</Script>
  </>;
}
