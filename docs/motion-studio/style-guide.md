# Style-Guide (Motion + Redesign)

Quelle: `/brandkit` (Logo, Farben, Typo) + Referenz-Analyse Learn.AI (jiro.build).

## Aus der Referenz übernommen (Grammatik, nicht Inhalt)

| Merkmal | Learn.AI | Bei UGC VZ |
|---|---|---|
| Hero | Handy-Mockup mit echter App-UI, schwebende Karten | Handy mit Creator-Profil / Brand-Anfrage, schwebende Suchkarte |
| Karten | „Laschen“-Ecken (ausgeschnittene Ecke mit Radius) | gleiche Form, Rahmen `hairline`, Lasche oben links / unten rechts |
| Feature-Kacheln | UI-Illustration statt Icon | Mini-UI: Suche, Matching-Linien, Auswahl-Leiste, Mail |
| Dunkle Bühne | Wellenringe, geschwungene Notch-Übergänge | Void + Glow-Ringe im Logo-Verlauf, gleiche Notch-Kurve |
| Schritte | 3 Karten mit Live-UI | „So funktioniert's“ = die Motion |
| Social Proof | Avatar-Pille + Sterne | Pille „590+ Creator · 25+ Brand-Anfragen in 4 Wochen“ (echt) |
| Abschluss | CTA in Notch über dunklem Footer | „Kostenlos Creator finden“ in Notch |

**Nicht übernommen:** Grün, Syne-Schrift, Stockfoto-Gesichter, Fake-„20K users“.

## Palette (Brand Kit)

- Verlauf: `#0396F8 → #1F6FF4 → #3F58F2 → #653AED → #9131EF` (62°) – Logo, Glow, Hero-Akzente
- UI: Brand Violet `#8B3FCA` (Buttons), Fresh Green `#A8E06A` / Badge-Grün `#527B33` (nur Positives)
- Neutral: Void `#060606`, Ink `#171717`, Ink Soft `#5A5A5A`, Hairline `#E8E8E4`, Surface `#F7F7F5`, Weiß

## Typografie

Geist Sans (Display bold, −5,5 % Laufweite), Geist Mono für Labels/Daten. Keine weitere Schrift.

## Motion-Regeln

| Klasse | Verhalten |
|---|---|
| Micro-UI (Buttons, Chips, Häkchen) | schnell (120–180 ms), kaum Overshoot |
| Karten / Panels | kontrolliert einschwingen (Feder, Dämpfung hoch), 350–500 ms |
| Kamera (Zoom/Pan) | langsam, fast unsichtbar, nie schneller als 1 Element-Breite/s |
| Headlines | kräftiger Eintritt (Slide 16 px + Fade), dann ≥ 1,5 s Halten |
| Cursor | echter Mauszeiger, Klick = 0,92-Scale + Ring |

- Ein Blickpunkt pro Moment: Was sich bewegt, ist das, was zählt.
- Deterministisch & seekbar: `render(t)` ohne versteckte Uhr, ohne Zufall.
- `prefers-reduced-motion`: Website zeigt Standbilder der 4 Zustände statt Animation.

## Verboten

Partikel, Glitch, Morphing, rotierende 3D-Logos, Text in der Bildmitte vor Verlauf als
einzige Idee, Logo-Reveal mit Lens-Flare, Stock-Gesichter.
