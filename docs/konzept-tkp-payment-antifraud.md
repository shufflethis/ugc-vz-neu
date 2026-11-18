# Konzept: TKP-Kampagnen, Stripe-Connect-Payment & 6-Stufen-Anti-Fraud

Stand: 18.11.2026 · Status: **Architektur- & Sicherheitskonzept** (in der Vorschau unter `/demo` als UI-Flow und Prüf-Simulator abgebildet; produktives Backend noch nicht gebaut).  
Baut auf [konzept-monetarisierung-abgesicherte-projekte.md](konzept-monetarisierung-abgesicherte-projekte.md) sowie dem bestehenden Neon-Datenmodell (`db/migrations/001_creator_platform.sql`) und der Creator-Session (`app/lib/creator-session.ts`) auf.

---

## 1. Ausgangslage & Kerngedanke

Bei TKP-Kampagnen (*Pay-per-1.000-Views*, z. B. 2,00 € bis 5,00 € TKP) besteht ein massiver wirtschaftlicher Anreiz für Missbrauch: Auf einschlägigen SMM-Panels kosten 50.000 künstliche TikTok- oder Reels-Aufrufe oft nur 4 € bis 8 €, würden bei 3,50 € TKP aber 175 € Ausschüttung auslösen. Genauso gefährlich ist „Paid-Arbitrage“ über echte, aber wertlose Billig-Reichweite in Drittländern (z. B. 0,15 € TKP über Ads in Südasien einkaufen und deutschen Marken-TKP abrechnen).

**Das Architektur-Grundprinzip lautet deshalb:**

> **Kein Euro verlässt die Stripe Platform Balance sofort.** Zwischen View-Messung und SEPA-Auszahlung liegt zwingend ein **Zwei-Topf-System (`vorgemerkt` vs. `auszahlbar`)** mit mehrstufiger Kanal-, Zeitreihen-, DACH-Analytics- und Haltefrist-Prüfung.

### Einheitliche Gebühren- & Auszahlungsformel (wie in `/demo` abgestimmt)

- **Brutto-Kampagnenbudget der Marke:** z. B. `2.500,00 €` (zzgl. 19 % USt. auf der B2B-Sammelrechnung)
- **Plattform-Fee:** `19,9 %` vom Kampagnenbudget (`497,50 €`)
- **Creator-Auszahlungstopf:** `80,1 %` (`2.002,50 €`) – gedeckelt auf diesen Betrag; nicht abgerufenes Restbudget wird vorgetragen oder über Stripe erstattet
- **Creator-Satz:** `0 % Abzug` vom im Konto angezeigten TKP-Satz
- **Mindestauszahlung Creator:** `25,00 €` auszahlbares Guthaben per SEPA via *Stripe Connect Express*

---

## 2. Angriffsmatrix: Alle realen Betrugsmaschen & Gegenmaßnahmen

