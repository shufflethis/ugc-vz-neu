import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { adminAuthorized } from '@/app/lib/collaborations/http';
import { enabled } from '@/app/lib/collaborations/security';
import CollaborationShell from '@/app/components/CollaborationShell';
import AdminClient from './AdminClient';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Kooperationen verwalten',robots:{index:false,follow:false},referrer:'no-referrer',alternates:{canonical:null,languages:{}}};
export default async function Page() {
  if(!await adminAuthorized(headers().get('authorization')))notFound();
  return <CollaborationShell admin>{enabled()?<AdminClient/>:<><h1>Kooperationen vorbereiten</h1><p className="demo-lead">Die Datenbank und der interne Zugang werden eingerichtet. Die geschützte Demo bleibt verfügbar.</p></>}</CollaborationShell>;
}
