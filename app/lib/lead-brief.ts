// Optionale Mini-Briefing-Felder der Creator-Auswahl. Sie werden dem Freitext
// vorangestellt, damit Brand-Mail, Creator-Mail, Slack und DB sie ohne
// Schemaaenderung zeigen. Creator sehen so sofort, ob Ware oder Honorar
// geboten wird.
const COMPENSATION: Record<string, string> = {
  paid: 'Bezahlt',
  barter: 'Ware gegen Content (Barter)',
  both: 'Bezahlt oder Ware – verhandelbar',
};

const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function composeBrief(
  raw: { compensation?: unknown; budget?: unknown; deadline?: unknown; usageRights?: unknown },
  message: string,
): string {
  const lines = [
    ['Vergütung', COMPENSATION[clean(raw.compensation, 10)]],
    ['Budget', clean(raw.budget, 80)],
    ['Frist', clean(raw.deadline, 80)],
    ['Nutzungsrechte', clean(raw.usageRights, 80)],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  return lines.length ? `${lines.join('\n')}${message ? `\n\n${message}` : ''}` : message;
}
