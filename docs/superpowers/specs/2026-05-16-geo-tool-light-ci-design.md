# geo-tool Light-CI für ugc-vz.de — Design

**Datum:** 2026-05-16
**Produkt:** ugc-vz.de (track by track GmbH)
**Ziel:** Die dunkle ugc-vz-Site auf eine helle Variante der geo-tool.com-Markenidentität umstellen — conversion-optimiert, ohne bestehenden Content zu verändern.

## Ausgangslage

- Next.js 14.2, App Router, Tailwind 3.4, ~25 Routen.
- Site ist aktuell **komplett dunkel**: Seiten hardcoden `bg-[#0D0D0D]` / `bg-gray-900`, weißer Text, dunkle Translucent-Cards.
- Bestehende Marke: Teal→Blau-Gradient `#2EFFD1 → #2E9FFF`.
- Blast Radius: ~33 Dateien mit dunklen Backgrounds, ~17 mit Gradient-Utility-Klassen, 10 brand-Subpages, 3 creator-Pages, Blog (`.prose`).
- `src/components/Navbar.tsx` ist toter Code ("UGC Directory", falsche Links `/creators` `/pricing`) — die echte Navigation steht inline im `<header>` jeder Seite.

## Entscheidungen (mit User bestätigt)

1. **Umfang:** Komplette Seite inkl. Blog/wissen.
2. **Farben:** Teal→Blau komplett ersetzt durch geo-tool Lime→Violett (`#A8E06A → #8B3FCA`).
3. **Light-Variante:** Hell mit sanften Gradient-Flächen (`grad-subtle`-Washes in Hero/Sections).
4. **Schriften:** Geist/Inter bleiben — keine Font-Umstellung.
5. Content (Texte, Sektionen, Struktur) bleibt 1:1 erhalten — nur Klassen/Farben ändern.

## 1. Token-Fundament

Eine zentrale Quelle: `tailwind.config.js` (`theme.extend.colors`) + `globals.css` (CSS-Variablen + Gradient-Utility-Klassen). Die Gradient-Klassen werden zentral umdefiniert → die ~17 Dateien, die `gradient-text` o. ä. nutzen, aktualisieren sich automatisch.

| Token | Wert | Einsatz |
|---|---|---|
| `--grad-main` | `linear-gradient(135deg, #A8E06A, #8B3FCA)` | CTAs, Headline-Akzent, Badges |
| `--grad-subtle` | Lime→Violett ~6 % Alpha auf Weiß | Hero/Section-Washes |
| Page-BG | `#FFFFFF` | Basis-Hintergrund |
| `surface` | `#F7F7F5` | Cards, Panels |
| `surface-2` | `#EFEFEC` | Nested Elemente |
| `ink` | `#171717` | Primärtext |
| `ink-soft` | `#5A5A5A` | Sekundärtext |
| `geo-violet` | `#8B3FCA` | Text-Akzent (kontraststark auf Weiß) |
| `geo-violet-soft` | `#A870E0` | Hover, sekundärer Akzent |
| `geo-green` | `#A8E06A` | nur Flächen / Borders / Tints |
| `green-deep` | `#6FA82E` | grüne Icons/Checkmarks auf hellem Tint |
| `void` | `#060606` | Footer, optionale dunkle CTA-Bänder |

Tints: `geo-green / 12% alpha` und `geo-violet / 12% alpha` für Badges/Pills.

## 2. Kontrast-Regel (conversion-kritisch)

Lime `#A8E06A` als Text auf Weiß ist nicht WCAG-konform. Daher verbindlich:

- **Lime** = ausschließlich Flächen, Borders, Tints.
- **Violett `#8B3FCA`** = Text-Akzent (Links, Headings-Akzent, Icons).
- **Primär-CTA** = solides Violett `#8B3FCA` + weißer Text.
- **Voller Lime→Violett-Gradient** = Headline-Text (groß, daher lesbar), Hero-Wash, Badges, Sekundär-Buttons.
- Grüne Icons/Checkmarks auf hellem Tint → `green-deep #6FA82E` statt `#A8E06A`.

## 3. Farb-Mapping (alt → neu)

| Alt | Neu |
|---|---|
| `bg-[#0D0D0D]` / dunkle Page-BGs | `bg-white` (+ `grad-subtle`-Wash in Hero/Sections) |
| `gradient-text` (Teal→Blau) | Lime→Violett (`--grad-main`) |
| `text-emerald-300/-400`, `text-teal-400` (Akzent) | `text-geo-violet` |
| `text-emerald-400` (Icons/Checks) | `text-green-deep` |
| dunkle Translucent-Cards (`from-emerald-900/20 …`) | helle Tint-Cards (`bg-surface` bzw. `geo-green/12` + Border `#E8E8E4`) |
| heller Bodytext (`text-gray-200/-300`) | `text-ink-soft` |
| CTA `from-emerald-600 to-blue-600` | solides Violett `bg-geo-violet` |
| Sekundär-Button (Border emerald) | Border `geo-violet`, Text `geo-violet`, Hover-Fill `geo-violet` |

## 4. Sonderfälle

- **Footer** (`src/components/FooterNew.tsx`): bleibt dunkel, umgestellt auf `void #060606`; `gradient-text`-Logo aktualisiert sich über Token.
- **`.prose` / Blog** (`globals.css` + `wissen/`): hell konvertiert — Bodytext `#333`, Headings `#171717`, Links `geo-violet`, Code heller BG (`surface-2`), Blockquote Lime-Border.
- **`Navbar.tsx`**: toter Code — nicht umgestalten, separat zum Löschen flaggen.
- **Klaro/Cookie-CSS** (`klaro-custom.css`): prüfen, ob Markenfarben darin hardcoded sind; ggf. angleichen.
- **Content unverändert**: keine Texte, Sektionen oder Struktur ändern.

## 5. Umsetzung in Phasen

1. **Token-Fundament** — `tailwind.config.js` + `globals.css` (Tokens, Gradient-Klassen, `.prose`-Light, Animationen/Glows auf neue Farben).
2. **Homepage + Kernkomponenten** — `app/page.tsx`, `SearchBox`, `TrustElements`, `ContentCascade`, `ResponsiveCTAButton`, `LogoImage`.
3. **brands/ (10 Seiten) + creator/ (3 Seiten)**.
4. **wissen/Blog** (`page.tsx`, `[slug]`, `ClientWissenContent`) + **faq** + **about**.
5. **Legal-Pages** (agb, impressum, datenschutz, cookies), **Footer**, **Popups** (ContactPopup, CreatorSelectionPopup, ContactButton), **CreatorCard / CreatorSearch / NoResults**.
6. **Visuelle QA** — Screenshots aller Haupttypen, Kontrast-Check, Build-Verifikation (`next build`).

## Erfolgskriterien

- Keine dunklen Page-Backgrounds mehr außer Footer und bewussten CTA-Bändern.
- Keine Teal/Blau-Reste (`#2EFFD1`, `#2E9FFF`, `emerald-*`, `teal-*`, `blue-*` als Markenfarbe).
- Alle Texte WCAG-AA-kontrastkonform; kein Lime-Text auf Weiß.
- `next build` läuft fehlerfrei durch.
- Sämtliche Inhalte (Texte, Sektionen, Links, Schema) unverändert.
