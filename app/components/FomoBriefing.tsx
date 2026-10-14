import './fomo-brief.css';
import { FOMO, earningsExamples, type Variant } from '../lib/collaborations/fomo-config';
import DemoVideo from './DemoVideo';

// Unterer Teil der fomo-Kampagnenseite nach Flos Content-Paket (Kapitel 3 bis 8).
// Copy wörtlich aus dem Paket; Zahlen ausschließlich aus FOMO (fomo-config.ts).
const M = '/media/fomo/';
const F = FOMO.fixumShort;

type Copy = {
  kicker: string; claim: string; sub: string; before: string[]; after: string[];
  benefits: [string, string, string][]; photos: [string, string];
  step1: string; earnIntro: string; earnExtra?: string; faqSwap: [string, string][]; faqExtra: [string, string][];
  ctaTitle: string; videos: string[];
};

const COPY: Record<Variant, Copy> = {
  w: {
    kicker: 'Für Creatorinnen, die mehr wollen als den nächsten Einzelauftrag',
    claim: 'Schluss mit Einmal-Jobs. Dein Content zahlt jeden Monat.',
    sub: `Als UGC Creatorin kennst du das: pitchen, warten, ein Video, eine Rechnung, und dann wieder von vorn. Mit der fomo Partnerschaft bekommst du ein festes Fixum von ${F} im Monat und eine lebenslange Provision von 25 % bis 50 % auf alle, die über dich zur App kommen. Ein Video am Tag, gedreht wo du willst: zu Hause, in Lissabon oder auf Bali.`,
    before: ['Einzelaufträge ohne Planbarkeit', 'Jede Woche neu pitchen', 'Bezahlt wird einmal, dann ist Schluss'],
    after: ['Festes Fixum jeden Monat, vorab vereinbart', 'Ein klarer Rhythmus: ein Video pro Tag', 'Provision, die weiterläuft, solange deine Geworbenen traden'],
    benefits: [
      ['✨', 'Dein eigenes Einkommen', `Das Fixum steht fest, bevor du loslegst: ${F} im Monat. Du weißt, womit du planen kannst, und bist von niemandem abhängig.`],
      ['🌍', 'Arbeiten von überall', 'Smartphone und CapCut genügen. Ob Berlin, Bali oder Dubai: Du drehst, wann und wo es für dich passt. Digital Nomad, Auswandern oder einfach das Sofa, deine Entscheidung.'],
      ['🌱', 'Etwas, das bleibt', `Deine Provision startet bei 25 % und steigt mit der Zeit bis 50 %. Und selbst wenn du irgendwann aufhörst, behältst du lebenslang ${FOMO.commissionKeep} % auf alle, die du schon geworben hast.`],
    ],
    photos: ['Junge Frau filmt sich mit Smartphone auf Stativ, echte Wohnung, natürliches Licht, kein Studio', 'Frau mit Laptop oder Smartphone an einem Ort mit Reisegefühl (Strand, Café im Süden), authentisch, nicht gestellt'],
    step1: 'Du prüfst deine Angaben und bestätigst. Dauert zwei Minuten.',
    earnIntro: 'Planbar statt hoffen: So setzt sich dein Verdienst zusammen.',
    faqSwap: [['Kann ich das von unterwegs machen?', 'Ja. Smartphone und Internet genügen. Wo du drehst, entscheidest du.']],
    faqExtra: [],
    ctaTitle: 'Bereit für ein Einkommen, das nicht nach einem Video endet?',
    videos: ['17b5c5fb_erste-stunde-trading', 'f0668244_zufaellige-side-hustles', '28856891_mama-traden', 'c82a16c0_hook-demo-2'],
  },
  m: {
    kicker: 'Für Creator, die aus Reichweite echtes Geld machen wollen',
    claim: 'Schluss mit Einmal-Jobs. Bau dir ein Einkommen, das weiterläuft.',
    sub: `Ein Auftrag, ein Video, eine Zahlung, und dann wieder Akquise. Hier bekommst du ein festes Fixum von ${F} im Monat plus 25 % bis 50 % lebenslange Provision auf alle, die über dich zu fomo kommen. Ein Video am Tag, dreimal gepostet. Der Rest arbeitet für dich.`,
    before: ['Bezahlt pro Video, dann ist Schluss', 'Jeden Monat bei null anfangen', 'Deine Reichweite verdient für andere'],
    after: ['Fester Betrag jeden Monat', 'Provision, die mit der Zeit von 25 % auf 50 % steigt', 'Deine Geworbenen bleiben dir, lebenslang'],
    benefits: [
      ['💵', 'Fester Betrag jeden Monat', `${F} Fixum, vereinbart bevor du startest. Nach der Testphase wird neu verhandelt, bei den meisten geht es nach oben.`],
      ['📈', 'Provision, die mitwächst', 'Start bei 25 %, nach 12 Monaten 50 % der Gebühren deiner Geworbenen. Nicht für ein paar Wochen, sondern lebenslang.'],
      ['🏆', 'Aufstieg nach Leistung', 'Ab 500 oder 1.000 Empfehlungen geht es auf den Gold Server: Vollzeit Retainer und Coaching. Die Top Creator posten 3 bis 4 Mal am Tag.'],
    ],
    photos: ['Junger Mann dreht ein Video mit Smartphone, Alltagssetting (Auto, Wohnung, Straße)', 'Creator am Schreibtisch mit Smartphone und Dashboard auf dem Bildschirm'],
    step1: 'Angaben checken, bestätigen, fertig. Zwei Minuten.',
    earnIntro: 'Klare Zahlen: So setzt sich dein Verdienst zusammen.',
    earnExtra: 'Zum Vergleich: Viele Affiliate Programme zahlen Provision nur für begrenzte Zeit. Bei fomo läuft sie weiter, solange deine Geworbenen traden.',
    faqSwap: [['Geht das neben meinem Job?', 'Ja. Ein Video pro Tag, dasselbe Video auf drei Plattformen. Viele drehen mehrere Videos am Stück vor.']],
    faqExtra: [['Muss ich auf Englisch posten?', 'Deine Posting Sprache stimmen wir im Onboarding ab. Empfehlungen aus den USA sind mehr wert, im Guide steht, wie du mit englischen Untertiteln eine US Zielgruppe aufbaust.']],
    ctaTitle: 'Bereit, dass deine Videos weiterzahlen?',
    videos: ['42adbe1b_was-ist-fomo-1', '3bba8f7d_day-in-the-life-1', 'd898ed40_ferrari', 'b2e12c49_sechs-monate'],
  },
  n: {
    kicker: 'Für Creator, die mehr wollen als den nächsten Einzelauftrag',
    claim: 'Schluss mit Einmal-Jobs. Dein Content zahlt jeden Monat.',
    sub: `Festes Fixum von ${F} im Monat, dazu 25 % bis 50 % lebenslange Provision auf alle, die über dich zu fomo kommen. Ein Video am Tag, auf drei Plattformen, in deinem Stil.`,
    before: ['Einzelaufträge ohne Planbarkeit', 'Jede Woche neu pitchen', 'Bezahlt wird einmal, dann ist Schluss'],
    after: ['Festes Fixum jeden Monat, vorab vereinbart', 'Ein klarer Rhythmus: ein Video pro Tag', 'Provision, die weiterläuft, solange deine Geworbenen traden'],
    benefits: [
      ['💵', 'Planbar', 'Fixum vorab fest vereinbart, alle 30 Tage ausgezahlt.'],
      ['📱', 'Flexibel', 'Smartphone genügt, du entscheidest wann und wo.'],
      ['🌱', 'Langfristig', `Provision lebenslang, ${FOMO.commissionKeep} % bleiben auch, wenn du aufhörst.`],
    ],
    photos: ['Zwei Creator (Frau und Mann) drehen gemeinsam, locker', ''],
    step1: 'Du prüfst deine Angaben und bestätigst. Dauert zwei Minuten.',
    earnIntro: 'Planbar statt hoffen: So setzt sich dein Verdienst zusammen.',
    faqSwap: [['Kann ich das von unterwegs machen?', 'Ja. Smartphone und Internet genügen. Wo du drehst, entscheidest du.']],
    faqExtra: [],
    ctaTitle: 'Bereit für ein Einkommen, das nicht nach einem Video endet?',
    videos: ['42adbe1b_was-ist-fomo-1', '5c98f637_walkthrough-camcorder', 'f0668244_zufaellige-side-hustles', '8cfe52c9_chatgpt'],
  },
};

