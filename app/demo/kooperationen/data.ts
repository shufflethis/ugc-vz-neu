import 'server-only';
import type { Campaign, DemoCandidate, Slide } from './model';

// Content is supplied by the authenticated server page, never imported by a
// client component or exported as a public static JSON/asset.
export const campaigns: Campaign[] = [
  {
    slug: 'fomo', brand: 'fomo', monogram: 'f', category: 'App · Social Trading',
    kind: 'Fixhonorar + Provision', title: 'Dein Content. Die Chance auf laufende Einnahmen.',
    summary: 'UGC VZ lädt dich zur Creator-Partnerschaft mit fomo ein, einer Social-Trading-App. Du produzierst regelmäßig kurze Videos und verbindest ein vereinbartes Fixhonorar mit einer Beteiligung an den Trading-Gebühren der Nutzer, die du gewinnst.',
    tone: 'violet', fictional: false, reward: 'Fixhonorar + Provision', rhythm: '1 Video pro Tag', duration: 'Testphase zum Einstieg',
    platforms: ['TikTok', 'Instagram', 'Facebook'],
    deliverables: ['Ein kurzes Video pro Tag produzieren und auf TikTok, Instagram und Facebook veröffentlichen. Ein Video, drei Posts.', 'Neue Projektaccounts für fomo aufbauen und dort deinen persönlichen Empfehlungslink verwenden.', 'Content-Vorlagen aus dem Kundenguide im eigenen Stil umsetzen und Fragen mit dem fomo-Team klären.'],
    requirements: ['Du bist mindestens 18 Jahre alt.', 'Du hast Erfahrung mit kurzen Videos und kannst eine Arbeitsprobe zeigen.', 'Du möchtest vor der Kamera stehen und kannst regelmäßig produzieren.', 'Du möchtest dich mit einer Social-Trading-App und ihren Risiken auseinandersetzen.'],
    terms: [
      { title: 'Fixhonorar fürs regelmäßige Posten', text: 'Das Briefing nennt einen monatlichen Retainer mit 200–1.000 US-Dollar als üblicher Startspanne für die ersten 30 Tage. Dein konkretes Honorar, der Anspruch nach der Testphase und die weitere Laufzeit werden individuell mit fomo vereinbart.' },
      { title: 'Beteiligung über einzelne Videos hinaus', text: 'Laut Briefing erhältst du zunächst 25 %, später bis zu 50 % der Trading-Gebühren deiner geworbenen Nutzer. Nach einem Ausstieg soll die Beteiligung für bereits geworbene Nutzer mit 25 % weiterlaufen. Voraussetzung für Einnahmen sind provisionsfähige Gebühren; ohne diese entsteht keine Provision. Laufzeit und Fortbestand müssen die vereinbarten Programmbedingungen bestätigen.' },
      { title: 'Testphase', text: 'Laut Briefing: 15 Posting-Tage innerhalb von höchstens 21 Tagen, dafür 50 % des vereinbarten Retainers. Abnahme, Abbruch und Zahlungsbedingungen bleiben Klärungspunkte.' },
      { title: 'Konten und Auszahlung', text: 'Das Briefing nennt eine Auszahlung an die fomo-Wallet und einen optionalen TikTok-Accountkauf. Ein alternativer Start ohne Accountkauf sowie der Auszahlungsweg werden vor Freigabe geklärt.' },
    ],
    questions: ['Kannst du regelmäßig kurze Videos produzieren?', 'Bist du bereit, neue Projektaccounts aufzubauen?'],
    value: {
      title: 'Was daraus eine laufende Einnahmequelle machen kann.',
      intro: 'Bei einem einzelnen UGC-Auftrag wirst du für ein vereinbartes Content-Paket bezahlt. Das fomo-Modell ist auf regelmäßige Zusammenarbeit ausgelegt und ergänzt das Honorar um eine Beteiligung an geworbenen Nutzern.',
      points: [
        { title: 'Fixhonorar für deine Arbeit', text: 'Ein individuell vereinbartes Honorar vergütet das regelmäßige Posten. Ob und zu welchen Konditionen die Zusammenarbeit nach der Testphase weitergeht, klärst du mit fomo.' },
        { title: 'Ein Video kann länger wirken', text: 'Kommt jemand über deinen Empfehlungslink zur App und erzeugt dort provisionsfähige Trading-Gebühren, wirst du daran beteiligt. Das kann auch nach Veröffentlichung des Videos Einnahmen bringen.' },
        { title: 'Schrittweise aufbauen', text: 'Mit weiteren geworbenen Nutzern kann deine Empfehlungsbasis wachsen. Wie viel du damit verdienst, hängt von deren Aktivität, deinem Provisionssatz und den Programmbedingungen ab.' },
      ],
      note: 'Laufende Einnahmen sind eine Möglichkeit, keine garantierte Dauerzahlung. Das Fixhonorar setzt die vereinbarte Leistung voraus; die Provision kann auch null sein.',
    },
    handoff: { guideUrl: 'https://stealth-harmonica-74d.notion.site/fomo-Kommandozentrale-3f8bac0068ef8104a1c9e542d1303e23', contact: 'Bia · fomo-Team', sourceDate: 'September 2026' },
    guide: [
      { title: 'Deine Einladung bestätigen', text: 'Dein Profil wurde von UGC VZ bereits ausgewählt. Du bestätigst deine vorhandenen Angaben, Posting-Sprache und Verfügbarkeit. Eine erneute Bewerbung ist nicht nötig.', owner: 'Creator + UGC VZ' },
      { title: 'Übergabe vorbereiten', text: 'UGC VZ ordnet deine Einladung einer Vermittlungs-ID zu. Gemeinsam klären wir, welche Profildaten an das fomo-Team weitergegeben werden.', owner: 'UGC VZ' },
      { title: 'Herkunft im Ticket angeben', text: 'Beim Einstieg über den Kundenguide gibst du UGC VZ / Florian Runge und deine Vermittlungs-ID im Discord-Ticket an. Die Zuordnung muss fomo bestätigen; die Vorlage unten zeigt den vorgeschlagenen Ablauf.', owner: 'Creator + fomo' },
      { title: 'Aufnahme und Konditionen bestätigen', text: 'fomo bestätigt die Aufnahme sowie Honorar, Leistungsumfang und Auszahlung. Erst nach der individuellen Vereinbarung startest du mit der Produktion. Ab dann begleitet dich das fomo-Team anhand seiner Kommandozentrale.', owner: 'fomo' },
    ],
  },
  {
    slug: 'studio-skin', brand: 'Studio Skin', monogram: 'S', category: 'Beauty · Fiktives Beispiel',
    kind: 'UGC-Auftrag', title: 'Eine Pflegeroutine. Deine Perspektive.',
    summary: 'Ein Produkt kennenlernen und daraus kurze, natürliche Videos machen. Ein fiktives Projekt zeigt, wie sich das System für andere Marken nutzen lässt.',
    tone: 'green', fictional: true, reward: 'Fixhonorar je Auftrag', rhythm: '3 kurze Videos', duration: 'Einmaliges Projekt',
    platforms: ['Reels', 'Produktdemo'],
    deliverables: ['Drei kurze Produktvideos mit unterschiedlichen Einstiegen erstellen.', 'Entwürfe zur vereinbarten Abnahme bereitstellen.'],
    requirements: ['Erfahrung mit Beauty- oder Pflege-Content.', 'Eine passende Arbeitsprobe.', 'Verfügbarkeit im gemeinsam festgelegten Zeitraum.'],
    terms: [{ title: 'Honorar und Rechte', text: 'Fiktives Muster ohne Preisangebot. Honorar, Nutzungsrechte, Korrekturen und Zahlung werden pro Kampagne hinterlegt.' }],
    questions: ['Hast du eine Beauty-Arbeitsprobe?', 'Kannst du drei Videos im vereinbarten Zeitraum erstellen?'],
    guide: [
      { title: 'Briefing abstimmen', text: 'Produkt, Aussagen und Formate gemeinsam prüfen.', owner: 'Creator + Marke' },
      { title: 'Konditionen vereinbaren', text: 'Honorar, Nutzungsrechte und Korrekturschleifen bestätigen.', owner: 'Creator + Marke' },
      { title: 'Auftrag übergeben', text: 'Die Marke bestätigt die Aufnahme. Danach startet die Produktion.', owner: 'UGC VZ + Marke' },
    ],
  },
  {
    slug: 'everyday', brand: 'everyday', monogram: 'e', category: 'Lifestyle · Fiktives Beispiel',
    kind: 'Laufende Partnerschaft', title: 'Gute Routinen. Regelmäßig erzählt.',
    summary: 'Ein wiederkehrendes Content-Paket für eine Lifestyle-Marke. Fiktives Beispiel für laufende Zusammenarbeit ohne Provisionsmodell.',
    tone: 'blue', fictional: true, reward: 'Monatliches Honorar', rhythm: '4 Videos pro Monat', duration: 'Laufende Zusammenarbeit',
    platforms: ['TikTok', 'Reels'],
    deliverables: ['Vier kurze Videos pro Monat produzieren.', 'Monatlich Themen und Arbeitsproben abstimmen.'],
    requirements: ['Erfahrung mit Lifestyle-Content.', 'Regelmäßige Verfügbarkeit.', 'Ein Portfolio mit eigenen Videos.'],
    terms: [{ title: 'Laufzeit und Vergütung', text: 'Fiktives Muster ohne Preisangebot. Monatshonorar, Laufzeit, Kündigung und Nutzungsrechte werden vor Beginn vereinbart.' }],
    questions: ['Kannst du monatlich vier Videos produzieren?', 'Interessiert dich eine laufende Partnerschaft?'],
    guide: [
      { title: 'Themen finden', text: 'Zielgruppe und Content-Schwerpunkte gemeinsam festlegen.', owner: 'Creator + Marke' },
      { title: 'Zusammenarbeit vereinbaren', text: 'Umfang, Laufzeit, Honorar und Abnahme bestätigen.', owner: 'Creator + Marke' },
      { title: 'Aufnahme bestätigen', text: 'Die Marke bestätigt den Start mit der Vermittlungs-ID.', owner: 'Marke' },
    ],
  },
];

