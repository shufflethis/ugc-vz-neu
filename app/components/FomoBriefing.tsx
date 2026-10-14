import './fomo-brief.css';

// Inhalte und Medien aus Flos Briefing-Seiten (fomo-creator-briefing[-women].vercel.app, Stand 14.10.2026).
// Alle Handlungsaufrufe führen zurück zur UGC-VZ-Einladung (#start), damit Zusagen zugeordnet bleiben.
export type FomoVariant = 'creator' | 'creatorin';
export const fomoVariant = (fuer?: string | string[]): FomoVariant => fuer === 'creatorinnen' ? 'creatorin' : 'creator';

const M = '/kooperationen/fomo/';
const V = {
  creator: {
    eyebrow: 'Creator-Partnerprogramm · Deutschland',
    title: ['Eine Partnerschaft für Creator,', 'die Reichweite aufbauen können.'],
    lead: 'Klare Konditionen, persönliche Betreuung, Start innerhalb von 48 Stunden.',
    bullets: ['Kein Krypto-Wissen nötig', 'Neue Accounts, deine Reichweite ist optional', 'Deutscher Ansprechpartner'],
    fomoExtra: '',
    jobImg: ['stock-creator-tripod.jpg', 'Symbolbild: junger Mann filmt sich mit dem Smartphone auf Stativ'],
    firstCard: ['Neuer Account, nur für fomo', 'Kein Risiko für deine bestehende Marke.'],
    why: [['✅', 'Freie Zeiteinteilung.', 'Du produzierst, wann und wo es für dich passt. Smartphone und CapCut genügen.'], ['✅', 'Langfristige Beteiligung.', 'Deine Empfehlungsbasis bleibt dir, und du bist lebenslang an ihren Gebühren beteiligt.'], ['✅', 'Entwicklung nach Leistung.', 'Die erfolgreichsten Creator posten 3 bis 4 Mal am Tag und werden in den Gold-Server mit Vollzeit-Retainer aufgenommen.']],
    whyImg: ['stock-creator-live.jpg', 'Symbolbild: Creator filmt sich live mit dem Smartphone'],
    formats: ['Echte fomo-Formate aus der Content-Bibliothek.', 'Stills aus Beispielvideos, die du nach dem Onboarding als Skript bekommst. Du übernimmst das Format und setzt es in deinem eigenen Stil um.'],
    cta: 'Jetzt als fomo Creator starten',
  },
  creatorin: {
    eyebrow: 'Creator-Partnerprogramm · Für Creatorinnen',
    title: ['Eine Partnerschaft für Creatorinnen,', 'die flexibel und langfristig planen.'],
    lead: 'Planbares Zusatzeinkommen, freie Zeiteinteilung und ein Arbeitsort, den du selbst wählst. Start innerhalb von 48 Stunden.',
    bullets: ['Kein Krypto-Wissen nötig, du lernst alles im Onboarding', 'Ortsunabhängig und flexibel planbar', 'Persönliche Betreuung auf Deutsch'],
    fomoExtra: ' Deshalb braucht es Creatorinnen, die das Thema verständlich erklären.',
    jobImg: ['stock-woman-filming.jpg', 'Symbolbild: junge Frau filmt sich zu Hause mit Kamera auf Stativ'],
    firstCard: ['Eigener Account, nur für fomo', 'Dein privates Profil bleibt deins.'],
    why: [['✨', 'Planbares Zusatzeinkommen.', 'Der Retainer wird vorab fest vereinbart, die Provision kommt laufend dazu.'], ['🌍', 'Ortsunabhängig arbeiten.', 'Ob zu Hause oder unterwegs: Du produzierst mit dem Smartphone, wo es für dich passt.'], ['🌱', 'Langfristige Beteiligung.', 'Deine Empfehlungsbasis bleibt dir, und du bist lebenslang an ihren Gebühren beteiligt.'], ['⏰', 'Freie Zeiteinteilung.', 'Für den Einstieg genügt ein Video pro Tag. Die erfolgreichsten Creator posten 3 bis 4 Mal täglich.']],
    whyImg: ['stock-woman-bali.jpg', 'Symbolbild: Frau arbeitet am Laptop an einer Strandbar am Meer'],
    formats: ['Erprobte Formate, umgesetzt in deinem Stil.', 'Stills aus echten Beispielvideos der fomo Content-Bibliothek. Nach dem Onboarding bekommst du die Skripte dazu und setzt jedes Format in deinem eigenen Stil um.'],
    cta: 'Jetzt als fomo Creatorin starten',
  },
};
const stills = [['3bba8f7d', 'Ein Tag in meinem Leben'], ['28856891', 'Mama das Traden beibringen'], ['17b5c5fb', 'Meine erste Trading-Stunde'], ['b2e12c49', 'Sechs-Monats-Transformation'], ['d898ed40', 'Tag X: Aus X einen Ferrari machen'], ['42adbe1b', 'Ist fomo legit?']];
const ladder = [[25, 'Start'], [30, '2 Mon.'], [35, '4 Mon.'], [40, '6 Mon.'], [45, '8 Mon.'], [50, '12 Mon.']] as const;
const steps = [['Einladung bestätigen', 'Du bist über UGC VZ eingeladen. Bestätige deine vorhandenen Angaben, keine neue Bewerbung nötig.'], ['Gespräch und Retainer', 'Wir stimmen deinen Start-Retainer ab. Meist 200 $ bis 1.000 $ für die ersten 30 Tage.'], ['Onboarding', 'Ticket auf Discord, fomo laden, neue Accounts auf TikTok, Instagram und Facebook.'], ['Testphase', '15 Posts an 15 Tagen, maximal 21 Tage. Das zahlt dir schon die Hälfte deines Retainers.'], ['Gold-Server', 'Ab 500 oder 1.000 Empfehlungen oder mit sichtbarem Einsatz: Vollzeit-Retainer und Coaching von Will und Charlie.'], ['Provision wächst', 'Lebenslang ab 25 % der Gebühren deiner Geworbenen, mit der Zeit bis 50 %.']];
const faq = [
  ['Brauche ich Krypto-Wissen?', 'Nein. Du brauchst Gespür für Hooks und virale Videos. Was fomo kann und wie du darüber sprichst, lernst du im Guide, in der Content-Bibliothek mit fertigen Skripten und in den Calls.'],
  ['Brauche ich viele Follower?', 'Nein. Du startest normalerweise mit neuen Accounts, die nur für fomo da sind. Deine bisherigen viralen Videos zeigen, dass du weißt, wie Reichweite entsteht. Deine bestehende Reichweite zu nutzen, ist freiwillig.'],
  ['Was kostet mich das?', 'Keine Gebühren, kein Abo. Die einzige Ausgabe, die wir offen nennen: Für TikTok kaufen die meisten einen Account mit 1.000 Followern für 60 $ über den fomo-Partner, weil TikTok den Link in der Bio erst ab 1.000 Followern freischaltet. Hast du schon einen ungenutzten TikTok mit über 1.000 Followern, nimmst du den.'],
  ['Wie viel Aufwand ist das?', 'Ein Video pro Tag, gepostet auf TikTok, Instagram und Facebook. Facebook läuft automatisch über Instagram. Wer mehr will, postet 3 bis 4 Mal am Tag, so machen es die Top-Creator.'],
  ['Wie und wann werde ich bezahlt?', 'Der Retainer kommt alle 30 Tage, die Testphase zahlt die Hälfte davon. Zahlungen gehen an deine fomo-Wallet. Deine Provision siehst du jederzeit live im Creator Dashboard in der App.'],
  ['Muss ich auf Englisch posten?', 'Deine Posting-Sprache stimmen wir im Onboarding ab. Wichtig zu wissen: Empfehlungen aus den USA sind mehr wert. Im Guide steht, wie du mit englischen Untertiteln, Titeln oder Hashtags eine US-Zielgruppe aufbaust.'],
  ['Was passiert, wenn die Testphase nicht klappt?', 'Du bist nicht raus. Du bleibst auf dem Affiliate-Server, kannst ohne Posting-Pflicht mit deinem Link weiterverdienen, nach 500 Empfehlungen eine neue Chance bekommen oder eine weitere Testphase anfragen.'],
  ['Was, wenn ich irgendwann aufhöre?', 'Du verdienst lebenslang weiter an allen, die du geworben hast. Dein Satz fällt dann auf 25 % zurück, aber er bleibt.'],
];

