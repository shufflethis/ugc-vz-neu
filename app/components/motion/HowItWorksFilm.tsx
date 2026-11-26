// Erklaerfilm "So funktioniert UGC VZ" als reine Funktion der Zeit (ugcVZ Rot-Blau CI v1.0):
// <HowItWorksFilm t={7.5} film="brands" format="16x9" /> zeichnet exakt den Frame bei 7,5 s.
// Keine Hooks, keine Transitions -- Website-Player und Video-Export nutzen dieselbe Quelle.
import { CSSProperties, ReactNode } from 'react';
import {
  caretOn, easeInOut, easeOut, Film, Format, lerp, path, press, seg, spring, typed,
} from './timeline';

const BLUE = '#06458F';
const NAVY = '#062A59';
const BLUE_SOFT = '#EBF2FA';
const RED = '#F2072A';
const RED_DARK = '#D10523';
const RED_SOFT = '#FDECEF';
const INK = '#202124';
const MUTED = '#5C6470';
const CLOUD = '#F5F7FA';
const BORDER = '#DCE2EA';
const SUCCESS_BG = '#E8F7EE';
const SUCCESS_TXT = '#157347';
const AVATAR_GRADIENT = 'linear-gradient(135deg, #062A59 0%, #06458F 68%, #0A5BB8 100%)';

type Creator = { name: string; initials: string; city: string; topics: string; formats: string; views: string; payout: string };
const CREATORS: Creator[] = [
  { name: 'Mia', initials: 'MI', city: 'Berlin', topics: 'Beauty, Skincare, Lifestyle', formats: 'Reels, TikTok, Unboxing', views: '42.000 Views', payout: '84,00 €' },
  { name: 'Jonas', initials: 'JO', city: 'Köln', topics: 'Tech, Food, Fitness', formats: 'Produktdemo, Hooks, TikTok', views: '23.000 Views', payout: '46,00 €' },
  { name: 'Lea', initials: 'LE', city: 'München', topics: 'Beauty, Fashion, Home', formats: 'Testimonials, Reels, Stories', views: '31.000 Views', payout: '62,00 €' },
  { name: 'Selin', initials: 'SE', city: 'Hamburg', topics: 'Skincare, Wellness, Food', formats: 'Unboxing, Get Ready With Me', views: '19.000 Views', payout: '38,00 €' },
];

const abs = (x: number, y: number, extra: CSSProperties = {}): CSSProperties => ({ position: 'absolute', left: x, top: y, ...extra });

