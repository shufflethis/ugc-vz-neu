// Erklaerfilm "So funktioniert UGC VZ" als reine Funktion der Zeit:
// <HowItWorksFilm t={7.5} film="brands" format="16x9" /> zeichnet exakt den Frame bei 7,5 s.
// Keine Hooks, keine Transitions -- Website-Player und Video-Export nutzen dieselbe Quelle.
// Inhalte folgen docs/motion-studio/shotlist.md; UI und Texte sind der echten Seite
// nachgebaut, Creator sind bewusst Platzhalter (Initialen, Fantasie-Vornamen).
import { CSSProperties, ReactNode } from 'react';
import {
  caretOn, easeInOut, easeOut, Film, Format, lerp, path, press, seg, spring, typed,
} from './timeline';

const GRADIENT = 'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';
const VIOLET = '#8B3FCA';

type Creator = { name: string; initials: string; city: string; topics: string; formats: string };
const CREATORS: Creator[] = [
  { name: 'Mia', initials: 'MI', city: 'Berlin', topics: 'Beauty, Skincare, Lifestyle', formats: 'Reels, Problem/Lösung, Unboxing' },
  { name: 'Jonas', initials: 'JO', city: 'Köln', topics: 'Tech, Food, Fitness', formats: 'Produktdemo, Voice-over, Hooks' },
  { name: 'Lea', initials: 'LE', city: 'München', topics: 'Beauty, Fashion, Home', formats: 'Testimonials, Reels, Fotos' },
  { name: 'Selin', initials: 'SE', city: 'Hamburg', topics: 'Skincare, Wellness, Food', formats: 'Unboxing, Get Ready With Me' },
];

const abs = (x: number, y: number, extra: CSSProperties = {}): CSSProperties => ({ position: 'absolute', left: x, top: y, ...extra });

function Avatar({ c, size }: { c: Creator; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: GRADIENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.34, flexShrink: 0, letterSpacing: '0.02em' }}>
      {c.initials}
    </div>
  );
}

