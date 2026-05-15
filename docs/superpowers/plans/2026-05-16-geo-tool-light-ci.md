# geo-tool Light-CI für ugc-vz.de — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die dunkle ugc-vz.de-Site auf eine helle Variante der geo-tool.com-Markenidentität (Lime→Violett) umstellen, ohne Inhalte zu verändern.

**Architecture:** Token-First. Phase 1 definiert alle Marken-Tokens zentral in `tailwind.config.js` und `globals.css`; die Gradient-Utility-Klassen aktualisieren ~17 Dateien automatisch. Phasen 2–5 wenden ein festes Farb-Mapping pro Seite/Komponente an. Phase 6 verifiziert visuell.

**Tech Stack:** Next.js 14.2 (App Router), Tailwind CSS 3.4, TypeScript, React 18.

**Spec:** `docs/superpowers/specs/2026-05-16-geo-tool-light-ci-design.md`

---

## Mapping-Referenz (zentraler Vertrag)

Jede Reskin-Task wendet diese Tabelle an. **Gilt nur für Elemente auf hellem Hintergrund.** Der Footer (`FooterNew.tsx`) bleibt dunkel und ist ausgenommen.

| Alt (Klasse / Wert) | Neu |
|---|---|
| `bg-[#0D0D0D]`, `bg-[#0a0a0a]`, `bg-black` (Page-/Section-BG) | `bg-white` |
| `bg-gray-900`, `bg-gray-900/30`, `bg-gray-800` (Section-Wash) | `grad-subtle` Klasse, oder `bg-surface` |
| `bg-gradient-to-b from-transparent to-gray-900/30` u. ä. | entfernen oder durch `grad-subtle` ersetzen |
| `gradient-text` Utility | bleibt — wird zentral in globals.css umgefärbt |
| `text-emerald-300`, `text-emerald-400` (als Text-Akzent), `text-teal-400`, `text-teal-300`, `text-blue-300`, `text-blue-400` | `text-geo-violet` |
| `text-emerald-400` / `text-emerald-300` als Häkchen-/Icon-Farbe (z. B. `<span>✓</span>`) | `text-green-deep` |
| `text-purple-300`, `text-pink-300` (Text-Akzent) | `text-geo-violet` |
| dunkle Translucent-Cards: `bg-gradient-to-br from-emerald-900/20 to-emerald-800/10`, `from-blue-900/...`, `from-purple-900/...` | `bg-surface` (Klasse `surface-card` für BG+Border) |
| `border-emerald-700/30`, `border-blue-700/30`, `border-purple-700/30`, `border-gray-800` | `border-hairline` |
| Bodytext hell: `text-gray-200`, `text-gray-300`, `text-gray-100` | `text-ink-soft` |
| `text-white` (Überschriften/Body auf dunklem BG) | `text-ink` |
| `hover:text-white` | `hover:text-ink` |
| Primär-CTA: `bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500` | `bg-geo-violet hover:bg-geo-violet-soft` |
| Sekundär-Button: `border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-white` (auch `border-2`) | `border border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white` |
| `bg-emerald-500/600/700` (Solid-Flächen) | `bg-geo-violet` |
| Hero-Akzent `from-purple-900/20 to-pink-900/20` BG-Card | `surface-card` |
| `#2EFFD1`, `#2E9FFF` (Roh-Hex) | über Token; im Code → `var(--geo-green)` / `var(--geo-violet)` |

**Verbotene Rest-Muster** (Grep-Check, außer in `FooterNew.tsx`): `#2EFFD1`, `#2E9FFF`, `emerald-`, `teal-`, `#0D0D0D`, `#0a0a0a`, `bg-gray-9`, `from-blue-`, `to-blue-`, `text-blue-3`, `text-blue-4`, `bg-blue-[5-9]`, `purple-9`, `pink-9`.

**Inhaltsregel:** Keine Texte, Sektionen, Links, `Schema`-Komponenten oder Props ändern — ausschließlich `className`-Werte und CSS.

