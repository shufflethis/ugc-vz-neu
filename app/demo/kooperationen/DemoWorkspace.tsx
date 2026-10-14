'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Clock3, FileText, Layers3, LockKeyhole, Mail, Play, Plus, Printer, RotateCcw, ShieldCheck, Sparkles, Users, Video } from 'lucide-react';
import FomoBriefing from '../../components/FomoBriefing';
import type { Variant } from '../../lib/collaborations/fomo-config';
import { DEMO_ROOT, type Campaign, type DemoCandidate, type Slide, type Stage } from './model';

type Props = { view: 'overview' | 'campaign' | 'apply' | 'guide' | 'tracking' | 'presentation' | 'account' | 'invitation'; campaigns: Campaign[]; campaign?: Campaign; candidates: DemoCandidate[]; slides: Slide[]; variant?: Variant };
const prefix = 'ugcvz-collab-demo-v3:';
const stages: Stage[] = ['Vorgeschlagen', 'Eingeladen', 'Einladung angenommen', 'Start geklärt', 'Übergabe offen', 'Bestätigt', 'Abgesagt'];
function read<T>(key: string, fallback: T): T {
  try { const value = sessionStorage.getItem(prefix + key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* The demo remains usable without browser storage. */ }
}
const url = (path = '') => `${DEMO_ROOT}${path ? `/${path}` : ''}`;
function Badge({ children, green = false }: { children: React.ReactNode; green?: boolean }) { return <span className={`demo-badge ${green ? 'is-green' : ''}`}>{children}</span>; }
function Label({ children }: { children: React.ReactNode }) { return <p className="demo-eyebrow">{children}</p>; }
function Brand({ campaign, large = false }: { campaign: Campaign; large?: boolean }) { return <span aria-hidden="true" className={`demo-brand tone-${campaign.tone} ${large ? 'large' : ''}`}>{campaign.monogram}</span>; }
function ButtonLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) { return <a className={`demo-button ${secondary ? 'secondary' : ''}`} href={href}>{children}<ArrowUpRight size={17} /></a>; }

export default function DemoWorkspace(props: Props) {
  const internal = props.view === 'tracking' || props.view === 'presentation';
  return <div className="collab-demo">
    <div className="demo-private"><span><LockKeyhole size={13} /> Private Vorschau</span><span>Demo mit Beispieldaten · kein Versand, keine echten Zusagen</span></div>
    <header className="demo-header">
      <a href={url()} aria-label="UGC VZ Kooperationen – Übersicht" className="demo-wordmark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ" width="78" height="48" /><span>Kooperationen<span className="demo-wordmark-sub">Ein Profil. Neue Möglichkeiten.</span></span>
      </a>
      <nav aria-label="Demo-Bereiche">
        <a aria-current={!internal ? 'page' : undefined} href={url()}><Layers3 size={16} />Für Creator</a>
        <a aria-current={props.view === 'account' ? 'page' : undefined} href={url('konto')}>Mein Konto</a>
        <a aria-current={props.view === 'invitation' ? 'page' : undefined} href={url('einladung')}>Einladungslink</a>
        <a aria-current={props.view === 'tracking' ? 'page' : undefined} href={url('tracking')}><ClipboardList size={16} />Kampagnenboard</a>
        <a aria-current={props.view === 'presentation' ? 'page' : undefined} href={url('praesentation')}><Play size={15} />Für die Abstimmung</a>
      </nav>
    </header>
    <div className="demo-content" id="demo-content">
      {props.view === 'account' && <DemoAccount />}
      {props.view === 'invitation' && <DemoInvitation />}
      {props.view === 'overview' && <Overview campaigns={props.campaigns} />}
      {props.view === 'campaign' && props.campaign && <CampaignPage campaign={props.campaign} variant={props.variant || 'n'} />}
      {props.view === 'apply' && props.campaign && <Application campaign={props.campaign} />}
      {props.view === 'guide' && props.campaign && <Guide campaign={props.campaign} />}
      {props.view === 'tracking' && <Tracking campaigns={props.campaigns} seed={props.candidates} />}
      {props.view === 'presentation' && <Presentation slides={props.slides} />}
    </div>
    <footer className="demo-footer"><span>UGC VZ · Jobs & Kooperationen <small>Interner Entwurf · Oktober 2026</small></span><button type="button" onClick={() => { if (!window.confirm('Alle simulierten Bewerbungen, Checklisten und Status in diesem Tab zurücksetzen?')) return; try { Object.keys(sessionStorage).filter(key => key.startsWith(prefix)).forEach(key => sessionStorage.removeItem(key)); } catch { /* No storage available. */ } window.location.reload(); }}><RotateCcw size={14} />Demo zurücksetzen</button></footer>
  </div>;
}

