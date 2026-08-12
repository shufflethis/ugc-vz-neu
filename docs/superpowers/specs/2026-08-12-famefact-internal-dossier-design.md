# Interne Creator-Dossiers für famefact-Adressen

Status: freigegeben, bereit für den Implementierungsplan
Datum: 2026-08-12

## Problem

Mitarbeiter von famefact nutzen die öffentliche Creator-Suche auf ugc-vz.de, bekommen aber
dieselbe reduzierte Ergebnis-Mail wie externe Brands: Name, Preis, Netzwerke, Reichweite,
Kontakt-E-Mail. Alles Weitere — Telefon, Alter, Stadt, Followerzahlen, Branchen, Equipment —
steht zwar in der Datenbank, ist aber nur über den token-geschützten CSV-Export
(`app/api/creators/private-export.csv`) erreichbar. Das erzwingt eine zweite Recherche pro
Anfrage und verzögert die Kontaktaufnahme.

Ziel: Wird eine Anfrage mit einer `@famefact.com`-Adresse gestellt, enthält die Ergebnis-Mail
den vollständigen Datensatz der ausgewählten Creator — die entscheidungsrelevanten Felder
prominent, der Rest vollständig darunter.

## Sicherheitsmodell

**Das Postfach ist die Authentifizierung, nicht der Request.** Jeder kann `x@famefact.com` in
das Formular tippen. Der Schutz besteht ausschließlich darin, dass die angereicherte Mail an
genau diese Adresse zugestellt wird und damit nur in einem echten famefact-Postfach landet.

Daraus folgen zwei Invarianten, die die Implementierung nicht verletzen darf:

1. **Angereicherte Daten verlassen den Server nur per E-Mail.** Die HTTP-Antwort von
   `POST /api/submit-request` bleibt `{ success, leadId }` beziehungsweise die bestehende
   Fehlerform. Käme auch nur ein Feld in die Response, wäre die Domainprüfung durch simples
   Eintippen einer fremden Adresse aushebelbar.
2. **Slack bekommt keine zusätzlichen Daten.** Mitgliedschaft in einem Slack-Kanal ist nicht
   dasselbe wie Kontrolle über ein famefact-Postfach. Die Slack-Meldung erhält lediglich ein
   `[INTERN]`-Präfix.

Die Domainprüfung ist ein Suffix-Anker auf der vollständigen Adresse:

```ts
const INTERNAL_EMAIL_PATTERN = /@famefact\.com$/i;
const isInternalRequest = (email: string) =>
  INTERNAL_EMAIL_PATTERN.test(email.trim().toLowerCase());
```

Ein `includes('famefact.com')` wäre falsch: `angreifer@famefact.com.evil.de` würde bestehen.
Ebenso scheitert `x@notfamefact.com` korrekt am `@`-Anker.

## Architektur

Ein boolescher Wert wandert durch die bestehende Pipeline. Keine neue Route, kein zweiter
Auth-Mechanismus, alle Nebenwirkungen an einer Stelle steuerbar.

```
POST /api/submit-request
  └─ normalizeRequestBody          → clientInfo
  └─ isInternalRequest(email)      → isInternal
  └─ fetchSelectedCreators(ids, { internal: isInternal })
       └─ internal ? erweiterte Query : bestehende Query
  └─ persistLead({ …, isInternal })         → brand_leads.is_internal
  └─ dispatchLeadEmails({ …, isInternal })
       ├─ Brand-Mail: isInternal ? renderInternalMatchEmail : renderBrandMatchEmail
       ├─ Interne Statusmail: unverändert, mit Kennzeichnung
       └─ Creator-Outreach: bei isInternal übersprungen
  └─ sendSlackNotification({ …, isInternal })  → nur [INTERN]-Präfix
  └─ Response: { success, leadId }             → unverändert
```

Verworfene Alternativen:

- **Eigene Route `/api/internal-lookup`**: dupliziert Lead-Persistenz, Resend-Versand und
  Fehlerbehandlung. Zwei Codepfade, die auseinanderdriften.
- **Mail verlinkt auf den CSV-Export**: minimalster Eingriff, erfüllt aber den Kern der
  Anforderung nicht — die Details sollen in der Mail stehen.

## Datenbeschaffung

