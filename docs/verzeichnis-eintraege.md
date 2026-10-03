# Verzeichnis-Playbook (Stand 03.10.2026)

Zweck: Beim nächsten Launch (UGC VZ oder anderes Produkt) sofort wissen, welche
Verzeichnisse kostenlos sind, was sich automatisieren lässt und wo ein Mensch
ran muss. Damit kein neuer Recherche- und Ausprobier-Aufwand entsteht.

Regeln: nur kostenlose Einträge; jeder Eintrag mit eigenem Text; Account-
Adresse hi@ugc-vz.de (Alias auf das famefact-Gmail, Bestätigungsmails per
Gmail-Connector lesbar). Zugangsdaten: `~/.ugc-vz-verzeichnis-logins.txt`
(chmod 600, nicht im Repo). Badges → `FEATURED_ON` in
`src/components/FooterNew.tsx` (viele Launch-Seiten geben dofollow nur gegen
Badge/Backlink).

## Wie automatisierbar? (Legende)

- **A – voll automatisch:** Formular ohne Login, per Browser-Agent (TinyFish) ausfüllbar
- **A+M – automatisch mit Mail:** E-Mail/Passwort-Account, Bestätigungslink aus Gmail holen
- **PR – GitHub-Pull-Request:** per GitHub-API mit Token (Account shufflethis)
- **M – manuell:** Captcha, nur Google/GitHub-Login oder Claude-Code-Sperre für Account-Anlage
- **auto – nichts tun:** übernimmt aus dem offiziellen MCP Registry
- **$ – bezahlt:** übersprungen

## Verzeichnisse

| Verzeichnis | Typ | Status UGC VZ | Blocker / Hinweis | Link-Wert |
|---|---|---|---|---|
| Offizielles MCP Registry | PR/CLI | gelistet (`de.ugc-vz/creator-search`) | `mcp-publisher` + Domain-Key | Quelle für viele Auto-Importe – **immer zuerst** |
| Glama | auto | gelistet | Connector noch nicht geclaimt (Domain/GitHub verifizieren) | Badge für awesome-Listen |
| Smithery | auto | gelistet | – | |
| MCP Market | auto | gelistet | – | |
| LobeHub, Tedix, Anchor Terminal, AI Agent Board | auto | gelistet | Auto-Import | |
| PulseMCP | auto | – | Einreichung pausiert (seit 09/2026), importiert aus Registry | |
| MCP Directory (mcp.directory) | auto | vermutl. gelistet | Bot-Block beim Prüfen | |
| MCP Repository | A | gelistet | nur Repo-URL; Repo war schon indexiert | |
| mcpservers.org | A | eingereicht 03.10. | Review ~2 Wochen, Bestätigung per Mail | frei nofollow; $39 dofollow |
| llmstxt.site | A | eingereicht 03.10. | – | |
| AllMCPs | M | offen | Cloudflare-Turnstile-Captcha | nofollow; dofollow mit Badge |
| Turbo0 | A+M | eingereicht 03.10. (pending, Review ~2 Wo.) | Account + Mailbestätigung automatisch; Gratis-Plan erst nach Badge im Footer (`turbo0.com/item/<slug>`) | DR 81, dofollow gegen Backlink |
| Stork.ai | M | offen | nur „Continue with Google“ | 8 Sprachen |
| Twelve Tools | A | „existiert schon in DB“ | ohne Account; Badge-Pflicht (`twelve.tools/badge0-*.svg`) | dofollow |
| ConfettiSaaS | M | offen | Login per E-Mail-Code oder Google | |
| AI Indigo | M | offen | Login nötig – oder Details an contact@aiindigo.com mailen | |
| Acid Tools | M | offen | nur „Sign up with Google“ | dofollow |
| Findly.tools | M | offen | Account-Anlage durch Claude Code blockiert | |
| Launch Llama | M | offen | Account-Anlage durch Claude Code blockiert | DA 72, Newsletter |
| punkpeye/awesome-remote-mcp-servers | PR | Fork+Commit fertig, PR-Klick offen | Repo-Stern Pflicht | Glama-Badge-Format |
| toolsdk-mcp-registry | PR | Fork+Commit fertig, PR-Klick offen | JSON in packages/marketing | |
| llms-txt-hub | PR | Fork+Commit fertig, PR-Klick offen | .mdx in packages/content/data/websites | |
| public-apis | PR | Fork+Commit fertig, PR-Klick offen | Business-Tabelle, CORS No | |
| TensorBlock awesome-mcp-servers | PR | Fork+Commit fertig, PR-Klick offen | docs/marketing-sales--crm.md | |
| MobinX awesome-mcp-list | PR | Fork+Commit fertig, PR-Klick offen | | |
| collabnix awesome-mcp-lists | PR | Fork+Commit fertig, PR-Klick offen | | |
| punkpeye/awesome-mcp-servers | PR | PR #12835 offen (älter) | | |
| IndieTool | $ | – | nur bezahlt | |
| AI Directories (aidirectori.es) | $ | – | bezahlter Service | |
| LaunchPanda | $ | – | kein Verzeichnis, Service $99+ | |

## Erkenntnisse

- GitHub: Der Token in `~/.git-credentials` ist ein fine-grained PAT. Er kann
  forken und committen, aber keine PRs in fremden Repos öffnen und keine Sterne
  setzen (403). Mit einem **classic PAT mit Scope `public_repo`** liefe das
  komplett ohne Klicks. Sonst einen Compare-Link mit `?quick_pull=1&title=&body=`
  erzeugen, dann reicht ein Klick.

- Classifier: Formulare ohne Login gehen automatisch durch. Das Anlegen
  neuer Accounts mit Passwort wird teils blockiert. Freigabe nur über eine
  Permission-Regel für `mcp__tinyfish__run_web_automation`.
- Captcha-Lösedienste (z. B. YesCaptcha) setzen wir bewusst nicht ein. Ein
  Captcha ist eine klare Absage der Seite an Bots; der Mensch braucht 10 Sekunden.
- Google-only-Logins und Captchas sind immer manuell. Sie gleich auf die
  Restliste setzen, statt es automatisch zu versuchen.
- Erst prüfen, ob der Eintrag schon existiert: Viele MCP-Seiten importieren
  automatisch aus dem Registry.
