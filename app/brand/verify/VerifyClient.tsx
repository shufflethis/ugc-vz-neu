'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function VerifyClient({ token }: { token: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    if (!token) {
      setError('Der Anmeldelink ist unvollständig. Bitte fordere einen neuen Link an.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/brand/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Anmeldung fehlgeschlagen.');
      window.location.href = data.redirectTo || '/brand';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-20 text-ink sm:px-8">
      <div className="mx-auto max-w-md rounded-3xl border border-hairline bg-white p-8 text-center shadow-[0_24px_80px_rgba(35,22,47,0.10)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-geo-violet/10 text-geo-violet">
          <ShieldCheck size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Brand-Workspace öffnen</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Bestätige deine Anmeldung mit einem Klick. Dieser Zwischenschritt schützt deinen Link vor automatischen Mail-Scannern.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={submitting || !token}
          className="mt-6 min-h-[48px] w-full rounded-xl bg-geo-violet px-6 font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
        >
          {submitting ? 'Wird geöffnet …' : 'Anmeldung bestätigen & öffnen →'}
        </button>

        <p className="mt-4 text-xs text-ink-soft">
          Link abgelaufen?{' '}
          <Link href="/brand" className="font-semibold text-geo-violet underline">Neuen Link anfordern</Link>
        </p>
      </div>
    </div>
  );
}
