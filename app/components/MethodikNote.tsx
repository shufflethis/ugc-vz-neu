import { VERIFIED_AT_LABEL } from '../lib/competitors';

/**
 * Methodik- und Betroffenheitshinweis. Steht wortgleich auf Hub und Detailseiten,
 * damit die Offenlegung nicht auseinanderläuft.
 */
export default function MethodikNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-ink-soft/70 ${className}`}>
      Methodik: Alle Angaben stammen von den öffentlich zugänglichen Websites der Anbieter, zuletzt geprüft am{' '}
      {VERIFIED_AT_LABEL}. Wo ein Anbieter keine Preise veröffentlicht, steht „nicht öffentlich" statt einer Schätzung. UGC VZ
      ist unser eigenes Angebot — diese Seite ist damit kein neutraler Test, sondern ein Vergleich aus Anbietersicht mit
      belegten Zahlen.
    </p>
  );
}