function Overview({ campaigns }: { campaigns: Campaign[] }) {
  return <>
    <section className="demo-hero">
      <div><Label>Dein Einstieg in Markenkooperationen</Label><h1>Dein Content.<br /><span className="gradient-text">Neue Möglichkeiten.</span></h1><p className="demo-lead">Mit UGC Geld verdienen und verstehen, was eine Kooperation von dir verlangt. Wir starten mit fomo: ein klarer Überblick, ein kurzer Weg von der Einladung zum Start und Flo als Kontakt bis zur Übergabe.</p><div className="demo-actions"><ButtonLink href={url('fomo')}>fomo-Kooperation ansehen</ButtonLink><ButtonLink href="#so-helfen-wir" secondary>So begleitet dich UGC VZ</ButtonLink></div><div className="demo-hero-proof"><span><Check size={15} />Eine erste Kampagne</span><span><Check size={15} />Du entscheidest, was passt</span></div></div>
      <div className="demo-visual" aria-label="Vom Profil zur passenden Kooperation">
        <div className="demo-visual-top"><span className="demo-avatar">DU</span><div><strong>Dein Creator-Profil</strong><small>Deine Stärken. Dein Stil.</small></div><ShieldCheck size={21} /></div>
        <div className="demo-visual-line"><span /></div>
        <div className="demo-visual-project"><div className="demo-visual-tag"><span className="demo-dot" />Nächste Möglichkeit</div><div className="demo-visual-brand"><Brand campaign={campaigns[0]} large /><span>fomo<small>Creator-Partnerschaft</small></span><ArrowUpRight size={25} /></div><p>Regelmäßig Content produzieren.<br />Gemeinsam den Start abstimmen.</p><div className="demo-visual-foot"><Badge>Fixhonorar + Provision</Badge><span>Pilotentwurf</span></div></div>
        <div className="demo-visual-note"><CheckCheck size={18} /><span>Ein klarer Ablauf. Auch für die nächste Marke.</span></div>
      </div>
    </section>
    <section className="demo-section" id="kooperationen"><div className="demo-section-heading"><div><Label>Unsere erste Kampagne</Label><h2>Wir starten mit fomo.</h2></div><p>Weitere Kooperationen sind geplant.<br />Aktuell ist nur der fomo-Pilot vorbereitet.</p></div>
      <div className="demo-campaign-grid demo-first-campaign">{campaigns.filter(c => !c.fictional).map(c => <article className="demo-campaign-card" key={c.slug}><div className={`demo-card-art tone-${c.tone}`}><span className="demo-card-art-name">{c.brand}<span>× UGC VZ</span></span><span className="demo-card-sticker">Erster Pilot</span><div className="demo-art-orbit" aria-hidden="true" /></div><div className="demo-card-body"><Label>{c.category}</Label><h3>{c.title}</h3><p>{c.summary}</p><div className="demo-card-facts"><span><Video size={15} />{c.rhythm}</span><span><Clock3 size={15} />{c.duration}</span></div><div className="demo-card-bottom"><Badge>{c.kind}</Badge><a href={url(c.slug)} aria-label={`${c.brand}: Kooperation ansehen`}><ArrowUpRight size={23} /></a></div></div></article>)}{['UGC-Aufträge', 'Weitere Partnerschaften'].map((title, i) => <article className="demo-campaign-card demo-campaign-placeholder" key={title} data-state="unavailable"><div className="demo-card-art"><span className="demo-placeholder-icon">{i === 0 ? <Video size={32} /> : <Layers3 size={32} />}</span><span className="demo-card-sticker">Noch nicht verfügbar</span></div><div className="demo-card-body"><Label>Ausblick</Label><h3>{title}</h3><p>{i === 0 ? 'Perspektivisch können hier einzelne Content-Aufträge stehen. Zurzeit gibt es dafür keine Kampagne.' : 'Wir möchten weitere passende Marken ergänzen. Neue Angebote erscheinen erst, wenn sie konkret sind.'}</p><div className="demo-card-bottom"><span><LockKeyhole size={14} />Weitere Kooperationen folgen</span></div></div></article>)}</div>
    </section>
    <section className="demo-how" id="so-helfen-wir"><div><Label>Dein Mehrwert mit UGC VZ</Label><h2>Gut informiert.<br />Persönlich begleitet.</h2></div><div className="demo-steps">{[['01', 'Klarheit vor deinem Start', 'Du siehst Aufgabe, Aufwand und Vergütungsmodell zusammen und kannst prüfen, ob das Projekt zu dir passt.'], ['02', 'Ein einfacher Einstieg', 'Du bist eingeladen. Bestätige deine vorhandenen Angaben und wann du starten kannst. Flo hilft bei offenen Fragen.'], ['03', 'Eine klare Übergabe', 'Deine bestätigten Angaben gehen mit Zuordnung an fomo. Nach der Aufnahme begleitet dich das fomo-Team mit seinem bestehenden Guide.']].map(([n, t, d]) => <div key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
    <div className="demo-note"><CircleHelp size={19} /><p>Geschützte Vorschau des ersten Piloten. Einladung und Status sind simuliert. Die grauen Plätze sind ein Ausblick und enthalten keine verfügbaren Angebote.</p></div>
  </>;
}

function CampaignPage({ campaign: c, variant }: { campaign: Campaign; variant: Variant }) {
  const fomo = c.slug === 'fomo';
  return <><a className="demo-back" href={url()}><ChevronLeft size={16} />Alle Kooperationen</a><section className="demo-campaign-hero"><div><div className="demo-inline"><Brand campaign={c} /><Label>{c.brand} × UGC VZ</Label><Badge>{c.fictional ? 'Fiktives Beispiel' : 'Deine Einladung · Vorschau'}</Badge></div><h1>{c.title}</h1><p className="demo-lead">{c.summary}</p><div className="demo-platforms">{c.platforms.map(p => <Badge key={p}>{p}</Badge>)}</div></div><aside className="demo-apply-card" id="start"><Label>Die Kooperation auf einen Blick</Label><h2>{c.reward}</h2><dl><div><dt>Umfang</dt><dd>{c.rhythm}</dd></div><div><dt>Zusammenarbeit</dt><dd>{c.duration}</dd></div><div><dt>Begleitung</dt><dd>UGC VZ → {c.brand}</dd></div></dl><ButtonLink href={url(`${c.slug}/start`)}>Weiter zum Start</ButtonLink><small>Du bist von UGC VZ eingeladen.<br />Bestätige im nächsten Schritt deine Angaben und Verfügbarkeit.</small></aside></section>
    {fomo && <><div className="demo-actions" style={{ marginTop: 40 }}><span className="demo-eyebrow" style={{ margin: 0 }}>Vorschau der Variante:</span>{([['w', 'Frauen (w)', '?v=w'], ['m', 'Männer (m)', '?v=m'], ['n', 'Neutral (n)', '?v=n']] as const).map(([v, label, q]) => <a key={v} className={`demo-button ${variant === v ? '' : 'secondary'}`} aria-current={variant === v ? 'page' : undefined} href={url(c.slug) + q}>{label}</a>)}</div>
      <FomoBriefing variant={variant} contactName="Florian Runge" contactEmail="florian.runge@ugc-vz.de" cta={<div className="demo-actions" style={{ justifyContent: 'center' }}><ButtonLink href={url(`${c.slug}/start`)}>Ja, ich bin dabei</ButtonLink><button type="button" className="demo-button secondary" onClick={() => window.alert('Im echten Ablauf öffnet sich hier „Schade, aber völlig okay.“ mit optionalen Gründen.')}>Nein danke</button></div>} /></>}
    {!fomo && c.value && <section className="demo-value" aria-labelledby="campaign-value-title">
      <Label>Deine Perspektive als Creator</Label>
      <h2 id="campaign-value-title">{c.value.title}</h2>
      <p className="demo-value-intro">{c.value.intro}</p>
      <div className="demo-value-points">{c.value.points.map((point, i) => <article key={point.title}><span className="demo-value-number">0{i + 1}</span><h3>{point.title}</h3><p>{point.text}</p></article>)}</div>
      <p className="demo-value-note">{c.value.note}</p>
    </section>}
    <div className="demo-detail-grid">{!fomo && <section><Label>Deine Aufgabe</Label><h2>Das würdest du machen.</h2><ul className="demo-check-list">{c.deliverables.map(t => <li key={t}><Check size={18} />{t}</li>)}</ul><Label>Passt das zu dir?</Label><h2>Das bringst du mit.</h2><ul className="demo-check-list">{c.requirements.map(t => <li key={t}><Check size={18} />{t}</li>)}</ul></section>}<section className="demo-terms"><Label>Transparent von Anfang an</Label><h2>Aufwand & Konditionen.</h2>{c.terms.map(t => <details key={t.title} open><summary>{t.title}<Plus size={16} /></summary><p>{t.text}</p></details>)}<p className="demo-caption">{c.fictional ? 'Alle Inhalte sind Beispiele zur Abstimmung.' : 'Quelle: bereitgestelltes fomo-Briefing. Individuelle Konditionen sind vor dem Start zu bestätigen.'}</p></section></div>
    <section className="demo-dark-band"><div><Label>Von UGC VZ zum {c.brand}-Team</Label><h2>Ein klarer Weg in die Zusammenarbeit.</h2><p>Flo hat dich für diese Kooperation ausgewählt und begleitet deinen Start. Danach findest du die Anleitung für deine Arbeit im vorhandenen Kundenguide. Das {c.brand}-Team bestätigt deine Konditionen und begleitet die Produktion.</p></div><ButtonLink href={url(`${c.slug}/guide`)} secondary>Übergabe & Kundenguide</ButtonLink></section>
    {!c.fictional && <div className="demo-note"><CircleHelp size={20} /><p>fomo ist eine Social-Trading-App. Die Zusammenarbeit umfasst Content über ein risikobehaftetes Thema. Trading-Gewinne werden nicht versprochen; Werbekennzeichnung und zulässige Aussagen müssen im Briefing geklärt sein.</p></div>}
  </>;
}

type ApplicationData = { name: string; email: string; profile: string; language: string; availability: string; id: string };
function Application({ campaign: c }: { campaign: Campaign }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ApplicationData>({ name: 'Alex Beispiel', email: 'alex@example.com', profile: 'https://example.com/profil', language: 'Deutsch', availability: 'Nach Absprache', id: '' });
  useEffect(() => { const saved = read<ApplicationData | null>(`application:${c.slug}`, null); if (saved?.id) setData(saved); }, [c.slug]);
  function field(key: keyof ApplicationData, value: string) { setData(d => ({ ...d, [key]: value })); }
  return <>
    <a href={url(c.slug)} className="demo-back"><ChevronLeft size={16} />Zur Einladung</a>
    <div className="demo-form-layout">
      <aside>
        <Label>{c.brand} × UGC VZ · Deine Einladung</Label>
        <h1>Deine Einladung.<br />Dein nächster Schritt.</h1>
        <p className="demo-lead">UGC VZ hat dich für diese Kooperation ausgewählt. Prüfe kurz deine Angaben und sag uns, wann du starten kannst. Dein Profil und deine Arbeitsprobe musst du nicht erneut einreichen.</p>
        <ol className="demo-form-progress">
          <li><span><Check size={15} /></span>Von UGC VZ ausgewählt</li>
          <li aria-current={!data.id ? 'step' : undefined}><span>{data.id ? <Check size={15} /> : '2'}</span>Angaben & Verfügbarkeit bestätigen</li>
          <li aria-current={data.id ? 'step' : undefined}><span>3</span>Übergabe an {c.brand}</li>
        </ol>
        <div className="demo-note"><LockKeyhole size={18} /><p>Interne Vorschau mit einem eingeladenen Beispielprofil. Bitte nur Beispieldaten verwenden. Es werden keine Zusage und keine E-Mail verschickt.</p></div>
      </aside>
      <section className="demo-form-card" aria-label="Einladung bestätigen">
        {!data.id || editing ? <form onSubmit={e => { e.preventDefault(); const value = { ...data, id: `DEMO-${c.slug.toUpperCase()}-NEU` }; write(`application:${c.slug}`, value); setData(value); setEditing(false); }}>
          <Label>Einmal bestätigen, dann weiter</Label>
          <h2>Stimmen deine Angaben noch?</h2>
          <p>Die vorhandenen Angaben sind in dieser Vorschau vorausgefüllt. Aktualisiere nur, was sich geändert hat.</p>
          <div className="demo-input-grid">
            <label>Name<input required maxLength={80} value={data.name} onChange={e => field('name', e.target.value)} autoComplete="off" /></label>
            <label>E-Mail<input required type="email" maxLength={160} value={data.email} onChange={e => field('email', e.target.value)} autoComplete="off" /></label>
          </div>
          <label>Dein hinterlegtes Social-Profil<input required type="url" pattern="https?://.*" maxLength={400} value={data.profile} onChange={e => field('profile', e.target.value)} /></label>
          <label>Posting-Sprache<select value={data.language} onChange={e => field('language', e.target.value)}><option value="">Später ergänzen</option><option>Deutsch</option><option>Englisch</option><option>Deutsch und Englisch</option></select></label>
          <label>Wann kannst du starten?<select value={data.availability} onChange={e => field('availability', e.target.value)}><option value="">Später ergänzen</option><option>Nach Absprache</option><option>In etwa zwei Wochen</option><option>Im nächsten Monat</option></select></label>
          <label className="demo-checkbox"><input type="checkbox" required /><span>Ich möchte den nächsten Schritt mit {c.brand} gehen. Den täglichen Aufwand und die Projektaccounts habe ich mir angesehen. Die endgültigen Konditionen und meine Aufnahme bestätigt das {c.brand}-Team.</span></label>
          <p className="demo-caption">In dieser Demo wird deine Bestätigung nur in diesem Browser-Tab gespeichert.</p>
          <div className="demo-actions"><button className="demo-button" type="submit">Angaben bestätigen & weiter<ArrowRight size={17} /></button></div>
        </form> : <div className="demo-success" role="status">
          <span className="demo-success-icon"><Check size={30} /></span><Label>Einladung angenommen · simuliert</Label>
          <h2>Weiter geht’s, {data.name.split(' ')[0]}.</h2>
          <p>Deine Angaben sind in der Demo bestätigt. Als Nächstes bereitest du die Übergabe an {c.brand} vor. Flo hilft bei offenen Fragen; das {c.brand}-Team bestätigt deine Konditionen und Aufnahme vor dem Produktionsstart.</p>
          <div className="demo-receipt"><span>Vermittlungs-ID</span><strong>{data.id}</strong><span>Status</span><strong>Einladung angenommen · simuliert</strong></div>
          {!data.language || !data.availability ? <p className="demo-note">Noch offen: {[!data.language && 'Posting-Sprache', !data.availability && 'Verfügbarkeit'].filter(Boolean).join(', ')}. Du kannst das später in deinem Konto ergänzen.</p> : <ButtonLink href={url(`${c.slug}/guide`)}>Zur Übergabe an {c.brand}</ButtonLink>}
          <div className="demo-actions"><button className="demo-button secondary" onClick={() => setEditing(true)}>Angaben bearbeiten</button><ButtonLink href={url('konto')}>Meine Kooperationen</ButtonLink></div>
          <a className="demo-text-link" href={url('tracking')}>Status im Demo-Board ansehen <ArrowUpRight size={15} /></a>
        </div>}
      </section>
    </div>
  </>;
}

function Guide({ campaign: c }: { campaign: Campaign }) {
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => { const saved = read<unknown>(`guide:${c.slug}`, []); if (Array.isArray(saved)) setDone(saved.filter(i => Number.isInteger(i) && i >= 0 && i < c.guide.length)); }, [c.slug, c.guide.length]);
  function toggle(i: number) { const next = done.includes(i) ? done.filter(n => n !== i) : [...done, i]; setDone(next); write(`guide:${c.slug}`, next); }
  return <>
    <a className="demo-back" href={url(c.slug)}><ChevronLeft size={16} />Zur Kooperation</a>
    <section className="demo-guide-heading"><div><Label>{c.brand} · Übergabe & Start</Label><h1>Gut vorbereitet.<br /><span className="gradient-text">Beim richtigen Team.</span></h1><p className="demo-lead">UGC VZ begleitet dich bis zur bestätigten Aufnahme. Die operative Anleitung und Betreuung übernimmt danach das {c.brand}-Team.</p></div><div className="demo-progress-card"><span>{done.length}<small> / {c.guide.length}</small></span><p>Übergabeschritte in der Vorschau</p><progress value={done.length} max={c.guide.length} aria-label="Onboarding-Fortschritt" /></div></section>
    <div className="demo-guide-list">{c.guide.map((item, i) => <article className={done.includes(i) ? 'done' : ''} key={item.title}><button type="button" onClick={() => toggle(i)} aria-pressed={done.includes(i)} aria-label={`${item.title}: ${done.includes(i) ? 'wieder öffnen' : 'als erledigt markieren'}`}>{done.includes(i) ? <Check size={22} /> : `0${i + 1}`}</button><div><Badge>{item.owner}</Badge><h2>{item.title}</h2><p>{item.text}</p></div></article>)}</div>
    {c.handoff && <HandoffResources campaign={c} />}
    <div className="demo-note"><ShieldCheck size={20} /><p>Das Abhaken zeigt nur deinen simulierten Fortschritt. Die Aufnahme bestätigt das {c.brand}-Team separat zur Vermittlungs-ID. Das Öffnen des Kundenguides zählt nicht als Übergabe.</p></div>
    <div className="demo-actions"><ButtonLink href={url('tracking')}>Übergabe im Board ansehen</ButtonLink><ButtonLink href={url(c.slug)} secondary>Briefing erneut ansehen</ButtonLink></div>
  </>;
}

function HandoffResources({ campaign: c }: { campaign: Campaign }) {
  const [id, setId] = useState(`DEMO-${c.slug.toUpperCase()}-NEU`);
  const [feedback, setFeedback] = useState('');
  useEffect(() => { const application = read<ApplicationData | null>(`application:${c.slug}`, null); if (application?.id) setId(application.id); }, [c.slug]);
  if (!c.handoff) return null;
  const template = `Hallo ${c.brand}-Team,\nich komme über UGC VZ / Florian Runge.\nMeine Vermittlungs-ID: ${id}\nMein Name: [Name]\nMeine Posting-Sprache: [Sprache]\nMein Benutzername im Programm: [Benutzername]\nMeine vereinbarte Vergütung: [Betrag oder noch offen]\nBitte bestätigt meine Aufnahme und die Zuordnung zu UGC VZ.`;
  return <section className="demo-handoff-resources">
    <article><Label>Operatives Onboarding · {c.brand}</Label><h2>Deine Kommandozentrale ist schon da.</h2><p>Im Kundenguide findest du die Anleitung für deinen Start, Content-Vorgaben und Informationen zur Bezahlung.</p><p><strong>Kontakt dort:</strong> {c.handoff.contact}. Bei Fragen zu Einladung und Übergabe bleibt Flo dein UGC-VZ-Kontakt.</p><a className="demo-button" href={c.handoff.guideUrl} target="_blank" rel="noopener noreferrer">Kundenguide öffnen<ArrowUpRight size={17} /></a><small>Öffnet die echte Kundenseite in einem neuen Tab. Dort angegebener Stand: {c.handoff.sourceDate}.</small></article>
    <article><Label>Vorschlag für die Zuordnung</Label><h2>Damit deine Herkunft klar bleibt.</h2><p>Die Vermittlungs-ID verbindet deine Einladung mit dem Kunden-Ticket. Diese Zuordnung und Bestätigung muss {c.brand} vor dem Pilot mit uns vereinbaren.</p><pre>{template}</pre><button type="button" className="demo-button secondary" onClick={async () => { try { await navigator.clipboard.writeText(template); setFeedback('Vorlage kopiert. Es wurde nichts versendet.'); } catch { setFeedback('Bitte den Text oben markieren und kopieren.'); } }}>Ticket-Vorlage kopieren<ClipboardList size={16} /></button><p role="status" className="demo-feedback">{feedback}</p><small>Ein späterer Empfehlungslink für geworbene App-Nutzer ist davon getrennt. Er ersetzt nicht den Nachweis, dass UGC VZ dich vermittelt hat.</small></article>
  </section>;
}

function Tracking({ campaigns, seed }: { campaigns: Campaign[]; seed: DemoCandidate[] }) {
  const [rows, setRows] = useState(seed);
  const [campaign, setCampaign] = useState('fomo');
  const [stage, setStage] = useState('Alle Status');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const saved = read<Record<string, Stage>>('stages', {});
    const extra = campaigns.flatMap(c => { const a = read<ApplicationData | null>(`application:${c.slug}`, null); return a?.id ? [{ id: a.id, name: a.name, initials: a.name.split(' ').map(s => s[0]).join('').slice(0, 2), topic: 'Einladung in der Demo angenommen', campaign: c.slug, source: 'Persönliche Einladung', stage: 'Einladung angenommen' as Stage, evidence: 'Im aktuellen Browser-Tab simuliert.', next: 'Startdetails und Übergabe abstimmen' }] : []; });
    setRows([...seed, ...extra].map(r => ({ ...r, stage: saved && stages.includes(saved[r.id]) ? saved[r.id] : r.stage })));
  }, [campaigns, seed]);
  const relevant = rows.filter(r => r.campaign === campaign);
  const filtered = relevant.filter(r => stage === 'Alle Status' || r.stage === stage);
  const active = rows.find(r => r.id === selected);
  const brand = campaigns.find(c => c.slug === campaign)!;
  const countAtLeast = (minimum: number) => relevant.filter(r => r.stage !== 'Abgesagt' && stages.indexOf(r.stage) >= minimum).length;
  function move(id: string, nextStage: Stage) {
    const nextRows = rows.map(r => r.id === id ? { ...r, stage: nextStage } : r);
    setRows(nextRows); write('stages', Object.fromEntries(nextRows.map(r => [r.id, r.stage])));
    const history = read<Record<string, string[]>>('history', {});
    write('history', { ...history, [id]: [...(history?.[id] || []), `${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · ${nextStage} · simuliert`] });
    setMessage(`${id}: „${nextStage}“ simuliert. Es wurde nichts versendet.`);
  }
  const nextAction: Partial<Record<Stage, [Stage, string]>> = { Vorgeschlagen: ['Eingeladen', 'Einladung simulieren'], Eingeladen: ['Einladung angenommen', 'Annahme simulieren'], 'Einladung angenommen': ['Start geklärt', 'Startdetails klären'], 'Start geklärt': ['Übergabe offen', 'Übergabe simulieren'], 'Übergabe offen': ['Bestätigt', 'Kundenbestätigung simulieren'] };
  return <><section className="demo-board-heading"><div><Label>Interne Arbeitsansicht</Label><h1>Von passend<br />zu <span className="gradient-text">bestätigt.</span></h1><p className="demo-lead">Ein gemeinsamer Blick auf Einladungen, Zusagen und die Übergabe an die Marke.</p></div><div className="demo-board-controls"><label>Kampagne<select aria-label="Kampagne" value={campaign} onChange={e => { setCampaign(e.target.value); setSelected(null); setMessage(''); }}>{campaigns.map(c => <option key={c.slug} value={c.slug}>{c.brand}{c.fictional ? ' · fiktiv' : ' · Pilot'}</option>)}</select></label><Badge>Nur Beispieldaten</Badge></div></section>
    <div className="demo-metrics">{[['Profile im Demo-Pool', relevant.length, 'Fiktive Kontakte'], ['Einladung angenommen', countAtLeast(2), 'Zusagen oder weiter'], ['Übergabe offen', relevant.filter(r => r.stage === 'Übergabe offen').length, 'Bestätigung fehlt'], ['Aufnahme bestätigt', relevant.filter(r => r.stage === 'Bestätigt').length, 'Simulierter Nachweis']].map(([title, value, caption], i) => <div key={String(title)} className={i === 3 ? 'highlight' : ''}><span>{title}</span><strong>{value}</strong><small>{caption}</small></div>)}</div>
    <div className="demo-board-panel"><div className="demo-board-title"><div><h2>{brand.brand} · Creator-Pipeline</h2><p>Beispielkontakte auswählen und den nächsten Schritt durchspielen.</p></div><label><span className="sr-only">Nach Status filtern</span><select value={stage} onChange={e => setStage(e.target.value)}>{['Alle Status', ...stages].map(s => <option key={s}>{s}</option>)}</select></label></div><div className="demo-table-scroll"><table><thead><tr><th>Creator / Arbeitsprobe</th><th>Herkunft</th><th>Status</th><th>Vermittlungs-ID</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{filtered.map(r => <tr key={r.id} className={selected === r.id ? 'selected' : ''}><td><div className="demo-person"><span className="demo-avatar">{r.initials}</span><span><strong>{r.name}</strong><small>{r.topic}</small></span></div></td><td>{r.source}</td><td><Badge green={r.stage === 'Bestätigt'}>{r.stage}</Badge></td><td className="demo-mono">{r.id}</td><td><button type="button" onClick={() => { setSelected(r.id); setMessage(''); }} aria-label={`Details zu ${r.name}`}><ArrowUpRight size={19} /></button></td></tr>)}</tbody></table>{!filtered.length && <p className="demo-empty">Für diesen Status gibt es in der Demo noch keine Profile.</p>}</div></div>
    {active && <section className="demo-contact-detail" aria-label={`Details zu ${active.name}`}><div><Label>{active.id} · Beispieldatensatz</Label><h2>{active.name}</h2><p>{active.evidence}</p><p><strong>Aktueller Status:</strong> {active.stage}</p><p>{active.stage === 'Bestätigt' ? 'Kundenbestätigung wurde im Demo-Ablauf erfasst. Ein echter Nachweis würde bestätigende Person und Zeitpunkt enthalten.' : active.stage === 'Abgesagt' ? 'Keine weiteren Einladungen oder Erinnerungen.' : 'Nächster Schritt: ' + (nextAction[active.stage]?.[1] || active.next)}</p><div className="demo-actions">{nextAction[active.stage] && <button type="button" className="demo-button" onClick={() => move(active.id, nextAction[active.stage]![0])}>{nextAction[active.stage]![1]}<ArrowRight size={16} /></button>}{!['Bestätigt', 'Abgesagt'].includes(active.stage) && <button type="button" className="demo-button secondary" onClick={() => move(active.id, 'Abgesagt')}>Absage simulieren</button>}</div><p role="status" className="demo-feedback">{message}</p><ul className="demo-history">{(read<Record<string, string[]>>('history', {})?.[active.id] || []).map((entry, i) => <li key={i}>{entry}</li>)}</ul></div><div className="demo-mail-preview"><Label><Mail size={13} />Ansprache · Entwurf</Label><h3>Passt diese Kooperation zu dir?</h3><p>Hallo {active.name.split(' ')[0]},</p><p>wir möchten dich zur Creator-Kooperation mit {brand.brand} einladen. Hier findest du Aufgabe, Umfang und Vergütung.</p><p>Schau dir deine Einladung an. Wenn es für dich passt, bestätige direkt deine Angaben und Verfügbarkeit. Danach geht es zur Übergabe an das Team.</p><p>Viele Grüße<br />Flo · UGC VZ</p><span className="demo-caption">Vor echtem Versand: persönliche Passung, Bedingungen und Kontaktfreigabe prüfen. Kein automatischer Versand aus dieser Ansicht.</span></div></section>}
    <div className="demo-board-notes"><div><ShieldCheck size={22} /><h3>Was zählt als Übergabe?</h3><p>Die Marke bestätigt die Aufnahme zur Vermittlungs-ID. Ein Klick auf Discord bleibt ein eigener, früherer Schritt.</p></div><div><Users size={22} /><h3>Wo bleibt die Freigabe?</h3><p>Auswahl, Kontaktfreigabe und Konditionen werden geprüft. Der spätere Versand stoppt bei Antwort, angenommener Einladung, Absage oder Abmeldung.</p></div><div><FileText size={22} /><h3>Was ist hier echt?</h3><p>Die Oberfläche und der Ablauf. Alle Kontakte, Status und Kennzahlen sind Beispiele. Es gibt keine Verbindung zu Live-Kontakten.</p></div></div>
  </>;
}

