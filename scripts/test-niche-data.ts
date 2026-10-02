import assert from 'node:assert/strict';
import { entryPrice, matchesNiche, nicheStats, percentile, topCreators, type NicheRow } from '@/app/lib/niche-data';

assert.equal(entryPrice('Video ab 100€'), 100);
assert.equal(entryPrice('Video ab 150€, Foto 40€'), 150); // Foto-Preis zaehlt nicht
assert.equal(entryPrice('Foto ab 40€\nVideo ab 120 €'), 120);
assert.equal(entryPrice('Nein, ab 250–300€ pro fertigem Video'), 250); // Spanne: unteres Ende
assert.equal(entryPrice('UGC Video ab 250 € | 3er-Videopaket ab 650 €'), 250);
assert.equal(entryPrice('Pauschal nicht zu sagen'), null);
assert.equal(entryPrice('5 € pro Video'), null); // unplausibel klein

assert.equal(percentile([100, 150, 200], 0.5), 150);
assert.equal(percentile([], 0.5), 0);

const base: NicheRow = {
  public_id: 'UGC-0000000000', display_name: 'A B', city: null, gender: 'Weiblich', topics: 'Beauty, Fashion, Food', industries: null,
  preferred_content: null, special_traits: null, pet_context: null, rate_text: 'ab 100€', reach_text: null, total_reach: 0,
  networks: ['instagram'], portfolio_links: null, profile_quality_score: 0, has_social_avatar: false, contact_reachable: false,
};
const food = /food|essen/;
assert.equal(matchesNiche({ ...base, topics: 'Beauty, Fashion, Food' }, { text: food }), false); // Food nur an dritter Stelle: kein Hauptthema
assert.equal(matchesNiche({ ...base, topics: 'Food, Beauty' }, { text: food }), true);
assert.equal(matchesNiche({ ...base, topics: 'Beauty', pet_context: 'Keine' }, { pets: true }), false);
assert.equal(matchesNiche({ ...base, topics: 'Beauty', pet_context: 'Ja, ein Hund' }, { pets: true }), true);
assert.equal(matchesNiche({ ...base, gender: 'Männlich', topics: 'x' }, { male: true }), true);
assert.equal(matchesNiche({ ...base, gender: 'Weiblich' }, { male: true }), false);

const rows = Array.from({ length: 8 }, (_, i) => ({ ...base, public_id: `UGC-${i}`, rate_text: `ab ${100 + i * 10}€` }));
assert.equal(nicheStats(rows).price?.median, 135);
assert.equal(nicheStats(rows.slice(0, 7)).price, null); // unter 8 Preisangaben keine Statistik
const ordered = topCreators([{ ...base, public_id: 'low' }, { ...base, public_id: 'mail', contact_reachable: true }], 2);
assert.equal(ordered[0].public_id, 'mail');
console.log('OK: niche-data');
