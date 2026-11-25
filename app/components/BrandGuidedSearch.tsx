'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchBox from './SearchBox';

const QUICK_NICHES = [
  'Beauty & Skincare',
  'Food & Drinks',
  'Apps & SaaS',
  'Fashion',
  'Home & Interior',
  'Familie',
  'Finanzen',
  'Fitness & Wellness',
];
const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Meta Paid Ads'];
const GOALS = ['Produktdemo / Unboxing', 'Testimonial', 'Problem-Lösung-Ad', 'Talking-Head'];
const BUDGETS = ['bis 250 € / Video', '250–500 € / Video', '500–1.000 € / Video', 'Paket (3–5 Videos)'];

const INTRO_CALL_URL = 'https://book.agentifizierung.de/gorden/intro-call?overlayCalendar=true';

export default function BrandGuidedSearch() {
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');
  const [composedQuery, setComposedQuery] = useState('');

  const applySelection = (next: { niche: string; platform: string; goal: string; budget: string }) => {
    const parts = [
      next.niche ? `UGC Creator für ${next.niche}` : 'Deutschsprachige UGC Creator',
      next.goal ? `Format: ${next.goal}` : '',
      next.platform ? `für ${next.platform}` : '',
      next.budget ? `Budget ${next.budget} (bezahlt)` : '',
    ].filter(Boolean);
    setComposedQuery(parts.length > 1 || next.niche ? `${parts.join(', ')}.` : '');
  };

  const toggle = (field: 'niche' | 'platform' | 'goal' | 'budget', value: string) => {
    const next = {
      niche: field === 'niche' ? (niche === value ? '' : value) : niche,
      platform: field === 'platform' ? (platform === value ? '' : value) : platform,
      goal: field === 'goal' ? (goal === value ? '' : value) : goal,
      budget: field === 'budget' ? (budget === value ? '' : value) : budget,
    };
    setNiche(next.niche);
    setPlatform(next.platform);
    setGoal(next.goal);
    setBudget(next.budget);
    applySelection(next);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-hairline bg-white p-4 text-left shadow-[0_24px_70px_rgba(35,22,47,0.08)] sm:p-7">
        {/* Gefuehrter Quick-Filter fuer Brands ohne leere-Textbox-Huerde */}
        <details className="mb-5 rounded-2xl border border-hairline bg-surface p-4" open>
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-semibold text-ink">
            <span>Schnell-Briefing zusammenklicken (optional)</span>
            <span className="text-xs font-normal text-ink-soft">Füllt deine Suchanfrage automatisch aus</span>
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Branche</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {QUICK_NICHES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={niche === label}
                    onClick={() => toggle('niche', label)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      niche === label
                        ? 'border-geo-violet bg-geo-violet text-white'
                        : 'border-hairline bg-white text-ink hover:border-geo-violet'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Plattform &amp; Format</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={platform === p}
                    onClick={() => toggle('platform', p)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      platform === p
                        ? 'border-geo-violet bg-geo-violet text-white'
                        : 'border-hairline bg-white text-ink hover:border-geo-violet'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={goal === g}
                    onClick={() => toggle('goal', g)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      goal === g
                        ? 'border-geo-violet bg-geo-violet text-white'
                        : 'border-hairline bg-white text-ink hover:border-geo-violet'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Budgetrahmen</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={budget === b}
                    onClick={() => toggle('budget', b)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      budget === b
                        ? 'border-geo-violet bg-geo-violet text-white'
                        : 'border-hairline bg-white text-ink hover:border-geo-violet'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>

        <SearchBox initialQuery={composedQuery} />
      </div>

      {/* Direkte Brand-Tools fuer Onboarding & Budget-Freigabe */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
        <Link
          href="/brands/ugc-kosten-rechner"
          className="inline-flex min-h-[40px] items-center rounded-full border border-hairline bg-white px-4 font-semibold text-ink hover:border-geo-violet hover:text-geo-violet"
        >
          UGC-Kosten-Rechner starten →
        </Link>
        <Link
          href="/brands/ugc-vertrag-vorlage"
          className="inline-flex min-h-[40px] items-center rounded-full border border-hairline bg-white px-4 font-semibold text-ink hover:border-geo-violet hover:text-geo-violet"
        >
          Vertrags- &amp; Briefing-Generator →
        </Link>
        <a
          href={INTRO_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] items-center rounded-full border border-geo-violet/30 bg-[#FBF8FE] px-4 font-semibold text-geo-violet hover:border-geo-violet"
        >
          Lieber abgeben? 15-Min-Kurzgespräch buchen
        </a>
      </div>
    </div>
  );
}