function Presentation({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if ((event.target as HTMLElement)?.matches('input,textarea,select')) return; if (event.key === 'ArrowRight') setCurrent(i => Math.min(slides.length - 1, i + 1)); if (event.key === 'ArrowLeft') setCurrent(i => Math.max(0, i - 1)); };
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey);
  }, [slides.length]);
  return <div className="demo-presentation"><div className="demo-presentation-tools"><div><Label>Abstimmung · Flo & Gorden</Label><p>Konzept, Demo und offene Entscheidungen.</p></div><button type="button" className="demo-button secondary" onClick={() => window.print()}><Printer size={16} />PDF / Drucken</button></div><div className="demo-slide-stage">{slides.map((slide, i) => <section key={slide.label} className={`demo-slide ${i === current ? 'active' : ''} ${i === 0 ? 'cover' : ''}`} aria-hidden={i !== current}><div className="demo-slide-top"><span>UGC VZ / Kooperationen</span><span>{slide.label}</span></div><div className="demo-slide-body"><h1>{slide.title}</h1><p className="demo-slide-intro">{slide.intro}</p><div className="demo-slide-cards">{slide.cards.map(card => <div key={card.title}><h2>{card.title}</h2><p>{card.text}</p></div>)}</div></div><div className="demo-slide-bottom"><p>{slide.note}</p><span>{String(i + 1).padStart(2, '0')}</span></div></section>)}</div><div className="demo-slide-controls"><button type="button" className="demo-button secondary" onClick={() => setCurrent(i => i - 1)} disabled={current === 0}><ChevronLeft size={17} />Zurück</button><div className="demo-slide-dots" aria-label="Folie auswählen">{slides.map((slide, i) => <button type="button" key={slide.label} aria-label={`Folie ${i + 1}: ${slide.label}`} aria-current={i === current ? 'step' : undefined} onClick={() => setCurrent(i)} />)}</div><span className="demo-slide-count" aria-live="polite">{current + 1} / {slides.length}</span><button type="button" className="demo-button" onClick={() => setCurrent(i => i + 1)} disabled={current === slides.length - 1}>Weiter<ChevronRight size={17} /></button></div><div className="demo-note"><Sparkles size={19} /><p>Konzipiert mit unserem Vertriebstrainer: Positionierung, Pitch und überprüfbare Übergaben. Aussagen, Annahmen und Entscheidungen sind getrennt. Die Anwendung auf Creator-Vermittlung ist ein Vorschlag für den Pilot.</p></div><div className="demo-actions"><ButtonLink href={url()}>Creator-Demo öffnen</ButtonLink><ButtonLink href={url('tracking')} secondary>Kampagnenboard öffnen</ButtonLink></div></div>;
}

