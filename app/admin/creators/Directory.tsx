'use client';

import { useEffect, useState } from 'react';
import CastingChips from '@/app/components/CastingChips';
import CastingEvidenceList from '@/app/components/CastingEvidenceList';
import CreatorAvatar from '@/app/components/CreatorAvatar';
import { castingFilters, directorySearchWords, matchCasting, relatedCasting, type CastingFilter, type CastingProfile } from '@/app/lib/casting';
import { safePortfolioUrl } from '@/app/lib/creator-public';
import WorkTags from './WorkTags';

export type DirectoryProfile = CastingProfile & {
  id: string; name: string; city: string; status: string; gender: string; image?: string;
};

const statusLabels: Record<string, string> = {
  active: 'Aktiv', pending_review: 'In Prüfung', pending_verification: 'Verifizierung offen',
  archived: 'Archiviert', quarantined: 'Gesperrt',
};
const inputStyle = 'mt-1 block w-full rounded-lg border border-hairline bg-white p-2.5 text-sm';
const pageSize = 24;
const selectionKey = 'famefact-creator-auswahl';

export default function Directory({ profiles }: { profiles: DirectoryProfile[] }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [removed, setRemoved] = useState<CastingFilter[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(selectionKey) || '[]');
      if (Array.isArray(saved)) setSelected(saved.filter((id): id is string => typeof id === 'string'));
    } catch { /* Selection still works when storage is disabled. */ }
    setSelectionReady(true);
  }, []);
  useEffect(() => {
    if (selectionReady) {
      try { sessionStorage.setItem(selectionKey, JSON.stringify(selected)); } catch { /* Tab memory suffices. */ }
    }
  }, [selected, selectionReady]);

  const filters = castingFilters(query).filter(filter => !removed.includes(filter));
  const words = directorySearchWords(query);
  const eligible = profiles.flatMap(profile => {
    if ((status && profile.status !== status) || !profile.city.toLowerCase().includes(city.trim().toLowerCase())) return [];
    if (onlySelected && !selected.includes(profile.id)) return [];
    const text = [profile.name, profile.id, profile.city, profile.topicsText, profile.formatsText].join(' ').toLowerCase();
    if (!words.every(word => text.includes(word))) return [];
    const evidence = matchCasting(profile, filters);
    if (evidence) return [{ profile, evidence, priority: 0 }];
    const related = relatedCasting(profile, filters);
    return related ? [{ profile, evidence: related.evidence, priority: related.priority }] : [];
  });
  const exact = eligible.filter(item => !item.priority);
  const showingAlternatives = !exact.length && eligible.length > 0;
  const matches = showingAlternatives ? eligible.sort((a, b) => b.priority - a.priority) : exact;
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const shown = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectionCount = profiles.filter(profile => selected.includes(profile.id)).length;

  return <>
    <h1>Alle Creator</h1>
    <div className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
      <label>Name, Thema oder Suchkriterien
        <input className={inputStyle} value={query} placeholder="z. B. männlicher Skater" type="search"
          onChange={event => { setQuery(event.target.value); setRemoved([]); setPage(1); }} />
      </label>
      <label>Ort<input className={inputStyle} type="search" value={city} onChange={event => { setCity(event.target.value); setPage(1); }} /></label>
      <label>Profilstatus<select className={inputStyle} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
        <option value="">Alle Status</option>
        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
    </div>
    <CastingChips filters={filters} remove={filter => { setRemoved([...removed, filter]); setPage(1); }} />
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <p role="status">{showingAlternatives ? `0 belegte Treffer · ${matches.length} ähnliche Profile` : `${matches.length} von ${profiles.length} Profilen`}</p>
      <label><input type="checkbox" checked={onlySelected} onChange={event => { setOnlySelected(event.target.checked); setPage(1); }} /> Nur gemerkte Creator ({selectionCount})</label>
    </div>
    {showingAlternatives && <h2 className="mb-4">Ähnliche Profile fürs Casting</h2>}
    {!matches.length && <p className="rounded-xl bg-surface p-4">Kein Profil erfüllt die gewählten Kriterien.</p>}
    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map(({ profile, evidence }) => <article className="min-w-0 space-y-3 rounded-2xl border border-hairline bg-white p-5 text-sm" key={profile.id}>
        <div className="flex items-center gap-3">
          <CreatorAvatar name={profile.name} image={profile.image} size={48} imgClassName="rounded-full object-cover" />
          <div className="min-w-0"><h3 className="break-words text-lg">{profile.name}</h3><p className="text-ink-soft">{[profile.city, profile.gender, statusLabels[profile.status] || profile.status].filter(Boolean).join(' · ')}</p></div>
        </div>
        <CastingEvidenceList evidence={evidence} />
        {profile.topicsText && <p className="line-clamp-3 break-words">{profile.topicsText}</p>}
        <label className="block"><input type="checkbox" checked={selected.includes(profile.id)}
          onChange={event => setSelected(ids => event.target.checked ? [...ids, profile.id] : ids.filter(id => id !== profile.id))} /> Fürs Casting merken</label>
        {profile.works.some(work => safePortfolioUrl(work.url)) &&
          <details><summary className="cursor-pointer text-geo-violet">Arbeitsproben & Merkmale</summary>
            {profile.works.map((work, index) => <WorkTags key={[work.id, work.skateboard, work.capImage].join('|')} work={work} number={index + 1} />)}
          </details>}
      </article>)}
    </div>
    {pages > 1 && <nav aria-label="Seiten der Creator-Bank" className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <button type="button" className="demo-button secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Zurück</button>
      <span>Seite {currentPage} von {pages}</span>
      <button type="button" className="demo-button secondary" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Weiter</button>
    </nav>}
  </>;
}
