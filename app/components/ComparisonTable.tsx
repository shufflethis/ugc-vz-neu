import type { Competitor, CompetitorFact } from '../lib/competitors';

const ROWS: { key: keyof Pick<Competitor, 'pricing' | 'creatorCount' | 'directContact' | 'commission' | 'markets'>; label: string }[] = [
  { key: 'pricing', label: 'Kosten für Brands' },
  { key: 'commission', label: 'Provision / Gebühr' },
  { key: 'directContact', label: 'Direkter Creator-Kontakt' },
  { key: 'creatorCount', label: 'Creator im Pool' },
  { key: 'markets', label: 'Märkte' },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function Cell({ fact }: { fact: CompetitorFact }) {
  return (
    <td className="align-top px-4 py-3 text-sm text-ink border-b border-hairline">
      <span className={fact.isPublic ? '' : 'text-ink-soft italic'}>{fact.value}</span>
    </td>
  );
}

export default function ComparisonTable({ rows, highlightSlug }: { rows: Competitor[]; highlightSlug?: string }) {
  const verifiedAt = rows[0]?.pricing.verifiedAt ?? '';
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-hairline">
        <table className="w-full min-w-[640px] border-collapse bg-white">
          <caption className="sr-only">Vergleich von UGC-Plattformen und Creator-Verzeichnissen</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left px-4 py-3 text-sm font-semibold text-ink-soft border-b border-hairline">
                Kriterium
              </th>
              {rows.map((c) => (
                <th
                  key={c.slug}
                  scope="col"
                  className={`text-left px-4 py-3 text-sm font-bold border-b border-hairline ${
                    c.slug === highlightSlug || c.isOwn ? 'text-geo-violet' : 'text-ink'
                  }`}
                >
                  {c.isOwn ? `${c.name} (wir)` : c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="text-left align-top px-4 py-3 text-sm font-medium text-ink-soft border-b border-hairline">
                  {row.label}
                </th>
                {rows.map((c) => (
                  <Cell key={c.slug} fact={c[row.key]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft/70 mt-3">
        Stand: {formatDate(verifiedAt)}. Alle Angaben stammen von den Websites der Anbieter. „nicht öffentlich" heißt, dass der
        Anbieter dazu keine Angabe veröffentlicht — wir schätzen keine Werte. Quellen:{' '}
        {rows.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && ', '}
            <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-geo-violet">
              {c.name}
            </a>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
