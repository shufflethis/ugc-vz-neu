import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import { FOMO } from '@/app/lib/collaborations/fomo-config';
import CollaborationShell from '@/app/components/CollaborationShell';
import CollaborationBrief from '@/app/components/CollaborationBrief';
import InviteAction from './InviteAction';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Deine Creator-Kooperation',robots:{index:false,follow:false},alternates:{canonical:null,languages:{}},referrer:'no-referrer'};
// Oberer, für alle gleicher Teil. Das variantenabhängige Briefing folgt erst nach dem Einlösen des Links (Konto-Seite).
const fomoFacts:[string,string][]=[['Fixum',FOMO.fixumRange],['Provision','25 % bis 50 %, lebenslang'],['Umfang','1 Video pro Tag, auf TikTok, Instagram und Facebook'],['Einstieg','Testphase mit 15 Posts'],['Begleitung','UGC VZ → fomo']];
export default async function Page({params}:{params:{slug:string}}) {
  if(!enabled())notFound();
  const c=await new CollabStore().campaign(params.slug);
  if(!c||c.state!=='live')notFound();
  return <CollaborationShell contactEmail={c.content.contactEmail}><CollaborationBrief content={c.content} facts={c.slug==='fomo'?fomoFacts:undefined}><InviteAction slug={c.slug}/></CollaborationBrief></CollaborationShell>;
}