function Avatar({ c, size, accent = false }: { c: Creator; size: number; accent?: boolean }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: accent ? `linear-gradient(135deg, ${BLUE} 0%, ${RED} 100%)` : AVATAR_GRADIENT,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.34,
      flexShrink: 0,
      letterSpacing: '0.02em',
      boxShadow: '0 6px 16px rgba(6,69,143,.18)',
    }}>
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
        <div style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: '50%', border: `3px solid ${RED}`, opacity: 1 - ring, transform: `scale(${0.4 + ring})` }} />
      )}
      <svg width="34" height="34" viewBox="0 0 24 24" style={{ transform: `scale(${s})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 4px 8px rgba(6,42,89,.28))' }}>
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.7 L11 13.3 L17.5 13 Z" fill={NAVY} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Tipp-Kreis in ugcVZ Directory Blue, zentriert im umgebenden (position: relative) Element. */
function Ripple({ t, at }: { t: number; at: number }) {
  const p = seg(t, at - 0.25, at + 0.4);
  if (p <= 0 || p >= 1) return null;
  const grow = p < 0.4 ? p / 0.4 : 1;
  const fade = p < 0.4 ? 1 : 1 - (p - 0.4) / 0.6;
  return <span style={{ position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: '50%', background: 'rgba(6,69,143,.22)', border: '2px solid rgba(6,69,143,.6)', transform: `scale(${0.5 + grow * 0.5})`, opacity: fade, zIndex: 40, pointerEvents: 'none' }} />;
}

function Bar({ w, op = 1 }: { w: number; op?: number }) {
  return <span style={{ display: 'inline-block', width: w, height: '0.7em', borderRadius: 6, background: BORDER, opacity: op, verticalAlign: 'middle' }} />;
}

function CreatorCard({ c, w, k, selected, btnScale = 1 }: { c: Creator; w: number; k: number; selected: boolean; btnScale?: number }) {
  return (
    <div style={{
      width: w,
      borderRadius: 16 * k,
      border: `${selected ? 2 : 1}px solid ${selected ? BLUE : BORDER}`,
      background: selected ? '#F8FBFF' : '#fff',
      padding: 20 * k,
      boxShadow: selected ? '0 20px 44px rgba(6,69,143,.14)' : '0 10px 28px rgba(6,42,89,.06)',
      fontSize: 14 * k,
      lineHeight: 1.45,
      color: MUTED,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 * k }}>
        <Avatar c={c} size={56 * k} accent={selected} />
        <div>
          <div style={{ fontSize: 19 * k, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{c.name}</div>
          <div style={{ fontSize: 13 * k, color: MUTED }}>{c.city}</div>
        </div>
      </div>
      <div style={{ marginTop: 14 * k, color: INK, fontWeight: 500 }}>{c.topics}</div>
      <div style={{ marginTop: 5 * k }}>{c.formats}</div>
      <div style={{ marginTop: 10 * k, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 * k, background: BLUE_SOFT, color: BLUE, padding: `${4 * k}px ${10 * k}px`, fontSize: 12.5 * k, fontWeight: 700 }}>
        <span>2,00 € / 1.000 Views</span>
      </div>
      <div style={{ marginTop: 8 * k, fontSize: 12.5 * k, color: SUCCESS_TXT, fontWeight: 600 }}>✓ Profil &amp; Views verifiziert</div>
      <div style={{ marginTop: 12 * k, borderRadius: 10 * k, border: `1px solid ${BORDER}`, padding: `${9 * k}px 0`, textAlign: 'center', fontWeight: 600, color: INK, fontSize: 13.5 * k, background: '#fff' }}>Profil &amp; Reels ansehen ↗</div>
      <div style={{
        marginTop: 10 * k,
        borderRadius: 10 * k,
        padding: `${11 * k}px 0`,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 13.5 * k,
        transform: `scale(${btnScale})`,
        background: selected ? SUCCESS_BG : BLUE,
        color: selected ? SUCCESS_TXT : '#fff',
        boxShadow: selected ? 'none' : '0 6px 16px rgba(6,69,143,.22)',
      }}>
        {selected ? '✓ In Kampagne' : '+ Auswählen'}
      </div>
    </div>
  );
}

function Backdrop({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: dark ? NAVY : CLOUD }} />
      {/* Dezentes ugcVZ Rot-Blau Licht auf Cloud #F5F7FA */}
      <div style={{ position: 'absolute', right: '-14%', top: '-26%', width: '68%', height: '82%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,69,143,0.16) 0%, rgba(6,69,143,0) 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', left: '-18%', bottom: '-28%', width: '58%', height: '72%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(242,7,42,0.10) 0%, rgba(242,7,42,0) 70%)', filter: 'blur(50px)' }} />
      {/* Feiner ugcVZ Akzent-Streifen ganz oben (80% Directory Blue, 20% Creator Red) */}
      <div style={{ position: 'absolute', left: 0, top: 0, right: '20%', height: 8, background: BLUE }} />
      <div style={{ position: 'absolute', left: '80%', top: 0, right: 0, height: 8, background: RED }} />
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
      <div style={{ fontSize: size ?? (v ? 86 : 80), fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.04, color: INK, opacity: easeOut(p), transform: `translateY(${(1 - easeOut(p)) * 24}px)` }}>{line}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/ugcvz-logo-red-blue.png" alt="UGC VZ" style={{ height: v ? 156 : 128, marginTop: v ? 64 : 46, opacity: clampOp(logo), transform: `scale(${0.86 + 0.14 * logo})` }} />
      <div style={{ marginTop: 26, fontFamily: 'var(--font-geist-mono), monospace', fontSize: v ? 32 : 26, fontWeight: 600, color: BLUE, opacity: u, background: BLUE_SOFT, padding: '8px 22px', borderRadius: 999 }}>{url}</div>
    </div>
  );
}
const clampOp = (x: number) => Math.min(1, Math.max(0, x));

/* ------------------------------------------------------------------ Film A (Marken) */

function BrandsFilm({ t, v }: { t: number; v: boolean }) {
  const W = v ? 900 : 1600;
  const k = v ? 1.25 : 1.2;
  const kc = k * (v ? 1.05 : 1);
  const query = 'Skincare-Serum, Reel für Instagram, DACH';
  const cards = CREATORS;
  // 16:9: Mia + Lea, 9:16 (2x2-Raster): Mia + Jonas
  const sel = [t >= 6.75, v && t >= 7.65, !v && t >= 7.65, false];

  // Suchkarte: zentriert -> oben verkleinert
  const up = spring(seg(t, 3.0, 3.7), 0.6);
  const sW = v ? 780 : 1120;
  const sX = (W - sW) / 2;
  const sY = lerp(v ? 520 : 210, v ? 64 : 28, up);
  const s0 = v ? 1 : 1.1;
  const sScale = lerp(s0, v ? 0.9 : 0.74, up);

  // Kartenraster
  const cW = v ? 395 : 355;
  const gap = v ? 30 : 24;
  const cols = v ? 2 : 4;
  const rowH = v ? 465 : 0;
  const gridW = cols * cW + (cols - 1) * gap;
  const gX = (W - gridW) / 2;
  const gY = v ? 420 : 258;
  const cardPos = (i: number) => ({ x: gX + (i % cols) * (cW + gap), y: gY + Math.floor(i / cols) * rowH });
  const cardBtn = (i: number) => ({ x: cardPos(i).x + cW / 2, y: cardPos(i).y + 305 * kc });

  // Auswahl-Leiste
  const count = (t >= 6.75 ? 1 : 0) + (t >= 7.65 ? 1 : 0);
  const barIn = spring(seg(t, 6.8, 7.3), 0.7);
  const barW = v ? 780 : 1272;
  const barH = v ? 156 : 96;
  const barY = lerp(v ? 1600 : 900, (v ? 1600 : 900) - barH - (v ? 54 : 30), barIn);
  const barX = (W - barW) / 2;
  const ctaX = v ? barX + barW / 2 : barX + barW - 170;
  const ctaY = v ? barY + 106 : barY + barH / 2;

  // Kampagnen-Brief -> Live-Report
  const panelIn = spring(seg(t, 9.15, 9.75), 0.55);
  const pW = v ? 800 : 1020;
  const pH = v ? 860 : 650;
  const pX = (W - pW) / 2;
  const pY = lerp(v ? 1650 : 950, v ? 350 : 118, panelIn);
  const mail = easeInOut(seg(t, 11.0, 11.5));

  const btnRelX = v ? sW / 2 : sW - 135 * k;
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
    [9.0, ctaX, (v ? 1600 : 900) - barH / 2 - (v ? 54 : 30) + (v ? 30 : 0)],
  ]);
  const cursorOp = 1 - seg(t, 9.3, 9.6);
  const content = 1 - easeOut(seg(t, 13.5, 13.95));

  return (
    <>
      <Backdrop />
      <div style={{ position: 'absolute', inset: 0, opacity: content, transform: `scale(${lerp(0.96, 1, content)})` }}>
        {/* Suchkarte */}
        <div style={abs(sX, sY, { width: sW, transform: `scale(${sScale})`, transformOrigin: 'top center', borderRadius: 24, background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 24px 64px rgba(6,69,143,.10)', padding: v ? 32 : 28 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ugcvz-logo-header.png" alt="UGC VZ" style={{ height: v ? 38 : 34 }} />
              <div style={{ fontSize: 20 * k, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>Creator-Pool DACH</div>
            </div>
            {!v && (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: BLUE, background: BLUE_SOFT, padding: '6px 14px', borderRadius: 999 }}>
                ✓ Fester Budget-Deckel · Geprüfte Views
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {(v ? ['Beauty & Pflege', 'Food & Drinks', 'Apps & Tech'] : ['Beauty & Pflege', 'Food & Drinks', 'Apps & Tech', 'Mode & Schmuck', 'Home & Garten']).map((chip, idx) => (
              <span key={chip} style={{ borderRadius: 999, background: idx === 0 ? BLUE_SOFT : CLOUD, border: `1px solid ${idx === 0 ? BLUE : BORDER}`, padding: `${7 * k}px ${15 * k}px`, fontSize: 13.5 * k, fontWeight: 600, color: idx === 0 ? BLUE : INK }}>{chip}</span>
            ))}
          </div>
          <div style={{ marginTop: 18, borderRadius: 14, border: `1.5px solid ${t > 0.3 && t < 3 ? BLUE : BORDER}`, background: CLOUD, padding: v ? 20 : 16, display: 'flex', alignItems: v ? 'stretch' : 'center', flexDirection: v ? 'column' : 'row', gap: 14 }}>
            <div style={{ flex: 1, fontSize: 18 * k, color: INK, minHeight: 28 * k, fontWeight: 500 }}>
              {t < 0.4 ? <span style={{ color: MUTED }}>Produkt, Zielgruppe, Videoformat ...</span> : typed(query, t, 0.4, 2.0)}
              {t >= 0.4 && t < 2.6 && caretOn(t) && <span style={{ display: 'inline-block', width: 2.5, height: '1.1em', background: RED, verticalAlign: 'text-bottom', marginLeft: 2 }} />}
            </div>
            <div style={{ borderRadius: 10, background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16 * k, padding: `${13 * k}px ${22 * k}px`, textAlign: 'center', transform: `scale(${press(t, 2.6)})`, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(6,69,143,.24)' }}>Creator suchen ⌕</div>
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
          <div style={abs(barX, barY, { width: barW, height: barH, borderRadius: 20, background: '#fff', border: `2px solid ${BLUE}`, boxShadow: '0 -8px 44px rgba(6,69,143,.16)', display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: v ? 'center' : 'space-between', gap: v ? 14 : 0, padding: v ? 20 : '0 26px' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 40 * k, height: 40 * k, borderRadius: '50%', background: SUCCESS_BG, color: SUCCESS_TXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 * k }}>✓</span>
              <div>
                <div style={{ fontSize: 19 * k, fontWeight: 700, color: INK }}>{count} Creator für deine Kampagne</div>
                {!v && <div style={{ fontSize: 13.5, color: MUTED }}>Budget-Deckel festlegen, nur geprüfte Views zahlen.</div>}
              </div>
            </div>
            <div style={{ borderRadius: 10, background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16 * k, padding: `${13 * k}px ${24 * k}px`, transform: `scale(${press(t, 9.1)})`, boxShadow: '0 8px 20px rgba(6,69,143,.25)' }}>Kampagne starten →</div>
          </div>
        )}

        {/* Kampagnen-Brief / Live-Report */}
        {panelIn > 0 && (
          <div style={abs(pX, pY, { width: pW, height: pH, borderRadius: 24, background: '#fff', border: `1px solid ${BORDER}`, borderTop: `5px solid ${BLUE}`, boxShadow: '0 36px 96px rgba(6,42,89,.22)', overflow: 'hidden' })}>
            <div style={{ position: 'absolute', inset: 0, padding: v ? 46 : 42, opacity: 1 - mail }}>
              <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 * k, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: RED_DARK, textAlign: 'center' }}>Kampagnen-Brief</div>
              <div style={{ fontSize: 30 * k, fontWeight: 800, color: INK, letterSpacing: '-0.03em', textAlign: 'center', marginTop: 6 }}>Dein Budget, deine Regeln</div>
              <div style={{ fontSize: 15 * k, color: MUTED, textAlign: 'center', marginTop: 6 }}>Kein Abo · Fester Budget-Deckel in jeder Kampagne</div>
              {[
                ['Marke', typed('GlowLab Berlin', t, 9.75, 10.05)],
                ['Vergütung & Budget-Deckel', typed('2,00 € / 1.000 Views · Max. 500 €', t, 10.05, 10.5)],
                ['Kurz-Briefing', typed('Serum im Alltag zeigen, 2 Reels für Instagram', t, 10.5, 11.0)],
              ].map(([label, val]) => (
                <div key={label} style={{ marginTop: v ? 30 : 22 }}>
                  <div style={{ fontSize: 14 * k, fontWeight: 700, color: INK }}>{label}</div>
                  <div style={{ marginTop: 8, borderRadius: 12, border: `1.5px solid ${BORDER}`, background: CLOUD, padding: `${14 * k}px 16px`, fontSize: 16 * k, fontWeight: 500, color: INK, minHeight: 24 * k }}>{val || ' '}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, padding: v ? 46 : 42, opacity: mail, transform: `translateY(${(1 - mail) * 20}px)` }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, background: RED_SOFT, padding: '6px 14px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 * k, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: RED_DARK }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
                Live-Report · Geprüfte Views
              </div>
              <div style={{ fontSize: 36 * k, fontWeight: 800, color: INK, letterSpacing: '-0.035em', marginTop: 12 }}>Deine Kampagne läuft</div>
              <div style={{ fontSize: 16 * k, color: MUTED, marginTop: 8 }}>Nur geprüfte Beiträge zählen für dein Budget:</div>
              {[CREATORS[0], v ? CREATORS[1] : CREATORS[2]].map((c, i) => {
                const p = spring(seg(t, 11.5 + i * 0.3, 12.1 + i * 0.3), 0.7);
                return (
                  <div key={c.name} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 18, borderRadius: 16, border: `1px solid ${BORDER}`, background: CLOUD, padding: v ? 22 : 18, opacity: clampOp(p * 1.3), transform: `translateX(${(1 - p) * 40}px)` }}>
                    <Avatar c={c} size={56 * k} accent={i === 0} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19 * k, fontWeight: 700, color: INK }}>{c.name} · {c.city}</div>
                      <div style={{ fontSize: 15 * k, color: BLUE, fontWeight: 700, marginTop: 2 }}>{c.views} · {c.payout}</div>
                    </div>
                    <span style={{ borderRadius: 999, background: SUCCESS_BG, color: SUCCESS_TXT, padding: '8px 14px', fontSize: 13 * k, fontWeight: 700 }}>✓ Zählt</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, background: BLUE_SOFT, padding: '14px 18px', fontSize: 14.5 * k, fontWeight: 700, color: BLUE }}>
                <span>Budget-Obergrenze: 500 € (fest)</span>
                <span style={{ color: SUCCESS_TXT }}>Kein Abo</span>
              </div>
            </div>
          </div>
        )}

        <Cursor x={cur.x} y={cur.y} t={t} clicks={[2.6, 6.7, 7.6, 9.1]} opacity={cursorOp} />
      </div>
      <CloseScene
        t={t}
        v={v}
        url="ugc-vz.de"
        line={<>Echte Views.<br /><span style={{ color: BLUE }}>Dein </span><span style={{ color: RED }}>Budget.</span></>}
      />
    </>
  );
}

/* ------------------------------------------------------------------ Film B (Creator) */

function Phone({ x, y, w, h, scale = 1, children }: { x: number; y: number; w: number; h: number; scale?: number; children: ReactNode }) {
  return (
    <div style={abs(x, y, { width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: w * 0.16, background: NAVY, padding: w * 0.03, boxShadow: '0 44px 100px rgba(6,42,89,.28)' })}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.135, background: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: w * 0.03, width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: 999, background: NAVY, zIndex: 30 }} />
        {children}
      </div>
    </div>
  );
}

function Banner({ t, at, out, s, title, text }: { t: number; at: number; out: number; s: number; title: string; text: string }) {
  const p = spring(seg(t, at, at + 0.55), 0.7) * (1 - easeOut(seg(t, out, out + 0.35)));
  if (p <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 14 * s, right: 14 * s, top: lerp(-140 * s, 56 * s, p), zIndex: 35, borderRadius: 18 * s, background: 'rgba(255,255,255,.98)', boxShadow: '0 14px 40px rgba(6,42,89,.18)', padding: 14 * s, display: 'flex', gap: 12 * s, alignItems: 'center', border: `1px solid ${BORDER}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-touch-icon.png" alt="" style={{ width: 42 * s, height: 42 * s, borderRadius: 10 * s, border: `1px solid ${BORDER}` }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 * s, fontWeight: 700, color: BLUE }}>{title}</div>
        <div style={{ fontSize: 12.5 * s, color: INK, lineHeight: 1.35, fontWeight: 500 }}>{text}</div>
      </div>
    </div>
  );
}

