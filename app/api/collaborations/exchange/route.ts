import { NextRequest } from 'next/server';
import { CollabStore } from '@/app/lib/collaborations/store';
import { COLLAB_SESSION_COOKIE } from '@/app/lib/collaborations/model';
import { validToken } from '@/app/lib/collaborations/security';
import { bodyOf,json,apiError } from '@/app/lib/collaborations/http';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function POST(request:NextRequest) {
  try {
    const body=await bodyOf(request);
    if(!validToken(body.token)||typeof body.slug!=='string') return json({error:'Ungültiger Einladungslink.'},400);
    const result=await new CollabStore().consume(body.token,body.slug);
    if(!result) return json({error:'Dieser Link ist abgelaufen, bereits eingelöst oder zurückgezogen. Über dein Creator-Konto kannst du vorhandene Einladungen wieder aufrufen.'},410);
    const response=json({url:`/konto/kooperationen/${result.membershipId}`});
    response.cookies.set(COLLAB_SESSION_COOKIE,result.session,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});
    return response;
  } catch(error) {return apiError(error);}
}