| # | Betrugsmasche | Wie Täter vorgehen | Technische & prozessuale Abwehr |
| --- | --- | --- | --- |
| 1 | **SMM-Panel / Bot-Klicks** | Kauf von 10k–100k Bot-Views für wenige Euro | 4h-Zeitreihen-Poller erkennt Rechteck-Spikes + harte Engagement-Untergrenze (`< 0,8 %` Like-Rate / `0` Shares) + 7-Tage-Haltefrist wartet Plattform-Bot-Purges ab |
| 2 | **Account-Spoofing (Fremd-Clips)** | Einreichen viraler Videos fremder Creator unter eigenem Konto | Pflicht-Verifizierung des Kanals vor Einreichung per **einmaligem Bio-Code (`UGCVZ-xxxx`)** oder OAuth; Handle im Video-Link muss exakt zum bestätigten Kanal gehören |
| 3 | **Alt-Content-Recycling** | Altes Video mit 80k Views nachträglich mit `#anzeige` editieren und einreichen | Harte Zeitstempel-Regel: `video_published_at >= campaign_picked_at` UND Einreichung **max. 24 Std. nach Upload** (`initial_views` wird abgezogen bzw. ab `> 500` abgelehnt) |
| 4 | **Billig-Geo Paid-Arbitrage** | Echte Views per TikTok Promote / Meta Ads für 0,15 € TKP in Indien/Brasilien kaufen | **Pflicht-Nachweis ab 35,00 € Clip-Vergütung** (oder bei Risiko-Score): 5-Sek.-Live-Screenrecording der TikTok/IG-Analytics mit Pull-to-Refresh (Länder + Traffic-Quelle *For You*); KI-Vision liest DACH-% aus |
| 5 | **Meme-Bait & Reuploads** | 20 Sek. fremdes Meme + 0,3 Sek. Produktbild am Ende; oder denselben Clip 5× gespiegelt hochladen | Multimodaler KI-Briefing-Check (Audio-Transkript + Keyframes) + Perceptual Frame/Audio-Hash gegen Dubletten; Cross-Posting teilt sich denselben Motiv-Deckel |
| 6 | **„Post & Delete“** | Views abrechnen und Clip direkt nach Gutschrift löschen oder auf privat stellen | **7-Tage-Haltefrist nach Ende des Zählfensters** + automatischer Live-HTTP-/API-Check unmittelbar vor Wechsel von `vorgemerkt` auf `auszahlbar` + AGB-Mindest-Online-Pflicht (60 Tage) |
| 7 | **Multi-Account-Bonus-Farming** | 10 E-Mail-Konten anlegen, um 10× den `+10 € Starter-Bonus` zu kassieren | Starter-Bonus ist an den **eindeutigen Stripe-KYC-/IBAN-Fingerprint** gebunden (`1× pro realer Person/Steuer-ID`) und wird erst ab 25 € Gesamtauszahlung nach Haltefrist ausgezahlt |

---

## 3. Die 6 Schutzschichten im Detail (Regelwerk & Schwellenwerte)

### Schicht 1: Kanal-Eigentum (`Bio-Code`) & 24h-Frische-Regel

1. **Bio-Code im MVP (null API-Genehmigungsrisiko):**
   - Im Creator-Konto (`creator_social_accounts`) generiert der Server pro Creator einen kurzen Token, z. B. `UGCVZ-4821`.
   - Der Creator setzt den Token kurz in seine öffentliche TikTok-, Instagram- oder YouTube-Bio und klickt auf *„Kanal bestätigen“*.
   - Der Server ruft die öffentliche Profilseite ab, prüft das Vorhandensein des Codes, speichert die kanonische Kanal-ID / den Handle als `verified_at = now()` und sperrt denselben Kanal für alle anderen UGC-VZ-Konten (`UNIQUE (platform, canonical_handle)`). Danach darf der Creator den Code wieder aus der Bio entfernen.
   - *Ausbaustufe:* Optionale Ablösung durch offizielles OAuth (*TikTok Login Kit*, *Instagram Graph API*, *YouTube Data API*).
2. **Frische-Schranke beim Einreichen:**
   - Ein Creator muss die Kampagne zuerst im Konto **picken** (`tkp_campaign_picks.picked_at`).
   - Beim Einreichen der Video-URL liest der Server das Veröffentlichungsdatum (`published_at`, bei TikTok zusätzlich direkt aus der Snowflake-Video-ID bit-kodiert auslesbar – fälschungssicher!).
   - Bedingungen für Annahme:
     - `published_at >= picked_at`
     - `now() - published_at <= interval '24 hours'`
     - `initial_views <= 500` (Startwert wird gespeichert; vergütet wird grundsätzlich nur der Zuwachs `qualified_delta_views = max(0, verified_views - initial_views)`).

### Schicht 2: 4-Stunden-Zeitreihen-Poller & Anomalie-Erkennung

Ein Hintergrund-Cronjob (`/api/cron/tkp-metrics`, alle 4 Stunden für alle aktiven Clips im Zählfenster) speichert unveränderliche Messpunkte (`views`, `likes`, `comments`, `shares`, `saves`).

Ein Clip wechselt automatisch auf Status `flagged` (`reserved_cents = 0`), sobald **eines** dieser Kriterien anschlägt:

