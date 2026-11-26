import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default function FloFounderCard() {
  const bookingHref = process.env.NEXT_PUBLIC_FLO_BOOKING_URL || '/contact?topic=flo';
  const isExternalBooking = /^https?:\/\//i.test(bookingHref);

  return (
    <section
      aria-labelledby="home-flo-title"
      className="bg-white px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-center gap-8 rounded-[24px] border border-[#E4E1D8] bg-[#F7F6F2] p-6 sm:p-10 lg:grid-cols-12 lg:gap-12">
          {/* 4:5 Portrait-Slot: ehrlicher Platzhalter bis Originalfoto von Florian vorliegt */}
          <div className="lg:col-span-4">
            <div className="flex aspect-[4/5] w-full max-w-[280px] flex-col items-center justify-center rounded-[20px] border border-[#E4E1D8] bg-white p-6 text-center shadow-card mx-auto lg:mx-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#121212] font-display text-2xl font-bold text-[#F7F6F2]">
                FR
              </div>
              <p className="mt-4 font-display text-base font-bold text-[#121212]">Florian Runge</p>
              <p className="mt-1 text-xs text-[#5C5A55]">Brand Partnerships, UGC VZ</p>
              <p className="mt-4 rounded-lg border border-dashed border-[#E4E1D8] bg-[#F7F6F2] px-3 py-1.5 text-[11px] text-[#5C5A55]">
                [PLATZHALTER: Foto Florian Runge 4:5]
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <p className="text-sm font-medium text-[#6C2BD9]">Direkter Ansprechpartner in Berlin</p>
            <h2 id="home-flo-title" className="sr-only">
              Persönlicher Kontakt mit Florian Runge
            </h2>
            <blockquote className="mt-3 font-display text-2xl font-semibold leading-snug tracking-[-0.015em] text-[#121212] sm:text-[28px] sm:leading-[38px]">
              „Wir haben UGC VZ gebaut, weil wir bei famefact jeden Tag sehen, wie viel Zeit Marken mit Creator-Mails verlieren. Wenn du eine erste Kampagne testen willst, sprich direkt mit mir.“
            </blockquote>

            <div className="mt-6 flex flex-col items-start justify-between gap-5 border-t border-[#E4E1D8] pt-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-[#121212]">Florian Runge</p>
                <p className="text-sm text-[#5C5A55]">Brand Partnerships, UGC VZ · Berlin</p>
              </div>

              {isExternalBooking ? (
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#121212] px-6 text-sm font-semibold text-[#F7F6F2] hover:opacity-90"
                >
                  <Calendar size={16} aria-hidden="true" />
                  15 Minuten mit Flo sprechen
                </a>
              ) : (
                <Link
                  href={bookingHref}
                  className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#121212] px-6 text-sm font-semibold text-[#F7F6F2] hover:opacity-90"
                >
                  <Calendar size={16} aria-hidden="true" />
                  15 Minuten mit Flo sprechen
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
