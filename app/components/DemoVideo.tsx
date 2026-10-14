'use client';
import { track } from '../lib/collaborations/track';

// Spielbares 9:16-Beispielvideo: Tap startet mit Ton, immer nur ein Video gleichzeitig.
export default function DemoVideo({ id, title, src, poster, memberId, variant }: { id: string; title: string; src: string; poster: string; memberId?: string; variant: string }) {
  return <figure className="fb-video">
    <video controls playsInline preload="metadata" poster={poster} onPlay={e => {
      document.querySelectorAll('video').forEach(other => { if (other !== e.currentTarget) other.pause(); });
      track(memberId, 'video_play', { video_id: id, variant });
    }}><source src={src} type="video/mp4" /></video>
    <figcaption><b>{title}</b><small>Beispiel aus der fomo Content Bibliothek</small></figcaption>
  </figure>;
}
