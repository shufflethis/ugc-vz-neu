import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildCreatorWelcomeEmail } from '@/app/lib/creator-welcome-email';
import {
  calculateReach,
  normalizeWebUrls,
  socialHandle,
  socialPlatform,
  type CreatorRegistrationPayload,
} from '@/app/lib/creator-registration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const uuidFromEmail = (email: string) => {
  const bytes = Buffer.from(crypto.createHash('sha256').update(`ugc-vz:native:${email}`).digest('hex').slice(0, 32), 'hex');
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const publicIdFromEmail = (email: string) => `UGC-${crypto.createHash('sha256')
  .update(`ugc-vz:public:native:${email}`)
  .digest('hex')
  .slice(0, 10)
  .toUpperCase()}`;

const redirectToCreator = (request: Request, state: 'verified' | 'invalid' | 'error') => {
  const url = new URL('/creator', request.url);
  url.searchParams.set(state, '1');
  url.hash = 'creator-form';
  return NextResponse.redirect(url, 303);
};

const htmlEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return redirectToCreator(request, 'error');
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return redirectToCreator(request, 'invalid');

  try {
    const sql = getDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [submission] = await sql.query(`
      SELECT id, email, payload, expires_at, verified_at
      FROM creator_registration_submissions
      WHERE token_hash = $1
      LIMIT 1
    `, [tokenHash]);

    if (!submission) return redirectToCreator(request, 'invalid');
    if (submission.verified_at) return redirectToCreator(request, 'verified');
    if (new Date(submission.expires_at).getTime() < Date.now()) return redirectToCreator(request, 'invalid');

    const payload = (typeof submission.payload === 'string'
      ? JSON.parse(submission.payload)
      : submission.payload) as CreatorRegistrationPayload;
    const email = String(submission.email).toLowerCase();
    const [existing] = await sql.query(`
      SELECT c.creator_id, p.public_id
      FROM creator_private_contacts c
      JOIN creator_profiles p ON p.id = c.creator_id
      WHERE lower(c.email) = lower($1)
      LIMIT 1
    `, [email]);

    const creatorId = existing?.creator_id || uuidFromEmail(email);
    const publicId = existing?.public_id || publicIdFromEmail(email);
    const socialLinks = normalizeWebUrls(payload.socialLinks, 8);
    const portfolioLinks = normalizeWebUrls(payload.portfolioLinks, 15);
    const submittedAt = new Date().toISOString();
    const displayName = payload.stageName || payload.name;
    const qualityScore = Math.min(100,
      20
      + (payload.city ? 5 : 0)
      + (payload.topics ? 15 : 0)
      + (payload.preferredContent ? 15 : 0)
      + (payload.rateText ? 15 : 0)
      + (socialLinks.length ? 15 : 0)
      + (portfolioLinks.length ? 15 : 0));

    await sql.query(`
      INSERT INTO creator_profiles (
        id, public_id, status, display_name, legal_name, stage_name, birth_year,
        gender, city, topics, preferred_content, industries, rate_text, reach_text,
        total_reach, equipment, special_traits, children_context, pet_context,
        profile_quality_score, source_priority, submitted_at, profile_image_url
      ) VALUES (
        $1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, 30, $20, $21
      )
      ON CONFLICT (id) DO UPDATE SET
        status = 'active',
        display_name = EXCLUDED.display_name,
        legal_name = EXCLUDED.legal_name,
        stage_name = EXCLUDED.stage_name,
        birth_year = EXCLUDED.birth_year,
        gender = EXCLUDED.gender,
        city = EXCLUDED.city,
        topics = EXCLUDED.topics,
        preferred_content = EXCLUDED.preferred_content,
        industries = EXCLUDED.industries,
        rate_text = EXCLUDED.rate_text,
        reach_text = EXCLUDED.reach_text,
        total_reach = EXCLUDED.total_reach,
        equipment = EXCLUDED.equipment,
        special_traits = EXCLUDED.special_traits,
        children_context = EXCLUDED.children_context,
        pet_context = EXCLUDED.pet_context,
        profile_quality_score = EXCLUDED.profile_quality_score,
        source_priority = 30,
        submitted_at = EXCLUDED.submitted_at,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now()
    `, [
      creatorId, publicId, displayName, payload.name, payload.stageName || null,
      payload.birthYear, payload.gender || null, payload.city || null, payload.topics,
      payload.preferredContent, payload.industries || null, payload.rateText,
      payload.reachText || null, calculateReach(payload.reachText || ''),
      payload.equipment || null, payload.specialTraits || null,
      payload.childrenContext || null, payload.petContext || null, qualityScore, submittedAt,
      payload.profileImageUrl || null,
    ]);

    await sql.query(`
      INSERT INTO creator_private_contacts (
        creator_id, email, email_verified_at, project_notifications_enabled, newsletter_enabled
      ) VALUES ($1, $2, now(), true, $3)
      ON CONFLICT (creator_id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified_at = now(),
        project_notifications_enabled = true,
        notification_paused_at = NULL,
        newsletter_enabled = EXCLUDED.newsletter_enabled,
        updated_at = now()
    `, [creatorId, email, payload.newsletterConsent]);

    for (let index = 0; index < socialLinks.length; index += 1) {
      const url = socialLinks[index];
      await sql.query(`
        INSERT INTO creator_social_accounts (creator_id, platform, handle, url, is_primary, source)
        VALUES ($1, $2, $3, $4, $5, 'native')
        ON CONFLICT (creator_id, url) DO UPDATE SET
          platform = EXCLUDED.platform,
          handle = EXCLUDED.handle,
          is_primary = EXCLUDED.is_primary,
          source = 'native'
      `, [creatorId, socialPlatform(url), socialHandle(url), url, index === 0]);
    }

    for (let index = 0; index < portfolioLinks.length; index += 1) {
      const url = portfolioLinks[index];
      await sql.query(`
        INSERT INTO creator_portfolio_items (creator_id, kind, url, sort_order, source)
        VALUES ($1, 'portfolio', $2, $3, 'native')
        ON CONFLICT (creator_id, url) DO UPDATE SET
          sort_order = EXCLUDED.sort_order,
          source = 'native'
      `, [creatorId, url, index]);
    }

    const consentRows = [
      ['platform', true],
      ['project_notifications', true],
      ['newsletter', Boolean(payload.newsletterConsent)],
    ] as const;
    for (const [purpose, granted] of consentRows) {
      await sql.query(`
        INSERT INTO consent_events (
          creator_id, purpose, granted, text_version, source, source_reference, occurred_at
        ) VALUES ($1, $2, $3, $4, 'native_form', $5, $6)
        ON CONFLICT (source, source_reference, purpose) DO UPDATE SET
          creator_id = EXCLUDED.creator_id,
          granted = EXCLUDED.granted,
          occurred_at = EXCLUDED.occurred_at
      `, [creatorId, purpose, granted, payload.consentTextVersion, submission.id, submittedAt]);
    }

    await sql.query(`
      UPDATE creator_registration_submissions
      SET verified_at = now()
      WHERE id = $1 AND verified_at IS NULL
    `, [submission.id]);

    if (process.env.RESEND_API_KEY && process.env.UGC_INTERNAL_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const internalHtml = `<h2>Neues verifiziertes Creator-Profil</h2>
        <p><strong>${htmlEscape(displayName)}</strong> · ${htmlEscape(publicId)}</p>
        <p>Themen: ${htmlEscape(payload.topics)}<br />Preis: ${htmlEscape(payload.rateText)}<br />Ort: ${htmlEscape(payload.city || 'nicht angegeben')}</p>
        <p>Social-Profile: ${socialLinks.length} · Portfolio-Links: ${portfolioLinks.length} · Newsletter: ${payload.newsletterConsent ? 'Ja' : 'Nein'}</p>`;
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
        to: process.env.UGC_INTERNAL_EMAIL,
        replyTo: email,
        subject: `[UGC VZ] Neues Creator-Profil ${publicId}`,
        html: internalHtml,
        text: `Neues verifiziertes Creator-Profil\n${displayName} · ${publicId}\nThemen: ${payload.topics}\nPreis: ${payload.rateText}\nOrt: ${payload.city || 'nicht angegeben'}\nSocial-Profile: ${socialLinks.length}\nPortfolio-Links: ${portfolioLinks.length}`,
        tags: [
          { name: 'category', value: 'creator_registration' },
          { name: 'audience', value: 'internal' },
          { name: 'creator_id', value: publicId },
        ],
      }, { idempotencyKey: `ugc-vz/creator-verified/${submission.id}` });
      if (result.error) console.error('Internal creator registration email rejected', result.error.name);
    }

    // Willkommensmail an den Creator. Bewusst hier und nicht in der
    // Double-Opt-In-Mail: die muss transaktional bleiben. Ein Fehlschlag darf
    // die Verifizierung nicht kippen - das Profil ist zu diesem Zeitpunkt
    // bereits aktiv.
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const welcome = buildCreatorWelcomeEmail({ name: displayName, publicId });
        const welcomeResult = await resend.emails.send({
          from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
          to: email,
          subject: welcome.subject,
          html: welcome.html,
          text: welcome.text,
          tags: [
            { name: 'category', value: 'creator_welcome' },
            { name: 'audience', value: 'creator' },
            { name: 'creator_id', value: publicId },
          ],
        }, { idempotencyKey: `ugc-vz/creator-welcome/${submission.id}` });
        if (welcomeResult.error) console.error('Creator welcome email rejected', welcomeResult.error.name);
      } catch (welcomeError) {
        console.error('Creator welcome email failed', welcomeError instanceof Error ? welcomeError.message : 'unknown error');
      }
    }

    return redirectToCreator(request, 'verified');
  } catch (error) {
    console.error('Creator verification failed', error instanceof Error ? error.message : 'unknown error');
    return redirectToCreator(request, 'error');
  }
}
