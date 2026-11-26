# UGC VZ Editorial Motion Hero — Architektur, Differenzierung & Video-Upgrade-Guide

Vorschau-Route (noindex): **`/motion-hero`** (`app/motion-hero/page.tsx`)  
Hauptkomponente: **`app/components/home/EditorialMotionHero.tsx`**

---

## 1. Warum dieser Ansatz (Orla-Stil statt Standard-SaaS)?

Nahezu alle Creator- und UGC-Plattformen im DACH-Markt folgen demselben B2B-SaaS-Baukasten (Headline links, generisches Dashboard-Mockup rechts). UGC lebt jedoch von **echten Gesichtern, Kamera-Präsenz und Bewegung**.

Der **Editorial Motion Hero** überträgt das erfolgreiche Prinzip hochwertiger Editorial-Motion-Sites (wie *Orla Fashion* auf MotionSites.ai) gezielt in die **ugcVZ Rot-Blau-CI** (`#06458F` Directory Blue, `#F2072A` Creator Red, `70 %` reines Studio-Weiß/Cloud):

1. **Heller Studio-Canvas (`#FFFFFF` + feine Studio-Vignette):** Maximale Ruhe und Luftigkeit — kein schwerer Dark-Mode, kein generischer Farbverlauf.
2. **Zentrale, super-realistische DACH-Creator-Figur:** Menschliche Präsenz statt anonymer UI-Box als emotionaler Anker in der Bühnenmitte.
3. **3 Tiefenebenen (Depth-of-Field Parallax):** Echte vertikale UGC-Reel-Karten, Live-View-Badges (`42.800 Views`), Preis-Pills (`2,00 € / 1.000 Views`) und Prüf-Status (`✓ Zählt`) schweben in 3 Ebenen um die Person herum und reagieren butterweich (60 fps, GPU-beschleunigt) auf Mausbewegung und Scrollen.
4. **Reduzierte Editorial-Faktenleiste unten rechts:** Alle kaufentscheidenden harten Fakten (Abrechnung, Budget-Schutz, `0 %` Creator-Gebühr, Plattformen) auf einen Blick — ohne Marketing-Ballast.
5. **Sauberer Übergang in den Conversion-Funnel:** Nur der Hero (Above the Fold) trägt die Editorial-Inszenierung. Direkt beim Runterscrollen folgen nahtlos die bewährten Conversion-Module (`TrustElements`, `QuickBriefCard`, KI-Creator-Suche, `CampaignHowTabs`, `VerificationProofSection`).

---

## 2. Technische Architektur & Performance-Guardrails

| Aspekt | Umsetzung |
|---|---|
| **Animationen** | `framer-motion` (`useMotionValue`, `useSpring`, `useScroll`, `useTransform`) — ausschließlich `transform` & `opacity` (kein Layout-Thrashing, konstante 60 fps). |
| **LCP & Ladezeit** | Komprimiertes Studio-WebP (`creator-hero-studio.webp`) mit `fetchPriority="high"` als sofort sichtbarer First Paint; Video-Layer lädt erst nach Hydration. |
| **Nahtloser Weiß-Übergang** | Sowohl Studio-Cutout als auch späteres Studio-MP4 nutzen reines `#FFFFFF` + `mix-blend-multiply` / sauberes Alpha-Matting — kein sichtbarer Rechteck-Rahmen. |
| **Mobile-Erlebnis** | Auf Mobile (`< lg`) kompakte, zentrierte Studio-Bühne mit 2 klaren Floating-Badges (kein unübersichtliches Gewusel, keine horizontalen Overflows). |
| **Barrierefreiheit** | Vollständige Unterstützung von `prefers-reduced-motion: reduce` (alle Parallax-, Float- und Video-Loops frieren ruhig ein) + WCAG-2.2.2-Pause-Button bei aktivem Video. |
| **SEO & Copy-Regeln** | Genau eine `<h1>`, exakte Links-Bündigkeit auf der `1200 px`-Spalte (`px-5 sm:px-8`), keine En-/Em-Dashes, keine KI-Klischees, alle Daten klar als Live- oder Beispielansicht markiert. |

---