const TITLES: Record<string, string> = {
  '17b5c5fb_erste-stunde-trading': 'Meine erste Trading Stunde', 'f0668244_zufaellige-side-hustles': 'Tag 3: Zufällige Side Hustles',
  '28856891_mama-traden': 'Mama das Traden beibringen', 'c82a16c0_hook-demo-2': 'Hook Beispiel', '42adbe1b_was-ist-fomo-1': 'Ist fomo legit?',
  '3bba8f7d_day-in-the-life-1': 'Ein Tag in meinem Leben', 'd898ed40_ferrari': 'Tag X: Aus X einen Ferrari machen',
  'b2e12c49_sechs-monate': 'Sechs Monats Transformation', '5c98f637_walkthrough-camcorder': 'Walkthrough durch die App', '8cfe52c9_chatgpt': 'ChatGPT Format',
};

const faqBase = (contact: string): [string, string][] => [
  ['Brauche ich Krypto Wissen?', 'Nein. Du brauchst ein Gespür für Hooks und gute Videos. Was fomo kann und wie du darüber sprichst, lernst du im Onboarding, mit fertigen Skripten aus der Content Bibliothek.'],
  ['Brauche ich viele Follower?', 'Nein. Du startest mit neuen Accounts nur für fomo. Dein privates Profil bleibt deins.'],
  ['Wie viel Zeit kostet das?', 'Ein Video pro Tag. Du postest es auf TikTok, Instagram und Facebook, es darf dreimal dasselbe Video sein. Ein Tag zählt, wenn alle drei Kanäle bespielt sind. X kannst du zusätzlich nutzen.'],
  ['SWAP', ''],
  ['Wie und wann werde ich bezahlt?', 'Das Fixum kommt alle 30 Tage in Krypto an deine fomo Wallet, die Testphase zahlt die Hälfte davon. Deine Provision siehst du live im Creator Dashboard. Wie bei jedem Nebenverdienst kümmerst du dich selbst um die Versteuerung.'],
  ['Was kostet mich das?', 'Keine Gebühren, kein Abo. Die einzige mögliche Ausgabe nennen wir offen: Viele kaufen für TikTok einen Account mit 1.000 Followern für 60 $, weil TikTok den Link in der Bio erst ab 1.000 Followern freischaltet. Das ist optional.'],
  ['Was, wenn die Testphase nicht klappt?', 'Du bist nicht raus. Du kannst ohne Posting Pflicht mit deinem Link weiterverdienen oder eine neue Testphase anfragen.'],
  ['Was, wenn ich aufhöre?', `Deine Provision auf alle bisherigen Geworbenen läuft weiter, dann mit ${FOMO.commissionKeep} %.`],
  ['Was hat UGC VZ damit zu tun?', 'UGC VZ hat dich für diese Kooperation ausgewählt und begleitet dich bis zum Start bei fomo. Dein UGC VZ Profil bleibt aktiv, auch für andere Kampagnen.'],
  ['Was passiert mit meinen Daten?', `Erst wenn du zustimmst, geben wir Name, E-Mail, Social Profile und deine Vermittlungs ID an fomo weiter. Mehr dazu in der Datenschutzerklärung. Fragen an ${contact}.`],
];

