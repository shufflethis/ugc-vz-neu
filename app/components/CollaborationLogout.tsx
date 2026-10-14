'use client';
import {useState} from 'react';
export default function CollaborationLogout(){const[error,setError]=useState('');return <><button type="button" onClick={async()=>{try{const r=await fetch('/api/collaborations/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw new Error();window.location.assign('/konto');}catch{setError('Abmelden fehlgeschlagen. Bitte erneut versuchen.');}}}>Abmelden</button>{error&&<span role="alert">{error}</span>}</>;}
