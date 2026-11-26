import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type Stripe from 'stripe';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  finalizeCreatorPayoutPaid,
  getCreatorTaxProfile,
  recordWebhookEventOnce,
  revertCreatorPayoutFailed,
  settleTopupIdempotently,
  type PayInMethod,
} from '@/app/lib/payments-ledger';
import { issueCreditNoteForPayout } from '@/app/lib/credit-note-generator';
import { constructVerifiedStripeEvent } from '@/app/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = constructVerifiedStripeEvent(rawBody, signature);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid Stripe signature' },
      { status: 400 },
    );
  }

  const sql = getDatabase();

  // 100 % Idempotenz: doppelte Stripe-Events sofort mit 200 bestaetigen ohne Doppelbuchung
  const isNewEvent = await recordWebhookEventOnce(sql, event.id, event.type);
  if (!isNewEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          const brandId = session.metadata?.ugc_vz_brand_id;
          const amountCents = Number(session.metadata?.topup_amount_cents || 0);
          const method = (session.metadata?.topup_method || 'sepa_debit') as PayInMethod;
          await settleTopupIdempotently(sql, {
            providerRef: session.id,
            brandId,
            amountCents: amountCents > 0 ? amountCents : undefined,
            method,
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const brandId = pi.metadata?.ugc_vz_brand_id;
        const amountCents = Number(pi.metadata?.topup_amount_cents || pi.amount_received || 0);
        const method = (pi.metadata?.topup_method || 'sepa_debit') as PayInMethod;
        if (brandId && amountCents > 0) {
          await settleTopupIdempotently(sql, {
            providerRef: pi.id,
            brandId,
            amountCents,
            method,
          });
        }
        break;
      }

      case 'customer_cash_balance_transaction.created': {
        const tx = event.data.object as Stripe.CustomerCashBalanceTransaction;
        if (tx.type === 'funding' && tx.net_amount > 0 && typeof tx.customer === 'string') {
          const [wallet] = await sql.query(
            `SELECT brand_id FROM brand_wallets WHERE stripe_customer_id = $1 LIMIT 1`,
            [tx.customer],
          );
          if (wallet?.brand_id) {
            await settleTopupIdempotently(sql, {
              providerRef: tx.id,
              brandId: String(wallet.brand_id),
              amountCents: tx.net_amount,
              method: 'bank_transfer',
            });
          }
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const verified = Boolean(account.payouts_enabled && account.details_submitted);
        const status = verified
          ? 'verified'
          : account.requirements?.disabled_reason
            ? 'restricted'
            : 'pending';
        await sql.query(
          `UPDATE creator_balances
           SET stripe_onboarding_status = $1, updated_at = now()
           WHERE stripe_connect_account_id = $2`,
          [status, account.id],
        );
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        const payoutId = payout.metadata?.ugc_vz_payout_id;
        if (payoutId) {
          const finalized = await finalizeCreatorPayoutPaid(sql, {
            payoutId,
            providerPayoutRef: payout.id,
          });
          if (finalized.transitionedNow && finalized.creatorId) {
            const taxProfile = await getCreatorTaxProfile(sql, finalized.creatorId);
            if (taxProfile) {
              const creditNote = await issueCreditNoteForPayout(sql, {
                payoutId,
                creatorId: finalized.creatorId,
                amountCents: finalized.amountCents,
                taxProfile,
              });

              // Best-Effort Versand der Gutschrift-PDF per E-Mail an den Creator
              if (process.env.RESEND_API_KEY) {
                const [contact] = await sql.query(
                  `SELECT email FROM creator_private_contacts WHERE creator_id = $1 LIMIT 1`,
                  [finalized.creatorId],
                );
                if (contact?.email) {
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails
                    .send({
                      from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
                      to: String(contact.email),
                      subject: `Deine UGC VZ Gutschrift ${creditNote.number}`,
                      text: `Hallo ${taxProfile.legalName},\n\ndeine Auszahlung über ${(finalized.amountCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} € wurde ausgeführt. Im Anhang findest du deine Gutschrift ${creditNote.number} (PDF inkl. ZUGFeRD-XML).\n\nViele Grüße\nUGC VZ`,
                      attachments: [
                        {
                          filename: `${creditNote.number}.pdf`,
                          content: Buffer.from(creditNote.pdfBytes).toString('base64'),
                        },
                      ],
                    })
                    .catch(() => {});
                }
              }
            }
          }
        }
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        const payoutId = payout.metadata?.ugc_vz_payout_id;
        if (payoutId) {
          await revertCreatorPayoutFailed(sql, payoutId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handling failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
