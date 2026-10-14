'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CONSENT_TEXT,STATUS,missingDetails,type Member,type Details } from '@/app/lib/collaborations/model';
export default function MemberClient({member:m}:{member:Member}) {
  const [details,setDetails]=useState<Details>({name:m.details.name??m.name,language:m.details.language||'',availability:m.details.availability||'',socialUrl:m.details.socialUrl??m.social_url??'',discord:m.details.discord||''});
  const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const c=m.terms_snapshot||m.content,missing=missingDetails(details);
  const editable=['invited','accepted','ready'].includes(m.status)&&m.campaign_state==='live';
  const update=(key:keyof Details,value:string)=>setDetails(d=>({...d,[key]:value}));
  async function save(action:'accept'|'save'|'decline') {
    if(action==='decline'&&!window.confirm('Diese Kooperation absagen?'))return;
    setBusy(true);setError('');
    try {const response=await fetch('/api/collaborations/member',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:m.id,version:m.version,campaignVersion:m.campaign_version,action,consent,details})});const result=await response.json();if(!response.ok)throw new Error(result.error);window.location.reload();}
    catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');setBusy(false);}
  }
  return <>
    <Link href="/konto/kooperationen" className="demo-back">← Meine Kooperationen</Link>
    <p className="demo-eyebrow">{c.brand} × UGC VZ</p><h1>{m.status==='invited'?'Deine Einladung. Dein nächster Schritt.':`Deine Kooperation mit ${c.brand}`}</h1>
    <p className="demo-lead">Hallo {details.name.split(' ')[0]||'Creator'}, hier kannst du deine Angaben ergänzen und jederzeit weitermachen.</p>
    <div className="demo-note"><p><strong>{STATUS[m.status]}</strong><br/>{m.status==='invited'?'Bestätige, ob du dabei sein möchtest. Die endgültige Aufnahme entscheidet das Markenteam.':m.status==='accepted'?`Noch offen: ${missingDetails(m.details).join(', ')}.`:m.status==='ready'?`${c.contactName} bereitet die Übergabe vor. Du musst deine Angaben nicht erneut einreichen.`:m.status==='handed_over'?'Deine Angaben wurden übergeben. Die Bestätigung des Markenteams steht noch aus.':m.status==='confirmed'?`Aufnahme bestätigt durch ${m.confirmed_by}. Dein Kundenguide begleitet die nächsten Schritte.`:'Du hast diese Kooperation abgesagt.'}{m.campaign_state!=='live'&&<><br/>Die Kampagne ist pausiert. Deine gespeicherten Angaben bleiben erhalten.</>}</p></div>
    <div className="demo-form-layout"><section className="demo-form-card">
      <h2>Deine Angaben</h2><p>Bereits vorhandene Daten sind übernommen. Du kannst fehlende Angaben auch später ergänzen.</p>
      <form onSubmit={e=>{e.preventDefault();save(m.status==='invited'?'accept':'save');}}>
        <label>Name<input value={details.name} maxLength={120} disabled={!editable} onChange={e=>update('name',e.target.value)}/></label>
        <label>E-Mail<input value={m.email} disabled readOnly/></label>
        <label>Social-Profil<input type="url" pattern="https://.*" value={details.socialUrl} maxLength={500} disabled={!editable} onChange={e=>update('socialUrl',e.target.value)}/></label>
        <label>Posting-Sprache<select value={details.language} disabled={!editable} onChange={e=>update('language',e.target.value)}><option value="">Später ergänzen</option><option>Deutsch</option><option>Englisch</option><option>Deutsch und Englisch</option></select></label>
        <label>Ab wann bist du verfügbar?<input value={details.availability} placeholder="Zum Beispiel: ab 1. November" maxLength={160} disabled={!editable} onChange={e=>update('availability',e.target.value)}/></label>
        <label>Discord-Name (optional)<input value={details.discord} maxLength={120} disabled={!editable} onChange={e=>update('discord',e.target.value)}/></label>
        {m.status==='invited'&&<label className="demo-checkbox"><input type="checkbox" required checked={consent} disabled={!editable} onChange={e=>setConsent(e.target.checked)}/><span>{CONSENT_TEXT} <Link href="/datenschutz" className="underline">Datenschutzhinweise</Link></span></label>}
        {editable&&<><p>{missing.length?`Du kannst jetzt bestätigen und ${missing.join(', ')} später ergänzen.`:'Alle Angaben für die Vorbereitung deiner Übergabe sind vollständig.'}</p><div className="demo-actions"><button className="demo-button" disabled={busy}>{busy?'Wird gespeichert …':m.status==='invited'?'Einladung annehmen & speichern':'Änderungen speichern'}</button><button type="button" className="demo-button secondary" onClick={()=>save('decline')} disabled={busy}>Kooperation absagen</button></div></>}
        {error&&<p role="alert" className="demo-error">{error}</p>}
      </form>
    </section><aside><h2>Deine Vereinbarung im Überblick</h2><p className="demo-lead whitespace-pre-line">{c.terms}</p><p className="demo-lead">Kontakt: <a className="underline" href={`mailto:${c.contactEmail}`}>{c.contactName}</a></p>
      {m.accepted_at&&m.status!=='declined'&&<><div className="demo-note"><p>Deine Vermittlungs-ID: <strong className="break-all">{m.id}</strong><br/>Bei der Übergabe bitte „UGC VZ / {c.contactName}“ und diese ID angeben. Erst die dokumentierte Aufnahme durch {c.brand} zählt als bestätigte Übergabe.</p></div><a className="demo-button" href={c.guideUrl} target="_blank" rel="noopener noreferrer">Kundenguide öffnen ↗</a></>}
      <p className="demo-caption">Profiländerungen außerhalb dieser Kooperation kannst du nach Anmeldung im <Link className="underline" href="/konto">Creator-Konto</Link> vornehmen.</p>
    </aside></div>
  </>;
}