function DemoAccount() {
  const [data,setData]=useState<ApplicationData|null>(null);
  useEffect(()=>{setData(read<ApplicationData|null>('application:fomo',null));},[]);
  const missing=data?[!data.language&&'Posting-Sprache',!data.availability&&'Verfügbarkeit'].filter(Boolean):[];
  return <><p className="demo-eyebrow">Privates Creator-Konto · Beispieldaten</p><h1>Meine Kooperationen</h1><p className="demo-lead">Deine Einladung bleibt hier auffindbar. Im echten Konto werden Angaben dauerhaft gespeichert; diese Demo verwendet nur den aktuellen Browser-Tab.</p><section className="demo-apply-card my-8"><p className="demo-eyebrow">fomo × UGC VZ</p><h2>Deine Creator-Partnerschaft</h2><p className="demo-lead">{data?.id ? missing.length ? 'Einladung angenommen · Angaben ergänzen' : 'Bereit zur Übergabe · simuliert' : 'Persönliche Einladung · noch offen'}</p>{missing.length>0&&<p className="demo-note">Noch offen: {missing.join(', ')}</p>}<div className="demo-actions"><ButtonLink href={url('fomo/start')}>{data?.id?'Angaben ansehen & ergänzen':'Einladung bestätigen'}</ButtonLink>{data?.id&&!missing.length&&<ButtonLink href={url('fomo/guide')} secondary>Kundenguide & Übergabe</ButtonLink>}</div></section><div className="demo-note"><LockKeyhole size={18}/><p>Im echten Ablauf bleibt die Kooperation auch nach Ablauf des 14-Tage-Links im Konto erhalten. Ein neuer Konto-Login ermöglicht die Fortsetzung. Diese Vorschau ist nicht mit echten Profilen verbunden.</p></div></>;
}
function DemoInvitation() {
  const [state,setState]=useState('active');
  return <><p className="demo-eyebrow">Einladung aus der Mail · Simulation</p><h1>Ein Link. Dein nächster Schritt.</h1><p className="demo-lead">Jeder eingeladene Creator bekommt einen eigenen Link. Er ist 14 Tage ab Versand gültig und führt zur zugeordneten Kampagne. Erst die ausdrückliche Bestätigung zählt als Zusage.</p><div className="demo-actions">{[['active','Gültiger Link'],['expired','Link abgelaufen'],['used','Bereits eingelöst']].map(([v,label])=><button type="button" className={state===v?'demo-button':'demo-button secondary'} key={v} onClick={()=>setState(v)} aria-pressed={state===v}>{label}</button>)}</div><section className="demo-apply-card my-8" aria-live="polite"><h2>{state==='active'?'Deine Einladung zu fomo':state==='expired'?'Dieser Einladungslink ist abgelaufen.':'Dieser Link wurde bereits eingelöst.'}</h2><p className="demo-lead">{state==='active'?'Die Kampagnenseite erklärt Aufgabe, Vergütung und deine Verdienstperspektive. Beim nächsten Schritt werden deine vorhandenen Angaben übernommen.':'Deine Kooperation und gespeicherten Angaben bleiben erhalten. Über dein privates Konto kannst du weitermachen.'}</p><div className="demo-actions"><ButtonLink href={url(state==='active'?'fomo':'konto')}>{state==='active'?'Einladung ansehen':'Im Demo-Konto fortsetzen'}</ButtonLink></div></section><div className="demo-note"><p>Diese Schalter simulieren Linkzustände. Es werden keine echten Zugangstokens erstellt und keine Mails versendet. Die interne Verwaltung hat einen eigenen Zugang; ein Creator-Link öffnet kein Kampagnenboard.</p></div></>;
}