- **Engagement-Floor (ab 3.000 Views):** `likes / views < 0.008` (`< 0,8 %` Like-Rate; normale organische Kurzvideos liegen bei 2,5 % bis 10 %).
- **Null-Interaktions-Sperre (ab 10.000 Views):** `(shares + saves) = 0` oder `comments < 2`.
- **Stufen-Spike (Velocity-Anomalie):** Ein einzelnes 4h-Intervall liefert `> 15.000` zusätzliche Views UND `> 80 %` aller bisherigen Gesamtviews, während in den darauffolgenden zwei 4h-Intervallen das Wachstum auf `< 0,5 %` abfällt und `delta_likes / delta_views < 0.003` liegt (klassisches Signaturmuster gekaufter SMM-Pakete).

> Ein automatisch geflaggter Clip ist kein sofortiger Bann: Der Creator kann über ein 5-Sekunden-Analytics-Screenrecording (Schicht 3) nachweisen, dass es sich um echten *For-You*-Traffic handelte.

### Schicht 3: DACH- & Traffic-Quellen-Prüfung (Pflicht ab 35,00 € pro Clip)

Öffentliche Video-Seiten verraten weder Zuschauer-Länder noch bezahlte Bewerbung. Deshalb gilt für jede DACH-Kampagne:

- **Auslöser:** Automatisch sobald der rechnerische Auszahlungsbetrag eines Clips **`>= 35,00 €`** erreicht (`needs_analytics`) **oder** wenn Schicht 2 eine gelbe Warnung wirft.
- **Nachweisformat (schwer fälschbar):** Kein statischer Screenshot (in 30 Sekunden per DevTools manipulierbar), sondern ein **5–8 Sekunden kurzes Bildschirmvideo** direkt aus der TikTok-/Instagram-/YouTube-Studio-App inklusive sichtbarem *Pull-to-Refresh* auf:
  1. **Zuschauer-Standorte** (Anteil Deutschland + Österreich + Schweiz)
  2. **Traffic-Quellen** (Anteil *For You* / *Reels-Tab* / *Shorts-Feed* vs. *Bezahlt* / *Direktlink*)
- **Automatisierte Vorprüfung via Gemini Vision (`@google/generative-ai`, bereits als Dependency installiert):**
  - Extrahiert `views_shown`, `dach_share_pct`, `organic_feed_pct` und prüft, ob `views_shown` plausibel zum letzten Server-Snapshot passt (±15 % Toleranz).
- **Faire 3-Stufen-Abrechnungsformel für DACH-Kampagnen:**
  - **`dach_share_pct >= 70 %`** und `organic_feed_pct >= 75 %` → **100 %** der Netto-Views zählen als `qualified_views`.
  - **`30 % <= dach_share_pct < 70 %`** und `organic_feed_pct >= 75 %` → **Anteilige Wertung:** `qualified_views = round(net_views * (dach_share_pct / 100))`. *(Schützt ehrliche DACH-Creator, deren Clip international im Algorithmus streut, ohne dass die deutsche Marke für Auslands-Views zahlt.)*
  - **`dach_share_pct < 30 %`** oder `organic_feed_pct < 50 %` (Paid/Extern-Dominanz) → **`0,00 €` (`flagged`)**.

### Schicht 4: Multimodaler Briefing-, Kennzeichnungs- & Duplikat-Check

Direkt nach dem Einreichen (einmalig pro Clip, Kosten im Bruchteil-Cent-Bereich):

1. **Caption- & Tag-Check:** Enthält die Beschreibung die Pflicht-Werbekennzeichnung (`Anzeige` / `Werbung`) und ggf. den geforderten Marken-Handle?
2. **Audio-/Frame-Kurzprüfung:** Transkript + 4 verteilte Video-Frames (Sekunde 1, 5, Mitte, Ende) werden gegen die Kampagnen-Requirements geprüft (Sprache Deutsch, Produkt/Thema tatsächlich Hauptinhalt und nicht nur 0,3 Sek. am Ende angehängt).
3. **Duplikat-Schutz (Perceptual Hash):** Über die extrahierten Keyframes + Audio-Dauer wird ein Hash (`pHash`) gebildet. Stimmt er zu `> 90 %` mit einem bereits eingereichten Video überein:
   - **Fremder Creator:** Sofortige Ablehnung (`flagged`, Content-Diebstahl).
   - **Derselbe Creator auf Zweitplattform (z. B. TikTok + IG Reels):** Nur erlaubt, wenn die Kampagne Cross-Posting freigibt; beide Links teilen sich dann zwingend denselben **`max_payout_per_video_cents`-Deckel** pro Motiv (`motif_group_id`).

