// Developer-Portal: ein Ort fuer alle Maschinen-Schnittstellen (REST/OpenAPI,
// MCP, A2A, UCP, llms.txt). Bewusst ohne API-Key-Verwaltung und Sandbox -
// alle Endpunkte sind oeffentlich; das steht hier auch explizit so.
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer & KI-Agenten – API, MCP und A2A | UGC VZ',
  description:
    'Öffentliche Schnittstellen des UGC-VZ-Creator-Verzeichnisses: REST-API mit OpenAPI 3.1, MCP-Server für Claude & ChatGPT, A2A Agent Card. Kein API-Key nötig.',
  alternates: { canonical: 'https://ugc-vz.de/developers' },
  openGraph: {
    title: 'UGC VZ für Developer & KI-Agenten',
    description: 'REST-API, MCP-Server und A2A-Endpunkt des UGC-Creator-Verzeichnisses. Kein API-Key nötig.',
    url: 'https://ugc-vz.de/developers',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

const card = 'rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(35,22,47,0.06)]';
const code = 'block overflow-x-auto rounded-xl bg-void p-4 text-sm leading-6 text-gray-200';
const h2 = 'text-2xl font-bold mb-4';

export default function DevelopersPage() {
  return (
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24 bg-white text-ink">
      <div className="max-w-4xl mx-auto py-14">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-geo-violet">Developer-Portal</p>
        <h1 className="mt-3 text-4xl font-bold">UGC VZ für Developer &amp; KI-Agenten</h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink-soft">
          Das komplette Creator-Verzeichnis ist maschinenlesbar: REST-API, MCP-Server und
          A2A-Endpunkt greifen auf dieselben Daten und dieselbe Logik zu.{' '}
          <strong className="text-ink">Kein API-Key nötig</strong> – alle Endpunkte sind öffentlich,
          Rate-Limits gelten pro IP (Web-Bot-Auth-signierte Agenten erhalten höhere Limits).
        </p>

        <div className="mt-10 space-y-8">
          <section className={card} id="rest">
            <h2 className={h2}>REST-API (OpenAPI 3.1)</h2>
            <p className="leading-7 text-ink-soft mb-4">
              Spezifikation: <a className="font-semibold text-geo-violet underline" href="/openapi.json">/openapi.json</a> —
              fünf Operationen: <code>searchCreators</code>, <code>getCreator</code>, <code>requestOutreach</code>,{' '}
              <code>getOutreachStatus</code>, <code>getVocab</code>. Fehler kommen als RFC 7807
              (<code>application/problem+json</code>) mit Fehlercode und Lösungshinweis.
            </p>
            <pre className={code}>{`curl -X POST https://ugc-vz.de/api/v1/creators/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"Beauty-Creatorin in Berlin für TikTok-Produktvideo","max_results":5}'`}</pre>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              <strong className="text-ink">Wichtig:</strong> <code>POST /api/v1/outreach</code> löst eine{' '}
              <strong className="text-ink">echte Kontaktanfrage mit E-Mail-Versand</strong> aus — kein Test-Endpunkt.
            </p>
          </section>

          <section className={card} id="mcp">
            <h2 className={h2}>MCP-Server (Claude, ChatGPT &amp; Co.)</h2>
            <p className="leading-7 text-ink-soft mb-4">
              Streamable-HTTP-Endpunkt: <code>https://ugc-vz.de/api/mcp</code> — Manifest unter{' '}
              <a className="font-semibold text-geo-violet underline" href="/.well-known/mcp.json">/.well-known/mcp.json</a>,
              Tool-Schemas unter <code>/api/agent-schemas/&lt;tool&gt;.json</code>.
            </p>
            <pre className={code}>{`// Claude Code
claude mcp add --transport http ugc-vz https://ugc-vz.de/api/mcp

// Claude Desktop / andere MCP-Clients (mcp-remote als stdio-Brücke)
{ "mcpServers": { "ugc-vz": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://ugc-vz.de/api/mcp"] } } }`}</pre>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              5 Tools: <code>search_creators</code>, <code>get_creator</code>, <code>request_outreach</code>,{' '}
              <code>get_outreach_status</code>, <code>get_vocab</code>. Suchergebnisse enthalten niemals
              private Kontaktdaten.
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              Gelistet im{' '}
              <a className="font-semibold text-geo-violet underline" href="https://registry.modelcontextprotocol.io/v0/servers?search=ugc-vz" rel="noopener noreferrer" target="_blank">offiziellen MCP-Registry</a>{' '}
              (<code>de.ugc-vz/creator-search</code>), auf{' '}
              <a className="font-semibold text-geo-violet underline" href="https://glama.ai/mcp/connectors/de.ugc-vz/creator-search" rel="noopener noreferrer" target="_blank">Glama</a>{' '}
              und auf{' '}
              <a className="font-semibold text-geo-violet underline" href="https://smithery.ai/servers/ugc-vz/creator-search" rel="noopener noreferrer" target="_blank">Smithery</a>.
              Quellcode-Doku:{' '}
              <a className="font-semibold text-geo-violet underline" href="https://github.com/ugcvz/ugc-vz-mcp" rel="noopener noreferrer" target="_blank">github.com/ugcvz/ugc-vz-mcp</a>.
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              Fuer stdio-only-Clients (z. B. Claude Desktop) gibt es die Bridge auch als npm-Paket:{' '}
              <a className="font-semibold text-geo-violet underline" href="https://www.npmjs.com/package/ugc-vz-mcp" rel="noopener noreferrer" target="_blank">ugc-vz-mcp</a>{' '}
              &mdash; <code>npx -y ugc-vz-mcp</code>.
            </p>
          </section>

          <section className={card} id="a2a">
            <h2 className={h2}>A2A &amp; weitere Discovery-Endpunkte</h2>
            <ul className="space-y-2 leading-7 text-ink-soft">
              <li><a className="font-semibold text-geo-violet underline" href="/.well-known/agent-card.json">/.well-known/agent-card.json</a> — A2A v1.0 Agent Card (Endpunkt: <code>/a2a</code>)</li>
              <li><a className="font-semibold text-geo-violet underline" href="/.well-known/ucp">/.well-known/ucp</a> — Universal-Commerce-Protocol-Manifest</li>
              <li><a className="font-semibold text-geo-violet underline" href="/llms.txt">/llms.txt</a> — Inhaltsverzeichnis für Sprachmodelle inkl. „Wann UGC VZ nutzen“</li>
              <li><a className="font-semibold text-geo-violet underline" href="/sitemap.xml">/sitemap.xml</a> — vollständige Seitenliste</li>
            </ul>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              Zentrale Seiten liefern auf <code>Accept: text/markdown</code> eine Markdown-Variante
              (Content-Negotiation nach acceptmarkdown.com).
            </p>
          </section>

          <section className={card} id="errors">
            <h2 className={h2}>Fehler, Limits &amp; Verhalten</h2>
            <ul className="space-y-2 leading-7 text-ink-soft">
              <li><strong className="text-ink">Fehlerformat:</strong> RFC 7807 <code>application/problem+json</code> mit <code>code</code>, <code>detail</code> und <code>resolution</code>; unbekannte <code>/api/*</code>-Pfade antworten strukturiert mit 404.</li>
              <li><strong className="text-ink">Rate-Limits:</strong> IP-basiert; Suche zählt mehrfach. Bei 429 den <code>Retry-After</code>-Header beachten. Höhere Limits über <a className="underline" href="https://web-bot-auth.org" rel="noopener noreferrer" target="_blank">Web Bot Auth</a>-Signaturen.</li>
              <li><strong className="text-ink">Datenschutz:</strong> Öffentliche Endpunkte geben niemals private Kontaktdaten zurück. Kontaktdaten erhält die Brand erst nach bewusster Anfrage per E-Mail.</li>
              <li><strong className="text-ink">Kosten:</strong> Suche, Profile und Vermittlung sind kostenlos, keine Provision.</li>
              <li><strong className="text-ink">Versionierung &amp; Deprecation:</strong> URL-Versionierung (<code>/api/v1</code>). Abkündigungen kündigen wir mindestens 6 Monate vorher an — per <code>Deprecation</code>- und <code>Sunset</code>-Header auf den betroffenen Endpunkten und hier auf dieser Seite.</li>
            </ul>
          </section>
        </div>

        <p className="mt-10 text-sm text-ink-soft">
          Fragen oder Feedback zur API: <a className="font-semibold text-geo-violet underline" href="mailto:hi@ugc-vz.de">hi@ugc-vz.de</a> ·{' '}
          <Link className="font-semibold text-geo-violet underline" href="/contact">Kontakt</Link>
        </p>
      </div>
    </main>
  );
}
