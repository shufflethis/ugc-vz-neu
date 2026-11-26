'use client';

import { FormEvent, useState } from 'react';
import { BadgeCheck, Check, ChevronDown, Copy, ExternalLink, Link2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import type { CreatorSocialConnection } from '../lib/brand-workspace';
import type { SocialOAuthAvailability } from '../lib/social-oauth';

const fieldClass =
  'w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none transition focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10';

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const OAUTH_STATUS_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  tiktok_ok: {
    ok: true,
    text: 'TikTok erfolgreich verbunden! Dein Kanal ist verifiziert – ein Bio-Code ist nicht mehr nötig.',
  },
  instagram_ok: {
    ok: true,
    text: 'Instagram erfolgreich verbunden! Dein Kanal ist verifiziert – ein Bio-Code ist nicht mehr nötig.',
  },
  tiktok_denied: {
    ok: false,
    text: 'Du hast die TikTok-Freigabe abgebrochen. Du kannst es jederzeit erneut starten oder den Bio-Code nutzen.',
  },
  instagram_denied: {
    ok: false,
    text: 'Du hast die Instagram-Freigabe im Meta-Dialog abgebrochen. Starte die Verbindung einfach erneut oder nutze unten die Bio-Code-Alternative.',
  },
  tiktok_invalid: {
    ok: false,
    text: 'Die TikTok-Anmeldesitzung ist abgelaufen. Bitte klicke einfach noch einmal auf „Mit TikTok verbinden“.',
  },
  instagram_invalid: {
    ok: false,
    text: 'Die Instagram-Anmeldesitzung ist abgelaufen (z. B. nach längerer Pause im Meta-Dialog). Bitte klicke einfach noch einmal auf „Mit Instagram verbinden“.',
  },
  tiktok_error: {
    ok: false,
    text: 'TikTok konnte gerade nicht verbunden werden. Alternativ kannst du unten per Bio-Code verifizieren.',
  },
  instagram_error: {
    ok: false,
    text: 'Instagram konnte gerade nicht verbunden werden. Bitte prüfe die Berechtigungen im Meta-Dialog oder nutze unten die Bio-Code-Alternative.',
  },
  instagram_no_business_account: {
    ok: false,
    text: 'Es wurde kein mit deiner Facebook-Seite verknüpftes Instagram-Creator- oder Business-Konto gefunden. Bitte verknüpfe dein professionelles Instagram-Profil mit einer Facebook-Seite und versuche es erneut, oder nutze unten den Bio-Code.',
  },
};

