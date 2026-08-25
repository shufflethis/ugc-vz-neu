// RFC-7807-Fehlerantworten (application/problem+json) fuer die oeffentliche
// REST-API (/api/v1) und den JSON-404-Catch-all. Agenten und Scanner erwarten
// strukturierte Fehler mit Code, Detail und Loesungshinweis -- HTML-Fehlerseiten
// koennen sie nicht parsen.
import { NextResponse } from 'next/server';

const DOCS_URL = 'https://ugc-vz.de/developers';

export type ProblemInit = {
  status: number;
  title: string;
  detail: string;
  code: string;
  resolution?: string;
  instance?: string;
};

export const problemResponse = ({ status, title, detail, code, resolution, instance }: ProblemInit) =>
  NextResponse.json(
    {
      type: `${DOCS_URL}#errors`,
      title,
      status,
      detail,
      code,
      ...(resolution ? { resolution } : {}),
      ...(instance ? { instance } : {}),
      documentation_url: DOCS_URL,
    },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json; charset=utf-8' },
    },
  );

export const badRequest = (detail: string, code = 'bad_request') =>
  problemResponse({ status: 400, title: 'Invalid request', detail, code, resolution: `Request-Schema unter https://ugc-vz.de/openapi.json pruefen.` });

export const notFound = (detail: string, code = 'not_found', instance?: string) =>
  problemResponse({
    status: 404,
    title: 'Not found',
    detail,
    code,
    instance,
    resolution: 'Verfuegbare Endpunkte: https://ugc-vz.de/openapi.json - Uebersicht: https://ugc-vz.de/developers - Inhalte: https://ugc-vz.de/llms.txt',
  });

export const serverError = (detail: string, code = 'internal_error') =>
  problemResponse({ status: 500, title: 'Internal error', detail, code, resolution: 'Bitte spaeter erneut versuchen oder hi@ugc-vz.de kontaktieren.' });