---

## Phase 1 — Token-Fundament

### Task 1: Tailwind-Farbtokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: `theme.extend` um `colors` ergänzen**

Ersetze den `extend`-Block so, dass `colors` ergänzt wird (keyframes/animation bleiben unverändert):

```js
    extend: {
      colors: {
        'geo-green': '#A8E06A',
        'geo-green-deep': '#6FA82E',
        'green-deep': '#6FA82E',
        'geo-violet': '#8B3FCA',
        'geo-violet-soft': '#A870E0',
        'void': '#060606',
        'surface': '#F7F7F5',
        'surface-2': '#EFEFEC',
        'ink': '#171717',
        'ink-soft': '#5A5A5A',
        'hairline': '#E8E8E4',
      },
      keyframes: {
        // ... bestehende keyframes unverändert lassen ...
      },
      animation: {
        // ... bestehende animation unverändert lassen ...
      },
    },
```

- [ ] **Step 2: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch (Tailwind-Config ist valides JS).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "Add geo-tool light-CI color tokens to Tailwind"
```

### Task 2: globals.css auf helle CI umstellen

**Files:**
- Modify: `app/globals.css` (vollständig ersetzen)

- [ ] **Step 1: `app/globals.css` mit folgendem Inhalt überschreiben**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
  --surface: #f7f7f5;
  --surface-2: #efefec;
  --ink: #171717;
  --ink-soft: #5a5a5a;
  --hairline: #e8e8e4;
  --geo-green: #a8e06a;
  --geo-green-deep: #6fa82e;
  --geo-violet: #8b3fca;
  --geo-violet-soft: #a870e0;
  --void: #060606;
  --grad-main: linear-gradient(135deg, #a8e06a 0%, #8b3fca 100%);
  --grad-subtle: linear-gradient(135deg, rgba(168,224,106,0.10) 0%, rgba(139,63,202,0.10) 100%);
}

body {
  color: var(--ink);
  background: var(--background);
  font-family: var(--font-inter, 'Inter'), var(--font-sans, Arial, Helvetica, sans-serif);
}

/* Brand gradient text */
.gradient-text {
  background: var(--grad-main);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Primary CTA — solid violet for WCAG-safe white text */
.search-button-gradient {
  background: var(--geo-violet);
}
.search-button-gradient:hover {
  background: var(--geo-violet-soft);
}

/* Secondary action button (e.g. mic) */
.mic-button-gradient {
  background: var(--geo-violet-soft);
}

/* Subtle brand wash for hero / section backgrounds */
.grad-subtle {
  background: var(--grad-subtle);
}

/* Light tinted card surface */
.surface-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
}

.footer-bg {
  background-color: var(--void);
}

/* Partner logos — dark on light background */
.partner-logo {
  filter: brightness(0) opacity(0.45);
  transition: all 0.3s ease;
}
.partner-logo:hover,
.group:hover .partner-logo {
  filter: brightness(0) opacity(0.8);
}
.partner-logo-gradient {
  filter: brightness(0) opacity(0.5);
  transition: all 0.3s ease;
}
.partner-logo-gradient:hover,
.group:hover .partner-logo-gradient {
  filter: brightness(0) saturate(100%) invert(28%) sepia(46%) saturate(1200%) hue-rotate(245deg) opacity(0.9);
}

/* Footer links (on dark footer) */
.footer-link {
  transition: color 0.3s ease;
  position: relative;
}
.footer-link:hover { color: #ffffff; }
.footer-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: -2px;
  left: 0;
  background-color: #ffffff;
  transition: width 0.3s ease;
}
.footer-link:hover::after { width: 100%; }

.social-icon { transition: transform 0.3s ease, color 0.3s ease; }
.social-icon:hover { transform: scale(1.1); color: #ffffff; }

/* Footer 4-column layout enforcement */
@media (min-width: 1024px) {
  .footer-grid-4 {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 3rem !important;
  }
  .footer-grid-4 > div { width: 100% !important; min-width: 0 !important; }
}
.footer-container { width: 100%; max-width: 100%; }

/* Blog Article Styling — light */
.prose { color: #333333; max-width: none; }
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: var(--ink);
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
.prose h1 { font-size: 2.25rem; line-height: 2.5rem; }
.prose h2 { font-size: 1.875rem; line-height: 2.25rem; }
.prose h3 { font-size: 1.5rem; line-height: 2rem; }
.prose p { margin-bottom: 1.5rem; line-height: 1.75; color: #333333; }
.prose a {
  color: var(--geo-violet);
  text-decoration: none;
  transition: color 0.2s ease;
}
.prose a:hover { color: var(--geo-violet-soft); text-decoration: underline; }
.prose ul, .prose ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
.prose li { margin-bottom: 0.5rem; color: #333333; }
.prose img { border-radius: 0.75rem; margin: 2rem 0; max-width: 100%; height: auto; }
.prose blockquote {
  border-left: 4px solid var(--geo-green);
  padding-left: 1rem;
  margin: 2rem 0;
  font-style: italic;
  color: var(--ink-soft);
}
.prose code {
  background-color: var(--surface-2);
  color: var(--ink);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}
.prose pre {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
.prose pre code { background-color: transparent; padding: 0; color: #f9fafb; }

/* Line clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Content Cascade Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(168,224,106,0.30), 0 0 40px rgba(139,63,202,0.20); }
  50% { box-shadow: 0 0 30px rgba(168,224,106,0.45), 0 0 60px rgba(139,63,202,0.30); }
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 4s ease infinite; }

/* Animated gradient text */
.gradient-text-animated {
  background: linear-gradient(-45deg, #a8e06a, #8b3fca, #a870e0, #6fa82e);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease infinite;
}

/* Hover effects for cards */
.cascade-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}
.cascade-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(17,17,17,0.10), 0 0 30px rgba(139,63,202,0.15);
}

/* Staggered animation delays */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
.stagger-5 { animation-delay: 0.5s; }
.stagger-6 { animation-delay: 0.6s; }

/* Content reveal animation */
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.reveal-up { animation: reveal-up 0.8s ease-out forwards; }
```

