'use client';

import { Dialog } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { safePortfolioUrl, type PublicCreatorProfile, type SearchCreator } from '../lib/creator-public';

export default function CreatorProfileDialog({ creator, selected, onClose, onSelect }: {
  creator: SearchCreator;
  selected: boolean;
  onClose: () => void;
  onSelect: () => void;
}) {
  const [profile, setProfile] = useState<PublicCreatorProfile | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setProfile(null);
    async function load() {
      try {
        const response = await fetch(`/api/v1/creators/${encodeURIComponent(creator.id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('profile_unavailable');
        const data: PublicCreatorProfile = await response.json();
        if (data.public_id !== creator.id) throw new Error('profile_mismatch');
        if (!controller.signal.aborted) setProfile(data);
      } catch {
        if (!controller.signal.aborted) setError('Das Profil konnte gerade nicht geladen werden. Bitte versuche es erneut.');
      }
    }
    void load();
    return () => controller.abort();
  }, [creator.id, attempt]);

  const portfolio = (profile?.portfolio || []).map(safePortfolioUrl).filter((url): url is string => Boolean(url));
  const socials = (profile?.socials || []).filter((social) => safePortfolioUrl(social.url));

  return (
    <Dialog open onClose={onClose} initialFocus={closeRef} className="relative z-[70]">
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-geo-violet">Creator-Profil</p>
                <Dialog.Title className="mt-1 text-2xl font-bold text-ink">{profile?.display_name || creator.name}</Dialog.Title>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="rounded-lg border border-hairline px-3 py-2 text-ink focus-visible:ring-2 focus-visible:ring-geo-violet">Schließen</button>
            </div>
            <Dialog.Description className="mt-3 text-sm leading-6 text-ink-soft">
              Schau dir Angebot und Arbeitsproben an. Deine bisherige Auswahl bleibt erhalten.
            </Dialog.Description>
            {!profile && !error && <p role="status" className="py-10 text-ink-soft">Profil wird geladen …</p>}
            {error && <div className="my-6 rounded-xl bg-amber-50 p-4"><p role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-lg border border-hairline px-4 py-2">Erneut versuchen</button></div>}
            {profile && <>
              <dl className="my-6 grid gap-4 sm:grid-cols-2">
                {[
                  ['Stadt / Region', profile.city],
                  ['Themen', profile.topics],
                  ['Content-Formate', profile.preferred_content],
                  ['Preisvorstellung', profile.rate_text],
                  ['Equipment', profile.equipment],
                ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt><dd className="mt-2 whitespace-pre-line break-words text-sm text-ink">{value?.trim() || 'Nicht angegeben'}</dd></div>)}
              </dl>
              <section aria-labelledby="creator-portfolio-title">
                <h3 id="creator-portfolio-title" className="text-lg font-semibold text-ink">Portfolio & Arbeitsproben</h3>
                {portfolio.length ? <ul className="mt-3 space-y-2">{portfolio.map((url, index) => <li key={`${url}-${index}`}><a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-hairline p-3 text-geo-violet hover:bg-surface focus-visible:ring-2 focus-visible:ring-geo-violet">Arbeitsprobe {index + 1} ansehen <span className="block break-all text-xs text-ink-soft">{new URL(url).hostname} · öffnet in einem neuen Tab</span></a></li>)}</ul> : <p className="mt-2 text-sm text-ink-soft">Noch keine öffentlichen Arbeitsproben hinterlegt.</p>}
              </section>
              {socials.length > 0 && <section className="mt-6" aria-labelledby="creator-socials-title"><h3 id="creator-socials-title" className="text-lg font-semibold text-ink">Social-Profile</h3><div className="mt-3 flex flex-wrap gap-2">{socials.map((social, index) => <a key={`${social.url}-${index}`} href={safePortfolioUrl(social.url)!} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-hairline px-3 py-2 text-sm text-geo-violet focus-visible:ring-2 focus-visible:ring-geo-violet">{social.platform || 'Social-Profil'} ↗</a>)}</div></section>}
              <p className="mt-6 rounded-xl bg-surface p-4 text-xs leading-5 text-ink-soft">
                {profile.humanVerification?.level === 1 ? 'Portfolio- und Social-Links sind hinterlegt.' : 'Die Angaben stammen vom Creator selbst.'} Das ist keine Identitäts- oder Qualitätsprüfung. Honorar, Verfügbarkeit und Nutzungsrechte vereinbarst du direkt mit dem Creator.
              </p>
            </>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" aria-pressed={selected} onClick={onSelect} className="rounded-xl bg-geo-violet px-5 py-3 font-semibold text-white focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2">{selected ? 'Aus Auswahl entfernen' : 'Zur Auswahl hinzufügen'}</button>
              <button type="button" onClick={onClose} className="rounded-xl border border-hairline px-5 py-3 text-ink focus-visible:ring-2 focus-visible:ring-geo-violet">Zurück zu den Ergebnissen</button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
