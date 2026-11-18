import type { CastingEvidence } from '../lib/casting';

export default function CastingEvidenceList({ evidence }: { evidence?: CastingEvidence[] }) {
  if (!evidence?.length) return null;
  return <ul className="space-y-2 text-sm">
    {evidence.map(item => <li key={item.label}>
      {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-geo-violet underline">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image && <img src={item.image} alt={item.imageAlt || 'Bestätigte Arbeitsprobe mit Cap'} loading="lazy" referrerPolicy="no-referrer" className="mb-2 max-h-48 w-full rounded-lg object-contain" />}
        {item.label} ↗
      </a> : <span>{item.label}</span>}
    </li>)}
  </ul>;
}