- [ ] **Step 2: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Convert globals.css to geo-tool light CI"
```

---

## Phase 2 — Homepage & Kernkomponenten

### Task 3: Homepage `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Datei lesen** und Mapping-Referenz anwenden. Konkret:
  - Wrapper `bg-[#0D0D0D]` → `bg-white`.
  - `<h1>` (kein Textfarb-Klasse) bekommt `text-ink`; `<span className="gradient-text">` bleibt.
  - Header-Nav-Links `text-gray-300 hover:text-white` → `text-ink-soft hover:text-ink`.
  - Hero-`<p> text-gray-300` → `text-ink-soft`.
  - Primär-CTA-Links (`from-emerald-600 to-blue-600 ...`) → `bg-geo-violet hover:bg-geo-violet-soft`.
  - Sekundär-CTA (`border border-emerald-500 text-emerald-300 ...`) → `border border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white`.
  - Section `bg-gradient-to-b from-transparent to-gray-900/30` → `grad-subtle`.
  - Die beiden Content-Cards (`from-emerald-900/20 ...` / `from-blue-900/20 ...`) → `surface-card`; deren `<h2>` `text-emerald-300` / `text-blue-300` → `text-geo-violet`; Body `text-gray-200` → `text-ink-soft`.
  - Full-Width-Card (`from-purple-900/20 to-pink-900/20`) → `surface-card`; `<h3>` `text-purple-300`/`text-pink-300` → `text-geo-violet`; Häkchen-Spans `text-emerald-400` → `text-green-deep`; Body `text-gray-200` → `text-ink-soft`.
  - CTA-Section (`from-emerald-900/30 to-blue-900/30 border-emerald-700/30`) → `surface-card`; Body `text-gray-200` → `text-ink-soft`; Buttons wie oben.
  - Video-Section `bg-gradient-to-b from-gray-900/30 to-transparent` → `grad-subtle`; innere Card → `surface-card`; `text-gray-200` → `text-ink-soft`.
  - Headlines ohne explizite Farbe (z. B. `text-3xl font-bold` zentriert) → `text-ink` ergänzen.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -nE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|purple-9|pink-9|gray-9' app/page.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Reskin homepage to light CI"
