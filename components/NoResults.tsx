'use client';

import React from 'react';
import Link from 'next/link';

interface NoResultsProps {
  query: string;
  categoryLabel?: string | null;
  matchCount?: number;
}

/**
 * Ehrlicher Leerzustand nach Spec 8.6 (Kapitel 6a):
 * Kein Auffuellen mit unpassenden Profilen, sondern direkter Einstieg in das Kampagnenmodell.
 */
const NoResults: React.FC<NoResultsProps> = ({ query, categoryLabel, matchCount = 0 }) => {
  const topicName = categoryLabel || query || 'dieses Thema';

  return (
    <div className="py-10 px-4 mb-16 text-center">
      <div className="mx-auto max-w-2xl rounded-[20px] border border-[#E4E1D8] bg-white p-8 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.06)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F6F2] text-[#121212]">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-[#121212]">
          Für {topicName} haben wir gerade {matchCount} passende Creator.
        </h3>

        <p className="mt-3 text-base leading-7 text-[#5C5A55]">
          Starte eine Kampagne, dann melden sich passende Creator bei dir. Du legst dein Budget und deinen Preis pro 1.000 Views selbst fest.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/brand?tab=signup"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#121212] px-6 text-sm font-semibold text-[#F7F6F2] transition-opacity hover:opacity-90"
          >
            Kampagne starten
          </Link>
          <Link
            href="/preise"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#E4E1D8] bg-white px-5 text-sm font-semibold text-[#121212] transition-colors hover:border-[#121212]"
          >
            Preise ansehen
          </Link>
        </div>

        <p className="mt-5 text-xs text-[#5C5A55]">
          Oder probiere es oben mit weniger Filtern (z. B. ohne feste Stadt) oder einer breiteren Kategorie.
        </p>
      </div>
    </div>
  );
};

export default NoResults;
