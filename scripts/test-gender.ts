import assert from 'node:assert/strict';
import { normalizeGenderValue } from '@/app/lib/normalize-gender';

for (const v of ['Weiblich', 'weiblich', 'Female', 'female', 'Femenino', 'Женский', 'أنثى', 'Frau', 'w', 'F']) assert.equal(normalizeGenderValue(v), 'female', v);
for (const v of ['Männlich', 'maennlich', 'Male', 'male', 'Mann', 'm']) assert.equal(normalizeGenderValue(v), 'male', v);
for (const v of ['', 'Divers', null, undefined, 'keine Angabe']) assert.equal(normalizeGenderValue(v as string), 'any', String(v));
console.log('OK: normalizeGenderValue');
