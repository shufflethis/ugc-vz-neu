'use client';
// Kampagnen-Events (video_play, cta_click, handover). Ohne Teilnahme-ID (Demo) wird nichts gesendet.
export function track(memberId: string | undefined, kind: string, details: Record<string, unknown> = {}) {
  if (!memberId) return;
  fetch('/api/collaborations/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: memberId, kind, details }), keepalive: true }).catch(() => {});
}
