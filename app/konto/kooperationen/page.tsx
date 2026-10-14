import type { Metadata } from 'next';
import Link from 'next/link';
import { enabled } from '@/app/lib/collaborations/security';
import { CollabStore } from '@/app/lib/collaborations/store';
import { STATUS,missingDetails } from '@/app/lib/collaborations/model';
import { pageIdentity } from '@/app/lib/collaborations/page-auth';
import CollaborationShell from '@/app/components/CollaborationShell';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Meine Kooperationen',robots:{index:false,follow:false},referrer:'no-referrer',alternates:{canonical:null,languages:{}}};
export default async function Page() {
  const who=pageIdentity();
  const members=enabled()&&(who.creatorId||who.session)?await new CollabStore().members(who.creatorId,who.session):[];
  return <CollaborationShell><p className="demo-eyebrow">Dein privater Bereich</p><h1>Meine Kooperationen</h1><p className="demo-lead">Deine Einladungen, bestätigten Angaben und nächsten Schritte an einem Ort.</p>
    {!members.length?<div className="demo-note"><p>{who.creatorId?'Hier erscheinen deine persönlichen Einladungen, sobald sie versendet wurden.':'Öffne deinen persönlichen Einladungslink oder melde dich mit deiner E-Mail-Adresse an.'} <Link className="underline" href="/konto">Zum Creator-Konto</Link></p></div>:<div className="demo-value-points mb-12">{members.map(m=><article className="demo-apply-card" key={m.id}><p className="demo-eyebrow">{m.content.brand}</p><h2>{m.content.title}</h2><p className="my-4"><span className="demo-badge">{STATUS[m.status]}</span></p><p className="text-sm leading-7 text-ink-soft">{m.campaign_state!=='live'?'Die Kampagne ist aktuell pausiert. Deine Angaben bleiben gespeichert.':m.status==='accepted'?`Noch offen: ${missingDetails(m.details).join(', ')}`:m.status==='invited'?'Deine persönliche Einladung wartet auf dich.':'Deinen Status und die weiteren Schritte findest du hier.'}</p><Link className="demo-button mt-5" href={`/konto/kooperationen/${m.id}`}>{m.status==='accepted'?'Angaben ergänzen':'Kooperation öffnen'}</Link></article>)}</div>}
  </CollaborationShell>;
}
