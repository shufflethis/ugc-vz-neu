'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
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
  /** Exakt eine H1-Ueberschrift von der aufrufenden Seite (SSR + SEO). */
  heading: ReactNode;
  /** ID des Headings fuer aria-labelledby. */
  headingId?: string;
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
  heading,
  headingId = 'home-title',
  videoSrc,
  showUpgradeGuideBar = false,
}: EditorialMotionHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(Boolean(videoSrc));
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Saubere Trennung der Motion-Layer (kein konkurrierendes y auf demselben Node):
  // 1) Aeusserer Wrapper: nur gedaempfter Scroll-Parallax (smoothScroll)
  // 2) Mittlerer Wrapper: nur weicher Maus-Parallax (mouseX/mouseY)
  // 3) Innerer Content: nur reines GPU-CSS-Floating (.hero-float-*)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 36, damping: 24, mass: 0.95 });
  const mouseY = useSpring(rawMouseY, { stiffness: 36, damping: 24, mass: 0.95 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 28,
    restDelta: 0.0005,
  });

  // Scroll-Layer (butterweich gedaempft)
  const subjectScrollY = useTransform(smoothScroll, [0, 1], [0, 28]);
  const subjectScrollScale = useTransform(smoothScroll, [0, 1], [1, 1.03]);
  const backLayerScrollY = useTransform(smoothScroll, [0, 1], [0, -34]);
  const midLayerScrollY = useTransform(smoothScroll, [0, 1], [0, -56]);
  const frontLayerScrollY = useTransform(smoothScroll, [0, 1], [0, -78]);

  // Maus-Layer (subtil & seidenweich ohne Ruckeln)
  const subjectMouseX = useTransform(mouseX, [-1, 1], [-6, 6]);
  const subjectMouseY = useTransform(mouseY, [-1, 1], [-4, 4]);
  const backX = useTransform(mouseX, [-1, 1], [10, -10]);
  const backY = useTransform(mouseY, [-1, 1], [8, -8]);
  const midX = useTransform(mouseX, [-1, 1], [-14, 14]);
  const midY = useTransform(mouseY, [-1, 1], [-10, 10]);
  const frontX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const frontY = useTransform(mouseY, [-1, 1], [-14, 14]);

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
        aria-labelledby={headingId}
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
          <div className="relative grid grid-cols-1 items-end pb-10 pt-10 lg:min-h-[690px] lg:grid-cols-12 lg:pb-12 lg:pt-12 xl:min-h-[730px]">
            {/* ZENTRALE STUDIO-CREATOR-FIGUR (Desktop, GPU-kompositiert ohne Layer-Konflikte) */}
            <div className="pointer-events-none absolute inset-y-0 left-[37%] right-[16%] z-10 hidden items-end justify-center lg:flex">
              <div
                aria-hidden="true"
                className="absolute bottom-2 h-8 w-[260px] rounded-full bg-[#062A59]/10 blur-2xl"
              />
              <motion.div
                style={
                  reducedMotion
                    ? undefined
                    : { y: subjectScrollY, scale: subjectScrollScale }
                }
                className="relative flex h-[635px] w-full items-end justify-center will-change-transform xl:h-[675px]"
              >
                <motion.div
                  style={
                    reducedMotion
                      ? undefined
                      : { x: subjectMouseX, y: subjectMouseY }
                  }
                  className="relative h-full w-auto will-change-transform"
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
                      className="h-full w-auto select-none object-contain object-bottom drop-shadow-[0_20px_32px_rgba(6,42,89,0.08)]"
                    />
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* SCHWEBENDE TIEFEN-EBENE 1 (HINTEN: ugcVZ-Stern) */}
            <motion.div
              style={reducedMotion ? undefined : { y: backLayerScrollY }}
              className="pointer-events-none absolute left-[38%] top-[10%] z-[5] hidden will-change-transform lg:block"
              aria-hidden="true"
            >
              <motion.div
                style={reducedMotion ? undefined : { x: backX, y: backY }}
                className="will-change-transform"
              >
                <div className="hero-float-b">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/ugcvz-mark.webp"
                    alt=""
                    width={68}
                    height={68}
                    className="h-14 w-14 opacity-90 drop-shadow-[0_10px_18px_rgba(242,7,42,0.16)]"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE REEL-KARTE 2 (RECHTS OBEN, ohne teuren Live-Blur -> 120 fps butterweich) */}
            <motion.div
              style={reducedMotion ? undefined : { y: backLayerScrollY }}
              className="absolute right-[1%] top-[8%] z-20 hidden will-change-transform lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { x: backX, y: backY }}
                className="will-change-transform"
              >
                <div className="hero-float-b">
                  <div className="relative w-[142px] rotate-[3deg] overflow-hidden rounded-[16px] border-2 border-white bg-white opacity-95 shadow-[0_18px_40px_rgba(6,42,89,0.14)] transition-transform duration-300 ease-out hover:rotate-0 hover:scale-[1.04] hover:opacity-100">
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
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE REEL-KARTE 1 (LINKS NEBEN SCHULTER, Midground) */}
            <motion.div
              style={reducedMotion ? undefined : { y: midLayerScrollY }}
              className="absolute left-[40%] top-[23%] z-20 hidden will-change-transform lg:block xl:left-[41%]"
            >
              <motion.div
                style={reducedMotion ? undefined : { x: midX, y: midY }}
                className="will-change-transform"
              >
                <div className="hero-float-a">
                  <div className="relative w-[132px] -rotate-[3.5deg] overflow-hidden rounded-[16px] border-2 border-white bg-white shadow-[0_22px_46px_rgba(6,69,143,0.16)] transition-transform duration-300 ease-out hover:rotate-0 hover:scale-[1.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/motion-hero/reel-skincare.webp"
                      alt="UGC-Beispielclip Skincare"
                      width={480}
                      height={854}
                      className="aspect-[9/14] w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#062A59]/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F2072A]" />
                      Live
                    </span>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#062A59]/95 via-[#062A59]/50 to-transparent p-2.5 text-white">
                      <p className="font-mono text-[11px] font-bold tabular-nums">42.800 Views</p>
                      <p className="text-[10px] font-semibold text-[#9AF0BE]">✓ Zählt · 85,60 €</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE RATE-PILL (RECHTS NEBEN KOPF, Vordergrund) */}
            <motion.div
              style={reducedMotion ? undefined : { y: frontLayerScrollY }}
              className="absolute right-[16%] top-[20%] z-30 hidden will-change-transform lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { x: frontX, y: frontY }}
                className="will-change-transform"
              >
                <div className="hero-float-c rounded-[12px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 shadow-[0_14px_34px_rgba(6,69,143,0.13)]">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5C6470]">
                    <ShieldCheck size={13} className="text-[#1F9D55]" aria-hidden="true" />
                    Geprüfter View-Satz
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#06458F]">
                    {heroRateLabel}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* SCHWEBENDE PRUEF-KARTE (UNTEN MITTE-LINKS, Vordergrund) */}
            <motion.div
              style={reducedMotion ? undefined : { y: midLayerScrollY }}
              className="absolute bottom-[13%] left-[44%] z-30 hidden will-change-transform lg:block"
            >
              <motion.div
                style={reducedMotion ? undefined : { x: frontX, y: frontY }}
                className="will-change-transform"
              >
                <div className="hero-float-a flex items-center gap-2.5 rounded-[12px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 shadow-[0_16px_38px_rgba(6,42,89,0.13)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F9D55] text-white">
                    <Check size={14} strokeWidth={2.75} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#202124]">Beitrag #14 zählt</p>
                    <p className="text-[11px] text-[#5C6470]">Brief erfüllt · Online geprüft</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* LINKE SPALTE: EDITORIAL TYPOGRAFIE & PRIMARY CTA (buendig auf 1200px) */}
            <div className="relative z-30 lg:col-span-5 lg:self-center lg:pb-6 lg:pr-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#DCE2EA] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#06458F] shadow-[0_1px_2px_rgba(6,69,143,0.05)] sm:py-1">
                <span className="h-2 w-2 rounded-full bg-[#F2072A]" aria-hidden="true" />
                <span>
                  Für Marken in DACH
                  {stats.liveCreatorCount
                    ? ` · ${stats.liveCreatorCount.toLocaleString('de-DE')} aktive Creator`
                    : ''}
                </span>
              </p>

              <div className="mt-4 lg:mt-5">{heading}</div>

              <p className="mt-4 max-w-[400px] text-base leading-7 text-[#5C6470] lg:mt-5 lg:text-[17px] lg:leading-[1.6]">
                Du schreibst ein kurzes Briefing und legst fest, was dir 1.000 Views wert sind. Echte Creator posten dein Produkt auf TikTok und Instagram. Du zahlst nur geprüfte Beiträge und nie mehr als dein Budget.
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
                  className="btn-press inline-flex min-h-[48px] items-center justify-center rounded-[8px] border border-[#DCE2EA] bg-white px-5 text-sm font-semibold text-[#202124] hover:border-[#06458F] hover:text-[#06458F] sm:min-h-[52px]"
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

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#5C6470]">
                <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-1">
                  <Check size={12} className="text-[#06458F]" aria-hidden="true" />
                  Kostenloses Konto
                </span>
                <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-1">
                  <Check size={12} className="text-[#06458F]" aria-hidden="true" />
                  Kein Abo
                </span>
                <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-1">
                  <Check size={12} className="text-[#06458F]" aria-hidden="true" />
                  Budget-Obergrenze
                </span>
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
              <div className="absolute bottom-3 left-3 rounded-[10px] border border-[#DCE2EA] bg-white px-3 py-2 shadow-md">
                <p className="text-[10px] font-semibold text-[#5C6470]">Geprüfter Satz</p>
                <p className="font-mono text-xs font-bold text-[#06458F]">{heroRateLabel}</p>
              </div>
            </div>

            {/* RECHTE SPALTE UNTEN: ORLA-SIGNATURE FAKTEN-TABELLE + LIVE BUDGET-BAR */}
            <div className="relative z-30 mt-5 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:self-end">
              <div className="rounded-[14px] border border-[#DCE2EA] bg-white/95 p-5 shadow-[0_12px_36px_rgba(6,69,143,0.08)]">
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
                className="absolute bottom-5 left-1/2 z-40 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[#DCE2EA] bg-white text-[#06458F] shadow-sm hover:border-[#06458F] lg:flex"
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
                <strong className="font-semibold text-white">Editorial Motion Hero Studio-Modus (noindex):</strong>{' '}
                Video-Slot für ein 5-Sek.-Studio-MP4 (Pomelli / Veo / Kling) ist direkt vorbereitet.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                Zur Live-Startseite
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