function CreatorFilm({ t, v }: { t: number; v: boolean }) {
  const W = v ? 900 : 1600;
  const H = v ? 1600 : 900;
  const phW = v ? 560 : 390;
  const phH = v ? 1150 : 800;
  const s = phW / (v ? 330 : 300);
  const side = easeInOut(seg(t, 6.5, 7.3));
  const phX = v ? (W - phW) / 2 : lerp((W - phW) / 2, 150, side);
  const phY = v ? lerp(110, 56, side) : 50;
  const phScale = v ? lerp(1, 0.59, side) : 1;
  const phXv = v ? lerp((W - phW) / 2, (W - phW * 0.59) / 2, side) : phX;

  const formOut = seg(t, 4.3, 4.6);
  const mailIn = seg(t, 4.4, 4.75);
  const profileIn = seg(t, 6.4, 6.8);
  const chip = (name: string, at: number) => {
    const on = t >= at;
    return <span key={name} style={{ borderRadius: 999, padding: `${7 * s}px ${13 * s}px`, fontSize: 13 * s, fontWeight: 600, border: `1.5px solid ${on ? BLUE : BORDER}`, background: on ? BLUE_SOFT : '#fff', color: on ? BLUE : INK, transform: `scale(${press(t, at)})`, display: 'inline-block', position: 'relative' }}>{on ? '✓ ' : ''}{name}<Ripple t={t} at={at} /></span>;
  };

  const gridIn = (i: number) => spring(seg(t, 6.9 + i * 0.08, 7.5 + i * 0.08), 0.7);
  const gridOut = easeOut(seg(t, 10.5, 10.9));
  const mailCard = spring(seg(t, 10.8, 11.5), 0.6);
  const content = 1 - easeOut(seg(t, 13.5, 13.95));

  const gCols = v ? 2 : 3;
  const gW = v ? 360 : 250;
  const gGap = v ? 28 : 22;
  const gX0 = v ? (W - (gCols * gW + gGap)) / 2 : 640;
  const gY0 = v ? 800 : 150;
  const others = ['JO', 'LE', 'SE', 'TO', 'AN'];

  return (
    <>
      <Backdrop />
      <div style={{ position: 'absolute', inset: 0, opacity: content, transform: `scale(${lerp(0.96, 1, content)})` }}>
        <Phone x={v ? phXv : phX} y={phY} w={phW} h={phH} scale={phScale}>
          {/* Screen A: Anmeldeformular */}
          <div style={{ position: 'absolute', inset: 0, padding: `${66 * s}px ${20 * s}px`, opacity: 1 - formOut }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugcvz-logo-header.png" alt="UGC VZ" style={{ height: 32 * s }} />
            <div style={{ fontSize: 21 * s, fontWeight: 800, color: INK, letterSpacing: '-0.03em', marginTop: 16 * s, whiteSpace: 'nowrap' }}>Als Creator mitmachen</div>
            <div style={{ fontSize: 13 * s, color: BLUE, fontWeight: 600, marginTop: 4 * s }}>Kostenlos · 0 % Gebühr für Creator</div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 20 * s, color: INK }}>Name</div>
            <div style={{ marginTop: 6 * s, border: `1px solid ${BORDER}`, background: CLOUD, borderRadius: 10 * s, padding: `${10 * s}px ${12 * s}px`, fontSize: 15 * s, minHeight: 20 * s, color: INK }}>{typed('Mia', t, 0.3, 0.8) || ' '}</div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 15 * s, color: INK }}>Deine Themen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 * s, marginTop: 8 * s }}>
              {chip('Beauty', 1.2)}{chip('Food', 1.6)}{chip('Fashion', 99)}{chip('Fitness', 99)}
            </div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, marginTop: 15 * s, color: INK }}>Social-Link</div>
            <div style={{ marginTop: 6 * s, border: `1px solid ${BORDER}`, background: CLOUD, borderRadius: 10 * s, padding: `${10 * s}px ${12 * s}px`, fontSize: 14 * s, minHeight: 20 * s, color: INK }}>{typed('instagram.com/mia.ugc', t, 1.8, 2.3) || ' '}</div>
            <div style={{ marginTop: 22 * s, borderRadius: 10 * s, background: BLUE, color: '#fff', fontWeight: 700, textAlign: 'center', padding: `${14 * s}px 0`, fontSize: 15 * s, transform: `scale(${press(t, 2.55)})`, position: 'relative', boxShadow: '0 8px 18px rgba(6,69,143,.24)' }}>Profil anlegen<Ripple t={t} at={2.55} /></div>
          </div>
          {/* Screen B: Bestaetigungsmail */}
          <div style={{ position: 'absolute', inset: 0, padding: `${80 * s}px ${22 * s}px`, opacity: mailIn * (1 - profileIn), background: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11 * s, fontWeight: 700, letterSpacing: '0.16em', color: RED_DARK, textTransform: 'uppercase' }}>UGC VZ · Bestätigung</div>
            <div style={{ fontSize: 21 * s, fontWeight: 800, color: INK, letterSpacing: '-0.03em', marginTop: 10 * s, lineHeight: 1.15 }}>Bestätige dein kostenloses UGC VZ Profil</div>
            <div style={{ fontSize: 13.5 * s, color: MUTED, marginTop: 12 * s, lineHeight: 1.5 }}>Hallo Mia, ein Klick und du kannst bei offenen View-Kampagnen mitmachen.</div>
            <div style={{ marginTop: 22 * s, borderRadius: 10 * s, background: BLUE, color: '#fff', fontWeight: 700, textAlign: 'center', padding: `${14 * s}px 0`, fontSize: 15 * s, transform: `scale(${press(t, 5.0)})`, position: 'relative' }}>E-Mail bestätigen<Ripple t={t} at={5.0} /></div>
            {t >= 5.25 && (
              <div style={{ marginTop: 24 * s, borderRadius: 12 * s, background: SUCCESS_BG, color: SUCCESS_TXT, padding: 15 * s, fontWeight: 700, fontSize: 14.5 * s, opacity: easeOut(seg(t, 5.25, 5.6)), transform: `translateY(${(1 - spring(seg(t, 5.25, 5.8))) * 16}px)` }}>✓ Dein Creator-Profil ist live</div>
            )}
          </div>
          {/* Screen C: eigenes Profil */}
          <div style={{ position: 'absolute', inset: 0, padding: `${78 * s}px ${20 * s}px`, opacity: profileIn, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * s }}>
              <Avatar c={CREATORS[0]} size={60 * s} accent />
              <div>
                <div style={{ fontSize: 21 * s, fontWeight: 800, color: INK }}>Mia</div>
                <div style={{ fontSize: 13 * s, color: MUTED }}>Berlin · Verifiziert</div>
              </div>
              <span style={{ marginLeft: 'auto', borderRadius: 999, background: SUCCESS_BG, color: SUCCESS_TXT, fontSize: 11.5 * s, fontWeight: 700, padding: `${5 * s}px ${10 * s}px` }}>● Live</span>
            </div>
            <div style={{ marginTop: 16 * s, fontSize: 13.5 * s, color: MUTED, lineHeight: 1.5 }}>Beauty, Food · TikTok &amp; Instagram Reels</div>
            <div style={{ marginTop: 16 * s, borderRadius: 12 * s, border: `1px solid ${BORDER}`, background: BLUE_SOFT, padding: 14 * s }}>
              <div style={{ fontSize: 11 * s, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Geprüfte Views</div>
              <div style={{ fontSize: 22 * s, fontWeight: 800, color: INK, marginTop: 4 * s }}>42.000 Views</div>
              <div style={{ fontSize: 12.5 * s, fontWeight: 700, color: SUCCESS_TXT, marginTop: 2 * s }}>84,00 € · 0 % Gebühr</div>
            </div>
            {[0, 1].map((i) => (
              <div key={i} style={{ marginTop: 12 * s, height: 64 * s, borderRadius: 12 * s, border: `1px solid ${BORDER}`, background: CLOUD, padding: `12px ${14 * s}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * s }}>
                  <Bar w={110 * s} />
                  <Bar w={70 * s} op={0.7} />
                </div>
                <span style={{ borderRadius: 8 * s, background: i === 0 ? BLUE : '#fff', color: i === 0 ? '#fff' : BLUE, border: `1px solid ${BLUE}`, fontSize: 11 * s, fontWeight: 700, padding: `${5 * s}px ${10 * s}px` }}>
                  {i === 0 ? 'Aktiv' : 'Offen'}
                </span>
              </div>
            ))}
          </div>
          <Banner t={t} at={2.85} out={4.3} s={s} title="UGC VZ" text="Bestätige dein kostenloses UGC VZ Profil" />
          <Banner t={t} at={9.8} out={13.4} s={s} title="Neue Kampagne" text="2,00 € pro 1.000 Views · Budget 500 €" />
        </Phone>

        {/* Verzeichnis-Raster */}
        {t >= 6.9 && gridOut < 1 && Array.from({ length: 6 }).map((_, i) => {
          if (v && i > 3) return null;
          const p = gridIn(i);
          const me = i === 1;
          const col = i % gCols;
          const row = Math.floor(i / gCols);
          const c = me ? CREATORS[0] : { ...CREATORS[1], initials: others[i % others.length], name: ' ' };
          const live = me ? spring(seg(t, 7.5, 8.1), 0.8) : 0;
          return (
            <div key={i} style={abs(gX0 + col * (gW + gGap), gY0 + row * (v ? 330 : 300) + (1 - p) * 40, { width: gW, opacity: clampOp(p) * (1 - gridOut) * (me ? 1 : 0.55), borderRadius: 18, background: '#fff', border: `${me ? 2 : 1}px solid ${me ? BLUE : BORDER}`, padding: 18, boxShadow: me ? '0 22px 54px rgba(6,69,143,.22)' : 'none', transform: `scale(${me ? 1 + 0.04 * live : 1})` })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar c={c} size={v ? 62 : 50} accent={me} />
                {me ? <div><div style={{ fontWeight: 800, fontSize: v ? 24 : 18, color: INK }}>Mia</div><div style={{ fontSize: v ? 16 : 13, color: MUTED }}>Berlin</div></div> : <Bar w={80} />}
                {me && live > 0 && <span style={{ marginLeft: 'auto', borderRadius: 999, background: SUCCESS_BG, color: SUCCESS_TXT, fontSize: v ? 15 : 12, fontWeight: 700, padding: '5px 10px', opacity: clampOp(live) }}>● Live</span>}
              </div>
              <div style={{ marginTop: 16 }}><Bar w={gW - 60} /></div>
              <div style={{ marginTop: 10 }}><Bar w={gW - 110} /></div>
              <div style={{ marginTop: 16, height: v ? 44 : 36, borderRadius: 10, background: me ? BLUE : CLOUD }} />
            </div>
          );
        })}

        {/* Offene Kampagne Karte */}
        {mailCard > 0 && (
          <div style={abs(v ? 60 : 640, v ? 790 + (1 - mailCard) * 60 : 132 + (1 - mailCard) * 60, { width: v ? 780 : 820, opacity: clampOp(mailCard * 1.3), borderRadius: 24, background: '#fff', border: `1px solid ${BORDER}`, borderTop: `5px solid ${RED}`, boxShadow: '0 36px 96px rgba(6,42,89,.18)', padding: v ? 44 : 42 })}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, background: RED_SOFT, padding: '6px 14px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: v ? 15 : 12.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: RED_DARK }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
              Offene Kampagne
            </div>
            <div style={{ fontSize: v ? 42 : 36, fontWeight: 800, color: INK, letterSpacing: '-0.035em', marginTop: 12, lineHeight: 1.08 }}>Verdiene pro 1.000 geprüfte Views</div>
            {[
              ['Vergütung', '2,00 € pro 1.000 Views'],
              ['Format', 'TikTok oder Instagram Reel'],
              ['Dein Anteil', '100 % vom View-Satz · 0 % Gebühr'],
            ].map(([k2, val], i) => {
              const p = easeOut(seg(t, 11.4 + i * 0.25, 11.8 + i * 0.25));
              return (
                <div key={k2} style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: v ? 21 : 18, opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
                  <span style={{ width: v ? 140 : 120, color: MUTED }}>{k2}</span>
                  <span style={{ color: i === 0 ? BLUE : INK, fontWeight: 700 }}>{val}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 28, display: 'inline-block', borderRadius: 10, background: BLUE, color: '#fff', fontWeight: 700, fontSize: v ? 21 : 18, padding: v ? '16px 28px' : '14px 26px', transform: `scale(${spring(seg(t, 12.3, 12.8), 0.8)})`, boxShadow: '0 10px 24px rgba(6,69,143,.25)' }}>Jetzt teilnehmen →</div>
          </div>
        )}
      </div>
      <CloseScene
        t={t}
        v={v}
        url="ugc-vz.de/creator"
        size={v ? 70 : 68}
        line={v
          ? <>Kostenlos.<br />0 % Gebühr.<br /><span style={{ color: BLUE }}>Bezahlt pro </span><span style={{ color: RED }}>Views.</span></>
          : <>Kostenlos. 0 % Gebühr.<br /><span style={{ color: BLUE }}>Bezahlt pro </span><span style={{ color: RED }}>1.000 Views.</span></>}
      />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none' }} />
    </>
  );
}

export default function HowItWorksFilm({ t, film, format }: { t: number; film: Film; format: Format }) {
  const v = format === '9x16';
  const W = v ? 900 : 1600;
  const H = v ? 1600 : 900;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', fontFamily: "'Inter Variable', 'Inter', var(--font-geist-sans), system-ui, sans-serif" }}>
      {film === 'brands' ? <BrandsFilm t={t} v={v} /> : <CreatorFilm t={t} v={v} />}
    </div>
  );
}