### Schicht 5: Zwei-Topf-Wallet & 7-Tage-Haltefrist (Escrow-Mechanik)

Jeder Clip durchläuft zwei zeitlich getrennte Phasen:

1. **Zählfenster (`counting_window_days`, z. B. 7 oder 14 Tage ab Einreichung):**
   - Views wachsen, `reserved_cents` blockiert den entsprechenden Betrag im `creator_pot_cents` der Kampagne (damit das Markenbudget niemals überbucht werden kann).
   - Im Creator-Konto erscheint dieser Betrag ausschließlich unter **`Vorgemerkt (in Prüfung / Haltefrist)`**.
2. **Haltefrist (`hold_days = 7` Tage *nach* Ende des Zählfensters):**
   - Nach Ende des Zählfensters ruht der Clip 7 Tage.
   - Am Ende von Tag 7 führt der Server vollautomatisch den **Final-Settlement-Check** aus:
     - Ist die Video-URL weiterhin HTTP 200, öffentlich sichtbar und enthält noch die Pflicht-Kennzeichnung? *(Falls gelöscht oder privat → `settled_cents = 0`, reserviertes Budget fließt zurück in den Kampagnen-Topf bzw. an die Marke.)*
     - Wie hoch ist der aktuelle Live-View-Stand (`post_hold_views`)? Da TikTok, Instagram und YouTube erkannte Bot-Views häufig innerhalb von 48–96 Stunden selbst wieder abziehen, gilt:
       `final_raw_views = LEAST(window_end_views, post_hold_views)`
   - Erst jetzt schreibt das Ledger eine `hold_release`-Buchung: Der Betrag wandert in **`Auszahlbar`** (`available_cents`).

### Schicht 6: Ökonomische Deckel, KYC-Bindung & manuelle Freigabe-Schwelle

- **Deckel pro Video (`max_payout_per_video_cents`):** Begrenzt das maximale Schadenspotenzial eines einzelnen Ausreißers (z. B. `200 €` bei kleinen Bounties, `500–800 €` bei großen Kampagnen).
- **Deckel pro Creator & Kampagne (`max_payout_per_creator_cents`):** Verhindert, dass ein einzelner Account durch Massen-Uploads den gesamten Topf allein leert (z. B. max. 25 % des Kampagnen-Topfs).
- **15-Sekunden-Admin-Gate ab 50,00 €:** Clips unter 50 € laufen bei grünem Score nach der Haltefrist vollautomatisch durch; jeder Einzel-Clip `>= 50,00 €` bekommt im internen Admin-Board ein kurzes Vier-Augen-Häkchen (Video + 5s-Analytics-Clip ansehen → Klick auf *Freigeben*).
- **1× Starter-Bonus pro Stripe-Person:** Nach erfolgreichem *Stripe Connect Express* Onboarding liefert Stripe für Bankkonto und Person eindeutige Fingerprints (`external_account.fingerprint`). Wir speichern ausschließlich einen gehashten Fingerprint (`sha256(secret + fingerprint)`): Taucht dieselbe IBAN oder Person unter einem zweiten Creator-Login erneut auf, wird kein zweiter Starter-Bonus gewährt und Multi-Accounting markiert.

---

## 4. Datenmodell (Neon Postgres – Entwurf Migration `015_tkp_bounties.sql`)

Das Schema knüpft direkt an `creator_profiles(id)` und `creator_social_accounts(id)` aus `001_creator_platform.sql` an. Alle Geldbeträge werden exakt in **Euro-Cent (`integer` / `bigint`)** geführt, niemals als Fließkommazahl.