function Cursor({ x, y, t, clicks, opacity = 1 }: { x: number; y: number; t: number; clicks: number[]; opacity?: number }) {
  const s = clicks.reduce((m, at) => Math.min(m, press(t, at)), 1);
  const ring = clicks.map((at) => seg(t, at, at + 0.45)).find((p) => p > 0 && p < 1) ?? 0;
  return (
    <div style={abs(x, y, { opacity, pointerEvents: 'none', zIndex: 50 })}>
      {ring > 0 && (
        <div style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%', border: `3px solid ${VIOLET}`, opacity: 1 - ring, transform: `scale(${0.4 + ring})` }} />
      )}
      <svg width="34" height="34" viewBox="0 0 24 24" style={{ transform: `scale(${s})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.25))' }}>
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.7 L11 13.3 L17.5 13 Z" fill="#171717" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Tipp-Kreis, zentriert im umgebenden (position: relative) Element. */
function Ripple({ t, at }: { t: number; at: number }) {
  const p = seg(t, at - 0.25, at + 0.4);
  if (p <= 0 || p >= 1) return null;
  const grow = p < 0.4 ? p / 0.4 : 1;
  const fade = p < 0.4 ? 1 : 1 - (p - 0.4) / 0.6;
  return <span style={{ position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: '50%', background: 'rgba(139,63,202,.28)', border: '2px solid rgba(139,63,202,.6)', transform: `scale(${0.5 + grow * 0.5})`, opacity: fade, zIndex: 40, pointerEvents: 'none' }} />;
}

function Bar({ w, op = 1 }: { w: number; op?: number }) {
  return <span style={{ display: 'inline-block', width: w, height: '0.7em', borderRadius: 6, background: '#E8E8E4', opacity: op, verticalAlign: 'middle' }} />;
}

function CreatorCard({ c, w, k, selected, btnScale = 1 }: { c: Creator; w: number; k: number; selected: boolean; btnScale?: number }) {
  return (
    <div style={{ width: w, borderRadius: 18 * k, border: `${selected ? 2 : 1}px solid ${selected ? VIOLET : '#E8E8E4'}`, background: selected ? '#FBF8FE' : '#fff', padding: 20 * k, boxShadow: '0 18px 40px rgba(35,22,47,.07)', fontSize: 14 * k, lineHeight: 1.45, color: '#5A5A5A' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 * k }}>
        <Avatar c={c} size={58 * k} />
        <div>
          <div style={{ fontSize: 19 * k, fontWeight: 700, color: '#171717', letterSpacing: '-0.02em' }}>{c.name}</div>
          <div style={{ fontSize: 13 * k }}>{c.city}</div>
        </div>
      </div>
      <div style={{ marginTop: 14 * k }}>{c.topics}</div>
      <div style={{ marginTop: 6 * k }}>{c.formats}</div>
      <div style={{ marginTop: 8 * k }}><b style={{ color: '#171717' }}>Preisvorstellung:</b> <Bar w={90 * k} /></div>
      <div style={{ marginTop: 8 * k, fontSize: 12.5 * k }}>✉ Per E-Mail erreichbar</div>
      <div style={{ marginTop: 14 * k, borderRadius: 12 * k, border: '1px solid #E8E8E4', padding: `${10 * k}px 0`, textAlign: 'center', fontWeight: 700, color: '#171717', fontSize: 13.5 * k }}>Profil &amp; Arbeitsproben ↗</div>
      <div style={{ marginTop: 10 * k, borderRadius: 12 * k, padding: `${11 * k}px 0`, textAlign: 'center', fontWeight: 700, fontSize: 13.5 * k, transform: `scale(${btnScale})`, background: selected ? '#EDF5E5' : VIOLET, color: selected ? '#385523' : '#fff' }}>
        {selected ? '✓ In deiner Auswahl' : '+ Zur Auswahl'}
      </div>
    </div>
  );
}

function Backdrop({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: dark ? '#060606' : '#F7F7F5' }} />
      <div style={{ position: 'absolute', right: '-12%', top: '-30%', width: '70%', height: '90%', borderRadius: '50%', background: GRADIENT, opacity: dark ? 0.35 : 0.13, filter: 'blur(90px)' }} />
      <div style={{ position: 'absolute', left: '-18%', bottom: '-35%', width: '60%', height: '80%', borderRadius: '50%', background: GRADIENT, opacity: dark ? 0.2 : 0.07, filter: 'blur(110px)' }} />
    </>
  );
}

function CloseScene({ t, v, line, url, size }: { t: number; v: boolean; line: ReactNode; url: string; size?: number }) {
  const p = seg(t, 13.8, 14.4);
  if (p <= 0) return null;
  const logo = spring(seg(t, 14.3, 15.0));
  const u = easeOut(seg(t, 14.7, 15.2));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: size ?? (v ? 92 : 84), fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 1.02, color: '#171717', opacity: easeOut(p), transform: `translateY(${(1 - easeOut(p)) * 24}px)` }}>{line}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ" style={{ height: v ? 150 : 120, marginTop: v ? 70 : 48, opacity: clampOp(logo), transform: `scale(${0.85 + 0.15 * logo})` }} />
      <div style={{ marginTop: 26, fontFamily: 'var(--font-geist-mono), monospace', fontSize: v ? 34 : 28, color: '#5A5A5A', opacity: u }}>{url}</div>
    </div>
  );
}
const clampOp = (x: number) => Math.min(1, Math.max(0, x));

/* ------------------------------------------------------------------ Film A */

function BrandsFilm({ t, v }: { t: number; v: boolean }) {
  const W = v ? 900 : 1600;
  const k = v ? 1.25 : 1.2;
  const kc = k * (v ? 1.05 : 1);
  const query = 'Skincare-Serum, Reel für Instagram, Frau 25–35';
  const cards = CREATORS;
  // 16:9: Mia + Lea, 9:16 (2x2-Raster): Mia + Jonas
  const sel = [t >= 6.75, v && t >= 7.65, !v && t >= 7.65, false];

  // Suchkarte: zentriert -> oben verkleinert
  const up = spring(seg(t, 3.0, 3.7), 0.6);
  const sW = v ? 780 : 1100;
  const sX = (W - sW) / 2;
  const sY = lerp(v ? 520 : 210, v ? 70 : 28, up);
  const s0 = v ? 1 : 1.12;
  const sScale = lerp(s0, v ? 0.9 : 0.74, up);

  // Kartenraster
  const cW = v ? 395 : 355;
  const gap = v ? 30 : 24;
  const cols = v ? 2 : 4;
  const rowH = v ? 450 : 0;
  const gridW = cols * cW + (cols - 1) * gap;
  const gX = (W - gridW) / 2;
  const gY = v ? 430 : 262;
  const cardPos = (i: number) => ({ x: gX + (i % cols) * (cW + gap), y: gY + Math.floor(i / cols) * rowH });
  const cardBtn = (i: number) => ({ x: cardPos(i).x + cW / 2, y: cardPos(i).y + 284 * kc });

  // Auswahl-Leiste
  const count = (t >= 6.75 ? 1 : 0) + (t >= 7.65 ? 1 : 0);
  const barIn = spring(seg(t, 6.8, 7.3), 0.7);
  const barW = v ? 780 : 1272;
  const barH = v ? 150 : 92;
  const barY = lerp(v ? 1600 : 900, (v ? 1600 : 900) - barH - (v ? 60 : 30), barIn);
  const barX = (W - barW) / 2;
  const ctaX = v ? barX + barW / 2 : barX + barW - 170;
  const ctaY = v ? barY + 104 : barY + barH / 2;

  // Anfrage-Panel -> Mail
  const panelIn = spring(seg(t, 9.15, 9.75), 0.55);
  const pW = v ? 800 : 1000;
  const pH = v ? 840 : 640;
  const pX = (W - pW) / 2;
  const pY = lerp(v ? 1650 : 950, v ? 360 : 120, panelIn);
  const mail = easeInOut(seg(t, 11.0, 11.5));

  // Button-Mitte relativ zur Karte, skaliert um die obere Mitte (Klick erfolgt vor dem Hochfahren)
  const btnRelX = v ? sW / 2 : sW - 130 * k;
  const btnRelY = v ? 30 + 191 * k : 30 + 166 * k;
  const searchBtn = { x: sX + sW / 2 + (btnRelX - sW / 2) * s0, y: sY + btnRelY * s0 };
  const cur = path(t, [
    [0, W - 120, (v ? 1600 : 900) - 120],
    [1.9, W - 140, (v ? 1600 : 900) - 160],
    [2.5, searchBtn.x, searchBtn.y],
    [3.0, searchBtn.x, searchBtn.y],
    [3.8, W - 160, v ? 1300 : 780],
    [6.0, W - 200, v ? 1250 : 760],
    [6.6, cardBtn(0).x, cardBtn(0).y],
    [6.9, cardBtn(0).x, cardBtn(0).y],
    [7.5, cardBtn(v ? 1 : 2).x, cardBtn(v ? 1 : 2).y],
    [8.4, cardBtn(v ? 1 : 2).x + 40, cardBtn(v ? 1 : 2).y + 40],
    [9.0, ctaX, (v ? 1600 : 900) - barH / 2 - (v ? 60 : 30) + (v ? 30 : 0)],
  ]);
  const cursorOp = 1 - seg(t, 9.3, 9.6);
  const content = 1 - easeOut(seg(t, 13.5, 13.95));

  return (
    <>
      <Backdrop />
      <div style={{ position: 'absolute', inset: 0, opacity: content, transform: `scale(${lerp(0.96, 1, content)})` }}>
        {/* Suchkarte */}
        <div style={abs(sX, sY, { width: sW, transform: `scale(${sScale})`, transformOrigin: 'top center', borderRadius: 28, background: '#fff', border: '1px solid #E8E8E4', boxShadow: '0 30px 80px rgba(35,22,47,.10)', padding: v ? 34 : 30 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 22 * k, fontWeight: 700, color: '#171717', letterSpacing: '-0.02em' }}>Wofür suchst du Creator?</div>
            {!v && <div style={{ fontSize: 13, color: '#5A5A5A' }}><span style={{ color: '#527B33' }}>✓</span> Kostenlos · Ohne Brand-Login</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {(v ? ['Beauty-Reels', 'Food-Videos', 'App-Demo'] : ['Beauty-Reels', 'Food-Videos', 'App-Demo', 'Mode & Fashion', 'Home & Interior']).map((chip) => (
              <span key={chip} style={{ borderRadius: 999, background: '#F7F7F5', border: '1px solid #E8E8E4', padding: `${8 * k}px ${16 * k}px`, fontSize: 14 * k, fontWeight: 600, color: '#171717' }}>{chip}</span>
            ))}
          </div>
          <div style={{ marginTop: 20, borderRadius: 18, border: `1.5px solid ${t > 0.3 && t < 3 ? '#C9B3E8' : '#E8E8E4'}`, background: '#F7F7F5', padding: v ? 22 : 18, display: 'flex', alignItems: v ? 'stretch' : 'center', flexDirection: v ? 'column' : 'row', gap: 16 }}>
            <div style={{ flex: 1, fontSize: 19 * k, color: '#171717', minHeight: 30 * k }}>
              {t < 0.4 ? <span style={{ color: '#8A8A8A' }}>Produkt, Zielgruppe, Videoformat …</span> : typed(query, t, 0.4, 2.0)}
              {t >= 0.4 && t < 2.6 && caretOn(t) && <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: VIOLET, verticalAlign: 'text-bottom', marginLeft: 2 }} />}
            </div>
            <div style={{ borderRadius: 14, background: VIOLET, color: '#fff', fontWeight: 700, fontSize: 17 * k, padding: `${14 * k}px ${22 * k}px`, textAlign: 'center', transform: `scale(${press(t, 2.6)})`, whiteSpace: 'nowrap' }}>Creator suchen ⌕</div>
          </div>
        </div>

        {/* Ergebnisse */}
        {cards.map((c, i) => {
          const p = spring(seg(t, 3.35 + i * 0.18, 3.95 + i * 0.18), 0.7);
          if (p <= 0) return null;
          const at = i === 0 ? 6.7 : 7.6;
          return (
            <div key={c.name} style={abs(cardPos(i).x, cardPos(i).y + (1 - p) * 60, { opacity: clampOp(p * 1.4) })}>
              <CreatorCard c={c} w={cW} k={kc} selected={sel[i]} btnScale={press(t, at)} />
            </div>
          );
        })}

        {/* Auswahl-Leiste */}
        {barIn > 0 && (
          <div style={abs(barX, barY, { width: barW, height: barH, borderRadius: 24, background: '#fff', border: '1px solid #E8E8E4', boxShadow: '0 -10px 50px rgba(35,22,47,.12)', display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: v ? 'center' : 'space-between', gap: v ? 14 : 0, padding: v ? 20 : '0 26px' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 40 * k, height: 40 * k, borderRadius: '50%', background: '#EDF5E5', color: '#385523', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 * k }}>✓</span>
              <div>
                <div style={{ fontSize: 19 * k, fontWeight: 700, color: '#171717' }}>{count} Creator in deiner Auswahl</div>
                {!v && <div style={{ fontSize: 13.5, color: '#5A5A5A' }}>Kostenlos anfragen, Kontaktinfos per E-Mail erhalten.</div>}
              </div>
            </div>
            <div style={{ borderRadius: 14, background: VIOLET, color: '#fff', fontWeight: 700, fontSize: 16 * k, padding: `${13 * k}px ${22 * k}px`, transform: `scale(${press(t, 9.1)})` }}>Kostenlos Anfrage senden</div>
          </div>
        )}

        {/* Anfrage-Panel / Mail */}
        {panelIn > 0 && (
          <div style={abs(pX, pY, { width: pW, height: pH, borderRadius: 30, background: '#fff', border: '1px solid #E8E8E4', boxShadow: '0 40px 120px rgba(35,22,47,.22)', overflow: 'hidden' })}>
            <div style={{ position: 'absolute', inset: 0, padding: v ? 50 : 44, opacity: 1 - mail }}>
              <div style={{ fontSize: 30 * k, fontWeight: 700, color: '#171717', letterSpacing: '-0.03em', textAlign: 'center' }}>Fast geschafft!</div>
              <div style={{ fontSize: 15 * k, color: '#5A5A5A', textAlign: 'center', marginTop: 6 }}>Kein Login, kein Abo – nur deine Kontaktdaten.</div>
              {[
                ['Dein Name', typed('Lisa', t, 9.75, 10.05)],
                ['E-Mail-Adresse', typed('lisa@deine-brand.de', t, 10.05, 10.5)],
                ['Projektbeschreibung', typed('Serum-Launch im November, 2 Reels für Instagram', t, 10.5, 11.0)],
              ].map(([label, val]) => (
                <div key={label} style={{ marginTop: v ? 34 : 24 }}>
                  <div style={{ fontSize: 14 * k, fontWeight: 700, color: '#171717' }}>{label}</div>
                  <div style={{ marginTop: 8, borderRadius: 14, border: '1px solid #E8E8E4', padding: `${15 * k}px 16px`, fontSize: 16 * k, color: '#171717', minHeight: 24 * k }}>{val || ' '}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, padding: v ? 50 : 44, opacity: mail, transform: `translateY(${(1 - mail) * 20}px)` }}>
              <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13 * k, letterSpacing: '0.18em', textTransform: 'uppercase', color: VIOLET }}>Dein kostenloses Matching</div>
              <div style={{ fontSize: 38 * k, fontWeight: 700, color: '#171717', letterSpacing: '-0.04em', marginTop: 10 }}>Deine Creator-Auswahl ist da</div>
              <div style={{ fontSize: 16 * k, color: '#5A5A5A', marginTop: 10 }}>Die verfügbaren Kontaktdaten deiner Favoriten:</div>
              {[CREATORS[0], v ? CREATORS[1] : CREATORS[2]].map((c, i) => {
                const p = spring(seg(t, 11.5 + i * 0.3, 12.1 + i * 0.3), 0.7);
                return (
                  <div key={c.name} style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 18, borderRadius: 18, background: '#F7F7F5', padding: v ? 24 : 20, opacity: clampOp(p * 1.3), transform: `translateX(${(1 - p) * 40}px)` }}>
                    <Avatar c={c} size={56 * k} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19 * k, fontWeight: 700, color: '#171717' }}>{c.name} · {c.city}</div>
                      <div style={{ fontSize: 15 * k, color: VIOLET, fontWeight: 600 }}>E-Mail: <Bar w={150 * k} op={0.9} /></div>
                    </div>
                    <span style={{ width: 38 * k, height: 38 * k, borderRadius: '50%', background: '#EDF5E5', color: '#385523', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 26, fontSize: 14 * k, color: '#5A5A5A' }}>Kostenlos · ohne Provision · ihr vereinbart alles direkt</div>
            </div>
          </div>
        )}

        <Cursor x={cur.x} y={cur.y} t={t} clicks={[2.6, 6.7, 7.6, 9.1]} opacity={cursorOp} />
      </div>
      <CloseScene t={t} v={v} url="ugc-vz.de" line={<>Kostenlos.<br /><span style={{ color: VIOLET }}>Ohne Provision.</span></>} />
    </>
  );
}

/* ------------------------------------------------------------------ Film B */

function Phone({ x, y, w, h, scale = 1, children }: { x: number; y: number; w: number; h: number; scale?: number; children: ReactNode }) {
  return (
    <div style={abs(x, y, { width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: w * 0.16, background: '#060606', padding: w * 0.03, boxShadow: '0 50px 120px rgba(35,22,47,.30)' })}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.135, background: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: w * 0.03, width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: 999, background: '#060606', zIndex: 30 }} />
        {children}
      </div>
    </div>
  );
}

function Banner({ t, at, out, s, title, text }: { t: number; at: number; out: number; s: number; title: string; text: string }) {
  const p = spring(seg(t, at, at + 0.55), 0.7) * (1 - easeOut(seg(t, out, out + 0.35)));
  if (p <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 14 * s, right: 14 * s, top: lerp(-140 * s, 56 * s, p), zIndex: 35, borderRadius: 22 * s, background: 'rgba(255,255,255,.96)', boxShadow: '0 14px 40px rgba(0,0,0,.18)', padding: 16 * s, display: 'flex', gap: 12 * s, alignItems: 'center', border: '1px solid #E8E8E4' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-touch-icon.png" alt="" style={{ width: 44 * s, height: 44 * s, borderRadius: 11 * s }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 * s, fontWeight: 700, color: '#171717' }}>{title}</div>
        <div style={{ fontSize: 13 * s, color: '#5A5A5A', lineHeight: 1.35 }}>{text}</div>
      </div>
    </div>
  );
}

function CreatorFilm({ t, v }: { t: number; v: boolean }) {
  const W = v ? 900 : 1600;
  const H = v ? 1600 : 900;
  const phW = v ? 560 : 390;
  const phH = v ? 1150 : 800;
  const s = phW / (v ? 330 : 300); // Skalierung des Phone-Inhalts (Basis-Layout ~300 px breit)
  const side = easeInOut(seg(t, 6.5, 7.3));
  const phX = v ? (W - phW) / 2 : lerp((W - phW) / 2, 150, side);
  const phY = v ? lerp(110, 60, side) : 50;
  const phScale = v ? lerp(1, 0.6, side) : 1;
  const phXv = v ? lerp((W - phW) / 2, (W - phW * 0.6) / 2, side) : phX;

  const formOut = seg(t, 4.3, 4.6);
  const mailIn = seg(t, 4.4, 4.75);
  const profileIn = seg(t, 6.4, 6.8);
  const chip = (name: string, at: number) => {
    const on = t >= at;
    return <span key={name} style={{ borderRadius: 999, padding: `${7 * s}px ${13 * s}px`, fontSize: 13 * s, fontWeight: 600, border: `1.5px solid ${on ? VIOLET : '#E8E8E4'}`, background: on ? '#F4EDFB' : '#fff', color: on ? VIOLET : '#171717', transform: `scale(${press(t, at)})`, display: 'inline-block', position: 'relative' }}>{on ? '✓ ' : ''}{name}<Ripple t={t} at={at} /></span>;
  };

  const gridIn = (i: number) => spring(seg(t, 6.9 + i * 0.08, 7.5 + i * 0.08), 0.7);
  const gridOut = easeOut(seg(t, 10.5, 10.9));
  const mailCard = spring(seg(t, 10.8, 11.5), 0.6);
  const content = 1 - easeOut(seg(t, 13.5, 13.95));

  const gCols = v ? 2 : 3;
  const gW = v ? 360 : 250;
  const gGap = v ? 28 : 22;
  const gX0 = v ? (W - (gCols * gW + gGap)) / 2 : 640;
  const gY0 = v ? 820 : 150;
  const others = ['JO', 'LE', 'SE', 'TO', 'AN'];

  return (
    <>
      <Backdrop />
      <div style={{ position: 'absolute', inset: 0, opacity: content, transform: `scale(${lerp(0.96, 1, content)})` }}>
        <Phone x={v ? phXv : phX} y={phY} w={phW} h={phH} scale={phScale}>
          {/* Screen A: Anmeldeformular */}
          <div style={{ position: 'absolute', inset: 0, padding: `${66 * s}px ${20 * s}px`, opacity: 1 - formOut }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugc-vz-logo.svg" alt="" style={{ height: 34 * s }} />
            <div style={{ fontSize: 22 * s, fontWeight: 700, color: '#171717', letterSpacing: '-0.03em', marginTop: 16 * s, whiteSpace: 'nowrap' }}>Als Creator anmelden</div>
            <div style={{ fontSize: 13 * s, color: '#5A5A5A', marginTop: 4 * s }}>Kostenlos · ohne Provision</div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 22 * s, color: '#171717' }}>Name</div>
            <div style={{ marginTop: 6 * s, border: '1px solid #E8E8E4', borderRadius: 12 * s, padding: `${11 * s}px ${12 * s}px`, fontSize: 15 * s, minHeight: 20 * s, color: '#171717' }}>{typed('Mia', t, 0.3, 0.8) || ' '}</div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 16 * s, color: '#171717' }}>Deine Themen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 * s, marginTop: 8 * s }}>
              {chip('Beauty', 1.2)}{chip('Food', 1.6)}{chip('Fashion', 99)}{chip('Fitness', 99)}
            </div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 16 * s, color: '#171717' }}>Social-Link</div>
            <div style={{ marginTop: 6 * s, border: '1px solid #E8E8E4', borderRadius: 12 * s, padding: `${11 * s}px ${12 * s}px`, fontSize: 14 * s, minHeight: 20 * s, color: '#171717' }}>{typed('instagram.com/dein-profil', t, 1.8, 2.3) || ' '}</div>
            <div style={{ marginTop: 22 * s, borderRadius: 14 * s, background: VIOLET, color: '#fff', fontWeight: 700, textAlign: 'center', padding: `${14 * s}px 0`, fontSize: 15 * s, transform: `scale(${press(t, 2.55)})`, position: 'relative' }}>Profil anlegen<Ripple t={t} at={2.55} /></div>
          </div>
          {/* Screen B: Bestaetigungsmail */}
          <div style={{ position: 'absolute', inset: 0, padding: `${80 * s}px ${22 * s}px`, opacity: mailIn * (1 - profileIn), background: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11 * s, letterSpacing: '0.16em', color: VIOLET, textTransform: 'uppercase' }}>UGC VZ · E-Mail</div>
            <div style={{ fontSize: 22 * s, fontWeight: 700, color: '#171717', letterSpacing: '-0.03em', marginTop: 10 * s, lineHeight: 1.15 }}>Bestätige dein kostenloses UGC-VZ-Profil</div>
            <div style={{ fontSize: 13.5 * s, color: '#5A5A5A', marginTop: 12 * s, lineHeight: 1.5 }}>Hallo Mia, ein Klick und dein Profil ist für Brands sichtbar.</div>
            <div style={{ marginTop: 22 * s, borderRadius: 12 * s, background: VIOLET, color: '#fff', fontWeight: 700, textAlign: 'center', padding: `${14 * s}px 0`, fontSize: 15 * s, transform: `scale(${press(t, 5.0)})`, position: 'relative' }}>E-Mail bestätigen<Ripple t={t} at={5.0} /></div>
            {t >= 5.25 && (
              <div style={{ marginTop: 26 * s, borderRadius: 16 * s, background: '#EDF5E5', color: '#385523', padding: 16 * s, fontWeight: 700, fontSize: 15 * s, opacity: easeOut(seg(t, 5.25, 5.6)), transform: `translateY(${(1 - spring(seg(t, 5.25, 5.8))) * 16}px)` }}>✓ Dein Creator-Profil ist aktiv</div>
            )}
          </div>
          {/* Screen C: eigenes Profil */}
          <div style={{ position: 'absolute', inset: 0, padding: `${80 * s}px ${22 * s}px`, opacity: profileIn, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s }}>
              <Avatar c={CREATORS[0]} size={64 * s} />
              <div>
                <div style={{ fontSize: 22 * s, fontWeight: 700, color: '#171717' }}>Mia</div>
                <div style={{ fontSize: 13 * s, color: '#5A5A5A' }}>Berlin</div>
              </div>
              <span style={{ marginLeft: 'auto', borderRadius: 999, background: '#EDF5E5', color: '#385523', fontSize: 12 * s, fontWeight: 700, padding: `${5 * s}px ${10 * s}px` }}>● Live</span>
            </div>
            <div style={{ marginTop: 20 * s, fontSize: 14 * s, color: '#5A5A5A', lineHeight: 1.5 }}>Beauty, Food · Reels, Unboxing</div>
            {[0, 1, 2].map((i) => <div key={i} style={{ marginTop: 14 * s, height: 70 * s, borderRadius: 14 * s, background: '#F7F7F5' }} />)}
          </div>
          <Banner t={t} at={2.85} out={4.3} s={s} title="UGC VZ" text="Bestätige dein kostenloses UGC-VZ-Profil" />
          <Banner t={t} at={9.8} out={13.4} s={s} title="Neue Brand-Anfrage" text="Eine Brand interessiert sich für dein Profil" />
        </Phone>

        {/* Verzeichnis-Raster */}
        {t >= 6.9 && gridOut < 1 && Array.from({ length: 6 }).map((_, i) => {
          if (v && i > 3) return null;
          const p = gridIn(i);
          const me = i === (v ? 1 : 1);
          const col = i % gCols;
          const row = Math.floor(i / gCols);
          const c = me ? CREATORS[0] : { ...CREATORS[1], initials: others[i % others.length], name: ' ' };
          const live = me ? spring(seg(t, 7.5, 8.1), 0.8) : 0;
          return (
            <div key={i} style={abs(gX0 + col * (gW + gGap), gY0 + row * (v ? 330 : 300) + (1 - p) * 40, { width: gW, opacity: clampOp(p) * (1 - gridOut) * (me ? 1 : 0.55), borderRadius: 20, background: '#fff', border: `${me ? 2 : 1}px solid ${me ? VIOLET : '#E8E8E4'}`, padding: 18, boxShadow: me ? '0 24px 60px rgba(139,63,202,.25)' : 'none', transform: `scale(${me ? 1 + 0.04 * live : 1})` })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar c={c} size={v ? 64 : 52} />
                {me ? <div><div style={{ fontWeight: 700, fontSize: v ? 24 : 18, color: '#171717' }}>Mia</div><div style={{ fontSize: v ? 16 : 13, color: '#5A5A5A' }}>Berlin</div></div> : <Bar w={80} />}
                {me && live > 0 && <span style={{ marginLeft: 'auto', borderRadius: 999, background: '#EDF5E5', color: '#385523', fontSize: v ? 15 : 12, fontWeight: 700, padding: '5px 10px', opacity: clampOp(live) }}>● Live</span>}
              </div>
              <div style={{ marginTop: 16 }}><Bar w={gW - 60} /></div>
              <div style={{ marginTop: 10 }}><Bar w={gW - 110} /></div>
              <div style={{ marginTop: 16, height: v ? 44 : 36, borderRadius: 12, background: me ? VIOLET : '#F7F7F5' }} />
            </div>
          );
        })}

        {/* Mail mit Brand-Anfrage */}
        {mailCard > 0 && (
          <div style={abs(v ? 60 : 640, v ? 820 + (1 - mailCard) * 60 : 140 + (1 - mailCard) * 60, { width: v ? 780 : 820, opacity: clampOp(mailCard * 1.3), borderRadius: 30, background: '#fff', border: '1px solid #E8E8E4', boxShadow: '0 40px 120px rgba(35,22,47,.18)', padding: v ? 48 : 44 })}>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: v ? 16 : 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: VIOLET }}>Neue Brand-Anfrage</div>
            <div style={{ fontSize: v ? 44 : 38, fontWeight: 700, color: '#171717', letterSpacing: '-0.04em', marginTop: 10, lineHeight: 1.08 }}>Eine Brand interessiert sich für dein Profil</div>
            {[['Projekt', 'Serum-Launch im November'], ['Format', '2 Reels für Instagram'], ['Kontakt', 'Antwort geht direkt an die Brand']].map(([k2, val], i) => {
              const p = easeOut(seg(t, 11.4 + i * 0.25, 11.8 + i * 0.25));
              return (
                <div key={k2} style={{ marginTop: 18, display: 'flex', gap: 16, fontSize: v ? 22 : 18, opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
                  <span style={{ width: v ? 130 : 110, color: '#5A5A5A' }}>{k2}</span>
                  <span style={{ color: '#171717', fontWeight: 600 }}>{val}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 30, display: 'inline-block', borderRadius: 14, background: VIOLET, color: '#fff', fontWeight: 700, fontSize: v ? 22 : 18, padding: v ? '18px 30px' : '15px 26px', transform: `scale(${spring(seg(t, 12.3, 12.8), 0.8)})` }}>Direkt antworten</div>
          </div>
        )}
      </div>
      <CloseScene t={t} v={v} url="ugc-vz.de/creator" size={v ? 76 : undefined} line={v
        ? <>Kostenlos.<br />Ohne Provision.<br /><span style={{ color: VIOLET }}>Direkt mit der Brand.</span></>
        : <>Kostenlos. Ohne Provision.<br /><span style={{ color: VIOLET }}>Direkt mit der Brand.</span></>} />
      {/* Hoehe fuer 9:16 explizit, damit absolute Kinder korrekt liegen */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }} />
    </>
  );
}

export default function HowItWorksFilm({ t, film, format }: { t: number; film: Film; format: Format }) {
  const v = format === '9x16';
  const W = v ? 900 : 1600;
  const H = v ? 1600 : 900;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
      {film === 'brands' ? <BrandsFilm t={t} v={v} /> : <CreatorFilm t={t} v={v} />}
    </div>
  );
}
