import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { consumeCreatorAiRateLimit, isTrustedCreatorRequest } from '@/app/lib/creator-request-guard';
import {
  loadCreatorAiProfile,
  refineAiProfileWithVoiceOrText,
} from '@/app/lib/creator-social-analyzer';
import { sanitizePublicSearchSnippet } from '@/app/lib/search-index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB (~60s voice note)
const MAX_JSON_BYTES = 16_384;
const HOUR_MS = 60 * 60 * 1000;

function mapAudioMimeToFormat(mimeType: string): 'webm' | 'mp4' | 'ogg' | 'wav' | 'mp3' | null {
  const base = mimeType.toLowerCase().split(';')[0].trim();
  if (base === 'audio/webm' || base === 'video/webm') return 'webm';
  if (base === 'audio/mp4' || base === 'audio/m4a' || base === 'audio/x-m4a' || base === 'video/mp4') return 'mp4';
  if (base === 'audio/ogg' || base === 'audio/opus') return 'ogg';
  if (base === 'audio/wav' || base === 'audio/wave' || base === 'audio/x-wav') return 'wav';
  if (base === 'audio/mpeg' || base === 'audio/mp3') return 'mp3';
  return null;
}

export async function POST(request: NextRequest) {
  if (!isTrustedCreatorRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Sprach-Ergänzung ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  const rate = consumeCreatorAiRateLimit(`voice:${creatorId}`, 15, HOUR_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Zu viele Sprach- oder Text-Aktualisierungen in kurzer Zeit. Bitte warte kurz.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_AUDIO_BYTES + 65_536) {
    return NextResponse.json(
      { success: false, error: 'Die Sprachaufnahme ist zu groß (maximal 5 MB / ca. 60 Sekunden).' },
      { status: 413 },
    );
  }

  try {
    const sql = getDatabase();
    const existing = await loadCreatorAiProfile(sql, creatorId);
    const contentType = (request.headers.get('content-type') || '').toLowerCase();

    let currentSummary = existing?.draftSummary || existing?.approvedSummary || '';
    let currentNiches: string[] = existing?.inferredNiches?.length
      ? existing.inferredNiches
      : existing?.approvedNiches || [];
    let audioPayload: { base64: string; format: 'webm' | 'mp4' | 'ogg' | 'wav' | 'mp3' } | undefined;
    let instructionText: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const summaryField = formData.get('currentSummary');
      if (typeof summaryField === 'string' && summaryField.trim()) {
        currentSummary = sanitizePublicSearchSnippet(summaryField, 1_500);
      }
      const nichesField = formData.get('currentNiches');
      if (typeof nichesField === 'string' && nichesField.trim()) {
        currentNiches = nichesField
          .split(',')
          .map((n) => sanitizePublicSearchSnippet(n, 60))
          .filter(Boolean)
          .slice(0, 15);
      }
      const textField = formData.get('instruction');
      if (typeof textField === 'string' && textField.trim()) {
        instructionText = sanitizePublicSearchSnippet(textField, 1_000);
      }

      const audioFile = formData.get('audio');
      if (audioFile && typeof audioFile !== 'string') {
        const bytes = Buffer.from(await audioFile.arrayBuffer());
        if (bytes.length === 0) {
          return NextResponse.json({ success: false, error: 'Die Sprachaufnahme ist leer.' }, { status: 400 });
        }
        if (bytes.length > MAX_AUDIO_BYTES) {
          return NextResponse.json(
            { success: false, error: 'Die Sprachaufnahme ist zu groß (maximal 5 MB / ca. 60 Sekunden).' },
            { status: 413 },
          );
        }
        const format = mapAudioMimeToFormat(audioFile.type || 'audio/webm');
        if (!format) {
          return NextResponse.json(
            { success: false, error: 'Nicht unterstütztes Audioformat. Bitte nutze WebM, MP4/M4A, OGG, WAV oder MP3.' },
            { status: 400 },
          );
        }
        audioPayload = { base64: bytes.toString('base64'), format };
      }
    } else {
      const raw = await request.text();
      if (Buffer.byteLength(raw, 'utf8') > MAX_JSON_BYTES) {
        return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
      }
      const body = JSON.parse(raw) as Record<string, unknown>;
      if (typeof body.currentSummary === 'string' && body.currentSummary.trim()) {
        currentSummary = sanitizePublicSearchSnippet(body.currentSummary, 1_500);
      }
      if (Array.isArray(body.currentNiches)) {
        currentNiches = body.currentNiches.map((n) => sanitizePublicSearchSnippet(String(n), 60)).filter(Boolean).slice(0, 15);
      }
      if (typeof body.instruction === 'string' && body.instruction.trim()) {
        instructionText = sanitizePublicSearchSnippet(body.instruction, 1_000);
      }
    }

    if (!audioPayload && !instructionText) {
      return NextResponse.json(
        { success: false, error: 'Bitte nimm eine Sprachnachricht auf oder gib eine kurze Ergänzung ein.' },
        { status: 400 },
      );
    }

    const refined = await refineAiProfileWithVoiceOrText({
      currentSummary,
      currentNiches,
      audio: audioPayload,
      instructionText,
    });

    // Save as updated draft (does NOT auto-approve until the creator explicitly clicks approve!)
    await sql.query(
      `INSERT INTO creator_ai_profiles (
         creator_id, status, draft_summary, inferred_niches,
         creator_voice_transcript, updated_at
       ) VALUES ($1, 'draft_ready', $2, $3::text[], $4, now())
       ON CONFLICT (creator_id) DO UPDATE SET
         status = CASE
           WHEN creator_ai_profiles.status = 'approved' THEN 'approved'
           ELSE 'draft_ready'
         END,
         draft_summary = EXCLUDED.draft_summary,
         inferred_niches = EXCLUDED.inferred_niches,
         creator_voice_transcript = EXCLUDED.creator_voice_transcript,
         updated_at = now()`,
      [creatorId, refined.updatedSummary, refined.updatedNiches, refined.transcript],
    );

    return NextResponse.json({
      success: true,
      transcript: refined.transcript,
      updatedSummary: refined.updatedSummary,
      updatedNiches: refined.updatedNiches,
      changesSummary: refined.changesSummary,
    });
  } catch (error) {
    console.error('Creator voice refinement failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { success: false, error: 'Deine Sprach- oder Text-Ergänzung konnte gerade nicht verarbeitet werden. Bitte versuche es erneut.' },
      { status: 502 },
    );
  }
}
