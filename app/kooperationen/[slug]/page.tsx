import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import CollaborationShell from '@/app/components/CollaborationShell';
import CollaborationBrief from '@/app/components/CollaborationBrief';
import InviteAction from './InviteAction';
import FomoBriefing, { fomoVariant } from '@/app/components/FomoBriefing';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Deine Creator-Kooperation',robots:{index:false,follow:false},alternates:{canonical:null,languages:{}},referrer:'no-referrer'};
export default async function Page({params,searchParams}:{params:{slug:string};searchParams:{fuer?:string}}) {
  if(!enabled())notFound();
  const c=await new CollabStore().campaign(params.slug);
  if(!c||c.state!=='live')notFound();
  return <CollaborationShell><CollaborationBrief content={c.content} briefing={c.slug==='fomo'?<FomoBriefing variant={fomoVariant(searchParams.fuer)} contactName={c.content.contactName} contactEmail={c.content.contactEmail}/>:undefined}><InviteAction slug={c.slug}/></CollaborationBrief></CollaborationShell>;
}