`fetchSelectedCreators` (`app/api/submit-request/route.ts:198`) bekommt einen zweiten Parameter
`{ internal }`. Basis bleibt die View `creator_search_public`, also weiterhin nur Profile mit
`status = 'active'`. Der interne Pfad ergänzt:

**Aus `creator_search_public`** — `birth_year`, `gender`, `city`, `country_code`, `height_cm`,
`special_traits`, `experience_since`, `industries`, `topics`, `skin_type`, `pet_context`,
`children_context`, `preferred_content`, `equipment`, `total_reach`, `portfolio_links`,
`profile_quality_score`.

**Aus `creator_private_contacts`** — `email`, `phone`, `contact_text`, `email_verified_at`,
`project_notifications_enabled`, `notification_paused_at`. Das im öffentlichen Pfad genutzte
`CASE WHEN c.project_notifications_enabled AND c.notification_paused_at IS NULL` entfällt hier:
Mitarbeiter sehen den Kontakt auch bei pausierten Creatorn, dafür wird der Pausiert-Zustand als
eigenes Feld mitgeliefert und in der Mail als Warnung gerendert.

**Aus `creator_social_accounts`** — je Konto `platform`, `handle`, `url`, `followers`,
`is_primary`, aggregiert als JSON. Der öffentliche Pfad nutzt nur den zusammengeklebten
`social_links`-String; die Followerzahlen gehen dabei verloren, sind für die interne Auswahl
aber zentral.

**Feldlängen**: `rate_text` wird im öffentlichen Pfad auf 200 Zeichen gekürzt
(`multilineText(row.rate_text, 200)`). Im internen Pfad gilt das volle Feld, ebenso für
`reach_text`. Freitextfelder bleiben durch `htmlEscape` beim Rendern abgesichert.

Typisierung: ein optionales Feld am bestehenden Typ, damit keine der heutigen Render-Funktionen
angefasst werden muss.

```ts
export type InternalCreatorDetails = {
  birthYear: number | null;
  approxAge: number | null;      // aktuelles Jahr − birthYear, nur wenn birthYear gesetzt
  gender: string;
  city: string;
  countryCode: string;
  heightCm: number | null;
  phone: string;
  contactText: string;
  emailVerifiedAt: string | null;
  notificationsPaused: boolean;  // !project_notifications_enabled || notification_paused_at
  socialAccounts: Array<{
    platform: string;
    handle: string;
    url: string;
    followers: number | null;
    isPrimary: boolean;
  }>;
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

export type SelectedCreator = {
  // … bestehende Felder unverändert
  internal?: InternalCreatorDetails;
};
```

`approxAge` wird beim Rendern als „ca. 27 Jahre" ausgegeben. Das Geburtsjahr allein erlaubt
keine exakte Altersangabe — das „ca." ist keine Kosmetik, sondern korrekt.

## Die interne Mail

Neue Funktion `renderInternalMatchEmail` in `app/lib/lead-email.ts`, aufgebaut auf der
bestehenden `emailShell`. Signatur analog zu `renderBrandMatchEmail`, zusätzlich `internalEmail`
für den Footer.

Pro Creator eine Karte in zwei Ebenen:

**Ebene 1 — Entscheidungsdaten**, direkt sichtbar:
- Kopfzeile: Anzeigename · UGC-ID · ca. Alter · Stadt
- Warn-Badge bei `notificationsPaused`: „Benachrichtigungen pausiert — nicht automatisiert
  anschreiben"
- Social-Buttons je Konto mit Plattform und Followerzahl, TikTok und Instagram zuerst
- Preisvorstellung (voller `rate_text`)
- Reichweite (`reach_text` plus `total_reach`)
- E-Mail als `mailto:`-Link, Telefon als `tel:`-Link, sonstiger Kontakttext

**Ebene 2 — „Alle Details"**, darunter als kompakte Feldliste: Branchen, Themen, Wunschformate,
Equipment, Erfahrung seit, Besonderheiten, Hauttyp, Haustier-/Kinder-Kontext, Größe, Gender,
Land, Portfolio-Links, Profil-Score, E-Mail-Verifizierungsdatum. Leere Felder werden
ausgelassen statt mit „Nicht angegeben" gefüllt — bei rund zwanzig Feldern erzeugt das sonst
mehr Rauschen als Information.