```sql
-- 1. Bestehende Social-Accounts um Eigentums-Verifizierung erweitern
ALTER TABLE creator_social_accounts
  ADD COLUMN IF NOT EXISTS canonical_handle text,
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS verification_method text
    CHECK (verification_method IS NULL OR verification_method IN ('bio_code', 'oauth')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS creator_social_verified_unique
  ON creator_social_accounts (platform, lower(canonical_handle))
  WHERE verified_at IS NOT NULL AND canonical_handle IS NOT NULL;

-- 2. Stripe-Connect- & Steuer-Profil je Creator (getrennt von oeffentlichen Profildaten!)
CREATE TABLE IF NOT EXISTS creator_payout_accounts (
  creator_id uuid PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE,
  bank_fingerprint_hash text,
  payouts_enabled boolean NOT NULL DEFAULT false,
  kyc_verified_at timestamptz,
  vat_mode text NOT NULL DEFAULT 'kleinunternehmer_19'
    CHECK (vat_mode IN ('kleinunternehmer_19', 'ust_19')),
  vat_id_verified boolean NOT NULL DEFAULT false,
  starter_bonus_claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_payout_fingerprint_idx
  ON creator_payout_accounts (bank_fingerprint_hash)
  WHERE bank_fingerprint_hash IS NOT NULL;

-- 3. TKP-Kampagnen mit hartem Budget-Deckel in Cent
CREATE TABLE IF NOT EXISTS tkp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  brand_name text NOT NULL,
  title text NOT NULL,
  briefing jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft', 'funded', 'live', 'paused', 'completed')),
  total_budget_cents integer NOT NULL CHECK (total_budget_cents >= 10000),
  platform_fee_bps integer NOT NULL DEFAULT 1990 CHECK (platform_fee_bps BETWEEN 0 AND 5000),
  creator_pot_cents integer NOT NULL CHECK (creator_pot_cents >= 0),
  reserved_cents integer NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
  settled_cents integer NOT NULL DEFAULT 0 CHECK (settled_cents >= 0),
  cpm_cents integer NOT NULL CHECK (cpm_cents BETWEEN 50 AND 5000),
  max_payout_per_video_cents integer NOT NULL CHECK (max_payout_per_video_cents > 0),
  max_payout_per_creator_cents integer NOT NULL CHECK (max_payout_per_creator_cents > 0),
  analytics_proof_threshold_cents integer NOT NULL DEFAULT 3500,
  counting_window_days smallint NOT NULL DEFAULT 14 CHECK (counting_window_days BETWEEN 3 AND 60),
  hold_days smallint NOT NULL DEFAULT 7 CHECK (hold_days BETWEEN 3 AND 30),
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reserved_cents + settled_cents <= creator_pot_cents)
);

-- 4. Kampagnen-Pick (Anker fuer published_at >= picked_at)
CREATE TABLE IF NOT EXISTS tkp_campaign_picks (
  campaign_id uuid NOT NULL REFERENCES tkp_campaigns(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  picked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, creator_id)
);

-- 5. Eingereichte Video-Links & Pruefstatus
CREATE TABLE IF NOT EXISTS tkp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES tkp_campaigns(id),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id),
  social_account_id uuid NOT NULL REFERENCES creator_social_accounts(id),
  motif_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('tiktok', 'ig_reels', 'yt_shorts')),
  platform_video_id text NOT NULL,
  video_url text NOT NULL,
  perceptual_hash text,
  video_published_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  counting_ends_at timestamptz NOT NULL,
  hold_ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'tracking'
    CHECK (status IN ('tracking', 'needs_analytics', 'in_hold', 'admin_review', 'settled', 'flagged', 'rejected')),
  initial_views integer NOT NULL DEFAULT 0 CHECK (initial_views >= 0),
  latest_raw_views integer NOT NULL DEFAULT 0 CHECK (latest_raw_views >= 0),
  qualified_views integer NOT NULL DEFAULT 0 CHECK (qualified_views >= 0),
  dach_share_pct smallint CHECK (dach_share_pct IS NULL OR dach_share_pct BETWEEN 0 AND 100),
  analytics_proof_url text,
  reserved_cents integer NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
  settled_cents integer NOT NULL DEFAULT 0 CHECK (settled_cents >= 0),
  status_reason text,
  UNIQUE (platform, platform_video_id)
);

-- 6. Append-only 4h-Metrik-Zeitreihe
CREATE TABLE IF NOT EXISTS tkp_metric_snapshots (
  id bigserial PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES tkp_submissions(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  views integer NOT NULL CHECK (views >= 0),
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  anomaly_flags text[] NOT NULL DEFAULT '{}'
);

-- 7. Unveraenderliches Hauptbuch (kein UPDATE/DELETE, analog lead_agent_events)
CREATE TABLE IF NOT EXISTS tkp_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profiles(id),
  campaign_id uuid REFERENCES tkp_campaigns(id),
  submission_id uuid REFERENCES tkp_submissions(id),
  entry_type text NOT NULL CHECK (entry_type IN (
    'hold_release_credit',
    'starter_bonus_credit',
    'fraud_clawback_debit',
    'stripe_payout_debit'
  )),
  amount_cents integer NOT NULL, -- positiv = Gutschrift, negativ = Auszahlung/Storno
  stripe_transfer_id text,
  credit_note_number text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

> **Wichtiger Schutz gegen Überbuchung (Race-Condition-Lock):**  
> Jede Erhöhung von `reserved_cents` oder Umwandlung in `settled_cents` läuft in einer Datenbank-Transaktion mit `SELECT id, creator_pot_cents, reserved_cents, settled_cents FROM tkp_campaigns WHERE id = $1 FOR UPDATE`. Der Check `CHECK (reserved_cents + settled_cents <= creator_pot_cents)` auf Datenbank-Ebene garantiert mathematisch, dass niemals auch nur 1 Cent mehr vergeben werden kann, als im Creator-Topf der Marke liegt.

---

## 5. Stripe Connect & Automatisches Gutschriftsverfahren

### 5.1 Geldfluss über *Separate Charges and Transfers*

```
[Marke]
   │ 1. Zahlt z. B. 2.500 € + 19 % USt. per Stripe SEPA Bank Transfer (Customer Balance)
   ▼