export function Placeholder({ text, square = false, inline = false }: { text: string; square?: boolean; inline?: boolean }) {
  return <div className={`fb-placeholder ${square ? 'square' : ''} ${inline ? 'inline' : ''}`} role="img" aria-label={`Platzhalter: ${text}`}><span>Platzhalter</span><p>{text}</p></div>;
}

export const RISK_LINE = 'Krypto ist riskant: Kurse schwanken stark, Verluste sind möglich. Deine Provision hängt davon ab, wie viel deine Geworbenen traden, und kann schwanken. Beispielergebnisse sind keine Garantie.';

export default function FomoBriefing({ variant, contactName, contactEmail, memberId, cta }: { variant: Variant; contactName: string; contactEmail: string; memberId?: string; cta?: React.ReactNode }) {
  const v = COPY[variant];
  const contact = FOMO.contactMail || contactEmail;
  const faq = faqBase(contact).flatMap(([q, a]) => q === 'SWAP' ? v.faqSwap : [[q, a] as [string, string]]).concat(v.faqExtra);
  const steps = [['Ja sagen', v.step1], ['Kurzes Gespräch', `Wir stimmen dein Fixum ab, meist ${F} für die ersten 30 Tage.`], ['Onboarding auf Discord', `Du nennst deine Vermittlungs ID, richtest neue Accounts auf TikTok, Instagram und Facebook ein und bist in ${FOMO.startTime} startklar.`], ['Testphase', `${FOMO.testPosts}. Dafür gibt es schon 50 % deines Fixums, also ${FOMO.fixumTest}.`], ['Dein Rhythmus', `Ein Video pro Tag, ${FOMO.postsMonth} im Monat. Fixum alle 30 Tage, Provision live im Creator Dashboard.`]];
  const max = FOMO.commissionSteps[FOMO.commissionSteps.length - 1][1];
  return <div className="fomo-brief">
    <section className="fb-proof" aria-label="Zahlen">
      {FOMO.proof.map(([icon, n, t]) => <div key={t}><span aria-hidden="true">{icon}</span><b>{n}</b><small>{t}</small></div>)}
      <p className="fb-fine">Quellen: fomo, Index Ventures, Fortune, X. Stand Oktober 2026.</p>
    </section>

    <section className="fb-sec">
      <p className="fb-k">{v.kicker}</p><h2>{v.claim}</h2><p className="fb-lead">{v.sub}</p>
      <div className="fb-compare">
        <div><h3>Bisher</h3><ul>{v.before.map(t => <li key={t}><span aria-hidden="true">✕</span>{t}</li>)}</ul></div>
        <div className="good"><h3>Mit fomo</h3><ul>{v.after.map(t => <li key={t}><span aria-hidden="true">✓</span>{t}</li>)}</ul></div>
      </div>
    </section>

    <section className="fb-sec fb-split">
      <div className="fb-cards">{v.benefits.map(([e, h, p]) => <div key={h}><span aria-hidden="true">{e}</span><h3>{h}</h3><p>{p}</p></div>)}</div>
      <Placeholder text={v.photos[0]} />
    </section>

    <section className="fb-sec"><p className="fb-k">Beispiele</p><h2>So sehen fomo Videos aus.</h2>
      <div className="fb-videos">{v.videos.map(id => <DemoVideo key={id} id={id} title={TITLES[id]} src={`${M}${id}.mp4`} poster={`${M}${id}.jpg`} memberId={memberId} variant={variant} />)}</div>
    </section>

    <section className="fb-sec"><p className="fb-k">So läuft es</p><h2>In fünf Schritten von der Einladung zum laufenden Einkommen.</h2>
      <ol className="fb-steps">{steps.map(([h, p], i) => <li key={h}><b>{i + 1}</b><div><h3>{h}</h3><p>{p}</p></div></li>)}</ol>
    </section>

    <section className="fb-sec" id="fb-verdienst"><p className="fb-k">Verdienst</p><h2>{v.earnIntro}</h2>
      <div className="fb-money">
        <div><small>Fixum</small><b>{FOMO.fixumRange}</b><p>Fest vereinbart, bevor du startest. Nach der Testphase wird neu verhandelt, bei den meisten geht es nach oben. Ausgezahlt alle 30 Tage an deine fomo Wallet.</p></div>
        <div><small>Testphase</small><b>{FOMO.fixumTest}</b><p>Die Hälfte deines Fixums, sobald du 15 Posts geschafft hast. Du hast 21 Tage Zeit, also 6 Tage Puffer.</p></div>
      </div>
      <figure className="fb-ladder"><figcaption><small>Lebenslange Provision</small><b>25 % bis 50 %</b>Du bekommst einen Anteil an den Trading Gebühren jeder Person, die über deinen Link kommt.</figcaption>
        <div>{FOMO.commissionSteps.map(([mo, p]) => <div key={mo}><span>{p} %</span><i style={{ height: `${(p / max) * 100}%` }} /><small>{mo === 0 ? 'Start' : `${mo} Mon.`}</small></div>)}</div>
      </figure>
      <div className="fb-example"><h3>Rechenbeispiel aus echten Dashboards</h3>
        <p>In zwei echten Creator Dashboards brachte jede geworbene Person im Schnitt rund 7,50 $ bis 11 $ Gebühren.</p>
        <ul>{earningsExamples().map(e => <li key={e.people}>{e.people.toLocaleString('de-DE')} Geworbene × {e.rate} % ≈ <b>{e.label.replace('rund ', '')}</b> Provision</li>)}</ul>
        <p>Dazu kommt jeden Monat dein Fixum.</p>
        <p className="fb-fine"><em>Rechenbeispiel aus echten Dashboards, keine Garantie. Wie viel du verdienst, hängt von deinen Videos und deinen Geworbenen ab.</em></p>
      </div>
      {v.earnExtra && <p className="fb-note">{v.earnExtra}</p>}
      <p className="fb-honest">Das Fixum ist sicher vereinbart. Die Provision schwankt, weil sie davon abhängt, wie viel deine Geworbenen traden.</p>
    </section>

    <section className="fb-sec"><h2 className="fb-h3">Echte Zahlen aus dem fomo Creator Dashboard.</h2>
      <div className="fb-shots">
        <figure><img loading="lazy" src={`${M}e922d7a9_damon_one.webp`} alt="Creator Dashboard: 100.063,17 $ verdient, 22.800 geworbene Nutzer" /><figcaption><b>100.063 $</b> Gesamtprovision · 22.800 Geworbene · 40 % Satz</figcaption></figure>
        <figure><img loading="lazy" src={`${M}c0dc1e95_IMG_4284.webp`} alt="Creator Dashboard: 67.375,32 $ verdient, 17.893 geworbene Nutzer" /><figcaption><b>67.375 $</b> Gesamtprovision · 17.893 Geworbene · 50 % Satz</figcaption></figure>
        <div className="fb-wins"><b>+618,49 $</b><b>+1.000,83 $</b><b>1.009 Empfehlungen</b><small>Wins aus dem Creator Discord</small></div>
      </div>
      <p className="fb-honest">Das sind Top Ergebnisse, nicht der Durchschnitt. Sie zeigen, was möglich ist, nicht was garantiert ist.</p>
    </section>

    {v.photos[1] && <section className="fb-sec fb-photo-row"><Placeholder text={v.photos[1]} /></section>}

    <section className="fb-sec"><p className="fb-k">Was du mitbringst</p><h2>Passt das zu dir?</h2>
      <ul className="fb-checks">{['Erfolg mit Short Form: Du hattest schon Videos mit hoher Reichweite.', 'Gesicht vor der Kamera: Du zeigst dich, das schafft Vertrauen.', 'CapCut oder TikTok Editor: nativ, sauber, nicht überproduziert.', `${FOMO.postsMonth} Posts im Monat: ein Video pro Tag auf TikTok, Instagram und Facebook. Dasselbe Video ist erlaubt.`, '18 Jahre oder älter.'].map(t => <li key={t}>{t}</li>)}</ul>
    </section>

    <section className="fb-sec"><p className="fb-k">Vertrauen</p><h2>Wer hinter dem Programm steht</h2>
      <div className="fb-cards four">{[['🏢', 'fomo, New York', 'Gegründet 2025. Rund 94 Mio. $ Funding, darunter eine Series B über 75 Mio. $ unter Führung von Index Ventures, mit Union Square Ventures und Benchmark.'], ['🤝', 'UGC VZ', 'Das kostenlose Verzeichnis für UGC Creator und Marken. Wir haben dich ausgewählt und begleiten dich bis zum Start.'], ['🛡️', 'Transparente Auszahlung', 'Fixum alle 30 Tage an deine fomo Wallet, Provision live im Creator Dashboard.'], ['🧾', 'Keine versteckten Kosten', 'Keine Gebühren, kein Abo.']].map(([e, h, p]) => <div key={h}><span aria-hidden="true">{e}</span><h3>{h}</h3><p>{p}</p></div>)}</div>
      <Placeholder text="Logozeile: Erfahrung aus Projekten mit Marken wie Casio, Rewe, Vattenfall, Mercedes. Genaue Formulierung intern freigeben, kein Bezug dieser Marken zu fomo." />
      <div className="fb-contact"><Placeholder square text="Echtes Foto von Flo" /><div><h3>{contactName.split(' ')[0]}, dein Ansprechpartner bei UGC VZ</h3><p>Antwort persönlich per Mail: <a href={`mailto:${contact}`}>{contact}</a></p></div></div>
    </section>

    <section className="fb-sec fb-rules"><h2>Klare Regeln, faire Konditionen</h2>
      <ul>{[['🔞', 'Nur ab 18.'], ['🏷️', 'Werbung kennzeichnen: Jeder bezahlte Post wird klar als Werbung oder Anzeige markiert.'], ['🚫', 'Keine Gewinnversprechen: Du versprichst deinen Zuschauern nie Trading Gewinne. Keine gefälschten Ergebnisse.'], ['💸', 'Kein Token Pushing: Du nimmst kein Geld von Projekten, um bestimmte Tokens zu bewerben.']].map(([e, t]) => <li key={t}><span aria-hidden="true">{e}</span>{t}</li>)}</ul>
    </section>

    <section className="fb-sec"><p className="fb-k">FAQ</p><h2>Deine Fragen, kurz beantwortet.</h2>
      <div className="fb-faq">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>

    <section className="fb-sec fb-decision" id="fb-entscheidung">
      <h2>{v.ctaTitle}</h2>
      <p>Sag Ja, und wir melden uns {FOMO.responseTime ? `innerhalb von ${FOMO.responseTime}` : 'zeitnah'} persönlich bei dir.</p>
      <p className="fb-risk">{RISK_LINE}</p>
      {cta}
      <p className="fb-fine">Kostenlos und unverbindlich. Die endgültigen Konditionen bestätigt das fomo Team im Gespräch.</p>
    </section>
  </div>;
}
