// Hero-Motiv: Handy mit Creator-Profil auf einer Verlaufsflaeche, dazu zwei schwebende
// Karten aus der echten Oberflaeche (Brand-Anfrage, Auswahl-Leiste). Statisch,
// Creator als Platzhalter (Initialen) -- siehe docs/motion-studio/brief.md.
const GRADIENT = 'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

export default function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[460px] lg:max-w-none" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 top-[8%] overflow-hidden rounded-[40px]" style={{ background: GRADIENT }}>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(-78deg, transparent 0 26px, rgba(255,255,255,.35) 26px 27px)' }} />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      </div>

      {/* Handy */}
      <div className="absolute left-1/2 top-0 w-[58%] -translate-x-1/2 rotate-[4deg] rounded-[38px] bg-void p-[7px] shadow-[0_40px_80px_rgba(20,10,40,0.35)]">
        <div className="relative overflow-hidden rounded-[32px] bg-white px-4 pb-6 pt-10">
          <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-void" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: GRADIENT }}>MI</div>
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight text-ink">Mia</p>
              <p className="text-xs text-ink-soft">Berlin</p>
            </div>
            <span className="ml-auto rounded-full bg-[#edf5e5] px-2 py-1 text-[10px] font-bold text-[#385523]">● Live</span>
          </div>
          <p className="mt-4 text-[11px] leading-4 text-ink-soft">Beauty, Skincare, Lifestyle · Reels, Unboxing</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-lg" style={{ background: GRADIENT, opacity: 0.35 + i * 0.2 }}>
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-hairline py-2 text-center text-[11px] font-bold text-ink">Profil &amp; Arbeitsproben ↗</div>
          <div className="mt-2 rounded-xl bg-geo-violet py-2 text-center text-[11px] font-bold text-white">+ Zur Auswahl</div>
        </div>
      </div>

      {/* Brand-Anfrage */}
      <div className="absolute left-0 top-[44%] flex w-[64%] items-center gap-3 rounded-2xl border border-hairline bg-white/95 p-3 shadow-[0_20px_50px_rgba(35,22,47,0.18)] backdrop-blur sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apple-touch-icon.png" alt="" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink sm:text-sm">Neue Brand-Anfrage</p>
          <p className="truncate text-[11px] text-ink-soft sm:text-xs">Eine Brand interessiert sich für dein Profil</p>
        </div>
      </div>

      {/* Auswahl-Leiste */}
      <div className="absolute bottom-[7%] right-[4%] flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_20px_50px_rgba(35,22,47,0.18)] sm:p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf5e5] font-bold text-[#385523]">✓</span>
        <div>
          <p className="text-xs font-bold text-ink sm:text-sm">2 Creator in deiner Auswahl</p>
          <p className="text-[11px] text-ink-soft sm:text-xs">Kontaktinfos kostenlos per E-Mail</p>
        </div>
      </div>
    </div>
  );
}
