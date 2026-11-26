#!/usr/bin/env node
/**
 * Taeglicher Health-Check fuer Creator- und Brand-Login-Endpunkte (ohne echte E-Mails zu versenden).
 * Aufruf: BASE_URL=https://ugc-vz.de node scripts/check-auth-health.mjs
 */

const baseUrl = (process.env.BASE_URL || 'https://ugc-vz.de').replace(/\/$/, '');

async function check(label, fn) {
  try {
    await fn();
    console.log(`OK   ${label}`);
  } catch (err) {
    console.error(`FAIL ${label}: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

await check('GET /brand returns 200 and noindex', async () => {
  const res = await fetch(`${baseUrl}/brand`, { redirect: 'follow' });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!/noindex/i.test(html)) throw new Error('Missing noindex robots directive on /brand');
  if (!html.includes('Anmelden') || !html.includes('Konto anlegen')) {
    throw new Error('Missing Anmelden / Konto anlegen tabs on /brand');
  }
});

await check('GET /brand/login redirects cleanly to /brand?tab=login', async () => {
  const res = await fetch(`${baseUrl}/brand/login`, { redirect: 'manual' });
  if (res.status < 300 || res.status >= 400) throw new Error(`Expected 3xx redirect, got ${res.status}`);
  const loc = res.headers.get('location') || '';
  if (!loc.includes('/brand?tab=login')) throw new Error(`Unexpected redirect target: ${loc}`);
});

await check('GET /konto returns 200 and noindex', async () => {
  const res = await fetch(`${baseUrl}/konto`, { redirect: 'follow' });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!/noindex/i.test(html)) throw new Error('Missing noindex robots directive on /konto');
});

await check('POST /api/brand/login validates invalid email with HTTP 400 (no 502)', async () => {
  const res = await fetch(`${baseUrl}/api/brand/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ mode: 'login', email: 'invalid-email' }),
  });
  if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
});

await check('POST /api/creator/login validates invalid email with HTTP 400 (no 502)', async () => {
  const res = await fetch(`${baseUrl}/api/creator/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ email: 'invalid-email' }),
  });
  if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
});

if (process.exitCode) {
  console.error('Auth health check FAILED.');
} else {
  console.log(`All auth health checks passed against ${baseUrl}`);
}
