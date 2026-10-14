import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { z } from 'zod';
import { enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import { pageIdentity } from '@/app/lib/collaborations/page-auth';
import CollaborationShell from '@/app/components/CollaborationShell';
import MemberClient from './MemberClient';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Deine Kooperation',robots:{index:false,follow:false},referrer:'no-referrer',alternates:{canonical:null,languages:{}}};
export default async function Page({params}:{params:{id:string}}) {
  if(!enabled()||!z.uuid().safeParse(params.id).success)notFound();
  const who=pageIdentity(),m=await new CollabStore().member(params.id,who.creatorId,who.session);
  if(!m)return <CollaborationShell><h1>Bitte erneut anmelden</h1><p className="demo-lead">Deine gespeicherten Kooperationen findest du nach der Anmeldung in deinem privaten Konto.</p><a className="demo-button mt-6" href="/konto">Mit E-Mail anmelden</a></CollaborationShell>;
  return <CollaborationShell><MemberClient member={m}/></CollaborationShell>;
}
