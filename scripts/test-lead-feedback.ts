import assert from 'node:assert/strict';
import { leadFeedbackUrl, verifyLeadFeedback } from '@/app/lib/lead-feedback';


// Das Secret wird erst beim Aufruf gelesen, nicht beim Import.
process.env.RESEND_WEBHOOK_SECRET = 'test-secret';

const url = new URL(leadFeedbackUrl('UGC-7ACBC6F69AE6') as string);
const t = url.searchParams.get('t') as string;
assert.equal(verifyLeadFeedback('UGC-7ACBC6F69AE6', t), true);
assert.equal(verifyLeadFeedback('UGC-7ACBC6F69AE7', t), false);
assert.equal(verifyLeadFeedback('UGC-7ACBC6F69AE6', t.replace(/.$/, '0')), t.endsWith('0'));
assert.equal(verifyLeadFeedback('UGC-7ACBC6F69AE6', 'kurz'), false);
assert.equal(leadFeedbackUrl('keine-id'), null);
delete process.env.RESEND_WEBHOOK_SECRET;
assert.equal(leadFeedbackUrl('UGC-7ACBC6F69AE6'), null);
console.log('OK: lead feedback links');