function Photo({ img }: { img: string[] }) {
  return <figure className="fb-photo"><img loading="lazy" src={M + img[0]} alt={img[1]} /><span>Symbolbild</span><figcaption>Foto: Unsplash (Unsplash-Lizenz)</figcaption></figure>;
}

export default function FomoBriefing({ variant, contactName, contactEmail }: { variant: FomoVariant; contactName: string; contactEmail: string }) {
  const v = V[variant];
  const order = variant === 'creatorin' ? [...stills.slice(0, 2), stills[5], ...stills.slice(2, 5)] : stills;
  return <div className="fomo-brief">
    <section className="fb-hero">
      <div>
        <p className="fb-eyebrow"><img src={M + 'fomo-icon-96.png'} alt="" width={22} height={22} />{v.eyebrow}</p>
        <h2 className="fb-h1">{v.title[0]}<br /><span>{v.title[1]}</span></h2>
        <p className="fb-lead">Du hast bewiesen, dass deine Videos funktionieren. fomo bietet dir dafür einen fest vereinbarten Retainer und eine <b>lebenslange Provision</b> auf alle, die über dich zur App kommen. {v.lead}</p>
        <div className="fb-actions"><a className="fb-btn" href="#start">Einladung bestätigen</a><a className="fb-btn ghost" href="#fb-geld">So verdienst du</a></div>
        <ul className="fb-ticks">{v.bullets.map(b => <li key={b}>{b}</li>)}</ul>
      </div>
      <div className="fb-phone">
        <video autoPlay muted loop playsInline controls preload="metadata" poster={M + '42adbe1b_was-ist-fomo-1.jpg'}><source src={M + '42adbe1b_was-ist-fomo-1.mp4'} type="video/mp4" /></video>
        <span className="fb-tag">Beispiel aus der Content-Bibliothek</span>
        <span className="fb-float a">Earn 50 % of your friends&apos; fees</span><span className="fb-float b">💸 +$733.01</span><span className="fb-float c">👑 Gold-Server</span>
      </div>
    </section>

    <section className="fb-stats" aria-label="Zahlen">
      {[['75 Mio. $', 'Series B, angeführt von Index Ventures (Juni 2026)'], ['600.000+', 'Nutzer laut fomo (Juni 2026)'], ['400.000+', 'Nutzer kamen allein über die Creator-Kampagne'], ['>400.000 $', 'hat der Top-Creator im Programm verdient']].map(([n, t]) => <div key={t}><b>{n}</b><span>{t}</span></div>)}
    </section>

    <section className="fb-sec"><p className="fb-k">Was ist fomo?</p><h2>Social Trading, verständlich für alle.</h2>
      <p className="fb-p">fomo ist die erste Social-Trading-App der Welt. Nutzer entdecken Tokens, sehen, was Freunde und Top-Trader kaufen, und traden mit wenigen Taps. Gemacht für ganz normale Leute, nicht für Krypto-Profis.{v.fomoExtra}</p>
      <div className="fb-chips">{['🧠 Tradern folgen', '🔍 Alerts, wenn Top-Trader kaufen', '🏆 Leaderboard', '💸 Mit Apple Pay kaufen', '💰 Niedrige Gebühren', '📱 Für Einsteiger gebaut'].map(c => <span key={c}>{c}</span>)}</div>
    </section>

    <section className="fb-sec"><p className="fb-k">Dein Job</p><h2>Ein Video pro Tag, auf drei Plattformen, in deinem Stil.</h2>
      <div className="fb-split"><Photo img={v.jobImg} />
        <div className="fb-cards">{[['🆕', v.firstCard[0], `Du startest mit frischen Accounts auf TikTok, Instagram und Facebook. ${v.firstCard[1]}`], ['🔥', 'Deine Erfahrung zählt', 'Du hast bereits Videos mit hoher Reichweite produziert. Dein Gespür für Hooks, Tempo und Dramaturgie ist der Kern dieser Zusammenarbeit.'], ['🔁', 'Einmal drehen, dreimal posten', 'Instagram teilt automatisch auf Facebook. Ein Video ergibt drei Posts.'], ['🎯', 'Bestehende Kanäle optional', 'Deine bestehenden Kanäle zusätzlich zu nutzen, ist freiwillig. Pflicht ist nur der fomo-Account.']].map(([e, h, p]) => <div key={h}><span>{e}</span><h3>{h}</h3><p>{p}</p></div>)}</div>
      </div>
    </section>

    <section className="fb-sec" id="fb-geld"><p className="fb-k">Verdienst</p><h2>Zwei Vergütungsbausteine, einer davon langfristig.</h2>
      <div className="fb-money">
        <div><small>1 · Retainer</small><b>200 $ bis 1.000 $</b><p>Typischer Start-Retainer für deine ersten 30 Tage, manchmal mehr. Fest vereinbart, bevor du loslegst. Nach der Testphase wird neu verhandelt, bei den meisten geht es nach oben.</p></div>
        <div className="gold"><small>2 · Lebenslange Provision</small><b>25 % bis 50 %</b><p>Du bekommst einen Anteil an den Trading-Gebühren jeder Person, die über deinen Link kommt. Nicht für ein paar Wochen, sondern lebenslang.</p></div>
      </div>
      <figure className="fb-ladder"><div>{ladder.map(([p, t]) => <div key={t} style={{ '--h': `${p * 1.8}%` } as React.CSSProperties}><span>{p} %</span><i /><small>{t}</small></div>)}</div>
        <figcaption>So steigt dein Satz typischerweise, laut Erklärung des fomo-Teams. Entscheidend sind, wie lange du dabei bist und wie gut du performst. Hörst du auf, behältst du 25 % auf alle, die du schon geworben hast.</figcaption></figure>
      <p className="fb-note">Zum Vergleich: Viele Affiliate-Programme zahlen Provision nur für begrenzte Zeit. Bei fomo läuft sie weiter, solange deine Geworbenen traden.</p>
    </section>

    <section className="fb-sec"><p className="fb-k">Ergebnisse</p><h2>Zahlen aus dem Creator Dashboard.</h2>
      <p className="fb-p">Screenshots aus dem fomo Creator Dashboard, die im offiziellen Briefing geteilt wurden. <b>Das sind Top-Ergebnisse, nicht der Durchschnitt.</b></p>
      <div className="fb-shots">
        <figure><img loading="lazy" src={M + 'e922d7a9_damon_one.webp'} alt="Creator Dashboard: 100.063,17 $ verdient, 22.800 geworbene Nutzer" /><figcaption><b>100.063 $</b> Gesamtprovision · 22.800 Geworbene · 40 % Satz</figcaption></figure>
        <figure><img loading="lazy" src={M + 'c0dc1e95_IMG_4284.webp'} alt="Creator Dashboard: 67.375,32 $ verdient, 17.893 geworbene Nutzer" /><figcaption><b>67.375 $</b> Gesamtprovision · 17.893 Geworbene · 50 % Satz</figcaption></figure>
      </div>
      <div className="fb-wins">{[['+618,49 $', 'Discord-Win'], ['+1.000,83 $', 'Discord-Win'], ['1.009', 'Empfehlungen, Discord-Win']].map(([n, t]) => <div key={n}><b>{n}</b><span>{t}</span></div>)}</div>
      <p className="fb-note">Discord-Wins aus dem Einführungsvideo des fomo-Teams für neue Creator.</p>
      <h3 className="fb-h3">Videos mit besonders hoher Reichweite</h3>
      <div className="fb-wins">{[['529.700', '@aaron.profits', 'Chart mit Ein-Dollar-Story'], ['507.500', '@savemejruss', '8 Sekunden Empfehlung'], ['411.900', '@glowupwithwill', 'Side-Hustle-Tagebuch']].map(([n, h, t]) => <a key={h} href="https://www.ugcroster.com/blog/fomo-app-marketing-strategy-real-creator-math" target="_blank" rel="noopener noreferrer"><b>{n}</b><span>Views · {h}</span><small>{t}</small></a>)}</div>
      <p className="fb-note">Quelle: Analyse von ugcroster.com. Formate wie diese findest du nach dem Onboarding als Skripte in der Content-Bibliothek.</p>
    </section>

    <section className="fb-sec"><div className="fb-split rev"><div><p className="fb-k">Warum das anders ist</p><h2>Flexibel im Alltag, langfristig beteiligt.</h2>
      <ul className="fb-why">{v.why.map(([e, b, t]) => <li key={b}><span>{e}</span><p><b>{b}</b> {t}</p></li>)}</ul></div><Photo img={v.whyImg} /></div>
    </section>

    <section className="fb-sec"><p className="fb-k">Formate</p><h2>{v.formats[0]}</h2><p className="fb-p">{v.formats[1]}</p>
      <div className="fb-stills">{order.map(([id, t]) => <figure key={id}><img loading="lazy" src={`${M}still-${id}.jpg`} alt={`Still aus dem Beispielvideo: ${t}`} /><figcaption>{t}</figcaption></figure>)}</div>
    </section>

    <section className="fb-sec"><p className="fb-k">Dein Weg</p><h2>Von der Einladung zur langfristigen Partnerschaft.</h2>
      <ol className="fb-steps">{steps.map(([h, p], i) => <li key={h}><small>Schritt {i + 1}</small><h3>{h}</h3><p>{p}</p></li>)}</ol>
    </section>

    <section className="fb-sec"><p className="fb-k">Die Testphase</p><h2>15 Posts in höchstens 21 Tagen.</h2>
      <div className="fb-test"><div className="fb-days" aria-label="21 Tage, davon 15 Posting-Tage und 6 Tage Puffer">{Array.from({ length: 21 }, (_, i) => <span key={i} className={i < 15 ? 'on' : ''}>{i + 1}</span>)}</div>
        <ul>{[['15', 'Posting-Tage, jeweils ein Video auf TikTok, Instagram und Facebook'], ['21', 'Tage Zeit, die Uhr startet mit deinem ersten Post'], ['6', 'Tage Puffer, falls mal was dazwischenkommt'], ['50 %', 'deines Retainers, sobald du durch bist']].map(([b, t]) => <li key={t}><b>{b}</b> {t}</li>)}</ul></div>
      <p className="fb-note">Poste einmal am Tag, dann bist du nach 15 Tagen durch. Du startest auf dem blauen Affiliate-Server, wo Bia dich begleitet. Knackst du 500 oder 1.000 Empfehlungen oder zeigst sichtbaren Einsatz, geht es auf den Gold-Server mit Vollzeit-Retainer.</p>
    </section>

    <section className="fb-sec"><p className="fb-k">Was du mitbringst</p><h2>Wen wir suchen.</h2>
      <ul className="fb-why">{[['Erfolg mit Short-Form:', 'Du hattest schon Videos, die viral gingen.'], ['Gesicht vor der Kamera:', 'Du zeigst dich, das schafft Vertrauen.'], ['CapCut oder TikTok-Editor:', 'nativ, sauber, nicht überproduziert.'], ['30 Posts im Monat:', 'ein Video pro Tag auf TikTok, Instagram und Facebook. Crossposting ist ausdrücklich erlaubt.'], ['18 Jahre oder älter.', '']].map(([b, t]) => <li key={b}><span>✓</span><p><b>{b}</b> {t}</p></li>)}</ul>
    </section>

    <section className="fb-sec"><p className="fb-k">Vertrauen</p><h2>Wer hinter dem Programm steht.</h2>
      <div className="fb-cards four">{[['🏢', 'fomo, New York', 'Gegründet 2025. Rund 94 Mio. $ Funding, darunter eine Series B über 75 Mio. $ unter Führung von Index Ventures, mit Union Square Ventures und Benchmark.'], ['🤝', `${contactName.split(' ')[0]}, dein Ansprechpartner`, 'UGC VZ begleitet dich auf Deutsch, von der Einladung bis zur Übergabe an das fomo-Team.'], ['🛡️', 'Transparente Auszahlung', 'Retainer alle 30 Tage an deine fomo-Wallet. Deine Provision siehst du live im Creator Dashboard.'], ['🧾', 'Keine versteckten Kosten', 'Keine Gebühren, kein Abo. Die einzige Ausgabe nennen wir offen: der optionale TikTok-Account für 60 $.']].map(([e, h, p]) => <div key={h}><span>{e}</span><h3>{h}</h3><p>{p}</p></div>)}</div>
      <p className="fb-note">Quellen Funding: <a href="https://fomo.family/blog/fomo-series-b" target="_blank" rel="noopener noreferrer">fomo Blog</a>, <a href="https://www.theblock.co/news/deals/2026-06-22-crypto-trading-app-fomo-raises-75-million-at-550-million-valuation-in-index-ventures-led-series-b-report-405563" target="_blank" rel="noopener noreferrer">The Block</a>, <a href="https://www.globenewswire.com/news-release/2026/06/22/3315279/0/en/fomo-Raises-75-Million-Series-B-Led-by-Index-Ventures-To-Scale-Global-Consumer-Trading-App.html" target="_blank" rel="noopener noreferrer">GlobeNewswire</a>.</p>
    </section>

    <section className="fb-sec fb-rules"><h2>Klare Regeln, faire Konditionen.</h2>
      <ul>{[['Nur ab 18.', ''], ['Werbung kennzeichnen:', 'Jeder bezahlte Post wird klar als Werbung oder Anzeige markiert.'], ['Keine Gewinnversprechen:', 'Du versprichst deinen Zuschauern nie Trading-Gewinne. Keine gefälschten PnLs, keine gefälschten Tweets, kein „Insider“.'], ['Krypto ist riskant:', 'Kurse schwanken stark, Verluste sind möglich. Das gehört ehrlich dazu.'], ['Kein Token-Pushing:', 'Du nimmst kein Geld von Projekten, um bestimmte Tokens zu bewerben.']].map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
    </section>

    <section className="fb-sec"><p className="fb-k">FAQ</p><h2>Deine Fragen, kurz beantwortet.</h2>
      <div className="fb-faq">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>

    <section className="fb-sec fb-final"><p className="fb-k">So geht&apos;s weiter</p><h2>Starten in drei Schritten.</h2>
      <ol>{['Einladung oben bestätigen, deine UGC-VZ-Angaben werden übernommen.', 'Kurzes Gespräch, wir stimmen deinen Retainer ab.', 'Onboarding auf Discord, und in 48 Stunden bist du startklar.'].map((t, i) => <li key={t}><b>{i + 1}</b>{t}</li>)}</ol>
      <a className="fb-btn" href="#start">Zur Einladung</a>
      <p className="fb-note">Fragen? <a href={`mailto:${contactEmail}`}>{contactName}</a> antwortet dir persönlich. Plätze vergeben wir laufend, je nach Fit.</p>
      <p className="fb-note">Alle Zahlen stammen aus dem offiziellen fomo Creator-Guide, aus fomo-Pressemitteilungen oder aus den genannten Quellen. Beispielergebnisse sind keine Garantie für deine Einnahmen.</p>
    </section>

    <a className="fb-sticky" href="#start"><img src={M + 'fomo-icon-96.png'} alt="" width={28} height={28} /><span><b>{v.cta}</b><small>Persönliche Einladung · 14 Tage gültig</small></span></a>
  </div>;
}
