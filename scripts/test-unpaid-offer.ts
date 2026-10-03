import assert from 'node:assert/strict';
import { isUnpaidOffer } from '@/app/lib/creator-outreach';

// LOCKD-Fall (03.10.2026): nur Umsatzbeteiligung, kein Honorar.
assert.equal(isUnpaidOffer('Wir schlagen dafür ein Affiliate-Modell mit einer marktüblichen Beteiligung an den über dich erzielten Umsätzen vor.'), true);
assert.equal(isUnpaidOffer('Vergütung auf Provisionsbasis'), true);
assert.equal(isUnpaidOffer('Du bekommst ein kostenloses Produkt für ein Video'), true);
// Honorar + Affiliate obendrauf bleibt normal.
assert.equal(isUnpaidOffer('Budget 300 € pro Video, dazu Affiliate-Code mit 10 %'), false);
assert.equal(isUnpaidOffer('Fixhonorar plus Provision'), false);
assert.equal(isUnpaidOffer('Suchen 3 Videos für unsere Hautpflege, Preis nach Absprache'), false);
console.log('OK: isUnpaidOffer');
