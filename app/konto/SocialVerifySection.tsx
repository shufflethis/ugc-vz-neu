'use client';

import { FormEvent, useState } from 'react';
import { BadgeCheck, Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import type { CreatorSocialConnection } from '../lib/brand-workspace';
import type { SocialOAuthAvailability } from '../lib/social-oauth';

const fieldClass =
  'w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-geo-violet focus:ring-4 focus:ring-geo-violet/10';

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const OAUTH_STATUS_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  tiktok_ok: { ok: true, text: 'Dein TikTok-Konto wurde direkt per OAuth verbunden und verifiziert!' },
  instagram_ok: { ok: true, text: 'Dein Instagram-Konto wurde direkt per OAuth verbunden und verifiziert!' },
  tiktok_invalid: { ok: false, text: 'Die TikTok-Verbindung wurde abgebrochen oder ist abgelaufen. Bitte starte sie erneut.' },
  instagram_invalid: { ok: false, text: 'Die Instagram-Verbindung wurde abgebrochen oder ist abgelaufen. Bitte starte sie erneut.' },
  tiktok_error: { ok: false, text: 'TikTok konnte gerade nicht verbunden werden. Alternativ kannst du unten sofort den Bio-Code nutzen.' },
  instagram_error: { ok: false, text: 'Instagram konnte gerade nicht verbunden werden. Alternativ kannst du unten sofort den Bio-Code nutzen.' },
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

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
        `Verifizierungscode ${data.code} erzeugt! Füge ihn kurz in deine ${PLATFORM_NAMES[platform]}-Bio ein und klicke dann auf „Bio jetzt prüfen“.`,
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
      setNotice('Kanal erfolgreich verifiziert! Brands sehen jetzt dein Verifizierungs-Badge in Kampagnen. Du kannst den Code wieder aus deiner Bio entfernen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prüfung fehlgeschlagen.');
    } finally {
      setCheckingId(null);
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

  const supportedAccounts = accounts.filter((a) => ['instagram', 'tiktok', 'youtube'].includes(a.platform.toLowerCase()));

  return (
    <section
      id="social-verify"
      className="mb-8 rounded-3xl border border-hairline bg-white p-6 shadow-[0_24px_80px_rgba(35,22,47,0.08)] sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-geo-violet">Vertrauens-Badge für Brands</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Instagram, TikTok &amp; YouTube verifizieren</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
            Verbinde deine öffentlichen Kanäle per Bio-Code (ohne Passwort, ohne App-Zugriff)
            {(oauthEnabled.tiktok || oauthEnabled.instagram) ? ' oder direkt per OAuth-Login' : ''}. Verifizierte Kanäle erhalten das grüne <strong className="text-ink">Verifiziert-Badge</strong> im Brand-Workspace und werden schneller ausgewählt.
          </p>
        </div>
      </div>

      {oauthBanner && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            oauthBanner.ok
              ? 'border-geo-green/60 bg-[#f6fbf1] text-[#385523]'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
          role="status"
        >
          {oauthBanner.text}
        </div>
      )}

      {(oauthEnabled.tiktok || oauthEnabled.instagram) && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {oauthEnabled.tiktok && (
            <a
              href="/api/auth/tiktok/start"
              className="inline-flex items-center gap-2 rounded-xl bg-void px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-geo-violet"
            >
              Direkt mit TikTok verbinden →
            </a>
          )}
          {oauthEnabled.instagram && (
            <a
              href="/api/auth/instagram/start"
              className="inline-flex items-center gap-2 rounded-xl bg-geo-violet px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7531ae]"
            >
              Direkt mit Instagram verbinden →
            </a>
          )}
        </div>
      )}

      {supportedAccounts.length > 0 && (
        <div className="mt-5 space-y-3">
          {supportedAccounts.map((acc) => {
            const isVerified = Boolean(acc.verifiedAt);
            return (
              <div
                key={acc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface/60 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {PLATFORM_NAMES[acc.platform.toLowerCase()] || acc.platform}
                    </span>
                    <a
                      href={acc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-geo-violet hover:underline"
                    >
                      {acc.handle || acc.canonicalHandle || acc.url}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5e5] px-2.5 py-0.5 text-xs font-semibold text-[#385523]">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Verifiziert
                      </span>
                    ) : acc.verificationCode ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                        Code offen
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-ink-soft">
                        Noch nicht verifiziert
                      </span>
                    )}
                  </div>
                  {!isVerified && acc.verificationCode && (
                    <p className="mt-1.5 text-xs text-ink-soft">
                      Kurz in deine Profil-Bio einfügen:{' '}
                      <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-ink">{acc.verificationCode}</code>
                    </p>
                  )}
                </div>

                {!isVerified && acc.verificationCode && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyCode(acc.id, acc.verificationCode!)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-geo-violet"
                    >
                      {copiedId === acc.id ? <Check className="h-3.5 w-3.5 text-[#385523]" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === acc.id ? 'Kopiert' : 'Code kopieren'}
                    </button>
                    <button
                      type="button"
                      disabled={checkingId === acc.id}
                      onClick={() => checkBio(acc.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-geo-violet px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7531ae] disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${checkingId === acc.id ? 'animate-spin' : ''}`} aria-hidden="true" />
                      {checkingId === acc.id ? 'Prüfe Bio …' : 'Bio jetzt prüfen'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={startVerification} className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">Plattform</span>
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
          <span className="mb-1.5 block text-xs font-semibold text-ink">Handle oder Profil-Link</span>
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
          className="rounded-xl bg-geo-violet px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7531ae] disabled:opacity-50"
        >
          {busyStart ? 'Erzeuge Code …' : 'Code erzeugen'}
        </button>
      </form>

      {notice && (
        <div className="mt-4 rounded-xl border border-geo-green/60 bg-[#f6fbf1] px-4 py-3 text-sm text-[#385523]" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
