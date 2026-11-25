'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle2, LogOut, Mail, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import type { BrandAccount, CampaignSummary, CampaignVisibility, CompensationModel } from '@/app/lib/brand-workspace';

const fieldClass = 'w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft';

const MODEL_LABELS: Record<CompensationModel, string> = {
  fixed: 'Festpreis / Paket',
  tkp: 'Pay-per-View (TKP)',
  hybrid: 'Hybrid (Fix + Provision)',
  barter: 'Produkt / Seeding',
};

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-[#edf5e5] text-[#385523]',
  paused: 'bg-amber-50 text-amber-800',
  completed: 'bg-surface text-ink-soft',
  draft: 'bg-surface text-ink-soft',
};

export default function BrandWorkspaceClient({
  brand,
  initialCampaigns,
}: {
  brand: BrandAccount | null;
  initialCampaigns: CampaignSummary[];
}) {
  if (!brand) return <BrandLoginView />;
  return <BrandDashboard brand={brand} initialCampaigns={initialCampaigns} />;
}

function BrandLoginView() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim())) {
      setError('Bitte gib eine gültige geschäftliche E-Mail-Adresse an.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/brand/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email: email.trim(), website }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Anmeldung fehlgeschlagen.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Bitte gib den 6-stelligen Code aus deiner E-Mail ein.');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/brand/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Code ungültig oder abgelaufen.');
      window.location.assign(data.redirectTo || '/brand');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code konnte nicht bestätigt werden.');
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-12 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl space-y-20">
        {/* Hero + Code-Login */}
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">
              UGC VZ Brand-Workspace · 750+ aktive DACH-Profile
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              UGC-Kampagnen, die du nach echten Views steuerst.
            </h1>
            <p className="mt-4 text-base leading-7 text-ink-soft">
              Lege Briefing, Zielplattform und optionales Budget-Limit in wenigen Minuten fest. Verifizierte Creator aus unserem DACH-Pool posten auf TikTok, Instagram Reels, YouTube Shorts oder TikTok Shop, und du siehst jeden Beitrag samt Views direkt in deinem Workspace.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              <li className="flex items-start gap-3">
                <Users size={18} className="mt-0.5 shrink-0 text-geo-violet" />
                <span><strong>Zwei flexible Wege:</strong> Vergütung pro 1.000 geprüfte Views (TKP) mit optionalem Budget-Limit oder gezielte Creator-Produktion &amp; Produkt-Tests.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-geo-violet" />
                <span><strong>Verifizierte Social-Profile:</strong> Sieh vorab, welche Creator ihre TikTok- und Instagram-Kanäle bestätigt haben.</span>
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 size={18} className="mt-0.5 shrink-0 text-geo-violet" />
                <span><strong>Beitragsprüfung &amp; Live-Reporting:</strong> Eingereichte Links gegen deine Briefing-Checkliste prüfen, Views &amp; effektiven TKP als CSV oder Live-Report-Link teilen.</span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-ink-soft">
              Für direkte Kampagnen und Creator-Anfragen ist ein kurzes Brand-Konto nötig. So schützen wir Creator vor Spam und halten alle Absprachen an einem Ort.{' '}
              <Link href="/brands" className="font-semibold text-geo-violet underline hover:no-underline">
                Creator-Pool als Vorschau ansehen →
              </Link>
            </p>
          </div>

          <div className="rounded-3xl border border-hairline bg-white p-7 shadow-[0_24px_80px_rgba(35,22,47,0.10)] sm:p-8">
            {sent ? (
              <div className="space-y-5 py-2">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-geo-violet/10 text-geo-violet">
                    <Mail size={26} />
                  </span>
                  <h2 className="mt-4 text-2xl font-bold text-ink">6-stelligen Code eingeben</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    Wir haben deinen Code und einen geschützten Link an <strong className="text-ink">{email}</strong> gesendet.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="brand-otp" className={labelClass}>6-stelliger Anmeldecode</label>
                    <input
                      id="brand-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value); if (error) setError(''); }}
                      placeholder="123456"
                      className={`${fieldClass} text-center font-mono text-2xl font-bold tracking-[0.3em]`}
                    />
                  </div>
                  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
                  <button
                    type="submit"
                    disabled={verifying}
                    className="min-h-[48px] w-full rounded-xl bg-geo-violet px-6 font-semibold text-white transition hover:bg-[#7531ae] disabled:opacity-60"
                  >
                    {verifying ? 'Code wird geprüft …' : 'Code bestätigen & Workspace öffnen →'}
                  </button>
                </form>

                <p className="rounded-xl bg-surface px-4 py-3 text-center text-xs text-ink-soft">
                  Code &amp; Link sind 30 Minuten gültig. Prüfe ggf. auch deinen Spam-Ordner.{' '}
                  <button type="button" onClick={() => { setSent(false); setOtpCode(''); setError(''); }} className="font-semibold text-geo-violet underline">
                    E-Mail ändern
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-ink">Brand-Workspace öffnen</h2>
                  <p className="mt-1 text-sm text-ink-soft">Erstelle dein Brand-Konto oder melde dich mit einem 6-stelligen Einmal-Code per E-Mail an.</p>
                </div>

                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="brand-login-website">Website</label>
                  <input id="brand-login-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="brand-email" className={labelClass}>Geschäftliche E-Mail *</label>
                  <input
                    id="brand-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marketing@deinebrand.de"
                    className={fieldClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="brand-name" className={labelClass}>Dein Name</label>
                    <input
                      id="brand-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="brand-company" className={labelClass}>Brand / Unternehmen</label>
                    <input
                      id="brand-company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="z. B. Deine Marke GmbH"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] w-full rounded-xl bg-geo-violet px-6 font-semibold text-white transition hover:bg-[#7531ae] disabled:opacity-60"
                >
                  {submitting ? 'Code wird gesendet …' : 'Brand-Konto anlegen / Code senden →'}
                </button>
                <p className="text-center text-xs text-ink-soft">
                  Kein Pflicht-Abo. Du bist Creator?{' '}
                  <Link href="/konto" className="font-semibold text-geo-violet underline">Zum Creator-Login</Link>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Zwei Kampagnenwege */}
        <section className="space-y-6">
          <div className="text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">Zwei Wege im selben Workspace</p>
            <h2 className="mt-2 text-3xl font-bold text-ink">Wähle das Modell, das zu deinem Ziel passt</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-geo-violet/30 bg-[#FBF8FE] p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-geo-violet">Weg 1 · Performance &amp; Reichweite</p>
              <h3 className="mt-2 text-2xl font-bold text-ink">View-Kampagne (TKP) mit optionalem Budget-Limit</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Creator posten auf ihren eigenen Accounts auf TikTok, Instagram Reels oder YouTube Shorts. Du zahlst pro 1.000 geprüfte Views und behältst über ein optionales Budget-Limit jederzeit die volle Kostenkontrolle. Ideal für Shop-Aktionen, Rabatt-Kampagnen und schnelle Produkt-Launches.
              </p>
            </div>
            <div className="rounded-3xl border border-hairline bg-surface p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Weg 2 · Content &amp; Seeding</p>
              <h3 className="mt-2 text-2xl font-bold text-ink">Creator-Produktion &amp; Produkt-Tests</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Beauftrage gezielt passende Profile aus über 750 DACH-Creatorn für Produktvideos, Ad-Creatives, Produktmuster-Tests oder TikTok Shop. Mit klarer Plattform-Auswahl, Briefing-Checkliste und direkter Freigabe im Dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* 4 Schritte */}
        <section className="space-y-6">
          <h2 className="text-center text-3xl font-bold text-ink">In vier Schritten zur messbaren Kampagne</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['1', 'Brand-Konto einrichten', 'Melde dich in einer Minute mit deiner geschäftlichen E-Mail per 6-stelligem Code an.'],
              ['2', 'Kampagne & Plattform festlegen', 'Wähle TikTok, Instagram Reels, YouTube Shorts, TikTok Shop oder reine Videodateien, definiere deine Checkliste und dein optionales Budget-Limit.'],
              ['3', 'Creator matchen & einladen', 'Lade gezielt Favoriten aus über 750 DACH-Profilen ein oder öffne deine Kampagne für Bewerbungen verifizierter Profile.'],
              ['4', 'Beiträge prüfen & Views tracken', 'Prüfe eingereichte Links gegen dein Briefing und teile Views, effektiven TKP und Ergebnisse als CSV oder Live-Report-Link.'],
            ].map(([num, heading, body]) => (
              <div key={num} className="rounded-2xl border border-hairline bg-white p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-geo-violet text-sm font-bold text-white">{num}</span>
                <h3 className="mt-3 text-base font-bold text-ink">{heading}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand FAQ */}
        <section className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-center text-3xl font-bold text-ink">Häufige Fragen von Brands</h2>
          {[
            ['Warum brauche ich ein Brand-Konto?', 'Damit Anfragen verbindlich bleiben, kein Spam entsteht und du alle Briefings, eingereichten Links, Views und Reports gesammelt in einem Dashboard siehst.'],
            ['Wie funktioniert die Vergütung pro 1.000 Views?', 'Du definierst deinen Satz pro 1.000 Views und auf Wunsch ein maximales Budget-Limit. Nach Kampagnenende zählen nur geprüfte und aktive Beiträge in vollen 1.000er-Schritten bis zu diesem Limit.'],
            ['Kann ich auch Videos ohne Posting-Pflicht oder mit Produktversand buchen?', 'Ja. Im Kampagnen-Setup wählst du aus, ob Creator auf eigenen Accounts posten, ob du Produkte versendest oder ob du fertige Videodateien für deine eigenen Kanäle und Ads brauchst.'],
            ['Muss ich ein monatliches Abo abschließen?', 'Nein. Es gibt kein Pflicht-Abo. Du startest direkt mit deinem Kampagnenbudget und zahlst nur für geprüfte Ergebnisse innerhalb deines gesetzten Limits.'],
            ['Was ist, wenn wir Unterstützung bei Strategie, Briefing oder Auswahl brauchen?', 'Unser Team hinter UGC VZ kommt aus der Agenturpraxis von famefact. Auf Wunsch begleiten wir Setup, Creator-Auswahl und Performance-Auswertung direkt mit.'],
          ].map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-hairline bg-white p-5">
              <summary className="cursor-pointer font-semibold text-ink">{q}</summary>
              <p className="mt-2.5 text-sm leading-6 text-ink-soft">{a}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}

function BrandDashboard({
  brand,
  initialCampaigns,
}: {
  brand: BrandAccount;
  initialCampaigns: CampaignSummary[];
}) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>(initialCampaigns);
  const [showCreate, setShowCreate] = useState(initialCampaigns.length === 0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [title, setTitle] = useState('');
  const [brandDisplayName, setBrandDisplayName] = useState(brand.companyName || brand.contactName || '');
  const [niche, setNiche] = useState('');
  const [deliverables, setDeliverables] = useState('3× 30s UGC-Videos (9:16) inkl. 2 Hooks');
  const [compensationModel, setCompensationModel] = useState<CompensationModel>('tkp');
  const [budgetPerVideoEur, setBudgetPerVideoEur] = useState('');
  const [tkpEur, setTkpEur] = useState('2.00');
  const [totalBudgetEur, setTotalBudgetEur] = useState('500');
  const [requiresProductChoice, setRequiresProductChoice] = useState(false);
  const [productChoicePrompt, setProductChoicePrompt] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [requiredMention, setRequiredMention] = useState('');
  const [requiredHashtags, setRequiredHashtags] = useState('');
  const [checklistText, setChecklistText] = useState(
    'Produkt oder Shop-Aktion klar im Bild\nAktion / Rabatt-Hinweis oder CTA genannt\nWerbekennzeichnung (Werbung / Anzeige) sichtbar',
  );
  const [usageRights, setUsageRights] = useState('Organische Nutzung + 6 Monate Repost-Rechte');
  const [deadline, setDeadline] = useState('Laufzeit 14 Tage oder bis Budget-Limit erreicht');
  const [visibility, setVisibility] = useState<CampaignVisibility>('open');
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [description, setDescription] = useState('');

  const applyPreset = (preset: 'tkp_cap' | 'product_tkp' | 'fixed_ugc') => {
    if (preset === 'tkp_cap') {
      setCompensationModel('tkp');
      setTkpEur('2.00');
      setBudgetPerVideoEur('');
      setTotalBudgetEur('500');
      setDeliverables('1–3 authentische Short-Videos (TikTok / Reels / Shorts) inkl. Aktions-Hinweis');
      setUsageRights('Organische Creator-Posts + Repost-Rechte (0 % Plattform-Provision)');
      setDeadline('Aktionszeitraum / optionales Budget-Limit');
      setPlatforms(['tiktok', 'instagram', 'youtube']);
      setRequiresProductChoice(false);
      setProductChoicePrompt('');
      setDiscountCode('z. B. 20 % Aktionsrabatt im Shop (kein Produktversand nötig)');
    } else if (preset === 'product_tkp') {
      setCompensationModel('tkp');
      setTkpEur('2.00');
      setBudgetPerVideoEur('');
      setTotalBudgetEur('');
      setDeliverables('Produkt-Showcase / Review nach Musterversand (1–3 Clips)');
      setUsageRights('Organische Posts + 6 Monate Paid Ads / TikTok Shop');
      setDeadline('Erste Clips 10 Tage nach Produktzustellung');
      setPlatforms(['tiktok', 'instagram', 'tiktok_shop']);
      setRequiresProductChoice(true);
      setProductChoicePrompt('Welches Produkt / welche Variante, Größe oder App-Option möchtest du testen?');
      setDiscountCode('');
    } else {
      setCompensationModel('fixed');
      setTkpEur('');
      setBudgetPerVideoEur('250');
      setTotalBudgetEur('1500');
      setDeliverables('3× 30s UGC-Videos (9:16) inkl. 2 Hooks');
      setUsageRights('12 Monate Paid Ads (Meta & TikTok)');
      setDeadline('Erste Clips innerhalb von 14 Tagen');
      setPlatforms(['tiktok', 'instagram', 'meta_ads']);
      setRequiresProductChoice(false);
      setProductChoicePrompt('');
      setDiscountCode('');
    }
  };

  const tkpNumeric = Number(String(tkpEur).replace(',', '.'));
  const totalBudgetNumeric = Number(totalBudgetEur);
  const estimatedCapViews =
    (compensationModel === 'tkp' || compensationModel === 'hybrid') && tkpNumeric > 0 && totalBudgetNumeric > 0
      ? Math.floor((totalBudgetNumeric / tkpNumeric) * 1000)
      : null;

  const totals = campaigns.reduce(
    (acc, c) => ({
      active: acc.active + (c.status === 'active' ? 1 : 0),
      selected: acc.selected + c.counts.selected,
      submissions: acc.submissions + c.counts.submissions,
      views: acc.views + c.metrics.totalViews,
    }),
    { active: 0, selected: 0, submissions: 0, views: 0 },
  );

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!title.trim()) {
      setCreateError('Bitte gib einen Kampagnentitel an.');
      return;
    }
    setCreating(true);
    try {
      const tkpCents =
        (compensationModel === 'tkp' || compensationModel === 'hybrid') && tkpNumeric > 0
          ? Math.round(tkpNumeric * 100)
          : null;
      const res = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          brandDisplayName,
          niche,
          deliverables,
          compensationModel,
          budgetPerVideoEur: budgetPerVideoEur ? Number(budgetPerVideoEur) : null,
          totalBudgetEur: totalBudgetEur ? Number(totalBudgetEur) : null,
          tkpEurCents: tkpCents,
          requiresProductChoice,
          productChoicePrompt,
          discountCode,
          briefingChecklist: checklistText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          requiredMention,
          requiredHashtags,
          usageRights,
          deadline,
          visibility,
          platforms: platforms.length ? platforms : ['tiktok', 'instagram'],
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Kampagne konnte nicht angelegt werden.');
      window.location.href = `/brand/kampagnen/${data.campaign.publicId}`;
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Fehler beim Anlegen.');
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/brand/logout', { method: 'POST' });
    window.location.href = '/brand';
  };

  const refresh = async () => {
    const res = await fetch('/api/brand/campaigns');
    const data = await res.json();
    if (res.ok && data.success) setCampaigns(data.campaigns);
  };

  return (
    <div className="min-h-screen bg-white px-4 pb-24 pt-10 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Kopf */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-geo-violet">Brand-Workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">
              {brand.companyName || brand.contactName || 'Dein Kampagnen-Cockpit'}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{brand.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/brands"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-hairline px-4 text-sm font-semibold text-ink hover:border-geo-violet"
            >
              <Search size={15} /> Creator suchen
            </Link>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-geo-violet px-4 text-sm font-semibold text-white hover:bg-[#7531ae]"
            >
              <Plus size={16} /> {showCreate ? 'Formular schließen' : 'Neue Kampagne'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-hairline px-3.5 text-sm font-semibold text-ink-soft hover:bg-surface"
            >
              <LogOut size={15} /> Abmelden
            </button>
          </div>
        </div>

        {/* KPI-Zeile */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Aktive Kampagnen', String(totals.active), 'Offen oder per Einladung'],
            ['Ausgewählte Creator', String(totals.selected), 'Im aktiven Produktionsfluss'],
            ['Eingereichte Clips', String(totals.submissions), 'TikTok, IG Reels & Shorts'],
            ['Getrackte Views', totals.views.toLocaleString('de-DE'), 'Über alle Kampagnen'],
          ].map(([label, val, sub]) => (
            <div key={label} className="rounded-2xl border border-hairline bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{val}</p>
              <p className="mt-1 text-xs text-ink-soft">{sub}</p>
            </div>
          ))}
        </div>

        {/* Neue Kampagne anlegen */}
        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-3xl border border-geo-violet/25 bg-[#FBF8FE] p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-ink">Neue UGC-Kampagne anlegen</h2>
                <p className="text-sm text-ink-soft">Als offene Ausschreibung für 750+ Creator im Konto oder privat nur für ausgewählte Profile.</p>
              </div>
              <button type="button" onClick={refresh} className="text-xs font-semibold text-geo-violet underline">
                Ansicht aktualisieren
              </button>
            </div>

            {/* 1-Klick Kampagnen-Vorlagen */}
            <div className="space-y-2">
              <span className={labelClass}>1-Klick-Vorlage wählen (optional)</span>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {[
                  {
                    id: 'tkp_cap' as const,
                    name: 'Pay-per-View / TKP',
                    sub: 'z. B. 2 €/1.000 Views · optionales Budget-Limit · ohne Versand',
                  },
                  {
                    id: 'product_tkp' as const,
                    name: 'Produkt-Test + TKP',
                    sub: 'Für alle Produkte & Services · inkl. Varianten-Auswahl',
                  },
                  {
                    id: 'fixed_ugc' as const,
                    name: 'UGC-Paket (Festpreis)',
                    sub: 'z. B. 250 €/Video · Paid-Ads-Buyout',
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-2xl border border-hairline bg-white p-3.5 text-left transition hover:border-geo-violet hover:shadow-sm"
                  >
                    <p className="text-xs font-bold text-geo-violet">{preset.name}</p>
                    <p className="mt-1 text-xs text-ink-soft">{preset.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="camp-title" className={labelClass}>Kampagnentitel *</label>
                <input id="camp-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Aktions-Kampagne Short-Videos (DE)" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-brand" className={labelClass}>Anzeigename der Brand</label>
                <input id="camp-brand" value={brandDisplayName} onChange={(e) => setBrandDisplayName(e.target.value)} placeholder="z. B. GlowSkin" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-niche" className={labelClass}>Branche / Nische</label>
                <input id="camp-niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="z. B. Streetwear, Beauty, Food, Tech" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-deliverables" className={labelClass}>Deliverables</label>
                <input id="camp-deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="camp-model" className={labelClass}>Vergütungsmodell</label>
                <select id="camp-model" value={compensationModel} onChange={(e) => setCompensationModel(e.target.value as CompensationModel)} className={fieldClass}>
                  <option value="tkp">Pay-per-View (TKP)</option>
                  <option value="fixed">Festpreis / Paket</option>
                  <option value="hybrid">Hybrid (Fix + TKP-Bonus)</option>
                  <option value="barter">Produkt / Seeding</option>
                </select>
              </div>
              {(compensationModel === 'tkp' || compensationModel === 'hybrid') ? (
                <div>
                  <label htmlFor="camp-tkp" className={labelClass}>TKP (€ / 1.000 Views)</label>
                  <input id="camp-tkp" type="number" min={0} step="0.10" value={tkpEur} onChange={(e) => setTkpEur(e.target.value)} placeholder="2.00" className={fieldClass} />
                </div>
              ) : (
                <div>
                  <label htmlFor="camp-per-video" className={labelClass}>Budget / Video (€)</label>
                  <input id="camp-per-video" type="number" min={0} value={budgetPerVideoEur} onChange={(e) => setBudgetPerVideoEur(e.target.value)} className={fieldClass} />
                </div>
              )}
              <div>
                <label htmlFor="camp-total" className={labelClass}>Budget-Limit (€, optional)</label>
                <input id="camp-total" type="number" min={0} value={totalBudgetEur} onChange={(e) => setTotalBudgetEur(e.target.value)} placeholder="Leer = offen" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-visibility" className={labelClass}>Sichtbarkeit</label>
                <select id="camp-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as CampaignVisibility)} className={fieldClass}>
                  <option value="open">Offen ausschreiben (750+ Creator)</option>
                  <option value="invite_only">Nur per Direkteinladung</option>
                </select>
              </div>
            </div>

            {estimatedCapViews !== null && (
              <div className="rounded-2xl border border-geo-green/60 bg-[#f6fbf1] px-4 py-3 text-xs leading-5 text-[#385523]">
                <strong>Budget-Rechnung:</strong> Bei <strong>{tkpNumeric.toFixed(2).replace('.', ',')} € / 1.000 Views</strong> und einem optionalen Budget-Limit von <strong>{totalBudgetNumeric.toLocaleString('de-DE')} €</strong> sind bis zu{' '}
                <strong>{estimatedCapViews.toLocaleString('de-DE')} bezahlte Views</strong> abgedeckt – ohne Plattform-Provision. (Leer lassen für offenes Budget ohne Obergrenze.)
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="camp-rights" className={labelClass}>Nutzungsrechte</label>
                <input id="camp-rights" value={usageRights} onChange={(e) => setUsageRights(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-deadline" className={labelClass}>Zeitplan / Frist</label>
                <input id="camp-deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-discount" className={labelClass}>Aktions- / Rabatt-Hinweis (optional)</label>
                <input id="camp-discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="z. B. 20 % Shop-Rabatt / Aktionscode" className={fieldClass} />
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={requiresProductChoice}
                  onChange={(e) => setRequiresProductChoice(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-geo-violet"
                />
                <span className="text-sm text-ink">
                  <strong>Produkt-/Varianten-Auswahl bei Bewerbung abfragen</strong>
                  <span className="block text-xs text-ink-soft">Ideal für Musterversand: Creator geben direkt bei der Bewerbung ihr Wunschprodukt, Größe oder Shop-Link an.</span>
                </span>
              </label>
              {requiresProductChoice && (
                <div>
                  <label htmlFor="camp-product-prompt" className={labelClass}>Frage an Creator</label>
                  <input
                    id="camp-product-prompt"
                    value={productChoicePrompt}
                    onChange={(e) => setProductChoicePrompt(e.target.value)}
                    placeholder="z. B. Welches Produkt / welche Variante aus dem Shop möchtest du erhalten?"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            <div>
              <span className={labelClass}>Auf welcher Plattform soll gepostet werden? (Pflichtangabe) *</span>
              <div className="flex flex-wrap gap-2">
                {[
                  ['tiktok', 'TikTok'],
                  ['instagram', 'Instagram Reels'],
                  ['youtube', 'YouTube Shorts'],
                  ['tiktok_shop', 'TikTok Shop'],
                  ['files_only', 'Nur Videodateien (kein Posting)'],
                  ['meta_ads', 'Meta Paid Ads'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={platforms.includes(id)}
                    onClick={() => togglePlatform(id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                      platforms.includes(id) ? 'border-geo-violet bg-geo-violet text-white' : 'border-hairline bg-white text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-soft">Hinweis: Bei öffentlichen Creator-Postings muss der Beitrag gut sichtbar als „Werbung“ oder „Anzeige“ gekennzeichnet werden.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="camp-mention" className={labelClass}>Pflicht-Erwähnung / Tag (optional)</label>
                <input id="camp-mention" value={requiredMention} onChange={(e) => setRequiredMention(e.target.value)} placeholder="z. B. @deinemarke" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="camp-hashtags" className={labelClass}>Pflicht-Hashtags (optional)</label>
                <input id="camp-hashtags" value={requiredHashtags} onChange={(e) => setRequiredHashtags(e.target.value)} placeholder="z. B. #werbung #deinemarke" className={fieldClass} />
              </div>
            </div>

            <div>
              <label htmlFor="camp-checklist" className={labelClass}>Pflicht-Checkliste für die Beitragsprüfung (1 Punkt pro Zeile)</label>
              <textarea
                id="camp-checklist"
                rows={3}
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                placeholder={'Produkt klar sichtbar\nRabattcode oder CTA genannt\nWerbung sichtbar markiert'}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="camp-desc" className={labelClass}>Briefing &amp; Produktdetails</label>
              <textarea id="camp-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Produkt-USP, Zielgruppe, gewünschte Hooks, Do's & Don'ts …" className={fieldClass} />
            </div>

            {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}

            <button
              type="submit"
              disabled={creating}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white hover:bg-[#7531ae] disabled:opacity-60"
            >
              <CheckCircle2 size={16} /> {creating ? 'Wird angelegt …' : 'Kampagne live anlegen →'}
            </button>
          </form>
        )}

        {/* Kampagnen-Liste */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-ink">Deine Kampagnen ({campaigns.length})</h2>
          {campaigns.length === 0 ? (
            <div className="rounded-3xl border border-hairline bg-surface p-10 text-center">
              <p className="text-base font-semibold text-ink">Noch keine Kampagne angelegt.</p>
              <p className="mt-2 text-sm text-ink-soft">Erstelle oben deine erste Ausschreibung oder wähle direkt passende Creator in der Suche aus.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((camp) => (
                <Link
                  key={camp.id}
                  href={`/brand/kampagnen/${camp.publicId}`}
                  className="block rounded-3xl border border-hairline bg-white p-6 transition hover:border-geo-violet hover:shadow-[0_16px_45px_rgba(35,22,47,0.08)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="font-mono text-ink-soft">{camp.publicId}</span>
                        <span className={`rounded-full px-2.5 py-0.5 ${STATUS_BADGES[camp.status] || 'bg-surface text-ink-soft'}`}>
                          {camp.status === 'active' ? 'Aktiv' : camp.status === 'paused' ? 'Pausiert' : camp.status === 'completed' ? 'Abgeschlossen' : 'Entwurf'}
                        </span>
                        <span className="rounded-full bg-geo-violet/10 px-2.5 py-0.5 text-geo-violet">
                          {camp.visibility === 'open' ? 'Offen ausgeschrieben' : 'Nur Einladung'}
                        </span>
                        <span className="rounded-full border border-hairline px-2.5 py-0.5 text-ink-soft">
                          {MODEL_LABELS[camp.compensationModel]}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-ink">{camp.title}</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        {[
                          camp.deliverables,
                          camp.tkpEurCents ? `${(camp.tkpEurCents / 100).toFixed(2).replace('.', ',')} € / 1.000 Views` : '',
                          camp.totalBudgetEur ? `Budget-Limit ${camp.totalBudgetEur.toLocaleString('de-DE')} €` : '',
                          camp.deadline,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-geo-violet">
                      Öffnen &amp; Reporting →
                    </span>
                  </div>

                  {camp.totalBudgetEur && camp.totalBudgetEur > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink-soft">
                          Budget-Limit: <strong className="text-ink">{camp.metrics.accruedPayoutEur.toLocaleString('de-DE')} €</strong> von {camp.totalBudgetEur.toLocaleString('de-DE')} €
                        </span>
                        <span className={`font-bold ${camp.metrics.capReached ? 'text-red-700' : 'text-[#385523]'}`}>
                          {camp.metrics.capReached
                            ? 'Budget-Limit erreicht'
                            : `Noch ${(camp.metrics.remainingBudgetEur ?? 0).toLocaleString('de-DE')} € frei`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full rounded-full transition-all ${camp.metrics.capReached ? 'bg-red-500' : 'bg-geo-violet'}`}
                          style={{ width: `${Math.min(100, Math.round((camp.metrics.accruedPayoutEur / camp.totalBudgetEur) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-xs sm:grid-cols-5">
                    <div>
                      <span className="text-ink-soft">Eingeladen</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.invited}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Bewerbungen</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.applied}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Ausgewählt</span>
                      <p className="mt-0.5 text-base font-bold text-[#385523]">{camp.counts.selected}</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Clips (Freigegeben)</span>
                      <p className="mt-0.5 text-base font-bold text-ink">{camp.counts.submissions} ({camp.counts.approvedSubmissions})</p>
                    </div>
                    <div>
                      <span className="text-ink-soft">Views</span>
                      <p className="mt-0.5 text-base font-bold text-geo-violet">{camp.metrics.totalViews.toLocaleString('de-DE')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
