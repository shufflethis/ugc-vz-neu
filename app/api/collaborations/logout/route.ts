import { NextRequest } from 'next/server';
import { COLLAB_SESSION_COOKIE } from '@/app/lib/collaborations/model';
import { CREATOR_SESSION_COOKIE } from '@/app/lib/creator-session';
import { sha256,enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import { bodyOf,json,apiError } from '@/app/lib/collaborations/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
  try {await bodyOf(request);const token=request.cookies.get(COLLAB_SESSION_COOKIE)?.value;
    if(token&&enabled())await new CollabStore().query('DELETE FROM collab_sessions WHERE token_hash=$1',[sha256(token)]);
    const response=json({success:true});
    for(const name of [COLLAB_SESSION_COOKIE,CREATOR_SESSION_COOKIE])response.cookies.set(name,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
    return response;
  }catch(error){return apiError(error);}
}
