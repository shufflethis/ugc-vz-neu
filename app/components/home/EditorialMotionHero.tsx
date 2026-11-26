'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import BudgetBar from '../motion/BudgetBar';

export interface MotionHeroStats {
  liveCreatorCount: number | null;
  heroCampaign: {
    title: string;
    tkpEurCents: number;
    totalBudgetEur: number;
    remainingPercent: number;
  } | null;
}

interface EditorialMotionHeroProps {
  stats: MotionHeroStats;
  /** Optionales 5-Sek.-Studio-Video auf reinem #FFFFFF (z. B. aus Pomelli / Veo / Kling). */
  videoSrc?: string;
  /** Zeigt unterhalb des Heroes die kompakte Vorschau- & Video-Upgrade-Leiste (nur fuer /motion-hero). */
  showUpgradeGuideBar?: boolean;
}

const POMELLI_PROMPT =
  'Seamless studio editorial motion loop on pure solid white #FFFFFF cyclorama background. The young German woman gently shifts her weight, turns her shoulders slightly by 15 degrees toward camera with a natural relaxed smile, softly raises her matte black smartphone as if framing a short video, subtle natural hair movement. Soft diffused studio daylight, locked tripod camera, zero camera shake, pure #FFFFFF white background stays completely clean and uniform without shadows or flickering, hyper-realistic 4K editorial look, 5 seconds.';

const EDITORIAL_SPECS = [
  { label: 'Abrechnung', value: 'Pro 1.000 geprüfte Views' },
  { label: 'Budget-Schutz', value: 'Feste Obergrenze, kein Abo' },
  { label: 'Creator-Gebühr', value: '0 % (100 % vom View-Satz)' },
  { label: 'Plattformen', value: 'TikTok, Instagram Reels & Shorts' },
] as const;