```

### Task 4: `app/components/SearchBox.tsx`

**Files:**
- Modify: `app/components/SearchBox.tsx`

- [ ] **Step 1: Datei lesen**, Mapping-Referenz anwenden. Besonders: dunkle Container-BGs → `bg-white`/`bg-surface`; Eingabefelder bekommen `bg-white text-ink border-hairline`; Submit-Button nutzt `search-button-gradient` (bleibt — jetzt solides Violett); Platzhalter/Hilfetext → `text-ink-soft`. `search.css`/`search.module.css` werden separat in Task 15 geprüft.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -nE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|gray-9' app/components/SearchBox.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/components/SearchBox.tsx
git commit -m "Reskin SearchBox to light CI"
```

### Task 5: `TrustElements.tsx` & `ContentCascade.tsx`

**Files:**
- Modify: `app/components/TrustElements.tsx`
- Modify: `app/components/ContentCascade.tsx`

- [ ] **Step 1: Beide Dateien lesen**, Mapping-Referenz anwenden.
  - TrustElements: dunkle Section-BGs → `bg-white`; Partner-Logos behalten Klasse `partner-logo` (in globals.css bereits auf hell umgestellt); Überschriften → `text-ink`, Text → `text-ink-soft`.
  - ContentCascade: dunkle BGs → `bg-white`/`grad-subtle`; `cascade-card`-Klasse bleibt; Card-Inhalte `from-emerald-900/...` etc. → `surface-card`; Akzent-Text → `text-geo-violet`, Icons/Häkchen → `text-green-deep`, Body → `text-ink-soft`.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -nE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|gray-9|purple-9|pink-9' app/components/TrustElements.tsx app/components/ContentCascade.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/components/TrustElements.tsx app/components/ContentCascade.tsx
git commit -m "Reskin TrustElements and ContentCascade to light CI"
```

### Task 6: `ResponsiveCTAButton.tsx` & `LogoImage.tsx`

**Files:**
- Modify: `src/components/ResponsiveCTAButton.tsx`
- Modify: `app/components/LogoImage.tsx` (nur falls Markenfarben hardcoded)

- [ ] **Step 1: Beide Dateien lesen.**
  - ResponsiveCTAButton: Mapping anwenden — Button auf `bg-geo-violet hover:bg-geo-violet-soft text-white`.
  - LogoImage: prüfen, ob ein Marken-Hex (`#2EFFD1`/`#2E9FFF`) oder ein farbiges Logo-Asset referenziert wird. Falls nur ein `<Image src=...>` ohne Marken-CSS → keine Änderung nötig (Logo-Asset-Tausch ist nicht Teil dieses Plans; ggf. in Phase 6 flaggen).

