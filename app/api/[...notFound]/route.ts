// Catch-all fuer unbekannte /api/*-Pfade: strukturierte RFC-7807-Antwort
// (application/problem+json) statt der HTML-404-Seite. Konkrete Routen
// gewinnen in Next immer vor diesem Catch-all.
import { NextRequest } from 'next/server';
import { notFound } from '@/app/lib/api-problem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const respond = (request: NextRequest) =>
  notFound(
    `Kein API-Endpunkt unter ${new URL(request.url).pathname}.`,
    'endpoint_not_found',
    new URL(request.url).pathname,
  );

export const GET = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
export const HEAD = respond;
export const OPTIONS = respond;