function formatEurCentsDe(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function EditorialMotionHero({
  stats,
  videoSrc,
  showUpgradeGuideBar = false,
}: EditorialMotionHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(Boolean(videoSrc));
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Normalisierte Mausposition (-1 .. +1) mit sanfter Feder-Physik fuer Orla-Style Tiefen-Parallax
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 65, damping: 20, mass: 0.7 });
  const mouseY = useSpring(rawMouseY, { stiffness: 65, damping: 20, mass: 0.7 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Scroll-Choreografie: Subjekt waechst hauchfein, schwebende Karten driften sanft in Tiefenebenen auseinander
  const subjectScrollY = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const subjectScrollScale = useTransform(scrollYProgress, [0, 1], [1, 1.045]);
  const backLayerScrollY = useTransform(scrollYProgress, [0, 1], [0, -54]);
  const midLayerScrollY = useTransform(scrollYProgress, [0, 1], [0, -88]);
  const frontLayerScrollY = useTransform(scrollYProgress, [0, 1], [0, -124]);

  // 3 Tiefenebenen fuer Maus-Parallax (Hinten: gegengesetzt, Mitte: subtil, Vorne: staerker)
  const subjectMouseX = useTransform(mouseX, [-1, 1], [-8, 8]);
  const subjectMouseY = useTransform(mouseY, [-1, 1], [-5, 5]);
  const backX = useTransform(mouseX, [-1, 1], [16, -16]);
  const backY = useTransform(mouseY, [-1, 1], [12, -12]);
  const midX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const midY = useTransform(mouseY, [-1, 1], [-14, 14]);
  const frontX = useTransform(mouseX, [-1, 1], [-30, 30]);
  const frontY = useTransform(mouseY, [-1, 1], [-20, 20]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    rawMouseX.set(Math.max(-1, Math.min(1, nx)));
    rawMouseY.set(Math.max(-1, Math.min(1, ny)));
  };

  const handlePointerLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  const toggleVideo = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false));
    } else {
      vid.pause();
      setVideoPlaying(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(POMELLI_PROMPT);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  const heroCampaign = stats.heroCampaign;
  const heroRateLabel = heroCampaign
    ? `${formatEurCentsDe(heroCampaign.tkpEurCents)} € / 1.000 Views`
    : '2,00 € / 1.000 Views';
  const heroBudgetLabel = heroCampaign
    ? `Budget ${heroCampaign.totalBudgetEur.toLocaleString('de-DE')} €`
    : 'Budget 500 €';
  const heroRemainingPct = heroCampaign ? heroCampaign.remainingPercent : 74;
  const heroUsedPct = Math.max(0, Math.min(100, 100 - heroRemainingPct));

  return (
    <>
      <section
        ref={sectionRef}
        aria-labelledby="motion-hero-title"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative overflow-hidden border-b border-[#DCE2EA] bg-white px-5 sm:px-8"
      >
        {/* Ruhige Studio-Lichtbuehne: reines Weiss im Zentrum, hauchzarter Rot-Blau-Studio-Rand */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 46% 62% at 54% 58%, rgba(255,255,255,1) 0%, rgba(245,247,250,0.65) 70%, rgba(245,247,250,0.92) 100%), radial-gradient(ellipse 38% 44% at 88% 12%, rgba(6,69,143,0.065), transparent 65%), radial-gradient(ellipse 30% 36% at 10% 88%, rgba(242,7,42,0.045), transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-[1200px]">
          <div className="relative grid grid-cols-1 items-end pb-10 pt-10 lg:min-h-[700px] lg:grid-cols-12 lg:pb-12 lg:pt-12 xl:min-h-[740px]">
            {/* ZENTRALE STUDIO-CREATOR-FIGUR (Desktop: hinter den vorderen Badges, buendig am Boden) */}
            <div className="pointer-events-none absolute inset-y-0 left-[37%] right-[16%] z-10 hidden items-end justify-center lg:flex">
              <div
                aria-hidden="true"
                className="absolute bottom-2 h-8 w-[260px] rounded-full bg-[#062A59]/10 blur-2xl"
              />
              <motion.div
                style={
                  reducedMotion
                    ? undefined
                    : {
                        x: subjectMouseX,
                        y: subjectScrollY,
                        scale: subjectScrollScale,
                      }
                }
                animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex h-[640px] w-full items-end justify-center xl:h-[685px]"
              >
                <motion.div
                  style={reducedMotion ? undefined : { y: subjectMouseY }}
                  className="relative h-full w-auto"
                >
                  {videoSrc ? (
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      poster="/motion-hero/creator-hero-studio.webp"
                      autoPlay={!reducedMotion}
                      muted
                      loop
                      playsInline
                      aria-label="UGC VZ Creatorin im Studio"
                      className="h-full w-auto object-contain object-bottom mix-blend-multiply"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/motion-hero/creator-hero-cutout.webp"
                      alt="DACH UGC-Creatorin mit Smartphone im Studio"
                      width={348}
                      height={973}
                      fetchPriority="high"
                      className="h-full w-auto select-none object-contain object-bottom drop-shadow-[0_22px_36px_rgba(6,42,89,0.08)]"
                    />
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* SCHWEBENDE TIEFEN-EBENE 1 (HINTEN, leichte Tiefenunschaerfe wie Orla, nur Desktop) */}
            <motion.div
              style={reducedMotion ? undefined : { x: backX, y: backLayerScrollY }}
              className="pointer-events-none absolute left-[38%] top-[10%] z-[5] hidden lg:block"
              aria-hidden="true"
            >
              <motion.div
                style={reducedMotion ? undefined : { y: backY }}
                animate={reducedMotion ? undefined : { rotate: [0, 8, 0], y: [0, -8, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/ugcvz-mark.webp"
                  alt=""
                  width={68}
                  height={68}
                  className="h-14 w-14 opacity-85 blur-[0.6px] drop-shadow-[0_12px_20px_rgba(242,7,42,0.18)]"
                />
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE REEL-KARTE 2 (RECHTS OBEN, tiefenunscharf -> beim Hover gestochen scharf) */}
            <motion.div
              style={reducedMotion ? undefined : { x: backX, y: backLayerScrollY }}
              className="absolute right-[1%] top-[8%] z-20 hidden lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { y: backY }}
                animate={reducedMotion ? undefined : { y: [0, 9, 0], rotate: [3.5, 2, 3.5] }}
                transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut' }}
                className="group relative w-[142px] overflow-hidden rounded-[16px] border-2 border-white bg-white shadow-[0_18px_40px_rgba(6,42,89,0.15)] transition-[filter,transform] duration-300 [filter:blur(0.6px)] hover:scale-[1.04] hover:[filter:blur(0px)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/motion-hero/reel-lifestyle.webp"
                  alt="UGC-Beispielclip Lifestyle und Food"
                  width={480}
                  height={860}
                  className="aspect-[9/14] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#062A59]/90 via-[#062A59]/45 to-transparent p-2.5 text-white">
                  <p className="font-mono text-[11px] font-bold tabular-nums">31.400 Views</p>
                  <p className="text-[10px] text-white/85">Matcha Reel · Geprüft</p>
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE REEL-KARTE 1 (LINKS NEBEN SCHULTER, gestochen scharf, Midground) */}
            <motion.div
              style={reducedMotion ? undefined : { x: midX, y: midLayerScrollY }}
              className="absolute left-[40%] top-[23%] z-20 hidden lg:block xl:left-[41%]"
            >
              <motion.div
                style={reducedMotion ? undefined : { y: midY }}
                animate={reducedMotion ? undefined : { y: [0, -10, 0], rotate: [-4, -2.5, -4] }}
                transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-[132px] overflow-hidden rounded-[16px] border-2 border-white bg-white shadow-[0_22px_48px_rgba(6,69,143,0.18)] transition-transform duration-300 hover:scale-[1.05]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/motion-hero/reel-skincare.webp"
                  alt="UGC-Beispielclip Skincare"
                  width={480}
                  height={854}
                  className="aspect-[9/14] w-full object-cover"
                />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#062A59]/85 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F2072A]" />
                  Live
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#062A59]/95 via-[#062A59]/50 to-transparent p-2.5 text-white">
                  <p className="font-mono text-[11px] font-bold tabular-nums">42.800 Views</p>
                  <p className="text-[10px] font-semibold text-[#9AF0BE]">✓ Zählt · 85,60 €</p>
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE RATE-PILL (RECHTS NEBEN KOPF, Vordergrund) */}
            <motion.div
              style={reducedMotion ? undefined : { x: frontX, y: frontLayerScrollY }}
              className="absolute right-[16%] top-[20%] z-30 hidden lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { y: frontY }}
                animate={reducedMotion ? undefined : { y: [0, 7, 0] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-[12px] border border-[#DCE2EA] bg-white/95 px-3.5 py-2.5 shadow-[0_14px_34px_rgba(6,69,143,0.14)] backdrop-blur-md"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5C6470]">
                  <ShieldCheck size={13} className="text-[#1F9D55]" aria-hidden="true" />
                  Geprüfter View-Satz
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#06458F]">
                  {heroRateLabel}
                </p>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE PRUEF-KARTE (UNTEN MITTE-LINKS, Vordergrund) */}
            <motion.div
              style={reducedMotion ? undefined : { x: frontX, y: midLayerScrollY }}
              className="absolute bottom-[13%] left-[44%] z-30 hidden lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { y: frontY }}
                animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-2.5 rounded-[12px] border border-[#DCE2EA] bg-white/95 px-3.5 py-2.5 shadow-[0_16px_38px_rgba(6,42,89,0.14)] backdrop-blur-md"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F9D55] text-white">
                  <Check size={14} strokeWidth={2.75} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#202124]">Beitrag #14 zählt</p>
                  <p className="text-[11px] text-[#5C6470]">Brief erfüllt · Online geprüft</p>
                </div>
              </motion.div>
            </motion.div>

            {/* LINKE SPALTE: EINZIGE H1 & EDITORIAL COPY (buendig auf 1200px fuer Mobile & Desktop) */}
            <div className="relative z-30 lg:col-span-5 lg:self-center lg:pb-8 lg:pr-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#DCE2EA] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#06458F] shadow-[0_1px_2px_rgba(6,69,143,0.05)] backdrop-blur-sm sm:py-1">
                <span className="h-2 w-2 rounded-full bg-[#F2072A]" aria-hidden="true" />
                <span>
                  Für Marken in DACH
                  {stats.liveCreatorCount
                    ? ` · ${stats.liveCreatorCount.toLocaleString('de-DE')} aktive Creator`
                    : ''}
                </span>
              </p>

              <h1
                id="motion-hero-title"
                className="mt-4 font-display text-[40px] font-extrabold leading-[1.03] tracking-[-0.036em] text-[#202124] sm:text-5xl lg:mt-5 lg:text-[56px] lg:leading-[1.01] xl:text-[66px]"
              >
                Echte Creator.
                <br />
                Echte Views.
                <br />
                <span className="text-[#06458F]">Dein Budget</span>
                <span className="text-[#F2072A]">.</span>
              </h1>

              <p className="mt-4 max-w-[400px] text-base leading-7 text-[#5C6470] lg:mt-5 lg:text-[17px] lg:leading-[1.6]">
                Kurzes Briefing schreiben, Preis pro 1.000 Views festlegen. Echte Creator posten dein Produkt auf TikTok und Instagram. Bezahlt wird nur, was die Prüfung besteht.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-7">
                <Link
                  href="/brand?tab=signup"
                  className="btn-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[8px] bg-[#06458F] px-7 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(6,69,143,0.25)] hover:-translate-y-[1px] hover:bg-[#053673] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F] focus-visible:ring-offset-2 sm:min-h-[52px] sm:text-base"
                >
                  <span>Kampagne starten</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  href="#so-funktionierts"
                  className="btn-press inline-flex min-h-[48px] items-center justify-center rounded-[8px] border border-[#DCE2EA] bg-white/90 px-5 text-sm font-semibold text-[#202124] backdrop-blur-sm hover:border-[#06458F] hover:text-[#06458F] sm:min-h-[52px]"
                >
                  So läuft&apos;s
                </Link>
              </div>

              <div className="mt-5">
                <Link
                  href="/creator"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#06458F] underline decoration-[#06458F]/30 underline-offset-4 transition-colors hover:text-[#053673] hover:decoration-[#F2072A]"
                >
                  <span>Du bist Creator? 0 % Gebühr, Geld pro 1.000 Views</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* KOMPAKTE STUDIO-BUEHNE AUF MOBILE / TABLET (< lg) */}
            <div className="relative mx-auto mt-8 w-full max-w-[380px] overflow-hidden rounded-[20px] border border-[#DCE2EA] bg-white pt-6 shadow-[0_12px_32px_rgba(6,69,143,0.08)] lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/motion-hero/creator-hero-cutout.webp"
                alt="DACH UGC-Creatorin im Studio"
                width={348}
                height={973}
                className="mx-auto h-[360px] w-auto object-contain object-bottom"
              />
              <div className="absolute right-3 top-4 w-[96px] overflow-hidden rounded-[12px] border-2 border-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/motion-hero/reel-skincare.webp"
                  alt="UGC-Beispielclip"
                  width={480}
                  height={854}
                  className="aspect-[9/14] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-[#062A59]/85 px-1.5 py-1 text-center font-mono text-[9px] font-bold text-white">
                  42.800 Views
                </div>
              </div>
              <div className="absolute bottom-3 left-3 rounded-[10px] border border-[#DCE2EA] bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-[#5C6470]">Geprüfter Satz</p>
                <p className="font-mono text-xs font-bold text-[#06458F]">{heroRateLabel}</p>
              </div>
            </div>

            {/* RECHTE SPALTE UNTEN: ORLA-SIGNATURE FAKTEN-TABELLE + LIVE BUDGET-BAR */}
            <div className="relative z-30 mt-5 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:self-end">
              <div className="rounded-[14px] border border-[#DCE2EA]/90 bg-white/90 p-5 shadow-[0_12px_36px_rgba(6,69,143,0.08)] backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#202124]">
                    <span
                      className={`h-2 w-2 rounded-full ${heroCampaign ? 'bg-[#1F9D55]' : 'bg-[#06458F]'}`}
                      aria-hidden="true"
                    />
                    {heroCampaign ? heroCampaign.title : 'Beispiel-Kampagne'}
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#5C6470]">
                    {heroBudgetLabel} · {heroRemainingPct} % frei
                  </span>
                </div>
                <BudgetBar
                  usedPercent={heroUsedPct}
                  label={`Verbrauchtes Budget: ${heroUsedPct} Prozent`}
                  className="mb-4"
                />

                <dl className="divide-y divide-[#DCE2EA]/80 text-xs">
                  {EDITORIAL_SPECS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3 py-2 first:pt-1 last:pb-0"
                    >
                      <dt className="font-medium text-[#5C6470]">{row.label}</dt>
                      <dd className="text-right font-semibold text-[#202124]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {videoSrc && (
              <button
                type="button"
                onClick={toggleVideo}
                aria-label={videoPlaying ? 'Hintergrundvideo pausieren' : 'Hintergrundvideo abspielen'}
                className="absolute bottom-5 left-1/2 z-40 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[#DCE2EA] bg-white/90 text-[#06458F] shadow-sm backdrop-blur-sm hover:border-[#06458F] lg:flex"
              >
                {videoPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Optionaler Vorschau- & Video-Upgrade-Streifen (nur auf /motion-hero, nie auf /) */}
      {showUpgradeGuideBar && (
        <section
          aria-label="Prototyp-Steuerung und Video-Upgrade"
          className="border-b border-[#DCE2EA] bg-[#062A59] px-5 py-4 text-white sm:px-8"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-[#F2072A]" aria-hidden="true" />
              <p className="text-white/90">
                <strong className="font-semibold text-white">Editorial Motion Hero Prototyp (noindex):</strong>{' '}
                Bewege die Maus oder scrolle für den Tiefen-Parallax-Effekt. Video-Slot für ein 5-Sek.-Studio-MP4 (Pomelli / Veo / Kling) ist direkt vorbereitet.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="/motion-hero/creator-hero-studio.png"
                download="ugcvz-creator-studio-startframe.png"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-white/25 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Download size={14} aria-hidden="true" />
                Studio-Startbild (PNG)
              </a>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] bg-white px-3 text-xs font-semibold text-[#06458F] transition-colors hover:bg-[#F5F7FA]"
              >
                {copiedPrompt ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copiedPrompt ? 'Pomelli/Veo-Prompt kopiert' : 'Pomelli/Veo-Prompt kopieren'}
              </button>
              <Link
                href="/"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-white/25 px-3 text-xs font-semibold text-white/90 hover:border-white hover:text-white"
              >
                <Video size={14} aria-hidden="true" />
                Vergleich: Aktuelle Startseite
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
