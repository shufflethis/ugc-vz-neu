// Gemeinsame Grenzen fuer Creator-Anfragen -- Client (Auswahl-UI) und Server
// (/api/submit-request) lesen dieselbe Zahl, damit die Auswahl nie mehr
// erlaubt, als der Server annimmt.
export const MAX_CREATORS_PER_REQUEST = 10;

// Freitier fuer Brand-Anfragen (app/lib/lead-gate.ts): pro E-Mail-Adresse bzw.
// Firmen-Domain in 30 Tagen. Darueber hinaus: kurze Nachricht an uns, wir
// schalten kostenlos frei (Tabelle brand_allowlist).
export const FREE_LEADS_PER_30D = 3;
export const FREE_CREATORS_PER_30D = 10;
export const FREE_DOMAIN_LEADS_PER_30D = 6;
