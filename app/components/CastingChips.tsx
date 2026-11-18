import { castingLabel, type CastingFilter } from '../lib/casting';

export default function CastingChips({ filters, remove }: {
  filters: CastingFilter[]; remove: (value: CastingFilter) => void;
}) {
  if (!filters.length) return null;
  return <div aria-label="Verbindliche Suchfilter" className="my-3 flex flex-wrap gap-2">
    {filters.map(filter => <button key={filter} type="button" aria-label={castingLabel(filter) + ' entfernen'}
      className="rounded-full border border-geo-violet bg-white px-3 py-2 text-sm font-medium text-geo-violet"
      onClick={() => remove(filter)}>{castingLabel(filter)} ×</button>)}
  </div>;
}
