import { NextRequest, NextResponse } from 'next/server';
import { authorizeCollabDemo } from '../collab-demo-auth';
import { CREATOR_SESSION_COOKIE, verifySession } from '../creator-session';
import { COLLAB_SESSION_COOKIE } from './model';
import { enabled, trustedMutation } from './security';
export const privateHeaders = {'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
export const json = (body:unknown,status=200) => NextResponse.json(body,{status,headers:privateHeaders});
export async function adminAuthorized(header:string|null) { return authorizeCollabDemo(header,process.env.COLLAB_ADMIN_PASSWORD || ''); }
export function identity(request:NextRequest) { return {creatorId:verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value),session:request.cookies.get(COLLAB_SESSION_COOKIE)?.value||null}; }
export async function bodyOf(request:NextRequest) {
  if(!enabled()) throw new Error('disabled');
  if(!trustedMutation(request)) throw new Error('origin');
  if(Number(request.headers.get('content-length')||0)>32000) throw new Error('body');
  const raw=await request.text(); if(Buffer.byteLength(raw)>32000) throw new Error('body');
  const body=JSON.parse(raw);
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('body');
  return body;
}
export function apiError(error:unknown) {
  const reason=error instanceof Error?error.message:'';
  if(reason==='disabled') return json({error:'Kooperationen sind noch nicht freigeschaltet.'},503);
  if(reason==='origin') return json({error:'Bitte diese Aktion direkt auf UGC VZ ausführen.'},403);
  if(reason==='body'||error instanceof SyntaxError) return json({error:'Ungültige Eingabe.'},400);
  console.error('Collaboration request failed');
  return json({error:'Die Aktion konnte nicht abgeschlossen werden. Bitte neu laden und erneut versuchen.'},500);
}
