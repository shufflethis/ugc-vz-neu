'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

// Global registry ensuring max 1 PauseableVideo plays simultaneously (Spec 8.10).
const PLAY_EVENT = 'ugcvz:video-play';

interface PauseableVideoProps {
  src: string;
  poster: string;
  label: string;
  aspectClassName?: string;
  className?: string;
  priorityPoster?: boolean;
  autoPlayWhenVisible?: boolean;
  caption?: string;
}

export default function PauseableVideo({
  src,
  poster,
  label,
  aspectClassName = 'aspect-[9/16]',
  className = '',
  priorityPoster = false,
  autoPlayWhenVisible = true,
  caption,
}: PauseableVideoProps) {
  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      setReducedMotion(mq.matches);
      if (mq.matches) setUserPaused(true);
      const onChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
        if (e.matches) {
          setUserPaused(true);
          videoRef.current?.pause();
        }
      };
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }
  }, []);

  // Load video source lazily after window load / first intersection so poster is LCP.
  useEffect(() => {
    if (!hydrated || reducedMotion) return;
    if (priorityPoster) {
      const startLoad = () => setLoadVideo(true);
      if (document.readyState === 'complete') {
        const t = window.setTimeout(startLoad, 150);
        return () => window.clearTimeout(t);
      }
      window.addEventListener('load', startLoad, { once: true });
      return () => window.removeEventListener('load', startLoad);
    }
    if (inView) {
      setLoadVideo(true);
    }
  }, [hydrated, reducedMotion, priorityPoster, inView]);

  // Pause offscreen (Spec 8.10: pause_offscreen: true).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Enforce max 1 playing video across page.
  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id && detail.id !== instanceId && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, [instanceId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loadVideo) return;

    if (inView && autoPlayWhenVisible && !userPaused && !reducedMotion) {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: instanceId } }));
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(true);
      }
    } else if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, [inView, autoPlayWhenVisible, userPaused, reducedMotion, loadVideo, instanceId]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!loadVideo) {
      setLoadVideo(true);
      setUserPaused(false);
      return;
    }
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: instanceId } }));
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[20px] border border-[#E4E1D8] bg-[#121212] ${aspectClassName} ${className}`}
    >
      {/* Static poster image guarantees fast LCP and zero CLS without JS */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={label}
        loading={priorityPoster ? 'eager' : 'lazy'}
        fetchPriority={priorityPoster ? 'high' : 'auto'}
        className={`h-full w-full object-cover transition-opacity duration-200 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
      />

      {loadVideo && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          loop
          preload="none"
          aria-label={label}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {caption && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#121212]/80 px-2.5 py-1 text-[11px] font-medium text-[#F7F6F2] backdrop-blur-sm">
          {caption}
        </span>
      )}

      {/* WCAG 2.2.2 pause/play control */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? `${label} pausieren` : `${label} abspielen`}
        aria-pressed={isPlaying}
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#121212]/80 text-[#F7F6F2] backdrop-blur-sm transition-transform duration-150 hover:bg-[#121212] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F04B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
      >
        {isPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </button>
    </div>
  );
}
