import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CollabStore } from '@/app/lib/collaborations/store';
import { bodyOf,json,apiError,identity } from '@/app/lib/collaborations/http';
export const runtime='nodejs'; export const dynamic='force-dynamic';
// Nur diese Events nimmt der Client entgegen; page_view, accept und decline schreibt der Server selbst.
const schema=z.object({id:z.uuid(),kind:z.enum(['video_play','cta_click','handover']),details:z.object({
  video_id:z.string().regex(/^[a-z0-9_-]{1,60}$/).optional(),position:z.enum(['hero','facts','decision','bottom','sticky']).optional(),
  method:z.enum(['discord_click']).optional(),variant:z.enum(['w','m','n']).optional(),variant_source:z.enum(['profile','override','fallback']).optional()}).strict()});
export async function POST(request:NextRequest) {
  try {
    const parsed=schema.safeParse(await bodyOf(request));
    if(!parsed.success) return json({error:'Ungültiges Event.'},400);
    const store=new CollabStore(),who=identity(request);
    const member=await store.member(parsed.data.id,who.creatorId,who.session);
    if(!member) return json({error:'Bitte melde dich erneut an.'},401);
    await store.event(member.id,parsed.data.kind,'creator',parsed.data.details);
    return json({success:true});
  } catch(error) {return apiError(error);}
}
