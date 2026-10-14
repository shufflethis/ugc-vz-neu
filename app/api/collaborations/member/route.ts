import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CollabStore } from '@/app/lib/collaborations/store';
import { detailsSchema } from '@/app/lib/collaborations/security';
import { bodyOf,json,apiError,identity } from '@/app/lib/collaborations/http';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const schema=z.object({id:z.uuid(),version:z.number().int().positive(),campaignVersion:z.number().int().positive(),action:z.enum(['accept','save','decline']),consent:z.boolean().optional(),details:detailsSchema.optional()});
export async function POST(request:NextRequest) {
  try {
    const parsed=schema.safeParse(await bodyOf(request));
    if(!parsed.success) return json({error:'Bitte die Angaben prüfen. Social-Links müssen mit https:// beginnen.'},400);
    const body=parsed.data, store=new CollabStore(),who=identity(request);
    const member=await store.member(body.id,who.creatorId,who.session);
    if(!member) return json({error:'Bitte melde dich erneut an.'},401);
    if(body.action==='decline') {
      return await store.decline(member,body.version)?json({success:true}):json({error:'Der Status hat sich geändert. Bitte neu laden.'},409);
    }
    if(!body.details||(body.action==='accept'&&body.consent!==true)) return json({error:'Bitte die Zustimmung zur Teilnahme und Datenweitergabe bestätigen.'},400);
    const result=await store.saveDetails(member,body.details,body.action==='accept',body.version,body.campaignVersion);
    return result?json({success:true,status:result.status}):json({error:'Status oder Konditionen wurden geändert. Bitte neu laden und prüfen.'},409);
  } catch(error) {return apiError(error);}
}
