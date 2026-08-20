/**
 * Google "Preferred Sources" Badge.
 * https://developers.google.com/search/docs/appearance/preferred-sources
 *
 * Bewusst als statischer Deeplink umgesetzt statt via publisher.js-Widget:
 * kein Third-Party-Script, kein Consent-Bedarf, kein Layout-Shift.
 *
 * variant "light" = helles Badge fuer dunkle Flaechen (Footer),
 * variant "dark"  = dunkles Badge fuer helle Flaechen (Wissen).
 */

const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=ugc-vz.de';
const LABEL = 'Als bevorzugte Quelle auf Google hinzufügen';

type Props = {
  variant?: 'light' | 'dark';
  className?: string;
};

export default function PreferredSourceBadge({ variant = 'dark', className = '' }: Props) {
  const base = `/google/preferred-source-badge-${variant}-de`;

  return (
    <a
      href={PREFERRED_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={LABEL}
      className={`inline-block transition-opacity duration-200 hover:opacity-80 ${className}`}
    >
      <img
        src={`${base}.png`}
        srcSet={`${base}.png 1x, ${base}@2x.png 2x`}
        alt={LABEL}
        width={169}
        height={53}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}
