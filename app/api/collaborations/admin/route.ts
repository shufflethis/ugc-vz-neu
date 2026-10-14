import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { CollabStore,newBatchId } from '@/app/lib/collaborations/store';
import { campaignSchema,baseUrl,decryptToken,enabled } from '@/app/lib/collaborations/security';
import { adminAuthorized,bodyOf,json,apiError } from '@/app/lib/collaborations/http';
import { invitationEmail } from '@/app/lib/collaborations/email';
import { normalizeGenderValue } from '@/app/lib/normalize-gender';
export const runtime='nodejs'; export const dynamic='force-dynamic'; export const maxDuration=60;
const uuid=z.uuid();
// Weibliche Profile bekommen die Creatorinnen-Variante des Briefings; männlich/unbekannt die Standardvariante.
const invitationUrl=(slug:string,encrypted:string,gender?:string)=>`${baseUrl()}/kooperationen/${slug}${normalizeGenderValue(gender)==='female'?'?fuer=creatorinnen':''}#einladung=${decryptToken(encrypted)}`;
export async function GET(request:NextRequest) {
  if(!await adminAuthorized(request.headers.get('authorization'))) return json({error:'Anmeldung erforderlich.'},401);
  if(!enabled()) return json({error:'Kooperationen noch nicht eingerichtet.'},503);
  try {
    const store=new CollabStore(),params=request.nextUrl.searchParams;
    if(params.has('search')) return json({creators:await store.creators((params.get('search')||'').slice(0,100))});
    if(uuid.safeParse(params.get('batch')).success) {
      const rows=await store.batch(params.get('batch')!);
      return json({preview:rows.map(r=>({id:r.id,name:r.display_name,email:r.recipient,delivery:r.delivery,subject:invitationEmail({name:r.display_name,note:r.personal_note,content:r.content,url:'[Persönlicher Link · 14 Tage gültig]'}).subject,text:invitationEmail({name:r.display_name,note:r.personal_note,content:r.content,url:'[Persönlicher Link · 14 Tage gültig]'}).text}))});
    }
    if(uuid.safeParse(params.get('history')).success) return json({history:await store.history(params.get('history')!)});
    return json({campaigns:await store.campaigns(),rows:params.get('slug')?await store.adminRows(params.get('slug')!):[],sendEnabled:process.env.COLLAB_SEND_ENABLED==='true',senderConfigured:/@/.test(process.env.COLLAB_FROM||process.env.RESEND_FROM||''),providerConfigured:Boolean(process.env.RESEND_API_KEY),webhookConfigured:Boolean(process.env.RESEND_WEBHOOK_SECRET)});
  } catch(error){return apiError(error);}
}
export async function POST(request:NextRequest) {
  if(!await adminAuthorized(request.headers.get('authorization'))) return json({error:'Anmeldung erforderlich.'},401);
  try {
    const body=await bodyOf(request),store=new CollabStore();
    if(body.action==='reconcile'&&uuid.safeParse(body.id).success&&uuid.safeParse(body.providerId).success) {
      if(!process.env.RESEND_API_KEY)return json({error:'Versanddienst noch nicht eingerichtet.'},503);
      const [invite]=await store.query('SELECT * FROM collab_invitations WHERE id=$1',[body.id]);
      if(!invite||!['sending','unknown'].includes(invite.delivery))return json({error:'Dieser Versand benötigt keinen Abgleich.'},409);
      const result=await new Resend(process.env.RESEND_API_KEY).emails.get(body.providerId);
      const mail=result.data;
      if(!mail||!mail.to.some(address=>address.toLowerCase()===invite.recipient.toLowerCase())||!mail.tags?.some(tag=>tag.name==='collab_invite'&&tag.value===invite.id))return json({error:'Die Mail konnte dieser Einladung nicht eindeutig zugeordnet werden.'},409);
      await store.reconcileSend(invite.id,mail.id,mail.created_at);
      if(['bounced','failed','suppressed','complained'].includes(mail.last_event))await store.emailEvent(invite.id,`reconcile-${mail.id}-${mail.last_event}`,`email.${mail.last_event}`,mail.id,new Date().toISOString());
      return json({success:true});
    }
    if(body.action==='campaign') {
      const parsed=campaignSchema.safeParse(body.campaign);
      if(!parsed.success) return json({error:parsed.error.issues[0].message},400);
      const saved=await store.saveCampaign(parsed.data);
      return saved?json({success:true}):json({error:'Die Kampagne wurde zwischenzeitlich geändert. Bitte neu laden.'},409);
    }
    if(body.action==='prepare') {
      const parsed=z.object({slug:z.string().min(2).max(60),creators:z.array(z.object({id:z.string().min(3).max(100),note:z.string().trim().min(15).max(1000)})).min(1).max(10)}).safeParse(body);
      if(!parsed.success||new Set(parsed.success?parsed.data.creators.map(c=>c.id):[]).size!==(parsed.success?parsed.data.creators.length:0)) return json({error:'Bitte ein bis zehn verschiedene Creator mit einer persönlichen Begründung auswählen.'},400);
      const batchId=newBatchId(),results=[];
      for(const creator of parsed.data.creators) {
        try {results.push({creatorId:creator.id,id:await store.prepare(parsed.data.slug,creator.id,creator.note,batchId)});}
        catch {results.push({creatorId:creator.id,error:'Nicht vorbereitet: Kontaktfreigabe, bisherigen Status oder laufenden Versand prüfen.'});}
      }
      return json({batchId,results});
    }
    if(body.action==='revoke'&&uuid.safeParse(body.id).success) {await store.revoke(body.id);return json({success:true});}
    if(['handover','confirm'].includes(body.action)&&uuid.safeParse(body.id).success&&Number.isInteger(body.version)) {
      const by=String(body.by||'').trim().slice(0,120),evidence=String(body.evidence||'').trim().slice(0,2000);
      if(by.length<2||evidence.length<10) return json({error:'Bitte Ansprechpartner und Nachweis der Übergabe bzw. Bestätigung eintragen.'},400);
      return await store.handover(body.id,body.version,body.action==='confirm',by,evidence)?json({success:true}):json({error:'Bitte erst Angaben vervollständigen und den aktuellen Status prüfen.'},409);
    }
    if(body.action==='send'&&uuid.safeParse(body.batchId).success&&body.confirm===true) {
      if(process.env.COLLAB_SEND_ENABLED!=='true') return json({error:'Der echte Versand ist noch nicht freigegeben.'},503);
      const from=process.env.COLLAB_FROM||process.env.RESEND_FROM;
      if(!process.env.RESEND_API_KEY||!from||!/@/.test(from)||!process.env.RESEND_WEBHOOK_SECRET) return json({error:'Absender, Versanddienst oder signierter Webhook noch nicht eingerichtet.'},503);
      const batch=await store.batch(body.batchId);
      if(!batch.length||batch.length>10||batch.some(r=>r.state!=='live')) return json({error:'Bitte zuerst die Kampagnenbedingungen freigeben.'},409);
      // Require the previewed campaign revision. Editing terms invalidates the send confirmation.
      if(batch.some(r=>r.campaign_version!==body.campaignVersion)) return json({error:'Die Kampagne wurde geändert. Bitte die Mailvorschau erneut prüfen.'},409);
      const resend=new Resend(process.env.RESEND_API_KEY),results=[];
      for(const row of batch) {
        const claim=await store.claimSend(row.id,body.campaignVersion);
        if(!claim) {results.push({id:row.id,status:'übersprungen'});continue;}
        try {
          const mail=invitationEmail({name:row.display_name,note:row.personal_note,content:row.content,url:invitationUrl(row.campaign_slug,row.token_encrypted,row.gender)});
          const response=await resend.emails.send({from,to:row.recipient,replyTo:row.content.contactEmail,...mail,tags:[{name:'audience',value:'collaboration'},{name:'collab_invite',value:row.id}]},{idempotencyKey:`collab-${row.id}`});
          if(response.error||!response.data?.id) {
            await store.finishSend(row.id,null);
            results.push({id:row.id,status:'Versand unklar – Versanddienst prüfen'});
          } else {
            await store.finishSend(row.id,response.data.id);
            await store.event(row.membership_id,'email_sent','admin',{providerId:response.data.id});
            results.push({id:row.id,status:'versendet'});
          }
        } catch {
          await store.finishSend(row.id,null);
          results.push({id:row.id,status:'Versand unklar – im Versanddienst prüfen, nicht erneut versenden'});
        }
      }
      return json({results});
    }
    return json({error:'Unbekannte Aktion.'},400);
  } catch(error){return apiError(error);}
}
