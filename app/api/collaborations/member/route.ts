import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CollabStore } from '@/app/lib/collaborations/store';
import { detailsSchema } from '@/app/lib/collaborations/security';
import { DECLINE_REASONS } from '@/app/lib/collaborations/model';
import { bodyOf,json,apiError,identity } from '@/app/lib/collaborations/http';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const schema=z.object({id:z.uuid(),version:z.number().int().positive(),campaignVersion:z.number().int().positive(),action:z.enum(['accept','save','decline']),consent:z.boolean().optional(),adult:z.boolean().optional(),details:detailsSchema.optional(),
  reasons:z.array(z.enum(DECLINE_REASONS)).max(5).optional(),variant:z.enum(['w','m','n']).optional(),variant_source:z.enum(['profile','override','fallback']).optional()});
export async function POST(request:NextRequest) {
  try {
    const parsed=schema.safeParse(await bodyOf(request));
    if(!parsed.success) return json({error:'Bitte die Angaben prüfen. Social-Links müssen mit https:// beginnen.'},400);
    const body=parsed.data, store=new CollabStore(),who=identity(request);
    const member=await store.member(body.id,who.creatorId,who.session);
    if(!member) return json({error:'Bitte melde dich erneut an.'},401);
    if(body.action==='decline') {
      return await store.decline(member,body.version,{reasons:body.reasons||[],variant:body.variant,variant_source:body.variant_source})?json({success:true}):json({error:'Der Status hat sich geändert. Bitte neu laden.'},409);
    }
    if(!body.details||(body.action==='accept'&&(body.consent!==true||body.adult!==true))) return json({error:'Bitte die Einwilligung zur Weitergabe und dein Alter bestätigen.'},400);
    const result=await store.saveDetails(member,body.details,body.action==='accept',body.version,body.campaignVersion);
    if(result&&body.action==='accept') await store.event(member.id,'accept','creator',{posting_language:body.details.language,start_option:body.details.availability,variant:body.variant,variant_source:body.variant_source});
    return result?json({success:true,status:result.status}):json({error:'Status oder Konditionen wurden geändert. Bitte neu laden und prüfen.'},409);
  } catch(error) {return apiError(error);}
}