- [ ] **Step 2: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResponsiveCTAButton.tsx app/components/LogoImage.tsx
git commit -m "Reskin CTA button to light CI"
```

---

## Phase 3 — brands/ & creator/

### Task 7: brands-Seiten (10 Dateien)

**Files (Modify):**
- `app/brands/page.tsx`
- `app/brands/ugc-agentur-berlin/page.tsx`
- `app/brands/ugc-agentur-hamburg/page.tsx`
- `app/brands/ugc-agentur-muenchen/page.tsx`
- `app/brands/ugc-creator-beauty/page.tsx`
- `app/brands/ugc-creator-deutschland/page.tsx`
- `app/brands/ugc-creator-finden/page.tsx`
- `app/brands/ugc-creator-preise/page.tsx`
- `app/brands/ugc-plattform-deutschland/page.tsx`
- `app/brands/ugc-vertrag-vorlage/page.tsx`

- [ ] **Step 1:** Jede der 10 Dateien einzeln lesen und die Mapping-Referenz anwenden. Die brand-Subpages sind strukturell ähnlich (Hero + Content-Sektionen + CTA); konsequent: dunkle Page-/Section-BGs → `bg-white`/`grad-subtle`, dunkle Cards → `surface-card`, Akzent-Text → `text-geo-violet`, Icons → `text-green-deep`, Body → `text-ink-soft`, Überschriften → `text-ink`, CTAs → `bg-geo-violet`.

- [ ] **Step 2: Grep-Verifikation über alle 10 Dateien**

Run: `grep -rnE '#0D0D0D|#0a0a0a|emerald-|teal-|from-blue|to-blue|text-blue-[34]|bg-blue-[5-9]|gray-9|purple-9|pink-9' app/brands/`
Expected: keine Treffer.

- [ ] **Step 3: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch.

- [ ] **Step 4: Commit**

```bash
git add app/brands/
git commit -m "Reskin brands pages to light CI"
```

### Task 8: creator-Seiten (3 Dateien)

**Files (Modify):**
- `app/creator/page.tsx`
- `app/creator/ugc-creator-jobs/page.tsx`
- `app/creator/ugc-creator-werden/page.tsx`

- [ ] **Step 1:** Alle 3 Dateien lesen und Mapping-Referenz anwenden (gleiches Vorgehen wie Task 7).

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|#0a0a0a|emerald-|teal-|from-blue|to-blue|text-blue-[34]|bg-blue-[5-9]|gray-9|purple-9|pink-9' app/creator/`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/creator/
git commit -m "Reskin creator pages to light CI"
```

---

## Phase 4 — Blog & Info-Seiten

### Task 9: wissen/Blog (3 Dateien)

**Files (Modify):**
- `app/wissen/page.tsx`
- `app/wissen/[slug]/page.tsx`
- `app/wissen/ClientWissenContent.tsx`

- [ ] **Step 1:** Alle 3 Dateien lesen und Mapping-Referenz anwenden. Die Artikel-Inhalte nutzen die `.prose`-Klasse (in Task 2 bereits auf hell umgestellt) — hier nur die umgebenden Layout-/Listen-/Card-Klassen anpassen: dunkle BGs → `bg-white`, Artikel-Cards → `surface-card`, Tags/Badges-Akzent → `text-geo-violet` bzw. Tint `bg-geo-green/12`, Body → `text-ink-soft`.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|gray-9|purple-9|pink-9' app/wissen/`
Expected: keine Treffer.

- [ ] **Step 3: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch.

- [ ] **Step 4: Commit**

```bash
git add app/wissen/
git commit -m "Reskin wissen/blog pages to light CI"
```

### Task 10: faq & about

**Files (Modify):**
- `app/faq/page.tsx`
- `app/about/page.tsx`

