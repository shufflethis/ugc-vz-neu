import Link from 'next/link';
import '../demo/kooperationen/demo.css';
import CollaborationLogout from './CollaborationLogout';
export default function CollaborationShell({children,admin=false}:{children:React.ReactNode;admin?:boolean}) {
  return <div className="collab-demo">
    <header className="demo-header"><Link className="demo-wordmark" href="/konto/kooperationen"><strong className="gradient-text">UGC VZ</strong><span>Kooperationen</span></Link>
      <nav aria-label="Kooperationen"><Link href="/konto/kooperationen">Meine Kooperationen</Link><Link href="/konto">Mein Profil</Link>{admin?<Link href="/demo/kooperationen">Demo</Link>:<CollaborationLogout/>}</nav></header>
    <div className="demo-content" style={{paddingTop:36}}>{children}</div>
    <footer className="demo-footer"><span>UGC VZ · Persönliche Kooperationen</span><div className="flex gap-4"><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link></div></footer>
  </div>;
}
