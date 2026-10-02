// Braucht Netz (echte DNS-Abfragen).
import assert from 'node:assert/strict';
import { domainAcceptsMail } from '@/app/lib/lead-gate';

(async () => {
  for (const d of ['famefact.com', 'brand.de']) assert.equal(await domainAcceptsMail(d), true, d);
  // Kein Eintrag im DNS bzw. MX zeigt nur auf localhost.
  for (const d of ['glowberlin.de', 'fitpeak.de']) assert.equal(await domainAcceptsMail(d), false, d);
  console.log('OK: domainAcceptsMail');
})();
