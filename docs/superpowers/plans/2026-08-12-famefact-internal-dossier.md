# Interne Creator-Dossiers für famefact-Adressen — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anfragen von `@famefact.com`-Adressen erhalten statt der Standard-Brand-Mail ein vollständiges Creator-Dossier mit Kontaktdaten, Alter, Followerzahlen und allen Profilfeldern.

**Architecture:** Ein `isInternal`-Boolean wandert durch die bestehende Pipeline in `app/api/submit-request/route.ts`. Die Creator-Query wird bei `internal` um Privatkontakte und alle Profilfelder erweitert, die Brand-Mail durch eine eigene Dossier-Render-Funktion ersetzt, der Creator-Outreach übersprungen. Keine neue Route, keine neue Authentifizierung — das Ziel-Postfach ist die Authentifizierung.

**Tech Stack:** Next.js App Router (Node runtime), Neon Postgres über `@/app/lib/database`, Resend, `@slack/webhook`, Testskripte über `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-12-famefact-internal-dossier-design.md`

## Global Constraints

- **Angereicherte Daten dürfen den Server nur per E-Mail verlassen.** Die HTTP-Antwort von `POST /api/submit-request` bleibt exakt `{ success: true, leadId, delivery: 'queued' }`. Kein Creator-Feld darf in die Response.
- **Slack-Inhalt bleibt unverändert.** Einzige erlaubte Änderung: ein `[INTERN]`-Präfix in Header und Text. Keine zusätzlichen Creator-Daten.
- **Domainprüfung ist ein Suffix-Anker:** `/@famefact\.com$/i`. Niemals `includes()`. Nur `famefact.com`, keine weiteren Domains, keine Env-Var.
- **Basis bleibt die View `creator_search_public`** — also ausschließlich Profile mit `status = 'active'`.
- **Alle Freitextfelder werden beim Rendern durch `htmlEscape` geleitet.** Creator-kontrollierter Text darf nie roh ins HTML.
- **Sprache aller Ausgaben: Deutsch.** Bestehende Tonalität und Duz-Form beibehalten.
- **Kein lokaler `next build`** — earlyoom killt ihn auf diesem VPS. Verifikation über Vercel.
- Testkommando durchgehend: `npm run test:lead-email`

---

## File Structure

| Datei | Verantwortung | Aktion |
|---|---|---|
| `app/lib/email-shell.ts` | Creator-unabhängige E-Mail-Primitive: Escaping, URL-Extraktion, Plattform-Labels, HTML-Rahmen | **Neu** (Extraktion aus `lead-email.ts`) |
| `app/lib/lead-email.ts` | Typen und die vier bestehenden Render-Funktionen | Modifizieren |
| `app/lib/internal-dossier-email.ts` | Ausschließlich die interne Dossier-Mail | **Neu** |
| `db/migrations/004_internal_lead_flag.sql` | Spalte `brand_leads.is_internal` | **Neu** |
| `app/api/submit-request/route.ts` | Erkennung, erweiterte Query, Versandsteuerung | Modifizieren |
| `scripts/test-lead-email.ts` | Rendering- und Erkennungstests | Modifizieren |

`lead-email.ts` hat heute 562 Zeilen. Die Dossier-Mail käme auf rund 250 weitere. Statt einer 800-Zeilen-Datei wandern die creator-unabhängigen Primitive in `email-shell.ts` (Task 1), die Dossier-Mail bekommt eine eigene Datei (Task 3). Importrichtung bleibt zyklenfrei: `email-shell.ts` importiert nichts, `lead-email.ts` und `internal-dossier-email.ts` importieren daraus.

---

### Task 1: E-Mail-Primitive nach `email-shell.ts` extrahieren

Reine Verschiebung ohne Verhaltensänderung. Der bestehende Test ist der Beweis: er muss vorher und nachher unverändert grün sein.

**Files:**
- Create: `app/lib/email-shell.ts`
- Modify: `app/lib/lead-email.ts:39-203` (Definitionen entfernen, Import ergänzen)
- Test: `scripts/test-lead-email.ts` (unverändert — dient als Regressionsnachweis)

**Interfaces:**
- Consumes: nichts
- Produces: `htmlEscape(value: unknown): string`, `cleanText(value: unknown, fallback?: string): string`, `htmlLines(value: unknown, fallback?: string): string`, `extractUrls(value: unknown): string[]`, `platformLabel(url: string): string`, `getInitials(name: string): string`, `emailShell(args: { preheader: string; eyebrow: string; title: string; children: string; footerNote?: string }): string`, `socialPlatformNames: readonly (readonly [string, string])[]`

- [ ] **Step 1: Bestehenden Test als Baseline laufen lassen**

Run: `npm run test:lead-email`
Expected: PASS mit JSON-Ausgabe `"result": "passed"`. Falls hier schon rot — stoppen und melden, dann liegt es nicht an dieser Änderung.

- [ ] **Step 2: `app/lib/email-shell.ts` anlegen**

Der Inhalt ist wortgleich aus `lead-email.ts` übernommen — Zeilen 39-53 (`htmlEscape`, `cleanText`, `htmlLines`), 55-63 (`socialPlatformNames`), 65-104 (`extractUrls`, `platformLabel`), 131-138 (`getInitials`), 152-203 (`emailShell`). Nichts umformulieren, nur `const` durch `export const` ersetzen.

```ts
export const htmlEscape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const cleanText = (value: unknown, fallback = '') => {
  const cleaned = String(value ?? '').replace(/\r\n/g, '\n').trim();
  return cleaned || fallback;
};

export const htmlLines = (value: unknown, fallback = 'Nicht angegeben') =>
  htmlEscape(cleanText(value, fallback)).replace(/\n/g, '<br />');

export const socialPlatformNames = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
  ['pinterest', 'Pinterest'],
  ['twitter', 'X'],
] as const;

export const extractUrls = (value: unknown) => {
  const matches = cleanText(value).match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || [];
  const urls = matches.flatMap((match) => {
    const rawUrl = match.replace(/[),.;]+$/g, '');

    try {
      const parsed = new URL(/^www\./i.test(rawUrl) ? `https://${rawUrl}` : rawUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) return [];

      // Creator fields often contain share/tracking parameters. Profile links are
      // clearer and more durable without them.
      if (/instagram\.com$|tiktok\.com$|youtube\.com$|youtu\.be$|linkedin\.com$|facebook\.com$|pinterest\.|twitter\.com$|x\.com$/i.test(parsed.hostname)) {
        parsed.search = '';
        parsed.hash = '';
      } else {
        [...parsed.searchParams.keys()]
          .filter((key) => key.toLowerCase().startsWith('utm_'))
          .forEach((key) => parsed.searchParams.delete(key));
      }

      return [parsed.toString().replace(/\/$/, '')];
    } catch {
      return [];
    }
  });

  return [...new Map(urls.map((url) => [url.toLowerCase(), url])).values()];
};