export default function SocialVerifySection({
  initialAccounts,
  oauthEnabled = { tiktok: false, instagram: false },
  oauthStatus,
}: {
  initialAccounts: CreatorSocialConnection[];
  oauthEnabled?: SocialOAuthAvailability;
  oauthStatus?: string;
}) {
  const oauthBanner = oauthStatus ? OAUTH_STATUS_MESSAGES[oauthStatus] : null;
  const [accounts, setAccounts] = useState<CreatorSocialConnection[]>(initialAccounts);
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram');
  const [handle, setHandle] = useState('');
  const [busyStart, setBusyStart] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const hasOAuthOption = Boolean(oauthEnabled.tiktok || oauthEnabled.instagram);
  const supportedAccounts = accounts.filter((a) => ['instagram', 'tiktok', 'youtube'].includes(a.platform.toLowerCase()));
  const hasOpenBioCode = supportedAccounts.some((a) => !a.verifiedAt && Boolean(a.verificationCode));

  const startVerification = async (e: FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError('Bitte gib deinen Benutzernamen (z. B. @deinhandle) oder deine Profil-URL ein.');
      return;
    }
    setBusyStart(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/creator/social-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', platform, handle: handle.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Code konnte nicht erstellt werden.');
      setAccounts(data.accounts || []);
      setHandle('');
      setNotice(
        `Bio-Code ${data.code} erstellt! Kurz in deine ${PLATFORM_NAMES[platform]}-Bio einfügen, „Bio jetzt prüfen“ klicken und den Code danach sofort wieder löschen.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifizierung konnte nicht gestartet werden.');
    } finally {
      setBusyStart(false);
    }
  };

  const checkBio = async (accountId: string) => {
    setCheckingId(accountId);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/creator/social-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', accountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Prüfung fehlgeschlagen.');
      setAccounts(data.accounts || []);
      setNotice('Kanal verifiziert! Du kannst den Code jetzt wieder aus deiner Profil-Bio entfernen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prüfung fehlgeschlagen.');
    } finally {
      setCheckingId(null);
    }
  };

  const removeAccount = async (accountId: string) => {
    setRemovingId(accountId);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/creator/social-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', accountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Kanal konnte nicht entfernt werden.');
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kanal konnte nicht entfernt werden.');
    } finally {
      setRemovingId(null);
    }
  };

  const copyCode = async (accountId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId((curr) => (curr === accountId ? null : curr)), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  return (
    <section
      id="social-verify"
      className="mb-8 rounded-[12px] border border-[#DCE2EA] bg-white p-6 shadow-card sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#06458F]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Kanäle verbinden &amp; verifizieren
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#202124]">Instagram, TikTok &amp; YouTube</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#5C6470]">
            Du brauchst <strong className="text-[#202124]">nur einen der beiden Wege</strong>: Verbinde dein Konto per Klick (empfohlen, kein Bio-Code nötig) oder bestätige es alternativ kurz per Bio-Code.
          </p>
        </div>
      </div>

      {/* Status-Banner */}
      {oauthBanner && (
        <div
          className={`mt-4 rounded-[8px] border px-4 py-3 text-sm font-medium ${
            oauthBanner.ok
              ? 'border-[#1F9D55]/40 bg-[#EAF7EF] text-[#157347]'
              : 'border-[#F2072A]/30 bg-[#FDECEF] text-[#9E0B22]'
          }`}
          role="status"
        >
          {oauthBanner.text}
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-[8px] border border-[#1F9D55]/40 bg-[#EAF7EF] px-4 py-3 text-sm font-medium text-[#157347]" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-[8px] border border-[#F2072A]/30 bg-[#FDECEF] px-4 py-3 text-sm font-medium text-[#9E0B22]" role="alert">
          {error}
        </div>
      )}

      {/* 1. Deine gespeicherten Kanäle (dedupliziert & aufräumbar) */}
      {supportedAccounts.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5C6470]">
            Deine Kanäle ({supportedAccounts.length})
          </p>
          <div className="space-y-2.5">
            {supportedAccounts.map((acc) => {
              const isVerified = Boolean(acc.verifiedAt);
              const isOAuth = acc.verificationMethod === 'oauth';
              return (
                <div
                  key={acc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#DCE2EA] bg-[#F5F7FA] px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[6px] bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#06458F] border border-[#DCE2EA]">
                        {PLATFORM_NAMES[acc.platform.toLowerCase()] || acc.platform}
                      </span>
                      <a
                        href={acc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#202124] hover:text-[#06458F] hover:underline"
                      >
                        {acc.handle || acc.canonicalHandle || acc.url}
                        <ExternalLink className="h-3.5 w-3.5 text-[#5C6470]" aria-hidden="true" />
                      </a>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-2.5 py-0.5 text-xs font-semibold text-[#157347]">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {isOAuth ? 'Verifiziert · Auto-View-Sync aktiv' : 'Verifiziert'}
                        </span>
                      ) : acc.verificationCode ? (
                        <span className="rounded-full bg-[#EBF2FA] px-2.5 py-0.5 text-xs font-semibold text-[#06458F]">
                          Bio-Code offen
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#DCE2EA] bg-white px-2.5 py-0.5 text-xs font-medium text-[#5C6470]">
                          Noch nicht verifiziert
                        </span>
                      )}
                    </div>

                    {!isVerified && acc.verificationCode && (
                      <p className="mt-2 text-xs text-[#5C6470]">
                        Nur falls du den Bio-Code-Weg nutzt: kurz in deine Bio einfügen{' '}
                        <code className="rounded-[6px] border border-[#DCE2EA] bg-white px-2 py-0.5 font-mono font-bold text-[#06458F]">
                          {acc.verificationCode}
                        </code>{' '}
                        und danach wieder löschen.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isVerified && acc.verificationCode && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyCode(acc.id, acc.verificationCode!)}
                          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2 text-xs font-semibold text-[#202124] hover:border-[#06458F] hover:text-[#06458F]"
                        >
                          {copiedId === acc.id ? <Check className="h-3.5 w-3.5 text-[#1F9D55]" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === acc.id ? 'Kopiert' : 'Code kopieren'}
                        </button>
                        <button
                          type="button"
                          disabled={checkingId === acc.id}
                          onClick={() => checkBio(acc.id)}
                          className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#06458F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${checkingId === acc.id ? 'animate-spin' : ''}`} aria-hidden="true" />
                          {checkingId === acc.id ? 'Prüfe Bio …' : 'Bio jetzt prüfen'}
                        </button>
                      </>
                    )}
                    {!isVerified && (
                      <button
                        type="button"
                        disabled={removingId === acc.id}
                        onClick={() => removeAccount(acc.id)}
                        title="Eintrag entfernen"
                        aria-label={`Eintrag ${acc.handle || acc.platform} entfernen`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#DCE2EA] bg-white text-[#5C6470] hover:border-[#F2072A] hover:text-[#D10523] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Weg 1 (Empfohlen): Direkt per OAuth verbinden */}
      {hasOAuthOption && (
        <div className="mt-6 rounded-[10px] border border-[#06458F]/25 bg-[#EBF2FA]/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#06458F]">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Weg 1 · Empfohlen (kein Bio-Code nötig)
            </p>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#06458F] border border-[#C4D7EF]">
              Zählt Views automatisch
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[#5C6470]">
            Einmal per offizieller Schnittstelle verbinden – dein Kanal wird sofort verifiziert und deine Kampagnen-Views werden automatisch gezählt.
            {oauthEnabled.instagram ? ' Für Instagram braucht Meta ein kostenloses Creator- oder Business-Konto mit verknüpfter Facebook-Seite.' : ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {oauthEnabled.instagram && (
              <a
                href="/api/auth/instagram/start"
                className="btn-press inline-flex min-h-[42px] items-center gap-2 rounded-[8px] bg-[#06458F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#053673]"
              >
                Mit Instagram verbinden →
              </a>
            )}
            {oauthEnabled.tiktok && (
              <a
                href="/api/auth/tiktok/start"
                className="btn-press inline-flex min-h-[42px] items-center gap-2 rounded-[8px] bg-[#062A59] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#06458F]"
              >
                Mit TikTok verbinden →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. Weg 2 (Alternative): Bio-Code (klar getrennt & aufklappbar, wenn OAuth verfuegbar ist) */}
      <details
        open={!hasOAuthOption || hasOpenBioCode}
        className="group mt-5 rounded-[10px] border border-[#DCE2EA] bg-[#F5F7FA]/60"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-[#202124] [&::-webkit-details-marker]:hidden">
          <span>
            {hasOAuthOption
              ? 'Weg 2 · Alternative ohne App-Login (Bio-Code, z. B. für YouTube oder ohne Facebook-Seite)'
              : 'Kanal per Bio-Code verifizieren (ohne Passwort, ohne App-Zugriff)'}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[#5C6470] transition-transform duration-150 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t border-[#DCE2EA] px-4 pb-4 pt-3.5">
          <p className="text-xs leading-5 text-[#5C6470]">
            Nur nötig, wenn du Weg 1 nicht nutzt: Erzeuge einen kurzen Code, füge ihn 30 Sekunden in deine Profil-Bio ein, klicke auf „Bio jetzt prüfen“ und lösche ihn danach sofort wieder.
          </p>
          <form onSubmit={startVerification} className="mt-3.5 grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#202124]">Plattform</span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'instagram' | 'tiktok' | 'youtube')}
                className={fieldClass}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#202124]">Handle oder Profil-Link</span>
              <input
                type="text"
                maxLength={250}
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  if (error) setError('');
                }}
                placeholder={platform === 'tiktok' ? '@deinhandle oder https://tiktok.com/@...' : '@deinhandle oder Profil-URL'}
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              disabled={busyStart}
              className="rounded-[8px] border border-[#06458F] bg-white px-4 py-2.5 text-sm font-semibold text-[#06458F] transition hover:bg-[#06458F] hover:text-white disabled:opacity-50"
            >
              {busyStart ? 'Erzeuge Code …' : 'Bio-Code erzeugen'}
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}
