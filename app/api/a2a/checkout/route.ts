import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const plans = {
  starter: {
    name: 'A2A Agent Starter',
    priceEur: 29,
    monthlySearchLimit: 10,
    stripePriceEnv: 'STRIPE_A2A_STARTER_PRICE_ID',
  },
  pro: {
    name: 'A2A Agent Pro',
    priceEur: 100,
    monthlySearchLimit: null,
    stripePriceEnv: 'STRIPE_A2A_PRO_PRICE_ID',
  },
};

const getBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

const createCheckoutSession = async (request: Request, planKey: keyof typeof plans, email?: string) => {
  // Checkout is intentionally prepared but not activated until Stripe env vars
  // and API-key provisioning are configured. Without those values this endpoint
  // returns a documented "configured: false" response instead of failing.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return {
      configured: false,
      message: 'STRIPE_SECRET_KEY is not configured.',
    };
  }

  const plan = plans[planKey];
  const priceId = process.env[plan.stripePriceEnv];
  if (!priceId) {
    return {
      configured: false,
      message: `${plan.stripePriceEnv} is not configured.`,
    };
  }

  const baseUrl = getBaseUrl(request);
  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('line_items[0][price]', priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', `${baseUrl}/brands?agent_checkout=success&plan=${planKey}`);
  body.set('cancel_url', `${baseUrl}/brands?agent_checkout=cancelled&plan=${planKey}`);
  body.set('allow_promotion_codes', 'true');
  body.set('metadata[product]', 'ugc-vz-a2a');
  body.set('metadata[plan]', planKey);

  if (email) {
    body.set('customer_email', email);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      configured: true,
      error: data.error?.message || 'Stripe Checkout session failed',
    };
  }

  return {
    configured: true,
    checkoutUrl: data.url,
    sessionId: data.id,
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get('plan') === 'pro' ? 'pro' : 'starter';
  const email = url.searchParams.get('email') || undefined;
  const session = await createCheckoutSession(request, plan, email);

  return NextResponse.json({
    plan,
    pricing: plans[plan],
    ...session,
    note:
      'Nach erfolgreicher Zahlung wird ein A2A API-Key fuer den gebuchten Plan benoetigt. Provisioning kann manuell oder per Stripe Webhook erfolgen.',
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const plan = body.plan === 'pro' ? 'pro' : 'starter';
  const session = await createCheckoutSession(request, plan, body.email);

  return NextResponse.json({
    plan,
    pricing: plans[plan],
    ...session,
    note:
      'Nach erfolgreicher Zahlung wird ein A2A API-Key fuer den gebuchten Plan benoetigt. Provisioning kann manuell oder per Stripe Webhook erfolgen.',
  });
}
