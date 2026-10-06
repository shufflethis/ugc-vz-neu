import { ReactNode } from 'react';

// Karte mit "Lasche": der Titel sitzt in einem erhoehten Reiter, die Oberkante
// der Karte geht mit einer inversen Rundung in den Reiter ueber (Referenz:
// Learn.AI-Template, siehe docs/motion-studio/style-guide.md).
// Die Innenrundung ist ein 25-px-Quadrat mit Radialverlauf: innen transparent,
// 1-px-Ring in Hairline, aussen Kartenfarbe -- es deckt das untere Stueck der
// Reiterkante und den Anfang der Kartenoberkante ab.
export default function NotchCard({ title, children, className = '', dark = false }: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  const fill = dark ? '#111111' : '#ffffff';
  const line = dark ? 'rgba(255,255,255,0.12)' : '#E8E8E4';
  return (
    <div className={`relative flex min-w-0 flex-col ${className}`}>
      <div className="relative z-10 -mb-px max-w-[78%] self-start rounded-t-[26px] border border-b-0 px-6 pb-3 pt-5 sm:px-7"
        style={{ background: fill, borderColor: line }}>
        {title}
        <span aria-hidden="true" className="absolute bottom-0 h-[25px] w-[25px]"
          style={{ right: -24, background: `radial-gradient(circle at 100% 0, transparent 24px, ${line} 24px, ${line} 25px, ${fill} 25.5px)` }} />
      </div>
      <div className="min-w-0 flex-1 rounded-[26px] rounded-tl-none border p-5 sm:p-7" style={{ background: fill, borderColor: line }}>
        {children}
      </div>
    </div>
  );
}