[Stripe Platform Balance (reguliert bei Stripe)]
   │ 19,9 % Plattform-Fee (497,50 €) → verbleiben als Plattform-Umsatz
   │ 80,1 % Creator-Topf (2.002,50 €) → zweckgebunden reserviert (transfer_group = camp_slug)
   │
   │ 2. Views laufen durch Schicht 1–5 + 7 Tage Haltefrist → Ledger bucht hold_release_credit
   │ 3. Creator klickt ab >= 25,00 € auf „Auszahlung abrufen“
   ▼
[Stripe Transfer -> Connected Express Account des Creators]
   │ stripe.transfers.create({ amount, currency: 'eur', destination: acct_..., transfer_group })
   ▼
[SEPA-Girokonto des Creators] + [Automatische PDF-Gutschrift (GS-2026-xxxxx)]
```

Warum **Stripe SEPA Bank Transfer (`customer_balance`)** für Marken ab 1.000 € entscheidend ist:
- Bei Kreditkartenzahlung würden 1,5 % bis 2,9 % (~37 € bis 72 € bei 2.500 €) an Karten-Gebühren verloren gehen.
- Bei *Stripe Bank Transfers* erhält jede Marke eine eigene virtuelle DE-IBAN von Stripe für die Überweisung; die Stripe-Gebühr liegt bei ~0,5 % und ist **auf maximal 5,00 € gedeckelt**, inklusive automatischem Zahlungsabgleich per Webhook (`payment_intent.succeeded`).

### 5.2 Formale Anforderungen an die automatische PDF-Gutschrift (§ 14 Abs. 2 Satz 2 UStG)

Eine Abrechnung durch den Leistungsempfänger (UGC VZ / track by track GmbH gegenüber dem Creator) heißt umsatzsteuerlich **Gutschrift** und ersetzt die Creator-Rechnung nur dann rechtssicher, wenn alle Pflichtpunkte erfüllt sind:

1. **Vorherige Vereinbarung:** Der Creator stimmt im Onboarding ausdrücklich der Abrechnung im Gutschriftsverfahren zu.
2. **Das Wort „Gutschrift“** muss als Dokumenttitel auf dem PDF stehen.
3. **Steuer-Weiche & Verifikation:**
   - **Option A (`kleinunternehmer_19`):** Netto = Auszahlungsbetrag, `0,00 €` USt., Pflichthinweis *„Kein Ausweis von Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung)“* + Steuernummer des Creators.
   - **Option B (`ust_19`):** Netto + **19 % USt.** wird nur freigeschaltet, wenn der Creator eine gültige deutsche **Steuernummer oder USt-IdNr.** hinterlegt hat (bei USt-IdNr. automatische Prüfung gegen die VIES-/BZSt-Schnittstelle). Ohne gültige Nummer bleibt Option B gesperrt – so verhindert ihr unberechtigten Vorsteuerabzug nach § 14c UStG!
4. **Fortlaufender Nummernkreis:** Lückenlose Vergabe über eine Postgres-Sequence (z. B. `GS-2026-00001`).
5. **DAC7-Meldepflicht:** Über *Stripe Connect Express* erhebt und verifiziert Stripe Name, Anschrift, Geburtsdatum, Steuer-ID (TIN) und IBAN. Werden 30 Transaktionen oder 2.000 € pro Kalenderjahr überschritten, liegen alle Pflichtdaten bereits strukturiert vor.

---

## 6. Schlanker Umsetzungsplan: Kaltstart vs. Skalierung

Ihr müsst für die erste eigene 1.000-€-Launch-Kampagne nicht alles auf einmal bauen:

### Phase 1 · MVP für die 1.000-€-Eigenkampagne & ersten Pilot-Kunden (~5–7 Entwicklungstage)
- **Kanal-Check:** Bio-Code (`UGCVZ-xxxx`) auf bestehender Tabelle `creator_social_accounts` + 24h-Frische-Prüfung.
- **View-Tracking:** Schlanker 4h-Cronjob auf Vercel/VPS, der öffentliche Metadaten der eingereichten URLs abruft und Stufen-Spikes / `< 0,8 %` Like-Rate markiert.
- **DACH-Schutz:** Upload-Feld für das 5-Sekunden-Analytics-Screenrecording ab `35,00 €` im bestehenden `/konto` (anfangs 15-Sekunden-Sichtprüfung durch euch im Admin-Board, noch bevor KI-Vision nötig ist!).
- **Auszahlung:** *Stripe Connect Express* Onboarding-Link + `7 Tage Haltefrist` + Auszahlungs-Freigabe per Knopfdruck im Admin-Cockpit inkl. generiertem Gutschrifts-PDF.

### Phase 2 · Vollautomatik ab ~5+ parallelen Marken-Kampagnen
- Selbstbedienungs-Einzahlung für Brands via *Stripe SEPA Bank Transfer* + automatische B2B-Rechnung.
- Automatische Vorprüfung der 5-Sekunden-Analytics-Videos & des Video-Inhalts über `@google/generative-ai` (Gemini Flash) + Perceptual Hash gegen Reuploads.
- Offizielle OAuth-Verknüpfung (*TikTok Login Kit / IG Graph*) als 1-Klick-Alternative zum Bio-Code, um Demografie-Insights komplett ohne Video-Upload auszulesen.

---

## 7. Offene Rechts- & Steuer-Prüfpunkte vor Produktivschaltung

Vor der ersten echten Euro-Einzahlung einer Drittmarke kurz durch Anwalt / Steuerberater bestätigen lassen:

1. **ZAG / BaFin bei Stripe Connect (*Separate Charges and Transfers*):** Prüfen, wie lange eingezahlte Marken-Budgets in der *Stripe Platform Balance* gehalten werden dürfen (Standard bei Stripe Connect in der EU ist in der Regel bis zu 90 Tage zweckgebunden vor Transfer) und dass vertraglich klar geregelt ist: **UGC VZ kauft Reichweiten-/Content-Leistungen im eigenen Namen ein** (Kommissions-/Leistungsketten-Modell: `Marke ↔ UGC VZ` und `UGC VZ ↔ Creator`), sodass kein erlaubnispflichtiges Finanztransfergeschäft für fremde Rechnung vorliegt. Das deckt sich exakt mit eurem Wunsch nach **1 B2B-Sammelrechnung (19 % USt.) an die Marke** + **Gutschrift an die Creator**!
2. **Muster-Gutschrift (§ 14 Abs. 2 UStG):** Einmalige Freigabe des PDF-Layouts für §-19-Kleinunternehmer und 19-%-Regelbesteuerte durch euren Steuerberater.
3. **Teilnahmebedingungen Creator:** Verfallklausel bei künstlicher Reichweitensteigerung, Löschverbot vor Ablauf von 60 Tagen und Zustimmung zum Gutschriftsverfahren.
