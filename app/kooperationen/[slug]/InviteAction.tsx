'use client';
import { useEffect,useState } from 'react';
export default function InviteAction({slug}:{slug:string}) {
  const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{const value=new URLSearchParams(window.location.hash.slice(1)).get('einladung')||'';if(value){setToken(value);window.history.replaceState(null,'',window.location.pathname+window.location.search);}},[]);
  async function open() {
    setBusy(true);setError('');
    try {const response=await fetch('/api/collaborations/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,token})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.url);}
    catch(e){setError(e instanceof Error?e.message:'Bitte erneut versuchen.');setBusy(false);}
  }
  return <div className="demo-actions">{token?<button type="button" className="demo-button" onClick={open} disabled={busy}>{busy?'Einladung wird geöffnet …':'Weiter zum Start'}</button>:<a className="demo-button" href="/konto/kooperationen">In meinem Konto fortsetzen</a>}
    <p className="text-sm leading-7 text-ink-soft">Prüfe deine vorhandenen Angaben und bestätige, ob du dabei sein möchtest. Dein persönlicher Link ist 14 Tage gültig.</p>
    {error&&<p role="alert" className="demo-error">{error} <a className="underline" href="/konto/kooperationen">Zum Konto</a></p>}</div>;
}
