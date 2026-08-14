import { formatVerifiedAt } from '../lib/competitors';
import type { Competitor, CompetitorFact } from '../lib/competitors';

const ROWS: { key: keyof Pick<Competitor, 'pricing' | 'creatorCount' | 'directContact' | 'commission' | 'markets'>; label: string }[] = [
  { key: 'pricing', label: 'Kosten für Brands' },
  { key: 'commission', label: 'Provision / Gebühr' },
  { key: 'directContact', label: 'Direkter Creator-Kontakt' },
  { key: 'creatorCount', label: 'Creator im Pool' },
  { key: 'markets', label: 'Märkte' },
];

function Cell({ fact, label, name }: { fact: CompetitorFact; label: string; name: string }) {
  return (
    <td className="align-top px-4 py-3 text-sm text-ink border-b border-hairline">
      <span className={fact.isPublic ? '' : 'text-ink-soft italic'}>{fact.value}</span>{' '}
      <a
        href={fact.source}
        target="_blank"
        rel="noopener noreferrer nofollow"
        title={`${fact.source} — geprüft am ${formatVerifiedAt(fact.verifiedAt)}`}
        aria-label={`Quelle für ${label} bei ${name}, geprüft am ${formatVerifiedAt(fact.verifiedAt)}`}
        className="align-super text-[10px] font-normal text-ink-soft/70 underline decoration-dotted hover:text-geo-violet"
      >
        Quelle
      </a>
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
                  <Cell key={c.slug} fact={c[row.key]} label={row.label} name={c.name} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft/70 mt-3">
        Stand: {formatVerifiedAt(verifiedAt)}. Alle Angaben stammen von den Websites der Anbieter. Der Link &bdquo;Quelle&quot; hinter jedem
        Wert führt auf die Anbieterseite, auf der dieser Wert steht; das Prüfdatum steht im Titel des Links. &bdquo;nicht öffentlich&quot;
        heißt, dass der Anbieter dazu keine Angabe veröffentlicht — wir schätzen keine Werte.
      </p>
    </div>
  );
}
