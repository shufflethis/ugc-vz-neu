import type { CampaignContent } from '../lib/collaborations/model';
export default function CollaborationBrief({content:c,children,facts}:{content:CampaignContent;children?:React.ReactNode;facts?:[string,string][]}) {
  return <>
    <section className="demo-campaign-hero"><div><p className="demo-eyebrow">{c.brand} × UGC VZ · Deine Einladung</p><h1>{c.title}</h1><p className="demo-lead">{c.summary}</p></div>
      <aside className="demo-apply-card" id="start"><p className="demo-eyebrow">Deine Kooperation</p><h2>{c.reward}</h2>{facts&&<dl>{facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}{children}</aside></section>
    <section className="demo-value"><h2>Deine Perspektive</h2><p className="demo-value-intro whitespace-pre-line">{c.benefit}</p></section>
    <div className="demo-detail-grid"><section><h2>Deine Aufgabe</h2><p className="demo-lead whitespace-pre-line">{c.task}</p><h2 className="mt-8">Das bringst du mit</h2><p className="demo-lead whitespace-pre-line">{c.requirements}</p></section>
      <section><h2>Vergütung & Bedingungen</h2><p className="demo-lead whitespace-pre-line">{c.terms}</p></section></div>
    <div className="demo-note"><p>Dein Kontakt bei UGC VZ: <a className="underline" href={`mailto:${c.contactEmail}`}>{c.contactName}</a>. Die endgültige Aufnahme bestätigt das {c.brand}-Team.</p></div>
  </>;
}
