// Geschlechtsangaben der Profile sind Freitext (Weiblich, Female, Femenino, ...).
// Weiblich zuerst pruefen: 'female' enthaelt 'male' und galt sonst als maennlich.
export const normalizeGenderValue = (gender?: string): 'male' | 'female' | 'any' => {
  const value = String(gender || '').trim().toLowerCase();
  if (/weib|frau|female|femen|женск|أنثى|^[wf]$/.test(value)) return 'female';
  if (/männ|maenn|mann|(^|\b)male\b|masc|мужск|ذكر|^m$/.test(value)) return 'male';
  return 'any';
};