- [ ] **Step 1:** Beide Dateien lesen und Mapping-Referenz anwenden.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|gray-9|purple-9|pink-9' app/faq/page.tsx app/about/page.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/faq/page.tsx app/about/page.tsx
git commit -m "Reskin faq and about pages to light CI"
```

---

## Phase 5 — Legal, Footer, Popups, Creator-Komponenten

### Task 11: Legal-Seiten (4 Dateien)

**Files (Modify):**
- `app/agb/page.tsx`
- `app/impressum/page.tsx`
- `app/datenschutz/page.tsx`
- `app/cookies/page.tsx`

- [ ] **Step 1:** Alle 4 Dateien lesen und Mapping-Referenz anwenden (überwiegend Text-Seiten: dunkle BGs → `bg-white`, Text → `text-ink`/`text-ink-soft`, Links → `text-geo-violet`).

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|gray-9' app/agb/ app/impressum/ app/datenschutz/ app/cookies/`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/agb/ app/impressum/ app/datenschutz/ app/cookies/
git commit -m "Reskin legal pages to light CI"
```

### Task 12: Footer `src/components/FooterNew.tsx`

**Files:**
- Modify: `src/components/FooterNew.tsx`

- [ ] **Step 1: Datei lesen.** Der Footer **bleibt dunkel**. Nur ändern:
  - `bg-[#1A1A1A]` → `bg-void` (`#060606`).
  - `gradient-text`-Logo bleibt (aktualisiert sich über Token).
  - Heller Text (`text-gray-300`, `text-white`), `footer-link`, `social-icon`, `border-gray-800` **bleiben unverändert** — sie funktionieren auf dunklem BG.
  - Falls ein Marken-Hex (`#2EFFD1`/`#2E9FFF`) hardcoded ist → durch `var(--geo-violet)` bzw. `text-geo-violet` ersetzen.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -nE '#2EFFD1|#2E9FFF|emerald-|teal-|#1A1A1A' src/components/FooterNew.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add src/components/FooterNew.tsx
git commit -m "Update footer to void-black brand color"
```

### Task 13: Popups & test-popup

**Files (Modify):**
- `app/components/ContactPopup.tsx`
- `app/components/CreatorSelectionPopup.tsx`
- `app/components/ContactButton.tsx`
- `app/test-popup/page.tsx`

- [ ] **Step 1:** Alle 4 Dateien lesen und Mapping-Referenz anwenden. Popups: dunkle Modal-BGs → `bg-white`, Overlay-Backdrop darf dunkel/transparent bleiben (`bg-black/50` o. ä. ist ok — das ist kein Marken-BG); Buttons → `bg-geo-violet`; Inputs → `bg-white text-ink border-hairline`.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|bg-gray-9' app/components/ContactPopup.tsx app/components/CreatorSelectionPopup.tsx app/components/ContactButton.tsx app/test-popup/page.tsx`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add app/components/ContactPopup.tsx app/components/CreatorSelectionPopup.tsx app/components/ContactButton.tsx app/test-popup/page.tsx
git commit -m "Reskin popups to light CI"
```

### Task 14: Creator-Komponenten

**Files (Modify):**
- `components/CreatorCard.tsx`
- `components/CreatorSearch.tsx`
- `components/NoResults.tsx`

- [ ] **Step 1:** Alle 3 Dateien lesen und Mapping-Referenz anwenden. Karten → `surface-card`, Akzente → `text-geo-violet`, Icons → `text-green-deep`, Buttons → `bg-geo-violet`.

- [ ] **Step 2: Grep-Verifikation**

Run: `grep -rnE '#0D0D0D|emerald-|teal-|from-blue|to-blue|text-blue-[34]|bg-gray-9' components/`
Expected: keine Treffer.

- [ ] **Step 3: Commit**

```bash
git add components/CreatorCard.tsx components/CreatorSearch.tsx components/NoResults.tsx
git commit -m "Reskin creator components to light CI"
```

### Task 15: CSS-Restdateien prüfen

**Files (Modify falls nötig):**
- `app/styles/search.css`
- `app/styles/search.module.css`
- `app/styles/klaro-custom.css`

- [ ] **Step 1:** Alle 3 Dateien lesen. Auf Marken-Hex prüfen:

Run: `grep -nE '2EFFD1|2E9FFF|#0D0D0D|emerald|teal' app/styles/search.css app/styles/search.module.css app/styles/klaro-custom.css`

  - Treffer → durch die geo-tool-Tokens ersetzen: Teal/Grün → `var(--geo-green)`, Blau/Violett → `var(--geo-violet)`, dunkle BGs → `#ffffff`/`var(--surface)`, helle Texte → `var(--ink)`/`var(--ink-soft)`.
  - `klaro-custom.css`: Cookie-Banner-Buttons auf `var(--geo-violet)` (Accept) und neutrale Töne (Decline) angleichen; Banner-BG hell.

- [ ] **Step 2: Build-Check**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch.

- [ ] **Step 3: Commit**

```bash
git add app/styles/
git commit -m "Align stylesheet brand colors to light CI"
```

---

## Phase 6 — Verifikation & QA

### Task 16: Gesamt-Grep, Build & visuelle QA

**Files:** keine Code-Änderung (außer Nachbesserungen)

- [ ] **Step 1: Globaler Grep auf verbotene Muster** (Footer ausgenommen)

Run:
```bash
grep -rnE '#2EFFD1|#2E9FFF|#0D0D0D|#0a0a0a|emerald-|teal-' app src components --include='*.tsx' --include='*.ts' --include='*.css' | grep -v 'FooterNew.tsx'
```
Expected: keine Treffer. Treffer → in der jeweiligen Datei nachbessern und committen.

- [ ] **Step 2: Production-Build**

Run: `npx next build`
Expected: Build läuft fehlerfrei durch, keine TypeScript-/Lint-Fehler.

- [ ] **Step 3: Dev-Server starten & Screenshots**

Run: `npx next dev` (Hintergrund), dann Screenshots via Chrome-DevTools-MCP oder Playwright von:
`/`, `/brands`, `/brands/ugc-agentur-berlin`, `/creator`, `/wissen`, ein `/wissen/[slug]`-Artikel, `/faq`, `/about`, `/impressum`.

Prüfen:
  - Keine dunklen Page-Backgrounds mehr (außer Footer).
  - Lime erscheint nur als Fläche/Border/Tint, niemals als Text auf Weiß.
  - Primär-CTAs sind solides Violett mit weißem Text.
  - Text-Kontraste lesbar (WCAG-AA).
  - Inhalte/Sektionen vollständig und unverändert.

- [ ] **Step 4: Nachbesserungen** in betroffenen Dateien vornehmen und committen:

```bash
git add -A
git commit -m "Fix light-CI QA findings"
```

### Task 17: Dead-Code `Navbar.tsx` flaggen

**Files:** keine

- [ ] **Step 1:** Bestätigen, dass `src/components/Navbar.tsx` nirgends importiert wird:

Run: `grep -rn "Navbar" app src components --include='*.tsx' | grep -v 'src/components/Navbar.tsx'`
Expected: keine Treffer.

- [ ] **Step 2:** Ergebnis dem User berichten mit Empfehlung, `src/components/Navbar.tsx` (toter Code, falsche Marke „UGC Directory") zu löschen. **Nicht eigenmächtig löschen** — separate Entscheidung.

---

## Self-Review-Ergebnis

- **Spec-Abdeckung:** Token-Fundament → Task 1–2. Kontrast-Regel → in Mapping-Referenz + globals.css (Solid-Violett-CTA, `green-deep`-Icons). Farb-Mapping → Mapping-Referenz. Footer → Task 12. `.prose`/Blog → Task 2 + Task 9. Navbar-Dead-Code → Task 17. Klaro-CSS → Task 15. Komplette Seite (alle Routen) → Tasks 3–15. Phasen 1–6 entsprechen Spec-Abschnitt 5. Erfolgskriterien → Task 16.
- **Platzhalter:** keine — globals.css/Tailwind-Config vollständig ausgeschrieben; Reskin-Tasks referenzieren die vollständige Mapping-Referenz.
- **Konsistenz:** Token-Namen (`geo-violet`, `geo-green`, `green-deep`, `surface`, `ink`, `ink-soft`, `hairline`, `void`) identisch in Tailwind-Config, globals.css und allen Tasks. Utility-Klassen (`gradient-text`, `grad-subtle`, `surface-card`, `search-button-gradient`) konsistent verwendet.
