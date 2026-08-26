/**
 * Einzige Quelle fuer die beworbene Creator-Zahl.
 *
 * Bewusst konservativ gerundet: der Wert liegt immer unter dem tatsaechlichen
 * Bestand aktiver Profile, damit die Aussage auch zwischen zwei Pruefungen haelt.
 * Vorher stand die Zahl an zehn Stellen hart im Code und ist entsprechend
 * auseinandergelaufen (470+ neben 370+).
 *
 * Fortgeschrieben von scripts/refresh-creator-count.mjs (woechentlicher Cron):
 * das Skript liest die Live-Suche, rundet auf volle Zehner ab und hebt diesen
 * Wert nur an, nie ab. Format deshalb stabil halten: Zahl + "+".
 */
export const CREATOR_COUNT_LABEL = '490+';

/** Reine Zahl ohne "+", z. B. fuer Fliesstext im Vergleich. */
export const CREATOR_COUNT_NUMBER = Number(CREATOR_COUNT_LABEL.replace('+', ''));