## 3. Upgrade auf echtes 5-Sekunden-Studio-Video (Google Pomelli / Veo / Kling)

Die Komponente `EditorialMotionHero.tsx` ist **Video-Slot-ready**: Sobald ein echtes Studio-Bewegtbild auf reinem Weiß vorliegt, wird das statische Studio-Foto automatisch durch ein nahtloses Bewegtbild (oder Scroll-Scrub-Video) ersetzt — ohne Layout-Änderung.

### Schritt 1: Studio-Startbild nutzen
Das fertige Start-Frame liegt direkt im Repo bereit:
- **`public/motion-hero/creator-hero-studio.png`** (und WebP-Version `creator-hero-studio.webp`)

### Schritt 2: Video generieren (1-Klick-Prompts)

#### Option A — Google Pomelli („Animate“) oder Google Flow (Veo 3)
1. `public/motion-hero/creator-hero-studio.png` als Startbild hochladen.
2. Prompt eingeben:
   > `Seamless studio editorial motion loop on pure solid white #FFFFFF cyclorama background. The young German woman gently shifts her weight, turns her shoulders slightly by 15 degrees toward camera with a natural relaxed smile, softly raises her matte black smartphone as if framing a short video, subtle natural hair movement. Soft diffused studio daylight, locked tripod camera, zero camera shake, pure #FFFFFF white background stays completely clean and uniform without shadows or flickering, hyper-realistic 4K fashion commercial look, 5 seconds.`

#### Option B — Kling 2.x (Image-to-Video, Professional Mode)
1. Start-Frame: `creator-hero-studio.png` (optional End-Frame = dasselbe Bild für einen 100 % nahtlosen Endlos-Loop!).
2. Prompt:
   > `Static tripod shot, seamless 5-second loop. The creator makes a gentle natural turn, subtle confident smile toward lens, slight relaxed hand motion holding her phone, soft breeze moving a few strands of hair. Pure uniform #FFFFFF studio background, crisp editorial daylight, zero artifacts, zero background flicker.`
3. Negative Prompt:
   > `camera zoom, pan, shaky cam, grey background, vignettes, morphing hands, logos, text, watermark, plastic skin`

#### Option C — Echtes Studio-Clip von einer echten UGC VZ Creatorin (Empfehlung für maximale Glaubwürdigkeit!)
- 5 Sekunden im Hochformat (`3:4` oder `9:16`) vor gut ausgeleuchteter weißer Wand/Hohlkehle, ruhige Stativ-Kamera, 1× entspannt in die Kamera lächeln und kurz das Smartphone heben. Passt zu 100 % zum Claim **„Echte Creator. Echte Views.“**

### Schritt 3: Optimieren & Ablegen (`ffmpeg`)
Das fertige Video mit einem Befehl web-optimieren (< 1,5 MB, stumm, `+faststart`, perfekt auf `#FFFFFF` gepegelt):

```bash
ffmpeg -y -i raw-studio.mp4 \
  -an -vf "scale=960:-2:flags=lanczos,eq=contrast=1.03:brightness=0.02" \
  -c:v libx264 -pix_fmt yuv420p -crf 23 -preset slow -movflags +faststart \
  public/motion-hero/creator-hero-loop.mp4
```

Danach in `EditorialMotionHero.tsx` einfach `videoSrc="/motion-hero/creator-hero-loop.mp4"` übergeben — das Video blendet nahtlos über `mix-blend-multiply` auf dem weißen Studio-Canvas ein, inklusive Poster-LCP und Pause-Button.

---

## 4. Promotion auf die Live-Startseite (`/`)

Sobald du mit `/motion-hero` zufrieden bist, lässt sich der neue Hero in **30 Sekunden** live schalten:
1. In `app/page.tsx` den aktuellen `<section aria-labelledby="home-title">` Block durch `<EditorialMotionHero stats={stats} />` ersetzen (alle Sektionen darunter bleiben identisch).
2. `npm run test:etappe4-ui && npm run build` ausführen.
3. Optional vorher 1–2 Wochen per Analytics-Vergleich (CTA-Klickrate `Kampagne starten` & `QuickBrief`-Starts) gegen den bisherigen Hero messen.