export const platformLabel = (url: string) => {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('instagram.')) return 'Instagram';
  if (hostname.includes('tiktok.')) return 'TikTok';
  if (hostname.includes('youtube.') || hostname === 'youtu.be') return 'YouTube';
  if (hostname.includes('linkedin.')) return 'LinkedIn';
  if (hostname.includes('facebook.')) return 'Facebook';
  if (hostname.includes('pinterest.')) return 'Pinterest';
  if (hostname.includes('twitter.') || hostname === 'x.com' || hostname.endsWith('.x.com')) return 'X';
  return 'Website';
};

export const getInitials = (name: string) => {
  const initials = cleanText(name, 'UGC')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return htmlEscape(initials || 'UGC');
};
```

Danach `emailShell` anfügen — der komplette Template-String aus `lead-email.ts:152-203`, unverändert, nur mit `export` davor:

```ts
export const emailShell = ({
  preheader,
  eyebrow,
  title,
  children,
  footerNote,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  children: string;
  footerNote?: string;
}) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${htmlEscape(title)}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-wrap { width: 100% !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .stack-cell { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 10px !important; }
        .creator-avatar { width: 42px !important; height: 42px !important; line-height: 42px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f5f3f9;color:#1d1725;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${htmlEscape(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f9;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-wrap" style="width:640px;max-width:640px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 35px rgba(61,31,86,.10);">
            <tr>
              <td class="email-pad" style="padding:22px 42px;background:#17121f;border-bottom:4px solid #8b3fca;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-.3px;">UGC<span style="color:#c8ff45;">VZ</span></td>
                    <td align="right" style="font-size:12px;color:#d8cfe2;">Kostenlose Creator-Vermittlung</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:38px 42px 14px;">
                <div style="font-size:12px;line-height:18px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#8b3fca;">${htmlEscape(eyebrow)}</div>
                <h1 style="margin:9px 0 0;font-size:34px;line-height:41px;letter-spacing:-.8px;color:#17121f;">${htmlEscape(title)}</h1>
              </td>
            </tr>
            ${children}
            <tr>
              <td class="email-pad" style="padding:25px 42px 34px;border-top:1px solid #eee9f2;color:#746b7c;font-size:12px;line-height:19px;">
                ${htmlEscape(footerNote || 'Diese transaktionale E-Mail erhältst du, weil über UGC VZ eine Anfrage mit deiner Adresse gestellt wurde.')}<br />
                UGC VZ ist ein Angebot der track by track GmbH / <a href="https://famefact.com/?utm_source=ugc-vz&amp;utm_medium=email" style="color:#6f2fa9;text-decoration:none;">famefact</a>, Schliemannstr. 23, 10437 Berlin.<br />
                Fragen oder Missbrauch melden: <a href="mailto:hi@ugc-vz.de" style="color:#6f2fa9;">hi@ugc-vz.de</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
```

- [ ] **Step 3: Definitionen aus `lead-email.ts` entfernen und importieren**

In `app/lib/lead-email.ts` die verschobenen Blöcke löschen (`htmlEscape`, `cleanText`, `htmlLines`, `socialPlatformNames`, `extractUrls`, `platformLabel`, `getInitials`, `emailShell`) und ganz oben ergänzen:

```ts
import {
  cleanText,
  emailShell,
  extractUrls,
  getInitials,
  htmlEscape,
  htmlLines,
  socialPlatformNames,
} from './email-shell';
```

`htmlEscape` wurde bisher aus `lead-email.ts` exportiert. Prüfen, ob andere Module das nutzen:

Run: `grep -rn "htmlEscape" --include=*.ts --include=*.tsx app scripts | grep -v "lead-email\|email-shell"`

Gibt es Treffer, dann in `lead-email.ts` einen Re-Export ergänzen, damit keine fremde Importzeile bricht:

```ts
export { htmlEscape } from './email-shell';
```

Gibt es keine Treffer, entfällt der Re-Export.

`creatorUrls`, `networkSummary`, `reachSummary`, `socialButtonsHtml` und `creatorCardHtml` bleiben in `lead-email.ts` — sie hängen am Typ `SelectedCreator`.

- [ ] **Step 4: Test laufen lassen — muss unverändert grün sein**

Run: `npm run test:lead-email`
Expected: PASS, identische Byte-Zahlen wie in Step 1. Weichen `brandHtmlBytes` oder `creatorHtmlBytes` ab, wurde beim Verschieben etwas verändert — dann diffen statt weitermachen.

- [ ] **Step 5: Commit**

```bash
git add app/lib/email-shell.ts app/lib/lead-email.ts
git commit -m "Extrahiere E-Mail-Primitive in eine eigene Shell-Datei"
```

---

### Task 2: Domainerkennung und Dossier-Typ

**Files:**
- Modify: `app/lib/lead-email.ts` (Typ und Erkennungsfunktion ergänzen)
- Test: `scripts/test-lead-email.ts`

**Interfaces:**
- Consumes: nichts aus Task 1
- Produces: `isInternalRequest(email: string): boolean`, `type InternalCreatorDetails`, erweitertes `SelectedCreator` mit optionalem `internal?: InternalCreatorDetails`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

In `scripts/test-lead-email.ts` den Import erweitern und die Erkennungstests ans Ende vor den `console.log` setzen:

```ts
import {
  isInternalRequest,
  renderBrandMatchEmail,
  renderCreatorOutreachEmail,
  renderInternalLeadEmail,
  type LeadClientInfo,
  type SelectedCreator,
} from '../app/lib/lead-email';
```

```ts
// Domainerkennung: das Ziel-Postfach ist die einzige Authentifizierung,
// deshalb muss der Suffix-Anker exakt sitzen.
assert.equal(isInternalRequest('info@famefact.com'), true);
assert.equal(isInternalRequest('Name@FameFact.com'), true);
assert.equal(isInternalRequest('  info@famefact.com  '), true);
assert.equal(isInternalRequest('angreifer@famefact.com.evil.de'), false);
assert.equal(isInternalRequest('x@notfamefact.com'), false);
assert.equal(isInternalRequest('famefact.com@gmail.com'), false);
assert.equal(isInternalRequest('info@sub.famefact.com'), false);
assert.equal(isInternalRequest(''), false);
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `npm run test:lead-email`
Expected: FAIL — `isInternalRequest is not a function` beziehungsweise ein TypeScript-Importfehler.

- [ ] **Step 3: Erkennung und Typ implementieren**

In `app/lib/lead-email.ts` direkt unter die bestehenden Typdefinitionen:

```ts
// Interne Anfragen erkennen wir ausschliesslich an der Absenderdomain. Der
// Schutz liegt nicht in dieser Pruefung, sondern darin, dass die angereicherte
// Mail nur an genau diese Adresse zugestellt wird.
const INTERNAL_EMAIL_PATTERN = /@famefact\.com$/i;

export const isInternalRequest = (email: string) =>
  INTERNAL_EMAIL_PATTERN.test(String(email ?? '').trim().toLowerCase());

export type InternalSocialAccount = {
  platform: string;
  handle: string;
  url: string;
  followers: number | null;
  isPrimary: boolean;
};

export type InternalCreatorDetails = {
  birthYear: number | null;
  approxAge: number | null;
  gender: string;
  city: string;
  countryCode: string;
  heightCm: number | null;
  phone: string;
  contactText: string;
  emailVerifiedAt: string | null;
  notificationsPaused: boolean;
  socialAccounts: InternalSocialAccount[];
  portfolioLinks: string;
  totalReach: number;
  industries: string;
  topics: string;
  preferredContent: string;
  equipment: string;
  experienceSince: string;
  specialTraits: string;
  skinType: string;
  petContext: string;
  childrenContext: string;
  profileQualityScore: number;
};
```

Und den bestehenden Typ `SelectedCreator` (`app/lib/lead-email.ts:17-25`) um ein optionales Feld erweitern:

```ts
export type SelectedCreator = {
  id: string;
  name: string;
  reach: string;
  networks: string;
  priceRange: string;
  contactEmail?: string;
  socialLinks?: string;
  // Nur bei internen Anfragen befuellt. Die bestehenden Render-Funktionen
  // ignorieren das Feld, damit Privatdaten nicht versehentlich in Brand- oder
  // Creator-Mails landen koennen.
  internal?: InternalCreatorDetails;
};
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

Run: `npm run test:lead-email`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/lib/lead-email.ts scripts/test-lead-email.ts
git commit -m "Erkenne famefact-Adressen und definiere den Dossier-Typ"
```

---

### Task 3: Dossier-Mail rendern

**Files:**
- Create: `app/lib/internal-dossier-email.ts`
- Test: `scripts/test-lead-email.ts`

**Interfaces:**
- Consumes: `emailShell`, `htmlEscape`, `cleanText`, `getInitials` aus `./email-shell` (Task 1); `SelectedCreator`, `InternalCreatorDetails`, `InternalSocialAccount`, `LeadClientInfo`, `RenderedEmail` aus `./lead-email` (Task 2)
- Produces: `renderInternalMatchEmail(args: { leadId: string; clientInfo: LeadClientInfo; selectedCreators: SelectedCreator[]; internalEmail: string }): RenderedEmail`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

In `scripts/test-lead-email.ts` nach den bestehenden Fixtures ergänzen:

```ts
import { renderInternalMatchEmail } from '../app/lib/internal-dossier-email';
```

```ts
const internalCreators: SelectedCreator[] = [{
  id: 'UGC-A1B2C3D4E5',
  name: 'Anna Beispiel',
  reach: 'TikTok: 42k, Instagram: 12k',
  networks: 'TikTok, Instagram',
  priceRange: '500–800 € pro Video, Nutzungsrechte 3 Monate inklusive',
  contactEmail: 'anna@example.test',
  socialLinks: 'https://instagram.com/anna',
  internal: {
    birthYear: 1998,
    approxAge: 28,
    gender: 'weiblich',
    city: 'Berlin',
    countryCode: 'DE',
    heightCm: 172,
    phone: '+49 170 1234567',
    contactText: 'Am besten per WhatsApp erreichbar',
    emailVerifiedAt: '2026-03-01T10:00:00.000Z',
    notificationsPaused: false,
    socialAccounts: [
      { platform: 'tiktok', handle: '@annabeispiel', url: 'https://tiktok.com/@annabeispiel', followers: 42000, isPrimary: true },
      { platform: 'instagram', handle: '@anna', url: 'https://instagram.com/anna', followers: 12000, isPrimary: false },
    ],
    portfolioLinks: 'https://example.test/portfolio',
    totalReach: 54000,
    industries: 'Beauty, Food',
    topics: 'Skincare-Routinen',
    preferredContent: 'Testimonials, Unboxing',
    equipment: 'iPhone 15 Pro, Ringlicht',
    experienceSince: '2021',
    specialTraits: 'Zwillinge im Haushalt',
    skinType: 'Mischhaut',
    petContext: 'Hund',
    childrenContext: 'Zwei Kinder',
    profileQualityScore: 87,
  },
}, {
  id: 'UGC-F6G7H8I9J0',
  name: 'Pausierter Creator',
  reach: '',
  networks: 'TikTok',
  priceRange: '',
  contactEmail: 'pausiert@example.test',
  socialLinks: '',
  internal: {
    birthYear: null,
    approxAge: null,
    gender: '',
    city: '',
    countryCode: 'DE',
    heightCm: null,
    phone: '',
    contactText: '',
    emailVerifiedAt: null,
    notificationsPaused: true,
    socialAccounts: [],
    portfolioLinks: '',
    totalReach: 0,
    industries: '',
    topics: '',
    preferredContent: '',
    equipment: '',
    experienceSince: '',
    specialTraits: '',
    skinType: '',
    petContext: '',
    childrenContext: '',
    profileQualityScore: 12,
  },
}];

const dossier = renderInternalMatchEmail({
  leadId: 'UGC-PREVIEW123',
  clientInfo: { ...clientInfo, name: 'Team famefact', email: 'info@famefact.com' },
  selectedCreators: internalCreators,
  internalEmail: 'hi@ugc-vz.de',
});

// Entscheidungsdaten muessen sichtbar sein
assert.match(dossier.subject, /\[INTERN\]/);
assert.match(dossier.html, /\+49 170 1234567/);
assert.match(dossier.html, /ca\. 28 Jahre/);
assert.match(dossier.html, /42\.000/);
assert.match(dossier.html, /Berlin/);
assert.match(dossier.html, /Nutzungsrechte 3 Monate inklusive/);
assert.match(dossier.html, /tel:\+491701234567/);
assert.match(dossier.html, /Am besten per WhatsApp erreichbar/);
assert.match(dossier.html, /Mischhaut/);
assert.match(dossier.text, /\+49 170 1234567/);

// Pausierte Creator: Kontakt sichtbar, aber deutlich markiert
assert.match(dossier.html, /Benachrichtigungen pausiert/);
assert.match(dossier.html, /pausiert@example\.test/);

// Leere Felder werden ausgelassen statt als "Nicht angegeben" gerendert
assert.doesNotMatch(dossier.html, /Hauttyp<\/td>\s*<td[^>]*><\/td>/);

// Kein Marketing im internen Dossier
assert.doesNotMatch(dossier.html, /geo-agentur/);
assert.doesNotMatch(dossier.html, /Kampagnen-Support/);

// Die externe Brand-Mail darf keine Privatdaten enthalten, auch nicht wenn
// derselbe Creator-Datensatz mit befuelltem internal-Feld durchgereicht wird.
const brandWithInternalData = renderBrandMatchEmail({
  leadId: 'UGC-PREVIEW123',
  clientInfo,
  selectedCreators: internalCreators,
  internalEmail: 'hi@ugc-vz.de',
});
assert.doesNotMatch(brandWithInternalData.html, /\+49 170 1234567/);
assert.doesNotMatch(brandWithInternalData.html, /1998/);
assert.doesNotMatch(brandWithInternalData.html, /Mischhaut/);
assert.doesNotMatch(brandWithInternalData.text, /\+49 170 1234567/);
```

Den `console.log` am Dateiende um `dossierHtmlBytes: Buffer.byteLength(dossier.html)` ergänzen.

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `npm run test:lead-email`
Expected: FAIL — Modul `../app/lib/internal-dossier-email` nicht gefunden.

- [ ] **Step 3: `app/lib/internal-dossier-email.ts` implementieren**

```ts
import { cleanText, emailShell, getInitials, htmlEscape } from './email-shell';
import type {
  InternalCreatorDetails,
  InternalSocialAccount,
  LeadClientInfo,
  RenderedEmail,
  SelectedCreator,
} from './lead-email';

const numberFormat = new Intl.NumberFormat('de-DE');

const followerLabel = (followers: number | null) =>
  typeof followers === 'number' && followers > 0
    ? `${numberFormat.format(followers)} Follower`
    : 'Follower unbekannt';

const platformName = (platform: string) => {
  const names: Record<string, string> = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    pinterest: 'Pinterest',
    twitter: 'X',
    other: 'Website',
  };
  return names[platform.toLowerCase()] || platform;
};

// TikTok und Instagram zuerst: das sind die Plattformen, nach denen im
// Tagesgeschaeft entschieden wird.
const platformRank = (platform: string) => {
  const order = ['tiktok', 'instagram', 'youtube'];
  const index = order.indexOf(platform.toLowerCase());
  return index === -1 ? order.length : index;
};

const sortedAccounts = (accounts: InternalSocialAccount[]) =>
  [...accounts].sort((a, b) => {
    const byPlatform = platformRank(a.platform) - platformRank(b.platform);
    if (byPlatform !== 0) return byPlatform;
    return (b.followers || 0) - (a.followers || 0);
  });

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const socialButtons = (accounts: InternalSocialAccount[]) => sortedAccounts(accounts)
  .map((account) => `<a href="${htmlEscape(account.url)}" style="display:inline-block;margin:5px 6px 0 0;padding:8px 11px;border:1px solid #ddd2e5;border-radius:8px;background:#ffffff;color:#6f2fa9;font-size:12px;font-weight:800;text-decoration:none;">${htmlEscape(platformName(account.platform))}${account.handle ? ` ${htmlEscape(account.handle)}` : ''} · ${htmlEscape(followerLabel(account.followers))}</a>`)
  .join('');

const dateLabel = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('de-DE');
};

// Leere Felder werden ausgelassen. Bei rund zwanzig Feldern erzeugt
// "Nicht angegeben" mehr Scrollweg als Information.
const detailRows = (details: InternalCreatorDetails) => ([
  ['Branchen', details.industries],
  ['Themen', details.topics],
  ['Wunschformate', details.preferredContent],
  ['Equipment', details.equipment],
  ['Erfahrung seit', details.experienceSince],
  ['Besonderheiten', details.specialTraits],
  ['Hauttyp', details.skinType],
  ['Haustiere', details.petContext],
  ['Kinder', details.childrenContext],
  ['Größe', details.heightCm ? `${details.heightCm} cm` : ''],
  ['Gender', details.gender],
  ['Land', details.countryCode],
  ['Portfolio', details.portfolioLinks],
  ['Gesamtreichweite', details.totalReach ? numberFormat.format(details.totalReach) : ''],
  ['Profil-Score', `${details.profileQualityScore}/100`],
  ['E-Mail verifiziert', dateLabel(details.emailVerifiedAt)],
] as const)
  .filter(([, value]) => cleanText(value).length > 0)
  .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#817688;font-size:12px;vertical-align:top;white-space:nowrap;">${htmlEscape(label)}</td><td style="padding:4px 0;color:#31283a;font-size:13px;">${htmlEscape(cleanText(value)).replace(/\n/g, '<br />')}</td></tr>`)
  .join('');

const headline = (details: InternalCreatorDetails) => [
  details.approxAge ? `ca. ${details.approxAge} Jahre` : '',
  details.city,
].filter(Boolean).join(' · ');

const pausedBadge = (details: InternalCreatorDetails) => details.notificationsPaused
  ? '<div style="margin-top:10px;padding:9px 12px;border-radius:8px;background:#fdeaea;border:1px solid #f0c4c4;color:#a12727;font-size:12px;font-weight:800;">Benachrichtigungen pausiert – nicht automatisiert anschreiben</div>'
  : '';

const contactBlock = (creator: SelectedCreator, details: InternalCreatorDetails) => {
  const rows = [
    creator.contactEmail
      ? `<a href="mailto:${htmlEscape(creator.contactEmail)}" style="color:#6f2fa9;font-weight:700;text-decoration:none;">${htmlEscape(creator.contactEmail)}</a>`
      : '',
    details.phone
      ? `<a href="${htmlEscape(telHref(details.phone))}" style="color:#6f2fa9;font-weight:700;text-decoration:none;">${htmlEscape(details.phone)}</a>`
      : '',
    details.contactText ? htmlEscape(cleanText(details.contactText)) : '',
  ].filter(Boolean);

  return rows.length ? rows.join('<br />') : 'Keine Kontaktdaten hinterlegt';
};

const dossierCard = (creator: SelectedCreator) => {
  const details = creator.internal;
  if (!details) return '';

  const rows = detailRows(details);

  return `
    <tr>
      <td style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e1ed;border-radius:16px;background:#ffffff;">
          <tr>
            <td style="padding:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="58" valign="top" style="width:58px;">
                    <div class="creator-avatar" style="width:46px;height:46px;line-height:46px;border-radius:50%;background:#8b3fca;color:#ffffff;text-align:center;font-size:15px;font-weight:800;">${getInitials(creator.name)}</div>
                  </td>
                  <td valign="middle">
                    <div style="font-size:19px;line-height:25px;font-weight:800;color:#21172a;">${htmlEscape(creator.name || 'UGC Creator')}</div>
                    <div style="margin-top:3px;font-size:13px;line-height:19px;color:#746b7c;">${htmlEscape(creator.id)}${headline(details) ? ` · ${htmlEscape(headline(details))}` : ''}</div>
                  </td>
                </tr>
              </table>
              ${pausedBadge(details)}
              <div style="margin-top:14px;">${socialButtons(details.socialAccounts) || '<span style="font-size:13px;color:#817688;">Keine Social-Accounts hinterlegt</span>'}</div>
              <div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:#f8f6fa;font-size:13px;line-height:20px;color:#31283a;">
                <strong>Kontakt:</strong><br />${contactBlock(creator, details)}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                <tr>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-right:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Preisvorstellung</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(cleanText(creator.priceRange, 'Nicht hinterlegt')).replace(/\n/g, '<br />')}</div>
                  </td>
                  <td class="stack-cell" width="50%" valign="top" style="width:50%;padding-left:10px;">
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;">Reichweite</div>
                    <div style="margin-top:4px;font-size:14px;line-height:20px;color:#31283a;">${htmlEscape(cleanText(creator.reach, 'Nicht hinterlegt')).replace(/\n/g, '<br />')}</div>
                  </td>
                </tr>
              </table>
              ${rows ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #eee9f2;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#9a8fa2;margin-bottom:8px;">Alle Details</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table></div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

const dossierText = (creator: SelectedCreator, index: number) => {
  const details = creator.internal;
  if (!details) return `${index + 1}. ${creator.name}`;

  return [
    `${index + 1}. ${creator.name || 'UGC Creator'} (${creator.id})`,
    details.notificationsPaused ? 'ACHTUNG: Benachrichtigungen pausiert – nicht automatisiert anschreiben' : '',
    headline(details),
    `E-Mail: ${creator.contactEmail || 'nicht hinterlegt'}`,
    `Telefon: ${details.phone || 'nicht hinterlegt'}`,
    details.contactText ? `Sonstiger Kontakt: ${cleanText(details.contactText)}` : '',
    `Preis: ${cleanText(creator.priceRange, 'nicht hinterlegt')}`,
    `Reichweite: ${cleanText(creator.reach, 'nicht hinterlegt')}`,
    ...sortedAccounts(details.socialAccounts).map((account) =>
      `${platformName(account.platform)}: ${account.url} (${followerLabel(account.followers)})`),
    details.industries ? `Branchen: ${details.industries}` : '',
    details.topics ? `Themen: ${details.topics}` : '',
    details.preferredContent ? `Wunschformate: ${details.preferredContent}` : '',
    details.equipment ? `Equipment: ${details.equipment}` : '',
    details.experienceSince ? `Erfahrung seit: ${details.experienceSince}` : '',
    details.specialTraits ? `Besonderheiten: ${details.specialTraits}` : '',
    details.portfolioLinks ? `Portfolio: ${details.portfolioLinks}` : '',
  ].filter(Boolean).join('\n');
};

export function renderInternalMatchEmail({
  leadId,
  clientInfo,
  selectedCreators,
  internalEmail,
}: {
  leadId: string;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  internalEmail: string;
}): RenderedEmail {
  const count = selectedCreators.length;
  const searchQuery = cleanText(clientInfo.searchQuery, 'Keine Suchanfrage übermittelt');

  const children = `
    <tr>
      <td class="email-pad" style="padding:8px 42px 22px;">
        <p style="margin:0;font-size:16px;line-height:25px;color:#4a4052;">Hallo ${htmlEscape(clientInfo.name || 'Team')},</p>
        <p style="margin:10px 0 0;font-size:16px;line-height:25px;color:#4a4052;">hier sind die vollständigen Profildaten deiner Auswahl – inklusive Direktkontakt, damit keine zweite Recherche nötig ist.</p>
        <div style="margin-top:18px;padding:14px 16px;border-left:4px solid #c8ff45;border-radius:8px;background:#17121f;color:#ffffff;font-size:14px;line-height:21px;">
          <strong>Suche:</strong> ${htmlEscape(searchQuery)}<br />
          <span style="color:#cfc5d8;">Referenz: ${htmlEscape(leadId)}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td class="email-pad" style="padding:0 42px 25px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${selectedCreators.map(dossierCard).join('')}
        </table>
        <p style="margin:4px 0 0;font-size:12px;line-height:19px;color:#817688;">Die Creator wurden zu dieser Anfrage <strong>nicht</strong> benachrichtigt. Profil-, Preis- und Reichweitenangaben stammen von den Creatorn selbst.</p>
      </td>
    </tr>`;

  const text = `Interne Creator-Dossiers – ${leadId}

Suche: ${searchQuery}

${selectedCreators.map(dossierText).join('\n\n')}

Die Creator wurden zu dieser Anfrage nicht benachrichtigt.
Rueckfragen: ${internalEmail}`;

  return {
    subject: `[INTERN] ${count} Creator-Dossier${count === 1 ? '' : 's'} – ${searchQuery.slice(0, 60)}`,
    html: emailShell({
      preheader: `${count} vollständige Creator-Profile mit Direktkontakt`,
      eyebrow: 'Interne Recherche',
      title: 'Creator-Dossiers',
      children,
      footerNote: 'Interne Auswertung aus der UGC-VZ-Creator-Datenbank. Die enthaltenen Kontaktdaten sind ausschließlich für die Projektanbahnung bestimmt und nicht zur Weitergabe an Dritte.',
    }),
    text,
  };
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

Run: `npm run test:lead-email`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/lib/internal-dossier-email.ts scripts/test-lead-email.ts
git commit -m "Rendere interne Creator-Dossiers mit Kontakt- und Profildaten"
```

---

### Task 4: Migration für die Lead-Markierung

**Files:**
- Create: `db/migrations/004_internal_lead_flag.sql`
- Modify: `app/api/submit-request/route.ts:249-284` (`persistLead`)

**Interfaces:**
- Consumes: `isInternalRequest` aus Task 2
- Produces: `persistLead({ leadId, kind, clientInfo, selectedCreators, isInternal })` — neuer Pflichtparameter `isInternal: boolean`

- [ ] **Step 1: Migration schreiben**

```sql
ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_leads_is_internal_idx
  ON brand_leads (is_internal, created_at DESC);

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('004_internal_lead_flag')
ON CONFLICT (version) DO NOTHING;
```

- [ ] **Step 2: Migration ausführen und Ergebnis prüfen**

Run: `npm run db:migrate`
Expected: Migration `004_internal_lead_flag` wird angewendet, keine Fehlermeldung.

Run: `npm run db:audit`
Expected: läuft ohne Fehler durch. Bricht das Audit wegen der neuen Spalte, ist die Erwartung im Audit-Skript zu ergänzen — nicht die Migration zurückzudrehen.

- [ ] **Step 3: `persistLead` um den Parameter erweitern**

In `app/api/submit-request/route.ts` die Signatur ergänzen:

```ts
async function persistLead({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
  isInternal,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  isInternal: boolean;
}) {
```

Das INSERT-Statement um die Spalte erweitern:

```ts
  const [lead] = await sql.query(`
      INSERT INTO brand_leads (
        public_id, name, email, company, search_query, message, source_url, status, is_internal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted', $8)
      ON CONFLICT (public_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        company = EXCLUDED.company,
        search_query = EXCLUDED.search_query,
        message = EXCLUDED.message,
        source_url = EXCLUDED.source_url,
        is_internal = EXCLUDED.is_internal,
        updated_at = now()
      RETURNING id
    `, [
      leadId,
      clientInfo.name,
      clientInfo.email,
      clientInfo.company || null,
      clientInfo.searchQuery || clientInfo.noResultsQuery || clientInfo.subject || kind,
      clientInfo.message || null,
      clientInfo.sourceUrl || null,
      isInternal,
    ]);
```

Der `creator_snapshot` in `lead_creator_matches` (Zeilen 287-298) bleibt unverändert — dort dürfen keine Privatdaten landen.

- [ ] **Step 4: Aufrufstelle provisorisch anpassen, damit TypeScript durchläuft**

In der POST-Handler-Funktion (`app/api/submit-request/route.ts:708`) den Parameter ergänzen. Der echte Wert kommt in Task 6:

```ts
    const isInternal = isInternalRequest(clientInfo.email);

    const databaseLeadId = await persistLead({
      leadId,
      kind,
      clientInfo,
      selectedCreators,
      isInternal,
    });
```

Den Import in `app/api/submit-request/route.ts:6-17` erweitern:

```ts
  isInternalRequest,
```

- [ ] **Step 5: Typprüfung**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: keine Fehler. Läuft `tsc` in den OOM-Kill (earlyoom), diesen Schritt überspringen und stattdessen `npm run test:lead-email` laufen lassen; die vollständige Typprüfung übernimmt der Vercel-Build in Task 7.

- [ ] **Step 6: Commit**

```bash
git add db/migrations/004_internal_lead_flag.sql app/api/submit-request/route.ts
git commit -m "Markiere interne Leads in der Datenbank"
```

---

### Task 5: Creator-Daten für den internen Pfad laden

**Files:**
- Modify: `app/api/submit-request/route.ts:198-247` (`fetchSelectedCreators`)

**Interfaces:**
- Consumes: `InternalCreatorDetails`, `InternalSocialAccount` aus Task 2
- Produces: `fetchSelectedCreators(creatorIds: string[], options: { internal: boolean }): Promise<SelectedCreator[]>` — bei `internal: true` ist `creator.internal` befüllt

- [ ] **Step 1: Query und Mapping implementieren**

`fetchSelectedCreators` vollständig ersetzen:

```ts
const PUBLIC_CREATOR_COLUMNS = `
        v.public_id,
        v.display_name,
        v.reach_text,
        v.rate_text,
        v.social_links,
        array_to_string(v.networks, ', ') AS network_names`;

// Der interne Pfad hebt das Notification-Gate auf: Mitarbeiter sehen den
// Kontakt auch bei pausierten Creatorn, bekommen den Zustand aber als Feld
// mitgeliefert und in der Mail als Warnung angezeigt.
const INTERNAL_CREATOR_COLUMNS = `${PUBLIC_CREATOR_COLUMNS},
        v.birth_year,
        v.gender,
        v.city,
        v.country_code,
        v.height_cm,
        v.special_traits,
        v.experience_since,
        v.industries,
        v.topics,
        v.skin_type,
        v.pet_context,
        v.children_context,
        v.preferred_content,
        v.equipment,
        v.total_reach,
        v.portfolio_links,
        v.profile_quality_score,
        c.email AS contact_email,
        c.phone,
        c.contact_text,
        c.email_verified_at,
        COALESCE(c.project_notifications_enabled, false) AS notifications_enabled,
        c.notification_paused_at,
        COALESCE(s.accounts, '[]'::json) AS social_accounts`;

const PUBLIC_CONTACT_COLUMN = `,
        CASE
          WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL THEN c.email
          ELSE NULL
        END AS contact_email`;

const INTERNAL_SOCIAL_JOIN = `
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'platform', a.platform,
          'handle', a.handle,
          'url', a.url,
          'followers', a.followers,
          'isPrimary', a.is_primary
        ) ORDER BY a.is_primary DESC, a.followers DESC NULLS LAST) AS accounts
        FROM creator_social_accounts a
        WHERE a.creator_id = v.id
      ) s ON true`;

const approximateAge = (birthYear: number | null) =>
  birthYear ? new Date().getFullYear() - birthYear : null;

const mapSocialAccounts = (value: unknown): InternalSocialAccount[] => {
  const raw = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry) => entry && typeof entry.url === 'string')
    .map((entry) => ({
      platform: plainText(entry.platform, 40) || 'other',
      handle: plainText(entry.handle, 80),
      url: plainText(entry.url, 300),
      followers: Number.isFinite(Number(entry.followers)) && entry.followers !== null
        ? Number(entry.followers)
        : null,
      isPrimary: Boolean(entry.isPrimary),
    }));
};

const mapInternalDetails = (row: any): InternalCreatorDetails => {
  const birthYear = row.birth_year === null || row.birth_year === undefined
    ? null
    : Number(row.birth_year);

  return {
    birthYear,
    approxAge: approximateAge(birthYear),
    gender: plainText(row.gender, 40),
    city: plainText(row.city, 80),
    countryCode: plainText(row.country_code, 2),
    heightCm: row.height_cm === null || row.height_cm === undefined ? null : Number(row.height_cm),
    phone: plainText(row.phone, 40),
    contactText: multilineText(row.contact_text, 400),
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at).toISOString() : null,
    notificationsPaused: !row.notifications_enabled || Boolean(row.notification_paused_at),
    socialAccounts: mapSocialAccounts(row.social_accounts),
    portfolioLinks: multilineText(row.portfolio_links, 600),
    totalReach: Number(row.total_reach) || 0,
    industries: multilineText(row.industries, 400),
    topics: multilineText(row.topics, 400),
    preferredContent: multilineText(row.preferred_content, 400),
    equipment: multilineText(row.equipment, 400),
    experienceSince: plainText(row.experience_since, 80),
    specialTraits: multilineText(row.special_traits, 400),
    skinType: plainText(row.skin_type, 80),
    petContext: multilineText(row.pet_context, 200),
    childrenContext: multilineText(row.children_context, 200),
    profileQualityScore: Number(row.profile_quality_score) || 0,
  };
};

async function fetchSelectedCreators(
  creatorIds: string[],
  { internal }: { internal: boolean },
): Promise<SelectedCreator[]> {
  const neonIds = creatorIds.filter((id) => /^UGC-[A-F0-9]{10}$/.test(id));
  if (neonIds.length !== creatorIds.length) {
    throw new Error('Invalid creator ID format');
  }

  const creatorsById = new Map<string, SelectedCreator>();

  if (neonIds.length) {
    if (!isDatabaseConfigured()) throw new Error('Creator database is not configured');
    const sql = getDatabase();
    const placeholders = neonIds.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await sql.query(`
      SELECT
        ${internal ? INTERNAL_CREATOR_COLUMNS : `${PUBLIC_CREATOR_COLUMNS}${PUBLIC_CONTACT_COLUMN}`}
      FROM creator_search_public v
      LEFT JOIN creator_private_contacts c ON c.creator_id = v.id${internal ? INTERNAL_SOCIAL_JOIN : ''}
      WHERE v.public_id IN (${placeholders})
    `, neonIds);

    for (const row of rows as any[]) {
      creatorsById.set(String(row.public_id), {
        id: String(row.public_id),
        name: plainText(row.display_name, 100) || 'UGC Creator',
        reach: multilineText(row.reach_text, internal ? 1_500 : 300),
        networks: plainText(row.network_names, 300),
        priceRange: multilineText(row.rate_text, internal ? 1_500 : 200),
        contactEmail: emailRegex.test(String(row.contact_email || '')) ? String(row.contact_email).slice(0, 160) : '',
        socialLinks: multilineText(row.social_links, 500),
        ...(internal ? { internal: mapInternalDetails(row) } : {}),
      });
    }

    if (rows.length !== neonIds.length) throw new Error('One or more creator profiles are unavailable');
  }

  return creatorIds.map((id) => {
    const creator = creatorsById.get(id);
    if (!creator) throw new Error('Creator profile not found');
    return creator;
  });
}
```

Den Import in `app/api/submit-request/route.ts:6-17` um die Typen erweitern:

```ts
  type InternalCreatorDetails,
  type InternalSocialAccount,
```

- [ ] **Step 2: Aufrufstelle anpassen**

In der POST-Handler-Funktion (`app/api/submit-request/route.ts:704-706`):

```ts
    const selectedCreators = kind === 'creator_match'
      ? await fetchSelectedCreators(creatorIds, { internal: isInternal })
      : [];
```

- [ ] **Step 3: Typprüfung**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: keine Fehler. Bei OOM-Kill überspringen, Vercel-Build in Task 7 deckt es ab.

- [ ] **Step 4: Commit**

```bash
git add app/api/submit-request/route.ts
git commit -m "Lade vollstaendige Creator-Daten fuer interne Anfragen"
```

---

### Task 6: Versand, Outreach-Sperre und Slack-Kennzeichnung

**Files:**
- Modify: `app/api/submit-request/route.ts:28-36` (`CreatorOutreachSummary`), `:438-565` (`dispatchLeadEmails`), `:567-620` (`sendSlackNotification`), POST-Handler

**Interfaces:**
- Consumes: `renderInternalMatchEmail` aus Task 3, `isInternal` aus Task 4, angereicherte Creator aus Task 5
- Produces: `dispatchLeadEmails({ leadId, kind, clientInfo, selectedCreators, isInternal })`, `sendSlackNotification({ leadId, kind, clientInfo, selectedCreators, delivery, isInternal })`, `CreatorOutreachSummary` mit zusätzlichem Feld `skippedInternal: number`

- [ ] **Step 1: Summary-Typ erweitern**

```ts
type CreatorOutreachSummary = {
  enabled: boolean;
  eligible: number;
  queued: number;
  failed: number;
  skippedNoEmail: number;
  skippedDaily: number;
  skippedLimit: number;
  // Interne Recherchen loesen keine Creator-Mails aus. Ohne eigenes Feld sae-
  // he das in der Statusmail wie ein Fehlschlag aus.
  skippedInternal: number;
};
```

Im Early-Return-Zweig ohne `RESEND_API_KEY` (`app/api/submit-request/route.ts:451-464`) das Feld ergänzen:

```ts
      creatorOutreach: {
        enabled: false,
        eligible: 0,
        queued: 0,
        failed: 0,
        skippedNoEmail: selectedCreators.length,
        skippedDaily: 0,
        skippedLimit: 0,
        skippedInternal: 0,
      },
```

- [ ] **Step 2: `dispatchLeadEmails` umbauen**

Signatur erweitern:

```ts
async function dispatchLeadEmails({
  leadId,
  kind,
  clientInfo,
  selectedCreators,
  isInternal,
}: {
  leadId: string;
  kind: LeadKind;
  clientInfo: LeadClientInfo;
  selectedCreators: SelectedCreator[];
  isInternal: boolean;
}): Promise<EmailDispatchResult> {
```

Die Auswahl der Brand-Mail (`app/api/submit-request/route.ts:470-474`) ersetzen:

```ts
  const brandEmail = kind === 'creator_match'
    ? (isInternal
      ? renderInternalMatchEmail({ leadId, clientInfo, selectedCreators, internalEmail })
      : renderBrandMatchEmail({ leadId, clientInfo, selectedCreators, internalEmail }))
    : kind === 'no_results'
      ? renderNoResultsEmail({ leadId, clientInfo })
      : renderContactAcknowledgementEmail({ leadId, clientInfo });
```

Die Outreach-Bedingung (`app/api/submit-request/route.ts:504-505`) erweitern:

```ts
  // Interne Recherche ist keine Brand-Anfrage. Wuerden hier Creator-Mails
  // rausgehen, bekaemen Creator ein Interessenssignal fuer eine Anfrage, die
  // keine ist.
  const shouldEmailCreators = process.env.SEND_CREATOR_OUTREACH_EMAILS === 'true'
    && kind === 'creator_match'
    && !isInternal;
```

Das Summary-Objekt (`app/api/submit-request/route.ts:554-562`) ergänzen:

```ts
  const creatorOutreach: CreatorOutreachSummary = {
    enabled: shouldEmailCreators,
    eligible: limitedCreators.length,
    queued: creators.filter((result) => result.status === 'queued').length,
    failed: creators.filter((result) => result.status === 'failed').length,
    skippedNoEmail: selectedCreators.length - withEmail.length,
    skippedDaily,
    skippedLimit: Math.max(0, withEmail.length - limitedCreators.length),
    skippedInternal: isInternal ? selectedCreators.length : 0,
  };
```

Den Import oben in der Datei ergänzen:

```ts
import { renderInternalMatchEmail } from '@/app/lib/internal-dossier-email';
```

- [ ] **Step 3: Slack kennzeichnen**

In `sendSlackNotification` die Signatur um `isInternal: boolean` erweitern und ausschließlich die Labels anpassen — **keine** zusätzlichen Creator-Daten:

```ts
  const kindLabel = `${isInternal ? '[INTERN] ' : ''}${kind === 'creator_match'
    ? 'Creator-Anfrage'
    : kind === 'no_results'
      ? 'Anfrage ohne Treffer'
      : 'Kontaktanfrage'}`;
```

Und die Outreach-Zeile (`app/api/submit-request/route.ts:593-595`) um den internen Fall ergänzen:

```ts
  const creatorMailStatus = isInternal
    ? `🔒 Interne Recherche · ${outreach.skippedInternal} Creator nicht benachrichtigt`
    : outreach.enabled
      ? `📨 Creator-Mails: ${outreach.queued} angenommen, ${outreach.failed} fehlgeschlagen, ${outreach.skippedNoEmail} ohne E-Mail, ${outreach.skippedDaily} heute bereits informiert${outreach.skippedLimit ? `, ${outreach.skippedLimit} wegen Versandlimit zurückgestellt` : ''}`
      : `⏸️ Creator-Mails deaktiviert · ${outreach.eligible} mit E-Mail versandfähig, ${outreach.skippedNoEmail} ohne hinterlegte E-Mail`;
```

Die Zeile `creatorSummary` (`app/api/submit-request/route.ts:596-598`) bleibt **unverändert**.

- [ ] **Step 4: POST-Handler verdrahten**

```ts
    const delivery = await dispatchLeadEmails({
      leadId,
      kind,
      clientInfo,
      selectedCreators,
      isInternal,
    });
```

```ts
      await sendSlackNotification({
        leadId,
        kind,
        clientInfo,
        selectedCreators,
        delivery,
        isInternal,
      });
```

Der Response-Block (`app/api/submit-request/route.ts:757-761`) bleibt **unverändert**.

- [ ] **Step 5: Response-Invariante verifizieren**

Run: `grep -n "NextResponse.json" app/api/submit-request/route.ts`
Expected: Jeder Treffer gibt ausschließlich `success`, `error`, `leadId` oder `delivery` zurück. Taucht irgendwo `selectedCreators` oder ein Creator-Feld auf, ist die Sicherheitsinvariante verletzt — korrigieren.

- [ ] **Step 6: Tests und Typprüfung**

Run: `npm run test:lead-email`
Expected: PASS

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: keine Fehler. Bei OOM-Kill überspringen.

- [ ] **Step 7: Commit**

```bash
git add app/api/submit-request/route.ts
git commit -m "Versende Dossiers intern und unterdruecke den Creator-Outreach"
```

---

### Task 7: Deploy und Live-Verifikation

**Files:** keine

- [ ] **Step 1: Push und Vercel-Build abwarten**

```bash
git push origin main
```

Run: `timeout 120 vercel ls ugc-vz --scope team_qEAR4clr473i64mzqkUeNveQ | head -5`
Expected: Ein neuer Production-Deployment mit Status `● Ready`. Bei `● Error` die Build-Logs prüfen: `vercel inspect --logs <deployment-url>`. Bricht die Vercel-CLI mit „Terminated" ab, ist das ein lokaler OOM-Kill und kein Deploy-Fehler — Status über die Live-Domain prüfen.

- [ ] **Step 2: Interne Anfrage live testen**

Eine echte Anfrage über die Suche auf ugc-vz.de mit einer erreichbaren `@famefact.com`-Adresse stellen und zwei bis drei Creator auswählen.

Erwartetes Ergebnis:
- Im famefact-Postfach liegt eine Mail mit Betreff `[INTERN] … Creator-Dossier…`
- Sie enthält Telefonnummer, Altersangabe und Followerzahlen
- Slack meldet `[INTERN]` und `🔒 Interne Recherche`
- Die ausgewählten Creator haben **keine** Auswahl-Mail bekommen

- [ ] **Step 3: Externe Anfrage als Gegenprobe**

Dieselbe Suche mit einer externen Adresse wiederholen.

Erwartetes Ergebnis: die gewohnte Brand-Mail ohne Telefonnummer, ohne Alter, ohne Followerzahlen.

- [ ] **Step 4: Datenbank prüfen**

```sql
SELECT public_id, email, is_internal, created_at
FROM brand_leads
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Der famefact-Lead hat `is_internal = true`, der externe `false`.
