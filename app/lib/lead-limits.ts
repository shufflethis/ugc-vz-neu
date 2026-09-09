// Gemeinsame Grenzen fuer Creator-Anfragen -- Client (Auswahl-UI) und Server
// (/api/submit-request) lesen dieselbe Zahl, damit die Auswahl nie mehr
// erlaubt, als der Server annimmt.
export const MAX_CREATORS_PER_REQUEST = 10;
