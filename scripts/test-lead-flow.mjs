import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 3999;
const baseUrl = `http://localhost:${port}`;
const nextBin = 'node_modules/next/dist/bin/next';

const server = spawn(process.execPath, [nextBin, 'dev', '-p', String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    AIRTABLE_API_KEY: '',
    RESEND_API_KEY: '',
    RESEND_WEBHOOK_SECRET: '',
    SLACK_WEBHOOK_URL: '',
    SUBMIT_REQUEST_API_KEY: '',
    SEND_CREATOR_OUTREACH_EMAILS: 'false',
    NEXT_TELEMETRY_DISABLED: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let logs = '';
server.stdout.on('data', (chunk) => { logs += chunk.toString(); });
server.stderr.on('data', (chunk) => { logs += chunk.toString(); });

const timeout = setTimeout(() => {
  server.kill('SIGTERM');
}, 60_000);

const waitForReady = () => new Promise((resolve, reject) => {
  const startedAt = Date.now();
  const interval = setInterval(() => {
    if (/Ready in|ready - started server/i.test(logs)) {
      clearInterval(interval);
      resolve();
      return;
    }

    if (server.exitCode !== null) {
      clearInterval(interval);
      reject(new Error(`Next server exited before becoming ready:\n${logs.slice(-2_000)}`));
      return;
    }

    if (Date.now() - startedAt > 30_000) {
      clearInterval(interval);
      reject(new Error(`Next server did not become ready:\n${logs.slice(-2_000)}`));
    }
  }, 100);
});

const postJson = (path, body, headers = {}) => fetch(`${baseUrl}${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

try {
  await waitForReady();

  const maliciousOrigin = await postJson('/api/submit-request', {
    type: 'contact',
    name: 'Test',
    email: 'test@example.test',
  }, {
    origin: 'https://ugc-vz.de.attacker.example',
    'sec-fetch-site': 'cross-site',
  });
  assert.equal(maliciousOrigin.status, 401);

  const missingResend = await postJson('/api/submit-request', {
    type: 'contact',
    clientInfo: {
      requestType: 'general_contact',
      name: 'Test Brand',
      email: 'test@example.test',
      message: 'Lokaler Test ohne Versand',
      submissionId: 'local-test-123456',
    },
  }, {
    origin: baseUrl,
    'sec-fetch-site': 'same-origin',
  });
  const missingResendBody = await missingResend.json();
  assert.equal(missingResend.status, 502);
  assert.equal(missingResendBody.success, false);
  assert.match(missingResendBody.leadId, /^UGC-[A-F0-9]{12}$/);

  const rateLimitStatuses = [];
  for (let index = 0; index < 5; index += 1) {
    const response = await postJson('/api/submit-request', {
      type: 'contact',
      clientInfo: {
        requestType: 'general_contact',
        name: 'Rate Limit Test',
        email: 'test@example.test',
        message: 'Lokaler Test ohne Versand',
        submissionId: `rate-limit-test-${index}`,
      },
    }, {
      origin: baseUrl,
      'sec-fetch-site': 'same-origin',
    });
    rateLimitStatuses.push(response.status);
  }
  assert.deepEqual(rateLimitStatuses, [502, 502, 502, 502, 429]);

  const honeypot = await postJson('/api/submit-request', {
    type: 'contact',
    clientInfo: {
      requestType: 'general_contact',
      name: 'Bot',
      email: 'bot@example.test',
      website: 'https://spam.test',
    },
  }, {
    origin: baseUrl,
    'sec-fetch-site': 'same-origin',
  });
  assert.equal(honeypot.status, 400);

  const unsignedWebhook = await postJson('/api/webhooks/resend', {});
  assert.equal(unsignedWebhook.status, 503);
  assert.match(unsignedWebhook.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
  assert.equal(unsignedWebhook.headers.get('x-frame-options'), 'DENY');
  assert.equal(unsignedWebhook.headers.get('x-content-type-options'), 'nosniff');

  console.log(JSON.stringify({
    maliciousOrigin: maliciousOrigin.status,
    missingResend: missingResend.status,
    rateLimit: rateLimitStatuses.at(-1),
    honeypot: honeypot.status,
    unsignedWebhook: unsignedWebhook.status,
    endpointSecurityHeaders: 'present',
    result: 'passed',
  }, null, 2));
} finally {
  clearTimeout(timeout);
  server.kill('SIGTERM');
}
