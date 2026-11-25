# TikTok & Instagram OAuth-Anleitung + Copy-Paste-Texte & Prompts (UGC VZ)

Die kompletten OAuth-2.0-Endpunkte sind in UGC VZ bereits live eingebaut und schalten sich **automatisch** in `/konto#social-verify` frei, sobald die Environment Variables in Vercel gesetzt sind. Bis zum Abschluss des App Reviews funktioniert für alle Creator weiterhin sofort die **Bio-Code-Verifizierung (`UGCVZ-XXXXXX`)**.

---

## Schnellübersicht: URLs & Vercel Environment Variables

| Plattform | Start-Route (intern) | OAuth Redirect URI (exakt so im Developer Portal eintragen!) | Benötigte Vercel Env-Vars |
| --- | --- | --- | --- |
| **TikTok Login Kit** | `/api/auth/tiktok/start` | `https://ugc-vz.de/api/auth/tiktok/callback` | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| **Instagram Login (Meta)** | `/api/auth/instagram/start` | `https://ugc-vz.de/api/auth/instagram/callback` | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` |

**Pflicht-URLs für beide Developer-Portale:**
- Website URL: `https://ugc-vz.de`
- Privacy Policy URL: `https://ugc-vz.de/datenschutz`
- Terms of Service URL: `https://ugc-vz.de/agb`
- Contact / Support E-Mail: `hi@ugc-vz.de`

---

## Teil 1: TikTok Developer App (Login Kit) – Schritt für Schritt

