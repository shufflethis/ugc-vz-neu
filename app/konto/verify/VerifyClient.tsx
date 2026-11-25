'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function VerifyClient({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/creator/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Der Anmeldelink ist ungültig oder abgelaufen.');
      }
      window.location.assign(data.redirectTo || '/konto?login=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-20 text-ink">
      <div className="mx-auto max-w-md rounded-3xl border border-hairline bg-white p-8 text-center shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-geo-violet/10 text-geo-violet">
          <ShieldCheck size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Creator-Konto öffnen</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Bestätige kurz deinen Klick, damit automatische E-Mail-Scanner deinen Link nicht vorab entwerten.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {token ? (
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="mt-6 min-h-[48px] w-full rounded-xl bg-geo-violet px-6 font-semibold text-white transition hover:bg-[#7531ae] disabled:opacity-60"
          >
            {busy ? 'Anmeldung läuft …' : 'Jetzt ins Creator-Konto einloggen →'}
          </button>
        ) : (
          <p className="mt-5 text-sm text-red-700">Kein gültiger Token in der URL gefunden.</p>
        )}

        <p className="mt-5 text-xs text-ink-soft">
          <Link href="/konto" className="font-semibold text-geo-violet underline">
            Neuen 6-stelligen Code anfordern
          </Link>
        </p>
      </div>
    </div>
  );
}
