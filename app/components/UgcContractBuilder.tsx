'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { trackUGCEvents } from '@/app/lib/analytics';

export default function UgcContractBuilder() {
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [videoCount, setVideoCount] = useState(3);
  const [videoLength, setVideoLength] = useState('30–45 Sekunden (9:16 hochkant)');
  const [extraHooks, setExtraHooks] = useState(2);
  const [includeRaw, setIncludeRaw] = useState(false);
  const [usageChannels, setUsageChannels] = useState<'organic' | 'paid' | 'paid_whitelisting'>('paid');
  const [usageDuration, setUsageDuration] = useState('12 Monate');
  const [exclusivity, setExclusivity] = useState('Keine Exklusivität');
  const [revisions, setRevisions] = useState(2);
  const [feeEuro, setFeeEuro] = useState('900');
  const [paymentTerms, setPaymentTerms] = useState('14 Tage nach finaler Abnahme und Rechnungseingang');
  const [deadlineDays, setDeadlineDays] = useState('10 Werktagen nach Wareneingang & Briefing-Freigabe');
  const [activeTab, setActiveTab] = useState<'contract' | 'outreach'>('contract');

  const brand = brandName.trim() || '[Name deiner Brand / GmbH]';
  const product = productName.trim() || '[Produkt / Kampagne]';
  const fee = feeEuro.trim() || '[Betrag]';

  const channelsText =
    usageChannels === 'organic'
      ? 'Organische Nutzung auf eigenen Brand-Kanälen (TikTok, Instagram, YouTube Shorts, Website/Shop, Newsletter)'
      : usageChannels === 'paid'
        ? 'Organische Nutzung sowie bezahlte Werbeanzeigen (Paid Social: Meta Ads, TikTok Ads, YouTube Ads) über die Werbekonten der Brand'
        : 'Organische Nutzung, bezahlte Werbeanzeigen (Paid Social) sowie Whitelisting / Spark Ads über den Account des Creators (nach gesonderter Freigabe des Ad-Codes)';

  const contractDraft = useMemo(
    () =>
      [
        'UGC-LEISTUNGS- & NUTZUNGSRECHTE-VEREINBARUNG (ARBEITSVORLAGE)',
        'Hinweis: Unverbindliche Arbeitsvorlage von UGC VZ – ersetzt keine Rechtsberatung.',
        '',
        '1. VERTRAGSPARTEIEN',
        `Auftraggeber (Brand): ${brand}, [Straße, PLZ Ort], vertreten durch [Ansprechpartner], E-Mail: [E-Mail]`,
        'Auftragnehmer (Creator): [Vor- und Nachname / Firma], [Anschrift], E-Mail: [E-Mail], USt-ID / Kleinunternehmer-Hinweis: [angaben]',
        `Projekt / Produkt: ${product}`,
        '',
        '2. LEISTUNGSUMFANG (DELIVERABLES)',
        `- Produktion von ${videoCount} UGC-Video(s) zum Produkt "${product}"`,
        `- Format & Länge: ${videoLength}, sauberer Ton, gute Ausleuchtung, nativer UGC-Stil`,
        extraHooks > 0 ? `- Zusätzlich ${extraHooks} alternative Hook-Varianten (erste 2–3 Sekunden) pro Video` : null,
        includeRaw ? '- Inklusive Übergabe des ungeschnittenen Rohmaterials (Raw Clips)' : '- Lieferung als fertig geschnittene Videos (Rohmaterial nicht enthalten)',
        '- Bereitstellung ohne Plattform-Wasserzeichen (z. B. ohne TikTok-Logo) als MP4/MOV',
        '',
        '3. ZEITPLAN, ABNAHME & KORREKTUREN',
        `- Erstlieferung innerhalb von ${deadlineDays}.`,
        `- Inklusive ${revisions} Korrekturrunde(n) bei Abweichungen vom schriftlichen Briefing (z. B. Schnitt, Texteinblendung, Produktclaim). Neuaufnahmen außerhalb des Briefings werden gesondert vergütet.`,
        '- Die Brand prüft die Lieferung binnen 5 Werktagen und erklärt Abnahme oder konkrete Änderungswünsche.',
        '',
        '4. VERGÜTUNG & ZAHLUNG',
        `- Gesamthonorar: ${fee} € netto (zzgl. gesetzlicher USt., sofern anwendbar / Hinweis § 19 UStG bei Kleinunternehmern).`,
        `- Zahlungsziel: ${paymentTerms}.`,
        '- Benötigte Produktmuster stellt die Brand kostenlos zur Verfügung.',
        '',
        '5. NUTZUNGSRECHTE (§ 31 URHG)',
        `- Umfang: ${channelsText}.`,
        `- Laufzeit: ${usageDuration} ab Abnahme (räumlich: DACH / weltweit online).`,
        `- Bearbeitung: Die Brand darf die Videos kürzen, untertiteln, mit Musik/Grafiken versehen und zu Werbevarianten umschneiden.`,
        `- Exklusivität: ${exclusivity}.`,
        '- Die Rechteeinräumung wird wirksam mit vollständiger Zahlung des vereinbarten Honorars.',
        '',
        '6. COMPLIANCE & RECHTE DRITTER',
        '- Der Creator sichert zu, dass nur lizenzfreie bzw. freigegebene Musik/Assets verwendet werden und keine Rechte Dritter verletzt werden.',
        '- Bei Postings auf eigenen Kanälen erfolgt eine ordnungsgemäße Werbekennzeichnung (#Werbung / Anzeige).',
        '- Produkt- und Gesundheitsclaims erfolgen ausschließlich auf Basis des freigegebenen Brand-Briefings.',
        '',
        'Ort, Datum: ________________________',
        `Unterschrift Brand (${brand}): ________________________`,
        'Unterschrift Creator: ________________________',
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
    [brand, product, videoCount, videoLength, extraHooks, includeRaw, deadlineDays, revisions, fee, paymentTerms, channelsText, usageDuration, exclusivity],
  );

  const outreachDraft = useMemo(
    () =>
      [
        'Hallo [Name],',
        '',
        `wir sind auf dein Profil bei UGC VZ aufmerksam geworden und suchen aktuell Creator für ${product} (${brand}).`,
        '',
        'Eckdaten zum Projekt:',
        `- Umfang: ${videoCount} UGC-Video(s), ${videoLength}${extraHooks > 0 ? `, plus ${extraHooks} extra Hooks` : ''}${includeRaw ? ', inkl. Rohmaterial' : ''}`,
        `- Nutzung: ${channelsText} (${usageDuration})`,
        `- Zeitplan: Lieferung idealerweise innerhalb von ${deadlineDays}`,
        `- Budgetrahmen: ca. ${fee} € gesamt (bezahlt, zzgl. Produktmuster)`,
        '',
        'Passt das grundsätzlich für dich? Falls ja, schick uns gern kurz deine Verfügbarkeit, deinen Paketpreis inkl. Nutzungsrechten und 1–2 passende Arbeitsproben.',
        '',
        'Viele Grüße',
        brand,
      ].join('\n'),
    [brand, product, videoCount, videoLength, extraHooks, includeRaw, channelsText, usageDuration, deadlineDays, fee],
  );

  const searchQuery = `Ich suche deutschsprachige UGC Creator für ${productName.trim() || 'ein Produktvideo'}: ${videoCount} Videos (${videoLength}), ${usageChannels === 'organic' ? 'organische Nutzung' : `Paid Ads (${usageDuration})`}, bezahltes Budget ca. ${fee} € gesamt.`;

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      trackUGCEvents.ctaClick(`contract_copy_${activeTab}`);
      toast.success(`${label} in die Zwischenablage kopiert.`);
    } catch {
      toast.error('Kopieren nicht möglich – bitte Text markieren und kopieren.');
    }
  };

  return (
    <section
      id="vertrag-konfigurator"
      aria-labelledby="contract-builder-heading"
      className="mb-14 rounded-3xl border border-hairline bg-surface p-5 sm:p-8"
    >
      <div className="mb-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">
          Interaktiver Generator · 0 € · ohne Login
        </p>
        <h2 id="contract-builder-heading" className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          UGC-Vertrag &amp; Creator-Ansprache direkt konfigurieren
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Stell Leistung, Nutzungsrechte und Vergütung ein – rechts entsteht sofort deine kopier- und druckbare Arbeitsvorlage plus fertige Anfrage-Nachricht.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        {/* Formular */}
        <div className="space-y-4 rounded-2xl border border-hairline bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cb-brand" className="block text-xs font-semibold text-ink">Deine Brand / Firma</label>
              <input
                id="cb-brand"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="z. B. GlowSkin GmbH"
                className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              />
            </div>
            <div>
              <label htmlFor="cb-product" className="block text-xs font-semibold text-ink">Produkt / Kampagne</label>
              <input
                id="cb-product"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="z. B. Vitamin-C Serum"
                className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="cb-videos" className="block text-xs font-semibold text-ink">Anzahl Videos</label>
              <input
                id="cb-videos"
                type="number"
                min={1}
                max={30}
                value={videoCount}
                onChange={(e) => setVideoCount(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              />
            </div>
            <div>
              <label htmlFor="cb-hooks" className="block text-xs font-semibold text-ink">Extra-Hooks</label>
              <input
                id="cb-hooks"
                type="number"
                min={0}
                max={6}
                value={extraHooks}
                onChange={(e) => setExtraHooks(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              />
            </div>
            <div>
              <label htmlFor="cb-fee" className="block text-xs font-semibold text-ink">Honorar (€ netto)</label>
              <input
                id="cb-fee"
                type="text"
                value={feeEuro}
                onChange={(e) => setFeeEuro(e.target.value)}
                placeholder="z. B. 900"
                className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cb-length" className="block text-xs font-semibold text-ink">Format &amp; Länge</label>
            <select
              id="cb-length"
              value={videoLength}
              onChange={(e) => setVideoLength(e.target.value)}
              className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
            >
              <option value="15–30 Sekunden (9:16 hochkant)">15–30 Sekunden (9:16 hochkant)</option>
              <option value="30–45 Sekunden (9:16 hochkant)">30–45 Sekunden (9:16 hochkant)</option>
              <option value="45–60 Sekunden (9:16 hochkant)">45–60 Sekunden (9:16 hochkant)</option>
              <option value="60–90 Sekunden (9:16 / 16:9)">60–90 Sekunden (9:16 / 16:9)</option>
            </select>
          </div>

          <div>
            <label htmlFor="cb-channels" className="block text-xs font-semibold text-ink">Nutzungsrechte / Kanäle</label>
            <select
              id="cb-channels"
              value={usageChannels}
              onChange={(e) => setUsageChannels(e.target.value as 'organic' | 'paid' | 'paid_whitelisting')}
              className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
            >
              <option value="organic">Nur organisch (Brand-Kanäle &amp; Shop)</option>
              <option value="paid">Organisch + Paid Ads (Meta, TikTok, YouTube)</option>
              <option value="paid_whitelisting">Organisch + Paid Ads + Whitelisting / Spark Ads</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cb-duration" className="block text-xs font-semibold text-ink">Nutzungsdauer</label>
              <select
                id="cb-duration"
                value={usageDuration}
                onChange={(e) => setUsageDuration(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              >
                <option value="3 Monate">3 Monate</option>
                <option value="6 Monate">6 Monate</option>
                <option value="12 Monate">12 Monate</option>
                <option value="24 Monate">24 Monate</option>
                <option value="Zeitlich unbefristet (Buyout)">Zeitlich unbefristet (Buyout)</option>
              </select>
            </div>
            <div>
              <label htmlFor="cb-exclusivity" className="block text-xs font-semibold text-ink">Branchen-Exklusivität</label>
              <select
                id="cb-exclusivity"
                value={exclusivity}
                onChange={(e) => setExclusivity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              >
                <option value="Keine Exklusivität">Keine Exklusivität</option>
                <option value="3 Monate für direkte Wettbewerber in derselben Produktkategorie">3 Monate Kategorie-Exklusivität</option>
                <option value="6 Monate für direkte Wettbewerber in derselben Produktkategorie">6 Monate Kategorie-Exklusivität</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cb-revisions" className="block text-xs font-semibold text-ink">Korrekturrunden</label>
              <select
                id="cb-revisions"
                value={revisions}
                onChange={(e) => setRevisions(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              >
                <option value={1}>1 Korrekturrunde inklusive</option>
                <option value={2}>2 Korrekturrunden inklusive</option>
                <option value={3}>3 Korrekturrunden inklusive</option>
              </select>
            </div>
            <div>
              <label htmlFor="cb-payment" className="block text-xs font-semibold text-ink">Zahlungsziel</label>
              <select
                id="cb-payment"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
              >
                <option value="7 Tage nach finaler Abnahme und Rechnungseingang">7 Tage nach Abnahme</option>
                <option value="14 Tage nach finaler Abnahme und Rechnungseingang">14 Tage nach Abnahme</option>
                <option value="30 Tage nach finaler Abnahme und Rechnungseingang">30 Tage nach Abnahme</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cb-deadline" className="block text-xs font-semibold text-ink">Lieferfrist</label>
            <input
              id="cb-deadline"
              type="text"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              className="mt-1 w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={includeRaw}
              onChange={(e) => setIncludeRaw(e.target.checked)}
              className="h-4 w-4 accent-geo-violet"
            />
            <span>Ungeschnittenes Rohmaterial (Raw Files) einschließen</span>
          </label>
        </div>

        {/* Live-Vorschau & Aktionen */}
        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex gap-1.5" role="tablist" aria-label="Vorlagen-Ansicht">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'contract'}
                onClick={() => setActiveTab('contract')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'contract' ? 'bg-geo-violet text-white' : 'bg-surface text-ink-soft hover:text-ink'
                }`}
              >
                Vertrags-Vorlage
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'outreach'}
                onClick={() => setActiveTab('outreach')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'outreach' ? 'bg-geo-violet text-white' : 'bg-surface text-ink-soft hover:text-ink'
                }`}
              >
                Anfrage-Text an Creator
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    activeTab === 'contract' ? contractDraft : outreachDraft,
                    activeTab === 'contract' ? 'Vertragsvorlage' : 'Anfrage-Text',
                  )
                }
                className="rounded-lg bg-geo-violet px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#053673]"
              >
                Text kopieren
              </button>
              <button
                type="button"
                onClick={() => {
                  trackUGCEvents.ctaClick('contract_print');
                  window.print();
                }}
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink hover:border-geo-violet"
              >
                Drucken / PDF
              </button>
            </div>
          </div>

          <pre className="mt-4 max-h-[460px] overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-4 font-mono text-xs leading-6 text-ink">
            {activeTab === 'contract' ? contractDraft : outreachDraft}
          </pre>

          <div className="mt-4 flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-soft">
              Noch keine Creator ausgewählt? Übernimm deine Eckdaten direkt in die Suche.
            </p>
            <Link
              href={`/brands#q=${encodeURIComponent(searchQuery)}`}
              onClick={() => trackUGCEvents.ctaClick('contract_find_creators')}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-void px-5 py-2.5 text-xs font-bold text-white hover:bg-geo-violet"
            >
              Creator für dieses Briefing finden →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