### 1.1 App anlegen
1. Öffne [https://developers.tiktok.com/](https://developers.tiktok.com/) und melde dich mit eurem Business-/Team-Account an.
2. Klicke auf **Manage Apps → Connect an app**.
3. **App Name:** `UGC VZ`
4. **Category:** `Social Networking` oder `Business / Marketing`
5. **Web / Desktop URL:** `https://ugc-vz.de`
6. **Terms of Service URL:** `https://ugc-vz.de/agb`
7. **Privacy Policy URL:** `https://ugc-vz.de/datenschutz`
8. Unter **Products** das Produkt **Login Kit** hinzufügen.
9. Bei **Login Kit → Web → Redirect URI** exakt eintragen:
   ```text
   https://ugc-vz.de/api/auth/tiktok/callback
   ```
10. **Scopes** aktivieren:
    - `user.info.basic` (Pflicht)
    - `user.info.profile` (für `@username`)
    - `user.info.stats` (für Follower-Zahl)
11. **Client Key** & **Client Secret** kopieren und in Vercel (Production + Preview) eintragen als:
    - `TIKTOK_CLIENT_KEY`
    - `TIKTOK_CLIENT_SECRET`
12. Einmal neu deployen (oder im Sandbox-Modus mit bis zu 10 Test-Accounts unter `/konto#social-verify` sofort testen!).

### 1.2 Copy-Paste-Texte für das TikTok App Review (Englisch)

**App Description / Summary (Copy-Paste):**
```text
UGC VZ (https://ugc-vz.de) is a directory and campaign workspace connecting User-Generated Content (UGC) creators in Germany, Austria, and Switzerland (DACH) with brands. Creators use TikTok Login Kit inside their private creator account (/konto) to verify ownership of their public TikTok handle and display a verified TikTok badge alongside their public follower count when applying to brand campaigns.
```

**Scope Justification – `user.info.basic` & `user.info.profile` (Copy-Paste):**
```text
We request user.info.basic and user.info.profile solely to confirm that the logged-in UGC VZ creator owns the TikTok account they link to their creator profile. We store only their open_id, public username/handle, and profile URL to display a "Verified TikTok" badge in brand campaign applications. We never post content or perform actions on behalf of the user.
```

**Scope Justification – `user.info.stats` (Copy-Paste):**
```text
We request user.info.stats to read the creator's current public follower_count once during account verification so brands reviewing campaign applications see accurate, verified channel reach instead of manually typed estimates.
```

**Reviewer Test Steps (Copy-Paste):**
```text
1. Log in as a creator at https://ugc-vz.de/konto using the demo/reviewer email provided.
2. Scroll to the section "Instagram, TikTok & YouTube verifizieren" (#social-verify).
3. Click "Direkt mit TikTok verbinden →".
4. Complete the TikTok OAuth consent screen.
5. You are redirected back to https://ugc-vz.de/konto?oauth=tiktok_ok#social-verify where your connected TikTok handle now appears with a green "Verifiziert" badge.
```

---

## Teil 2: Instagram / Meta Developer App (Instagram API with Instagram Login)

### 2.1 App anlegen
1. Öffne [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/) → **Create App**.
2. **Use Case:** *Other* → **App Type:** `Business`.
3. **App Name:** `UGC VZ` · **Contact Email:** `hi@ugc-vz.de`.
4. Im Dashboard links unter **Add Product** → **Instagram** → **API setup with Instagram login** auswählen.
5. Unter **Set up Instagram business login → OAuth Redirect URIs** exakt eintragen:
   ```text
   https://ugc-vz.de/api/auth/instagram/callback
   ```
6. Unter **App Settings → Basic**:
   - **Privacy Policy URL:** `https://ugc-vz.de/datenschutz`
   - **Terms of Service URL:** `https://ugc-vz.de/agb`
   - **Data Deletion Instructions URL:** `https://ugc-vz.de/datenschutz`
7. **Instagram App ID** & **Instagram App Secret** (aus dem Instagram-Produkt-Tab, nicht die allgemeine Facebook App ID!) in Vercel eintragen als:
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
8. Vor dem Live-Schalten unter **Roles → Instagram Testers** eure eigenen Instagram Creator-/Business-Konten hinzufügen, die Einladung in der Instagram-App unter *Einstellungen → Website-Berechtigungen → Apps und Websites → Tester-Einladungen* annehmen und direkt testen!

### 2.2 Copy-Paste-Texte für das Meta App Review (Englisch)

**Permission `instagram_business_basic` – Use Case Explanation (Copy-Paste):**
```text
UGC VZ (https://ugc-vz.de) is a DACH creator directory and brand campaign platform. Creators who hold an Instagram Creator or Business account can click "Direkt mit Instagram verbinden" inside their private UGC VZ dashboard (/konto#social-verify).

We use the instagram_business_basic permission exclusively to read the creator's Instagram user_id, public username, and followers_count via https://graph.instagram.com/me. This verifies account ownership and displays a "Verified Instagram" badge to brands reviewing campaign applications. UGC VZ does not publish posts, read private messages, or access private user data.
```

**Reviewer Step-by-Step Instructions (Copy-Paste):**
```text
1. Open https://ugc-vz.de/konto and sign in via magic link (test email provided in review notes).
2. In the "Instagram, TikTok & YouTube verifizieren" card (#social-verify), click "Direkt mit Instagram verbinden →".
3. Authorize with the provided Instagram Creator/Business test account.
4. Observe the redirect back to https://ugc-vz.de/konto?oauth=instagram_ok#social-verify.
5. Verify that the linked @username is listed with a green "Verifiziert" badge.
```

---

## Teil 3: 60-Sekunden-Screencast-Drehbuch (für beide App Reviews Pflicht!)

Beide Plattformen (TikTok & Meta) lehnen Anträge ohne kurzes Bildschirmvideo ab. Nimm einmalig 45–60 Sekunden (Loom / OBS / QuickTime, 1080p, ohne Ton nötig) auf:
1. **0:00–0:10:** Browser zeigt `https://ugc-vz.de/konto` (eingeloggt als Test-Creator).
2. **0:10–0:20:** Kurz zur Karte **„Instagram, TikTok & YouTube verifizieren“** scrollen und Klick auf **„Direkt mit TikTok verbinden →“** (bzw. Instagram) zeigen.
3. **0:20–0:35:** Den offiziellen TikTok- bzw. Instagram-OAuth-Consent-Screen sichtbar im Bild bestätigen (URL-Leiste muss sichtbar sein!).
4. **0:35–0:50:** Automatischer Redirect zurück auf `https://ugc-vz.de/konto?oauth=..._ok#social-verify` → grüne Bestätigungsmeldung + **„Verifiziert“**-Badge am Profil zeigen.
5. **0:50–1:00:** Optional kurz zeigen, dass der Kanal im Profil gespeichert bleibt (Seite einmal neu laden).

---

## Teil 4: Fertige Prompts (für Browser-Agent / Assistenten oder Team-Übergabe)

### Prompt A: TikTok Developer App gemeinsam durchgehen / ausfüllen
```text
Hilf mir Schritt für Schritt dabei, im TikTok for Developers Portal (https://developers.tiktok.com/) eine neue Web-App für UGC VZ (https://ugc-vz.de) mit „Login Kit“ einzurichten und fürs App Review einzureichen.

Eckdaten (exakt so verwenden):
- App-Name: UGC VZ
- Website: https://ugc-vz.de
- Redirect URI: https://ugc-vz.de/api/auth/tiktok/callback
- Privacy Policy: https://ugc-vz.de/datenschutz
- Terms of Service: https://ugc-vz.de/agb
- Scopes: user.info.basic, user.info.profile, user.info.stats
- Zweck: Creator verifizieren im eingeloggten Bereich (/konto#social-verify) einmalig ihren eigenen TikTok-Account (Handle + Follower-Zahl) für das Verifiziert-Badge bei Brand-Kampagnen. Es wird nichts im Namen des Nutzers gepostet.

Führe mich Feld für Feld durch das Portal, gib mir immer exakt den passenden englischen Text zum Einfügen, und prüfe am Ende, welche beiden Keys ich in Vercel als TIKTOK_CLIENT_KEY und TIKTOK_CLIENT_SECRET hinterlegen muss.
```

### Prompt B: Meta / Instagram Developer App gemeinsam durchgehen / ausfüllen
```text
Hilf mir Schritt für Schritt dabei, im Meta for Developers Portal (https://developers.facebook.com/apps/) eine Business-App mit „Instagram API with Instagram Login“ für UGC VZ (https://ugc-vz.de) einzurichten, einen Instagram Tester hinzuzufügen und das App Review für den Scope instagram_business_basic einzureichen.

Eckdaten (exakt so verwenden):
- App-Name: UGC VZ
- App-Typ: Business
- Redirect URI: https://ugc-vz.de/api/auth/instagram/callback
- Privacy Policy & Data Deletion URL: https://ugc-vz.de/datenschutz
- Terms of Service: https://ugc-vz.de/agb
- Scope: instagram_business_basic (nur Lesezugriff auf user_id, username, followers_count über graph.instagram.com/me zur Profil-Verifizierung in /konto#social-verify; kein Posting, keine DMs)

Wichtig: Achte darauf, dass ich am Ende die Instagram App ID & das Instagram App Secret (aus dem Instagram-Produkt-Tab) als INSTAGRAM_APP_ID und INSTAGRAM_APP_SECRET in Vercel eintrage und mir vor dem App Review den kurzen Test mit einem Instagram-Tester-Konto bestätigst.
```

### Prompt C: Nach dem Einrichten (Env-Vars in Vercel prüfen & live testen)
```text
Ich habe jetzt TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, INSTAGRAM_APP_ID und INSTAGRAM_APP_SECRET in Vercel eingetragen (oder einen Teil davon). Hilf mir beim End-to-End-Check:
1. Prüfe, ob /konto#social-verify die neuen OAuth-Buttons anzeigt.
2. Teste den Login-Roundtrip mit einem Sandbox-/Tester-Account.
3. Prüfe, ob der Account danach in creator_social_accounts mit verification_method = 'oauth', verified_at und followers gespeichert ist und im Brand-Workspace (/brand/kampagnen/[id]) mit grünem Verifiziert-Badge erscheint.
```
