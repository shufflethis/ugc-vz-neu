import assert from 'node:assert/strict';
import { earningsExamples, resolveVariant, referralId } from '../app/lib/collaborations/fomo-config';
assert.deepEqual(earningsExamples().map(e => [e.lo, e.hi]), [[190, 275], [940, 1375], [3000, 4400]]);
assert.deepEqual(resolveVariant('m', 'female'), { variant: 'm', source: 'override' });
assert.deepEqual(resolveVariant(undefined, 'female'), { variant: 'w', source: 'profile' });
assert.deepEqual(resolveVariant('x', 'male'), { variant: 'm', source: 'profile' });
assert.deepEqual(resolveVariant(['w'], 'any'), { variant: 'n', source: 'fallback' });
assert.equal(referralId('fomo', 42), 'UGCVZ-FOMO-0042');
console.log('PASS: fomo config');
