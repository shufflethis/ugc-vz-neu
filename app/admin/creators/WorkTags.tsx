'use client';

import { useState } from 'react';
import type { CastingWork } from '@/app/lib/casting';
import { safePortfolioUrl } from '@/app/lib/creator-public';
import { saveWorkTags } from './actions';

export default function WorkTags({ work, number }: { work: CastingWork; number: number }) {
  const [skateboard, setSkateboard] = useState(work.skateboard);
  const [capImage, setCapImage] = useState(work.capImage || '');
  const [loaded, setLoaded] = useState('');
  const [failed, setFailed] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const url = safePortfolioUrl(work.url);
  if (!url) return null;
  const image = capImage.trim();
  const preview = safePortfolioUrl(image)?.startsWith('https:') ? image : '';
  const ready = !image || loaded === image || image === work.capImage;
  const changed = skateboard !== work.skateboard || image !== (work.capImage || '');

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const error = await saveWorkTags({
        id: work.id, before: { skateboard: work.skateboard, capImage: work.capImage },
        after: { skateboard, capImage: image || null },
      });
      setMessage(error || 'Merkmale gespeichert.');
    } catch {
      setMessage('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="my-2 space-y-3 rounded-lg border border-hairline p-3">
    <a className="text-geo-violet underline" href={url} target="_blank" rel="noopener noreferrer">Arbeitsprobe {number} ansehen ↗</a>
    <label className="block"><input type="checkbox" checked={skateboard} onChange={event => setSkateboard(event.target.checked)} /> Skateboard in der Arbeitsprobe bestätigt</label>
    <label className="block">Cap sichtbar · direkter Bildlink zur Arbeitsprobe
      <input type="url" placeholder="https://…" value={capImage} onChange={event => { setCapImage(event.target.value); setLoaded(''); setFailed(''); }}
        className="mt-1 w-full rounded-lg border border-hairline p-2" />
    </label>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {preview && <img key={preview} src={preview} alt="Cap vor dem Speichern prüfen" referrerPolicy="no-referrer" className="max-h-40 rounded"
      onLoad={() => setLoaded(preview)} onError={() => setFailed(preview)} />}
    {image && (!preview || failed === image) && <p role="alert">Das Bild lässt sich hier nicht anzeigen. Bitte einen direkten HTTPS-Bildlink eingeben.</p>}
    <button className="demo-button secondary" type="button" disabled={busy || !changed || !ready} onClick={save}>Merkmale speichern</button>
    {message && <p role="status">{message}</p>}
  </div>;
}
