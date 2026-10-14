import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { z } from 'zod';
import { enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import { pageIdentity } from '@/app/lib/collaborations/page-auth';
import { normalizeGenderValue } from '@/app/lib/normalize-gender';
import { resolveVariant } from '@/app/lib/collaborations/fomo-config';
import CollaborationShell from '@/app/components/CollaborationShell';
import FomoBriefing from '@/app/components/FomoBriefing';
import MemberClient, { DecisionButtons } from './MemberClient';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Deine Kooperation',robots:{index:false,follow:false},referrer:'no-referrer',alternates:{canonical:null,languages:{}}};
export default async function Page({params,searchParams}:{params:{id:string};searchParams:{v?:string}}) {
  if(!enabled()||!z.uuid().safeParse(params.id).success)notFound();
  const who=pageIdentity(),store=new CollabStore(),found=await store.member(params.id,who.creatorId,who.session);
  if(!found)return <CollaborationShell><h1>Dieser Einladungslink ist abgelaufen.</h1><p className="demo-lead">Schreib uns kurz, dann schicken wir dir einen neuen. Gespeicherte Kooperationen findest du nach der Anmeldung in deinem Konto.</p><div className="demo-actions mt-6"><a className="demo-button" href="mailto:florian.runge@ugc-vz.de?subject=Neuer%20Einladungslink">Neuen Link anfordern</a><a className="demo-button secondary" href="/konto">Mit E-Mail anmelden</a></div></CollaborationShell>;
  // Variante serverseitig; das Geschlecht verlässt den Server nicht (kein Feld im Client-Payload).
  const {gender,...m}=found,{variant,source}=resolveVariant(searchParams.v,normalizeGenderValue(gender??undefined));
  if(m.status==='invited')await store.event(m.id,'page_view','creator',{variant,variant_source:source}).catch(()=>{});
  const briefing=m.campaign_slug==='fomo'?<FomoBriefing variant={variant} contactName={m.content.contactName} contactEmail={m.content.contactEmail} memberId={m.id} cta={<DecisionButtons memberId={m.id} variant={variant} variantSource={source}/>}/>:undefined;
  return <CollaborationShell contactEmail={m.content.contactEmail}><MemberClient member={m} variant={variant} variantSource={source} briefing={briefing}/></CollaborationShell>;
}
