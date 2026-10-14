'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { consentText, ADULT_TEXT, DECLINE_REASONS, STATUS, missingDetails, type Member, type Details } from '@/app/lib/collaborations/model';
import { FOMO, referralId, type Variant, type VariantSource } from '@/app/lib/collaborations/fomo-config';
import { track } from '@/app/lib/collaborations/track';
import { Placeholder } from '@/app/components/FomoBriefing';

type Props = { member: Member; variant: Variant; variantSource: VariantSource; briefing?: React.ReactNode };
export default function MemberClient({ member: m, variant, variantSource, briefing }: Props) {
  const [details, setDetails] = useState<Details>({ name: m.details.name ?? m.name, language: m.details.language || '', availability: m.details.availability || '', socialUrl: m.details.socialUrl ?? m.social_url ?? '', discord: m.details.discord || '' });
  const [consent, setConsent] = useState(false), [adult, setAdult] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [reasons, setReasons] = useState<string[]>([]), [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const c = m.terms_snapshot || m.content, missing = missingDetails(details);
  const contact = FOMO.contactMail || c.contactEmail;
  const id = referralId(m.campaign_slug, m.referral_no) || m.id;
  const editable = ['invited', 'accepted', 'ready'].includes(m.status) && m.campaign_state === 'live';
  const update = (key: keyof Details, value: string) => setDetails(d => ({ ...d, [key]: value }));
  const meta = { variant, variant_source: variantSource };
  async function save(action: 'accept' | 'save' | 'decline') {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/collaborations/member', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, version: m.version, campaignVersion: m.campaign_version, action, consent, adult, details, reasons, ...meta }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      if (action === 'save') window.location.reload(); else window.location.replace(window.location.pathname + window.location.search);
    } catch (e) { setError(e instanceof Error ? e.message : `Das hat nicht geklappt. Versuch es bitte noch einmal oder schreib uns an ${contact}.`); setBusy(false); }
  }
  const accepted = !!m.accepted_at && m.status !== 'declined';
  return <>
    <Link href="/konto/kooperationen" className="demo-back">← Meine Kooperationen</Link>
    {accepted ? <section className="demo-apply-card my-6" aria-live="polite">
      <p className="demo-eyebrow">{c.brand} × UGC VZ</p>
      <h1>{variant === 'm' ? 'Stark, du bist dabei.' : 'Du bist dabei. Willkommen!'}</h1>
      <p className="demo-lead">Deine Vermittlungs ID lautet <strong>{id}</strong>. Nenne sie bitte im Discord Onboarding, damit alles richtig zugeordnet wird.</p>
      <div className="demo-actions">
        {FOMO.discordInvite ? <a className="demo-button" href={FOMO.discordInvite} target="_blank" rel="noopener noreferrer" onClick={() => track(m.id, 'handover', { method: 'discord_click', ...meta })}>Zum Discord Onboarding</a> : <Placeholder inline text="Discord Einladungslink fomo Onboarding (folgt)" />}
        <button type="button" className="demo-button secondary" onClick={async () => { try { await navigator.clipboard.writeText(id); setCopied(true); } catch { /* manuell kopieren */ } }}>{copied ? 'Kopiert ✓' : 'ID kopieren'}</button>
      </div>
      <p className="demo-lead"><strong>{STATUS[m.status]}</strong>{m.status === 'accepted' && missing.length > 0 && <> · Noch offen: {missing.join(', ')}</>}</p>
    </section> : m.status === 'declined' ? <section className="demo-apply-card my-6"><h1>Danke für deine Rückmeldung.</h1><p className="demo-lead">Dein UGC VZ Profil bleibt aktiv und wir melden uns bei passenden Kampagnen.</p></section>
      : <><p className="demo-eyebrow">{c.brand} × UGC VZ · Deine Einladung</p><h1>{c.title}</h1><p className="demo-lead">Hallo {details.name.split(' ')[0] || 'du'}, schön dass du da bist. {c.summary}</p>
        {m.campaign_state !== 'live' && <div className="demo-note"><p>Die Kampagne ist pausiert. Deine gespeicherten Angaben bleiben erhalten.</p></div>}</>}

    {m.status === 'invited' && briefing}

    {m.status !== 'declined' && <div className="demo-form-layout" id="zusage"><section className="demo-form-card">
      <h2>{m.status === 'invited' ? 'Ja, ich bin dabei' : 'Deine Angaben'}</h2><p>Deine vorhandenen Angaben sind übernommen. Fehlendes kannst du auch später ergänzen.</p>
      <form onSubmit={e => { e.preventDefault(); if (m.status === 'invited') track(m.id, 'cta_click', { position: 'bottom', ...meta }); save(m.status === 'invited' ? 'accept' : 'save'); }}>
        <label>Name<input value={details.name} maxLength={120} disabled={!editable} onChange={e => update('name', e.target.value)} /></label>
        <label>E-Mail<input value={m.email} disabled readOnly /></label>
        <label>Social Profil<input type="url" pattern="https://.*" value={details.socialUrl} maxLength={500} disabled={!editable} onChange={e => update('socialUrl', e.target.value)} /></label>
        <label>Posting Sprache<select value={details.language} disabled={!editable} onChange={e => update('language', e.target.value)}><option value="">Später ergänzen</option><option>Deutsch</option><option>Englisch</option><option>Deutsch und Englisch</option></select></label>
        <label>Ab wann kannst du starten?<input value={details.availability} placeholder="Zum Beispiel: ab 1. November" maxLength={160} disabled={!editable} onChange={e => update('availability', e.target.value)} /></label>
        <label>Discord Name (optional)<input value={details.discord} maxLength={120} disabled={!editable} onChange={e => update('discord', e.target.value)} /></label>
        {m.status === 'invited' && <>
          <label className="demo-checkbox"><input type="checkbox" checked={consent} disabled={!editable} onChange={e => setConsent(e.target.checked)} /><span>{consentText(contact, FOMO.consentCompany || 'fomo')} <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link></span></label>
          <label className="demo-checkbox"><input type="checkbox" checked={adult} disabled={!editable} onChange={e => setAdult(e.target.checked)} /><span>{ADULT_TEXT}</span></label>
        </>}
        {editable && <div className="demo-actions">
          <button className="demo-button" disabled={busy || (m.status === 'invited' && !(consent && adult))}>{busy ? 'Einen Moment…' : m.status === 'invited' ? 'Ja, ich bin dabei' : 'Änderungen speichern'}</button>
          <button type="button" className="demo-button secondary" onClick={() => dialog.current?.showModal()} disabled={busy}>Nein danke</button>
        </div>}
        {error && <p role="alert" className="demo-error">{error}</p>}
      </form>
    </section><aside><h2>Deine Konditionen</h2><p className="demo-lead whitespace-pre-line">{c.terms}</p><p className="demo-lead">Kontakt: <a className="underline" href={`mailto:${contact}`}>{c.contactName}</a></p>
      {accepted && c.guideUrl && <a className="demo-button" href={c.guideUrl} target="_blank" rel="noopener noreferrer">Kundenguide öffnen ↗</a>}
      <p className="demo-caption">Dein übriges Profil verwaltest du im <Link className="underline" href="/konto">Creator Konto</Link>.</p>
    </aside></div>}

    {m.status === 'invited' && editable && <a className="fb-sticky-cta" href="#zusage" onClick={() => track(m.id, 'cta_click', { position: 'sticky', ...meta })}>Ja, ich bin dabei</a>}

    <dialog ref={dialog} className="fb-dialog" id="fb-decline" aria-labelledby="fb-decline-title">
      <form method="dialog" onSubmit={e => { e.preventDefault(); dialog.current?.close(); save('decline'); }}>
        <h2 id="fb-decline-title">Schade, aber völlig okay.</h2>
        <p>Magst du uns sagen, warum? (optional)</p>
        {DECLINE_REASONS.map(r => <label key={r} className="demo-checkbox"><input type="checkbox" checked={reasons.includes(r)} onChange={e => setReasons(list => e.target.checked ? [...list, r] : list.filter(x => x !== r))} /><span>{r}</span></label>)}
        <div className="demo-actions"><button className="demo-button">Absagen</button><button type="button" className="demo-button secondary" onClick={() => dialog.current?.close()}>Zurück</button></div>
      </form>
    </dialog>
  </>;
}

// Entscheidungsbuttons im Briefing: Ja springt zum Formular, Nein öffnet den Absage-Dialog.
export function DecisionButtons({ memberId, variant, variantSource }: { memberId?: string; variant: Variant; variantSource: VariantSource }) {
  return <div className="demo-actions" style={{ justifyContent: 'center' }}>
    <a className="demo-button" href="#zusage" onClick={() => track(memberId, 'cta_click', { position: 'decision', variant, variant_source: variantSource })}>Ja, ich bin dabei</a>
    <button type="button" className="demo-button secondary" onClick={() => (document.getElementById('fb-decline') as HTMLDialogElement | null)?.showModal()}>Nein danke</button>
  </div>;
}
