import assert from 'node:assert/strict';
import { composeBrief } from '@/app/lib/lead-brief';

assert.equal(composeBrief({}, 'Hallo'), 'Hallo');
assert.equal(
  composeBrief({ compensation: 'barter', budget: ' 150 € pro Video ', deadline: '', usageRights: 'x' }, 'Text'),
  'Vergütung: Ware gegen Content (Barter)\nBudget: 150 € pro Video\nNutzungsrechte: x\n\nText',
);
assert.equal(composeBrief({ compensation: 'evil' }, ''), '');
assert.equal(composeBrief({ budget: '100' }, ''), 'Budget: 100');
console.log('OK: composeBrief');
