import { Check, ShieldCheck, X } from 'lucide-react';

const VERIFICATION_RULES = [
  {
    title: 'Abgleich mit deinem Brief',
    description: 'Fehlt das Produkt oder der Bezug zur Kampagne, zählt der Beitrag nicht.',
  },
  {
    title: 'Views von der Plattform',
    description: 'Wir übernehmen die Views pro Beitrag direkt von TikTok und Instagram.',
  },
  {
    title: 'Gelöscht heißt nicht bezahlt',
    description: 'Was vor Kampagnenende offline geht, fällt aus der Abrechnung.',
  },
];

export default function VerificationProofSection() {
  return (
    <section
      aria-labelledby="home-proof-title"
      className="bg-[#F7F6F2] px-5 py-16 sm:px-8 sm:py-28"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[#1F9D55]">
            <ShieldCheck size={16} aria-hidden="true" />
            Beitragsprüfung vor Abrechnung
          </p>
          <h2
            id="home-proof-title"
            className="mt-2 font-display text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-[#121212] sm:text-[44px] sm:leading-[48px]"
          >
            Bezahlt wird nur, was die Prüfung besteht.
          </h2>

          <ul className="mt-8 space-y-5">
            {VERIFICATION_RULES.map((rule) => (
              <li key={rule.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8F04B] text-[#121212]">
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#121212]">{rule.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#5C5A55] sm:text-base">{rule.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual Card: Zaehlt vs. Zaehlt nicht */}
        <div className="lg:col-span-6">
          <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card sm:p-7">
            <div className="flex items-center justify-between gap-2 border-b border-[#E4E1D8] pb-4">
              <p className="text-sm font-semibold text-[#121212]">Status der Beitragsprüfung</p>
              <span className="rounded-full border border-[#E4E1D8] bg-[#F7F6F2] px-2.5 py-0.5 text-[11px] font-medium text-[#5C5A55]">
                Beispielansicht
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {/* Zustand 1: Zaehlt (Lime #C8F04B) */}
              <div className="rounded-[16px] border-2 border-[#121212] bg-[#F7F6F2] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C8F04B] px-3 py-1 text-xs font-bold text-[#121212]">
                      <Check size={13} strokeWidth={2.75} aria-hidden="true" />
                      Zählt
                    </span>
                    <span className="text-sm font-semibold text-[#121212]">TikTok Beitrag #14</span>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#121212]">
                    42.000 Views · 84,00 €
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#5C5A55]">
                  <span className="rounded-md bg-white px-2 py-1">Produkt klar im Bild</span>
                  <span className="rounded-md bg-white px-2 py-1">Kennzeichnung vorhanden</span>
                  <span className="rounded-md bg-white px-2 py-1">Online bis Kampagnenende</span>
                </div>
              </div>

              {/* Zustand 2: Zaehlt nicht (Grau, durchgestrichen) */}
              <div className="rounded-[16px] border border-[#E4E1D8] bg-[#F7F6F2]/50 p-4 text-[#5C5A55]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E4E1D8] px-3 py-1 text-xs font-bold text-[#5C5A55]">
                      <X size={13} strokeWidth={2.5} aria-hidden="true" />
                      Zählt nicht
                    </span>
                    <span className="text-sm font-medium line-through">Instagram Reel #19</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums line-through">
                    18.400 Views · 0,00 €
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[#5C5A55]">
                  Grund: Produktbezug aus dem Brief fehlt oder Beitrag vor Kampagnenende entfernt.
                </p>
              </div>
            </div>

            <p className="mt-4 text-right text-[11px] text-[#5C5A55]">
              Beispielansicht. Gezählt wird in vollen 1.000er-Schritten.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