export const candidates: DemoCandidate[] = [
  { id: 'DEMO-001', name: 'Alex Beispiel', initials: 'AB', topic: 'Apps · Erklärvideos', campaign: 'fomo', source: 'UGC-VZ-Pool', stage: 'Vorgeschlagen', evidence: 'Arbeitsprobe und Themen passen im Beispiel.', next: 'Passung und Kontaktfreigabe prüfen' },
  { id: 'DEMO-002', name: 'Sam Muster', initials: 'SM', topic: 'Lifestyle · Short-Form', campaign: 'fomo', source: 'UGC-VZ-Pool', stage: 'Eingeladen', evidence: 'Einladung im Beispieldatensatz zugestellt.', next: 'Rückmeldung abwarten' },
  { id: 'DEMO-003', name: 'Kim Demo', initials: 'KD', topic: 'Apps · Storytelling', campaign: 'fomo', source: 'Kampagnenlink', stage: 'Einladung angenommen', evidence: 'Die Einladung wurde im Beispiel angenommen.', next: 'Verfügbarkeit und Startdetails abstimmen' },
  { id: 'DEMO-004', name: 'Robin Beispiel', initials: 'RB', topic: 'Tech · Kurzvideos', campaign: 'fomo', source: 'UGC-VZ-Pool', stage: 'Start geklärt', evidence: 'Startdetails im Demo-Ablauf abgestimmt.', next: 'Konditionen bestätigen lassen' },
  { id: 'DEMO-005', name: 'Toni Muster', initials: 'TM', topic: 'Apps · Tutorials', campaign: 'fomo', source: 'Persönliche Einladung', stage: 'Übergabe offen', evidence: 'Übergabe vorbereitet, Kundenbestätigung fehlt.', next: 'Aufnahme durch fomo bestätigen lassen' },
  { id: 'DEMO-006', name: 'Jules Demo', initials: 'JD', topic: 'Apps · Reels', campaign: 'fomo', source: 'UGC-VZ-Pool', stage: 'Bestätigt', evidence: 'Fiktive Kundenbestätigung zur Vermittlungs-ID.', next: 'Onboarding bei fomo' },
  { id: 'DEMO-007', name: 'Lou Beispiel', initials: 'LB', topic: 'Beauty · Produktdemo', campaign: 'studio-skin', source: 'Kampagnenlink', stage: 'Einladung angenommen', evidence: 'Fiktive Bewerbung.', next: 'Portfolio prüfen' },
  { id: 'DEMO-008', name: 'Noa Muster', initials: 'NM', topic: 'Lifestyle · Alltag', campaign: 'everyday', source: 'UGC-VZ-Pool', stage: 'Vorgeschlagen', evidence: 'Fiktiver Profilvorschlag.', next: 'Verfügbarkeit prüfen' },
];

