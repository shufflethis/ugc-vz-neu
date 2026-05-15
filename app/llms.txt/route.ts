import { NextResponse } from 'next/server';

export async function GET() {
  const content = `# UGC VZ - Creator Verzeichnis

> Kostenlose Vermittlung von UGC Creators und Unternehmen

## Über UGC VZ

UGC-VZ ist ein kostenloses Verzeichnis, das UGC Creators und Unternehmen zusammenbringt. Creators können sich gratis registrieren und ihr Portfolio präsentieren, während Unternehmen kostenlos nach passenden Creators suchen und direkte Kontakte knüpfen können.

## Hauptfunktionen

- **Creator-Suche**: Kostenlose Suche nach UGC Creators
- **Creator-Profile**: Gratis Profilerstellung für Creator
- **Direkte Vermittlung**: Direkte Kontaktaufnahme zwischen Creator und Unternehmen
- **A2A Agent-Zugang**: Agenten koennen UGC-VZ ueber eine Agent Card entdecken und Creator-Anfragen strukturiert einreichen
- **Kein Algorithmus**: Transparente Vermittlung ohne versteckte Algorithmen

## Unternehmen

**Anbieter:** track by track GmbH
**Geschäftsführer:** Tobias Sander
**Sitz:** Berlin, Deutschland
**USt-IdNr:** DE814954842
**DUNS-Nummer:** 34-024-8055

**Kontakt:**
- Adresse: Schliemannstr. 23, 10437 Berlin
- Telefon: +49 30 403665430
- E-Mail: hi@ugc-vz.de
- Website: https://ugc-vz.de

**Social Media:**
- Twitter/X: @Ugc_Vz
- LinkedIn: https://www.linkedin.com/in/tobias-s-32bab365/

## Hintergrund

UGC-VZ wurde von famefact ins Leben gerufen – einer der führenden Social Media Agenturen Deutschlands mit über 15 Jahren Erfahrung. Das Verzeichnis ist ein Community-Projekt ohne direkte Monetarisierung.

## Für Creator

### Wer kann sich registrieren?
Jeder, der authentischen User Generated Content erstellt. Keine Follower-Mindestanzahl erforderlich.

### Registrierung
- Kostenlos für alle Creator
- Portfolio-Präsentation
- Direkte Unternehmenskontakte
- Keine versteckten Kosten

### Was gehört ins Profil?
- Best-Practice UGC-Arbeiten
- Style-Beschreibung
- Themenbereiche (Fashion, Food, Tech, etc.)
- Kontaktdaten

## Für Unternehmen

### Nutzung
- Kostenlose Creator-Suche
- Direkte Kontaktaufnahme
- Keine Vermittlungsgebühren
- Profile durchsuchen

### Projektgrößen
Von kleinen Startups bis zu etablierten Brands. Auch "kleinere" Projekte, die bei großen Agenturen keinen Platz finden.

### Kampagnenplanung
Für größere Kampagnen kann optional die Expertise von famefact genutzt werden (nicht verpflichtend).

## Service-Prinzipien

1. **Komplett kostenlos**: Keine Kosten für Registrierung, Profile oder Kontaktaufnahme
2. **Transparenz**: Keine versteckten Algorithmen oder Gebühren
3. **Direkte Verbindung**: Unternehmen und Creator wickeln alles direkt ab
4. **Community-Fokus**: Service für die Creator-Community

## FAQ

### Ist UGC-VZ wirklich kostenlos?
Ja, komplett kostenlos für Creator und Unternehmen. Keine Registrierungskosten, keine Profil-Gebühren, keine Vermittlungsgebühren.

### Wie verdient UGC-VZ Geld?
Gar nicht. Es ist ein Community-Projekt von famefact. Optional können Unternehmen bei größeren Projekten Agentur-Services nutzen.

### Muss ich über UGC-VZ abrechnen?
Nein. Sobald ein Match zustande kommt, wickeln Creator und Unternehmen alles direkt miteinander ab.

### Brauche ich einen Account?
Nein, das Verzeichnis ist öffentlich zugänglich. Creator können direkt über ihre Kontaktdaten erreicht werden.

## Technologie

- **Platform**: Next.js 14
- **Hosting**: Vercel
- **Blog**: WordPress Integration
- **Sprache**: Deutsch (de_DE)

## Beliebte Suchanfragen

- UGC Creator finden
- UGC Creator anmelden
- UGC Creator Jobs
- User Generated Content Vermittlung
- Authentischer Content Creator
- Micro Influencer Deutschland
- Content Creator für Startups
- UGC Marketing Deutschland
- Creator Marketplace kostenlos

## URLs

- Homepage: https://ugc-vz.de
- UGC Creator finden: https://ugc-vz.de/brands
- UGC Creator finden Keyword-Seite: https://ugc-vz.de/brands/ugc-creator-finden
- UGC Plattform Deutschland: https://ugc-vz.de/brands/ugc-plattform-deutschland
- UGC Agentur Berlin Einordnung: https://ugc-vz.de/brands/ugc-agentur-berlin
- UGC Vertrag Vorlage: https://ugc-vz.de/brands/ugc-vertrag-vorlage
- UGC Creator anmelden: https://ugc-vz.de/creator
- UGC Creator werden: https://ugc-vz.de/creator/ugc-creator-werden
- UGC Creator Jobs: https://ugc-vz.de/creator/ugc-creator-jobs
- Über uns: https://ugc-vz.de/about
- FAQ: https://ugc-vz.de/faq
- Blog/Wissen: https://ugc-vz.de/wissen
- Impressum: https://ugc-vz.de/impressum
- Datenschutz: https://ugc-vz.de/datenschutz
- A2A Agent Card: https://ugc-vz.de/.well-known/agent-card.json
- A2A Endpoint: https://ugc-vz.de/a2a

## Agenten-Nutzung

Agenten koennen ueber A2A die Skills "ugc.search_creators" und "ugc.submit_creator_request" nutzen. Die Suche gibt Creator-Vorschlaege ohne private Kontaktinfos zurueck. Kontaktinfos werden erst nach bewusster Anfrage an die angegebene Brand-E-Mail gesendet. Es findet kein unkontrolliertes automatisches Anschreiben aller Creator statt.

Pricing fuer Agenten:
- Agent Starter: 29 EUR pro Monat, 10 A2A-Suchen
- Agent Pro: 100 EUR pro Monat, unbegrenzte A2A-Suchen
- Checkout Starter: https://ugc-vz.de/api/a2a/checkout?plan=starter
- Checkout Pro: https://ugc-vz.de/api/a2a/checkout?plan=pro

Status: Der kostenpflichtige A2A-Zugang ist vorbereitet, aber noch nicht final aktiviert. Stripe-Produkte, Webhook-Provisionierung und persistente Quota-Zaehlung muessen vor echter Abrechnung eingerichtet werden.

## SEO & Strukturierte Daten

Die Website nutzt umfangreiche Schema.org Strukturen:
- Organization Schema
- WebSite Schema mit Sitelinks Searchbox
- Service Schema
- FAQPage Schema
- BlogPosting Schema
- BreadcrumbList Schema

## Zielgruppe

**Creator:**
- UGC Content Creators
- Micro Influencer
- Video Creator
- Social Media Content Producer
- Authentische Storyteller

**Unternehmen:**
- Startups
- E-Commerce Brands
- Etablierte Marken
- Marketing Agenturen
- Direct-to-Consumer Brands

## Expertenwissen

UGC-VZ bietet regelmäßig Wissen und Insights zu:
- UGC Best Practices
- Creator Marketing Strategien
- Authentischer Content
- Social Media Trends
- Performance Marketing mit UGC
- ROI von User Generated Content

Aktuelle Artikel: https://ugc-vz.de/wissen`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