Betreff: `[INTERN] 3 Creator-Dossiers – <Suchbegriff>`

Die Marketing-Blöcke der Brand-Mail (Full-Service-Kachel, GEO-Audit, Vertragsvorlage) entfallen.
Stattdessen ein Zweckbindungs-Hinweis im Footer: die Daten stammen aus der
Creator-Datenbank, sind ausschließlich für die Projektanbahnung bestimmt und nicht zur
Weitergabe an Dritte.

Der Text-Teil (`text`) spiegelt dieselbe Struktur — die bestehende `creatorText`-Funktion
bekommt eine interne Variante.

## Verhaltensänderungen

| Aspekt | Extern (unverändert) | Intern |
|---|---|---|
| Brand-Mail | `renderBrandMatchEmail` | `renderInternalMatchEmail` |
| Creator-Outreach | wird versendet | **übersprungen** |
| Interne Statusmail | an `UGC_INTERNAL_EMAIL` | unverändert, gekennzeichnet |
| Slack | Standardmeldung | `[INTERN]`-Präfix, sonst identisch |
| `brand_leads` | `is_internal = false` | `is_internal = true` |
| HTTP-Response | `{ success, leadId }` | identisch |

Das Überspringen des Creator-Outreach ist die wichtigste Verhaltensänderung: nutzt ein
Mitarbeiter das Formular als Datenbank-Lookup, würden Creator sonst eine „Eine Brand hat dein
Profil ausgewählt"-Mail für eine Anfrage bekommen, die keine ist. Das Rückgabeobjekt von
`sendCreatorOutreachEmails` zählt diese Fälle als `skippedInternal`, damit die interne
Statusmail den Grund nennen kann statt einen Fehlschlag zu suggerieren.

## Datenbank

Migration `db/migrations/004_internal_lead_flag.sql`:

```sql
ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- statement-breakpoint
INSERT INTO schema_migrations (version)
VALUES ('004_internal_lead_flag')
ON CONFLICT (version) DO NOTHING;
```

Bewusst eine eigene Spalte statt einer Sonderbelegung von `brand_leads.status`: `status` bildet
den Lead-Lebenszyklus ab (`submitted` und Folgezustände), eine Herkunftsmarkierung dort würde
beide Bedeutungen vermischen und die Statuslogik in `route.ts:347` und
`app/api/webhooks/resend/route.ts` stören.

Ausgeführt wird sie über den vorhandenen Runner: `npm run db:migrate`.

## Tests

Erweiterung von `scripts/test-lead-email.ts` (Repo-Idiom, läuft über `tsx` und übersteht
earlyoom):

1. **Dossier-Rendering**: famefact-Adresse erzeugt eine Mail, die Telefonnummer, Altersangabe
   und Followerzahl enthält.
2. **Keine Leckage extern**: dieselbe Creator-Auswahl mit externer Adresse erzeugt eine Mail
   **ohne** Telefonnummer und ohne Geburtsjahr.
3. **Domainprüfung**: `isInternalRequest` liefert `true` für `info@famefact.com` und
   `Name@FameFact.com`, `false` für `angreifer@famefact.com.evil.de`, `x@notfamefact.com` und
   `famefact.com@gmail.com`.
4. **Pausiert-Badge**: ein Creator mit `notification_paused_at` erscheint mit Kontaktdaten und
   dem Warnhinweis.

Verifikation des Builds erfolgt über Vercel, nicht lokal — auf dem VPS killt earlyoom
`next build`.

## Bewusst nicht enthalten

- Keine UI-Änderung im Formular. Die Erkennung läuft rein serverseitig; ein sichtbarer
  Interne-Suche-Schalter würde die Existenz des Datenpfads nach außen dokumentieren.
- Kein Zugriff auf Creator mit `status != 'active'`. Wer archivierte oder in Prüfung
  befindliche Profile braucht, nutzt weiterhin den CSV-Export.
- Keine Erweiterung des Slack-Inhalts.
- Keine Env-Var für die Domainliste. Kommt eine zweite Hausdomain dazu, ist das eine
  Einzeiler-Änderung an `INTERNAL_EMAIL_PATTERN`.