export const slides: Slide[] = [
  { label: '01 / Die Idee', title: 'Aus einer Kooperation wird ein wiederholbarer Ablauf.', intro: 'UGC VZ Kooperationen · FOMO als erster Pilot · Gesprächsgrundlage für Flo & Gorden', cards: [
    { title: 'Für Creator', text: 'Chance auf laufende Vergütung durch regelmäßigen Content und Beteiligung an geworbenen Nutzern. Vorhandene Angaben bestätigen und mit Flo den Start klären.' },
    { title: 'Für fomo', text: 'Passende Creator gezielt einladen und ihre Zusagen mit Herkunft übergeben. Das vorhandene Kunden-Onboarding bleibt der operative Leitfaden.' },
    { title: 'Für UGC VZ', text: 'Vermittlungen nachvollziehbar zuordnen und denselben Ablauf später für weitere Kunden nutzen. Heute gibt es einen Pilot.' },
  ], note: 'Vorschlag, kein freigegebenes Kundenangebot. Die Demo zeigt den Ablauf, keine Geschäftsergebnisse.' },
  { label: '02 / Bestehendes nutzen', title: 'Der Kundenguide ist da. Wir organisieren den Weg dorthin.', intro: 'Die Notion-Kommandozentrale enthält bereits Accounts, Content, Posting, Testphase und Bezahlung. Bia ist dort als Kontakt genannt.', cards: [
    { title: 'UGC VZ: vor dem Start', text: 'Passende Creator auswählen, Angebot verständlich einordnen, Einladungen zuordnen und den Start begleiten.' },
    { title: 'fomo: ab der Aufnahme', text: 'Individuelle Konditionen bestätigen und die operative Arbeit über den vorhandenen Guide und Discord begleiten.' },
    { title: 'Eine gepflegte Quelle', text: 'Zum Originalguide verlinken. Florians Aufbereitung kann ergänzen; Änderungen müssen mit dem Kundenguide abgeglichen werden.' },
  ], note: 'Notion-Kommandozentrale am 14.10.2026 im Browser gelesen; dort angegebener Stand September 2026. Die Demo belegt noch keine Zeitersparnis.' },
  { label: '03 / Positionierung', title: 'Ein klarer Einstieg. Zunächst eine Kampagne.', intro: 'FOMO ist das erste Projekt. Weitere Angebotsarten sind vorbereitet, aber noch nicht verfügbar.', cards: [
    { title: 'Jetzt: fomo-Pilot', text: 'Alternative zum einzelnen Content-Auftrag: tägliche Videos gegen vereinbartes Honorar plus potenziell fortlaufende Beteiligung. Einnahmen hängen von Leistung und Programmbedingungen ab.' },
    { title: 'Später: UGC-Aufträge', text: 'Content-Pakete gegen Fixhonorar sind eine Erweiterungsoption. Aktuell gibt es dafür kein Angebot.' },
    { title: 'Später: weitere Partnerschaften', text: 'Die Technik ist wiederverwendbar. Neue Marken werden erst als Angebote gezeigt, wenn eine echte Kampagne vorliegt.' },
  ], note: 'Positionierung nach unserem Vertriebstrainer: verständliche Kategorie, konkrete Aufgabe, sichtbare Grenzen. Bestehendes kostenloses Verzeichnis bleibt ein eigenes Angebot.' },
  { label: '04 / Creator-Erlebnis', title: 'Du bist eingeladen. Weiter zum Start.', intro: 'Auswahl durch UGC VZ → persönliche Einladung → Angaben & Verfügbarkeit bestätigen → Übergabe → Aufnahme und Konditionen durch fomo.', cards: [
    { title: 'Persönlich eingeladen', text: 'Ein persönlicher Link gilt 14 Tage ab Versand. Profil und Arbeitsprobe sind bekannt; vorhandene Angaben werden übernommen.' },
    { title: 'Bewusst entscheiden', text: 'Umfang, Vergütung und Voraussetzungen stehen vor der Bestätigung. Die Annahme der Einladung ersetzt nicht die Aufnahme durch fomo.' },
    { title: 'Später weitermachen', text: 'Die Zusage bleibt im Creator-Konto gespeichert. Fehlende Angaben später ergänzen; danach begleitet Flo die Übergabe zu fomo und dem Kundenguide.' },
  ], note: 'In der Demo werden Formulare und Statuswechsel ausschließlich in diesem Browser-Tab simuliert. Kein Versand, kein echter Login, keine Kundenübergabe.' },
  { label: '05 / Nachweis & Übergabe', title: 'Der wichtige Moment: Die Marke bestätigt die Aufnahme.', intro: 'Jede Einladung erhält eine Vermittlungs-ID. Herkunft, Status und Bestätigung gehören zu dieser ID.', cards: [
    { title: 'Zusagen messen', text: 'Zustellung, Klick und angenommene Einladung getrennt erfassen. Öffnungen sind ein ungenauer technischer Indikator.' },
    { title: 'Übergabe belegen', text: 'UGC VZ / Flo plus Vermittlungs-ID ins Ticket; Bestätigung durch fomo erfassen. Der Trading-Referral-Link des Creators ist eine andere Zuordnung.' },
    { title: 'Nutzen prüfen', text: 'Im Pilot: Zahl angenommener Einladungen, bestätigte Aufnahmen und manueller Aufwand. Zielwerte erst gemeinsam festlegen.' },
  ], note: 'Adaption des Playbooks „Revenue Architecture“: eindeutige Übergabe und überprüfbares Ergebnis. Keine erfundenen Erfolgsquoten.' },
  { label: '06 / Pilot & Verantwortliche', title: 'Mit zehn passenden Creatorn anfangen.', intro: 'Vorschlag: drei Gruppen mit je zehn Profilen. Nach jeder Gruppe Antworten, Zusagen und offene Fragen prüfen; erst danach die nächste einladen.', cards: [
    { title: 'Flo · vorgeschlagen', text: 'Konditionen mit fomo klären, erste Auswahl prüfen, Rückfragen beantworten und Übergaben abstimmen.' },
    { title: 'Gorden / Technik · vorgeschlagen', text: 'Kampagnenseite, Datenmodell, Freigaben und Tracking für den vereinbarten Pilot vorbereiten.' },
    { title: 'fomo · noch zu benennen', text: 'Eine verantwortliche Person bestätigt Bedingungen, Aufnahme und das weitere Onboarding.' },
  ], note: 'Rollen und Starttermin sind abzustimmen. Automatisierung übernimmt nach Freigabe Routine; Auswahl und individuelle Konditionen bleiben bewusst geprüft.' },
  { label: '07 / Wirtschaftlichkeit', title: 'Die Vergütung braucht eine eindeutige Bezugsgröße.', intro: 'Im Chat genannt: 2.000 US-Dollar fix + 10 %. 2.500 US-Dollar sind ein Verhandlungswunsch, keine Zusage.', cards: [
    { title: 'Fixbetrag', text: 'Zeitraum, Leistungsumfang, Kosten und Zahlungsauslöser klären. Keine monatliche Laufzeit unterstellen.' },
    { title: '10 % wovon?', text: 'Berechnungsbasis, zugeordnete Creator, Laufzeit, Abrechnung und Nachweis mit fomo vereinbaren.' },
    { title: 'Klar getrennt', text: 'Agenturvergütung und Creator-Honorar sind verschiedene Beträge. Keine Marge oder Auszahlung ohne bestätigte Grundlage berechnen.' },
  ], note: 'Interner Gesprächsstand aus dem bereitgestellten Chat. Kein unterschriebenes Angebot, keine Umsatzprognose.' },
  { label: '08 / Entscheidung mit Flo', title: 'Drei Entscheidungen, dann kann der Pilot konkret werden.', intro: 'Die Demo ist das gemeinsame Arbeitsmittel. Heute geht es um Umfang, Bedingungen und eine saubere Übergabe.', cards: [
    { title: '01 · Umfang', text: 'FOMO-Pilot mit etwa 30 passenden Profilen? Welche Auswahlkriterien und Kontaktfreigaben gelten?' },
    { title: '02 · Zusagen', text: 'Welche Creator-Konditionen und welche Agenturvergütung bestätigt fomo verbindlich?' },
    { title: '03 · Abnahme', text: 'Wer bestätigt die Creator-Aufnahme, mit welchem Nachweis und bis wann? Danach Starttermin vereinbaren.' },
  ], note: 'Nächster Schritt: diese drei Punkte gemeinsam entscheiden und dokumentieren. Die produktive Vorbereitung bleibt bis zur Freigabe im Entwurf; danach die erste Zehnergruppe kontrolliert versenden.' },
];
