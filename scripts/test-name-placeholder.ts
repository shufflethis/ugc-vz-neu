import assert from 'node:assert/strict';
import { fillCreatorName } from '@/app/lib/creator-outreach';

assert.equal(fillCreatorName('Hallo [Name], Hallo {name}!', 'Mara'), 'Hallo Mara, Hallo Mara!');
assert.equal(fillCreatorName('Hi {{ NAME }} und [ name ]', 'Angie Lora'), 'Hi Angie Lora und Angie Lora');
assert.equal(fillCreatorName('Kein Platzhalter', 'Mara'), 'Kein Platzhalter');
console.log('OK: fillCreatorName');
