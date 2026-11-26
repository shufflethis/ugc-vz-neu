'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, FileSpreadsheet, ShieldCheck, Wallet } from 'lucide-react';
import {
  calculateCreatorPayoutPreview,
  type PayoutSpeed,
  type TaxCountry,
} from '@/app/lib/payments-ledger';

interface PayoutDashboardData {
  success: boolean;
  stripeConfigured: boolean;
  minPayoutCents: number;
  balance: {
    stripeConnectAccountId: string | null;
    stripeOnboardingStatus: 'not_started' | 'pending' | 'verified' | 'restricted';
    pendingCents: number;
    availableCents: number;
    paidOutCents: number;
  };
  taxProfile: {
    legalName: string;
    country: TaxCountry;
    smallBusiness: boolean;
    taxNumber: string;
    vatId: string;
    taxId: string;
    dateOfBirth: string | null;
    street: string;
    postalCode: string;
    city: string;
    selfBillingAgreedAt: string | null;
  } | null;
  taxValidation: { valid: boolean; missingFields: string[] };
  creditNotes: Array<{
    id: string;
    number: string;
    period: string;
    netCents: number;
    vatRateType: string;
    vatCents: number;
    grossCents: number;
    issuedAt: string;
  }>;
  settlements: Array<{
    id: string;
    campaignTitle: string;
    viewsAtCutoff: number;
    countedThousands: number;
    amountCents: number;
    status: string;
  }>;
}

const SUBMISSION_STATUS_META: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Eingereicht', className: 'bg-[#F7F6F2] text-[#5C5A55]' },
  in_review: { label: 'In Prüfung', className: 'bg-amber-50 text-amber-800' },
  counted: { label: 'Zählt', className: 'bg-[#C8F04B] text-[#121212]' },
  rejected: { label: 'Zählt nicht', className: 'bg-red-50 text-[#D93025]' },
  appealed: { label: 'Einspruch offen', className: 'bg-[#EFE8FD] text-[#6C2BD9]' },
};

function fmtEur(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default function CreatorPayoutPanel() {
  const [data, setData] = useState<PayoutDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTax, setSavingTax] = useState(false);
  const [startingStripe, setStartingStripe] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Steuer- & DAC7-Formular
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState<TaxCountry>('DE');
  const [smallBusiness, setSmallBusiness] = useState(true);
  const [taxNumber, setTaxNumber] = useState('');
  const [vatId, setVatId] = useState('');
  const [taxId, setTaxId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [agreeSelfBilling, setAgreeSelfBilling] = useState(false);

  // Auszahlung
  const [payoutSpeed, setPayoutSpeed] = useState<PayoutSpeed>('standard');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/creator/payouts', { cache: 'no-store' });
      const json = (await res.json()) as PayoutDashboardData;
      if (res.ok && json.success) {
        setData(json);
        if (json.taxProfile) {
          setLegalName(json.taxProfile.legalName);
          setCountry(json.taxProfile.country);
          setSmallBusiness(json.taxProfile.smallBusiness);
          setTaxNumber(json.taxProfile.taxNumber);
          setVatId(json.taxProfile.vatId);
          setTaxId(json.taxProfile.taxId);
          setDateOfBirth(json.taxProfile.dateOfBirth || '');
          setStreet(json.taxProfile.street);
          setPostalCode(json.taxProfile.postalCode);
          setCity(json.taxProfile.city);
          setAgreeSelfBilling(Boolean(json.taxProfile.selfBillingAgreedAt));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveTax = async (e: FormEvent) => {
    e.preventDefault();
    setSavingTax(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/creator/tax-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          country,
          smallBusiness,
          taxNumber,
          vatId,
          taxId,
          dateOfBirth,
          street,
          postalCode,
          city,
          agreeSelfBilling,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Steuerprofil konnte nicht gespeichert werden.');
      }
      setStatusMessage('Steuer- und DAC7-Daten gespeichert.');
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setSavingTax(false);
    }
  };

  const handleStartStripeOnboarding = async () => {
    setStartingStripe(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/creator/payouts/onboarding', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Stripe-Verifizierung konnte nicht gestartet werden.');
      }
      if (json.onboardingUrl) {
        window.location.href = json.onboardingUrl;
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Onboarding fehlgeschlagen.');
    } finally {
      setStartingStripe(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!data) return;
    setRequestingPayout(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/creator/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: data.balance.availableCents,
          payoutSpeed,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Auszahlung konnte nicht gestartet werden.');
      }
      setStatusMessage('Auszahlung wurde gestartet. Nach Ausführung findest du deine Gutschrift unten.');
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Auszahlung fehlgeschlagen.');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-8 rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6">
        <p className="text-sm text-[#5C5A55]">Guthaben &amp; Gutschriften werden geladen...</p>
      </section>
    );
  }

  const availableCents = data?.balance.availableCents || 0;
  const canInstant = country === 'DE' || country === 'AT';
  let preview = null;
  if (availableCents > 0) {
    try {
      preview = calculateCreatorPayoutPreview(
        availableCents,
        canInstant ? payoutSpeed : 'standard',
        country,
      );
    } catch {
      preview = null;
    }
  }

  const accountableUrl = process.env.NEXT_PUBLIC_ACCOUNTABLE_URL;

  return (
    <section
      aria-labelledby="creator-payouts-title"
      className="mb-10 rounded-[24px] border border-[#E4E1D8] bg-[#F7F6F2] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#6C2BD9]">
            <Wallet size={14} aria-hidden="true" />
            Guthaben, Auszahlung &amp; Gutschriften
          </p>
          <h2 id="creator-payouts-title" className="mt-1 font-display text-2xl font-bold text-[#121212]">
            Deine Vergütung (0 % Gebühr für Creator)
          </h2>
        </div>
        <span className="rounded-full bg-[#C8F04B] px-3 py-1 text-xs font-bold text-[#121212]">
          Der Satz gehört dir. Wir ziehen nichts ab.
        </span>
      </div>

      {/* 3 Guthaben-Kacheln */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-[#E4E1D8] bg-white p-4">
          <p className="text-xs font-medium text-[#5C5A55]">Auszahlbar</p>
          <p className="mt-2 inline-block rounded-md bg-[#C8F04B] px-2 py-0.5 font-mono text-xl font-bold tabular-nums text-[#121212]">
            {fmtEur(availableCents)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#E4E1D8] bg-white p-4">
          <p className="text-xs font-medium text-[#5C5A55]">Ausstehend / in Auszahlung</p>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#121212]">
            {fmtEur(data?.balance.pendingCents || 0)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#E4E1D8] bg-white p-4">
          <p className="text-xs font-medium text-[#5C5A55]">Bereits ausgezahlt</p>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#121212]">
            {fmtEur(data?.balance.paidOutCents || 0)}
          </p>
        </div>
      </div>

      {/* Gepruefte Beitraege mit Status-Chips (Spec 8.10 submission_status_chip) */}
      {data && data.settlements.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-[#121212]">Eingereichte Kampagnen-Beiträge</h3>
          <div className="mt-2 divide-y divide-[#E4E1D8] rounded-[16px] border border-[#E4E1D8] bg-white px-4">
            {data.settlements.map((s) => {
              const meta = SUBMISSION_STATUS_META[s.status] || SUBMISSION_STATUS_META.submitted;
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[#121212]">{s.campaignTitle}</p>
                    <p className="font-mono text-xs tabular-nums text-[#5C5A55]">
                      {s.viewsAtCutoff.toLocaleString('de-DE')} Views ({s.countedThousands} × 1.000) · {fmtEur(s.amountCents)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schritt 1: Steuer- & DAC7-Profil */}
      <form onSubmit={handleSaveTax} className="mt-6 rounded-[20px] border border-[#E4E1D8] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[#121212]">
            1. Steuerdaten &amp; DAC7 (vor erster Auszahlung)
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              data?.taxValidation.valid
                ? 'bg-[#C8F04B] text-[#121212]'
                : 'bg-[#F7F6F2] text-[#5C5A55]'
            }`}
          >
            {data?.taxValidation.valid ? 'Vollständig' : 'Noch offen'}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tax-legal-name" className="mb-1 block text-xs font-semibold text-[#121212]">
              Vollständiger Name / Firma *
            </label>
            <input
              id="tax-legal-name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tax-country" className="mb-1 block text-xs font-semibold text-[#121212]">
              Land *
            </label>
            <select
              id="tax-country"
              value={country}
              onChange={(e) => setCountry(e.target.value as TaxCountry)}
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] bg-white px-3 text-sm"
            >
              <option value="DE">Deutschland (DE)</option>
              <option value="AT">Österreich (AT · Reverse Charge)</option>
              <option value="CH">Schweiz (CH · Drittland)</option>
            </select>
          </div>
          <div>
            <label htmlFor="tax-dob" className="mb-1 block text-xs font-semibold text-[#121212]">
              Geburtsdatum (DAC7 Pflicht) *
            </label>
            <input
              id="tax-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tax-id" className="mb-1 block text-xs font-semibold text-[#121212]">
              Persönliche Steuer-ID (DAC7) *
            </label>
            <input
              id="tax-id"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="11-stellige Steuer-ID"
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tax-number" className="mb-1 block text-xs font-semibold text-[#121212]">
              Steuernummer
            </label>
            <input
              id="tax-number"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="z. B. 12/345/67890"
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tax-vat" className="mb-1 block text-xs font-semibold text-[#121212]">
              USt-IdNr. {country === 'AT' ? '(Pflicht für AT)' : '(falls vorhanden)'}
            </label>
            <input
              id="tax-vat"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder={country === 'AT' ? 'ATU12345678' : 'DE123456789'}
              className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="tax-street" className="mb-1 block text-xs font-semibold text-[#121212]">
                Straße &amp; Hausnummer *
              </label>
              <input
                id="tax-street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tax-zip" className="mb-1 block text-xs font-semibold text-[#121212]">
                PLZ *
              </label>
              <input
                id="tax-zip"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tax-city" className="mb-1 block text-xs font-semibold text-[#121212]">
                Ort *
              </label>
              <input
                id="tax-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#E4E1D8] px-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 text-xs text-[#5C5A55]">
          {country === 'DE' && (
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={smallBusiness}
                onChange={(e) => setSmallBusiness(e.target.checked)}
                className="h-4 w-4 accent-[#121212]"
              />
              <span>Kleinunternehmer gemäß § 19 UStG (kein Ausweis von 19 % Umsatzsteuer)</span>
            </label>
          )}
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreeSelfBilling}
              onChange={(e) => setAgreeSelfBilling(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#121212]"
            />
            <span>
              Ich stimme zu, dass UGC VZ (track by track GmbH) meine Vergütung im Gutschriftverfahren gemäß § 14 Abs. 2 UStG abrechnet.
            </span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={savingTax}
            className="btn-press inline-flex min-h-[44px] items-center rounded-full bg-[#121212] px-5 text-xs font-semibold text-[#F7F6F2] hover:opacity-90 disabled:opacity-60"
          >
            {savingTax ? 'Wird gespeichert...' : 'Steuerdaten speichern'}
          </button>
        </div>
      </form>

      {/* Schritt 2 & 3: Stripe Onboarding (erst bei Auszahlung!) + Auszahlungs-Vorschau */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-5">
          <h3 className="font-display text-lg font-bold text-[#121212]">
            2. Auszahlungs-Konto (Stripe Connect)
          </h3>
          <p className="mt-1.5 text-xs leading-5 text-[#5C5A55]">
            Die Verifizierung deines SEPA-Bankkontos (DE, AT, CH) läuft direkt über Stripe und wird erst vor deiner ersten Auszahlung benötigt.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#121212]">
              <ShieldCheck size={15} className="text-[#1F9D55]" aria-hidden="true" />
              Status: {data?.balance.stripeOnboardingStatus || 'not_started'}
            </span>
            <button
              type="button"
              onClick={handleStartStripeOnboarding}
              disabled={startingStripe}
              className="btn-press inline-flex min-h-[42px] items-center rounded-full border border-[#121212] px-4 text-xs font-semibold text-[#121212] hover:bg-[#F7F6F2] disabled:opacity-60"
            >
              {startingStripe ? 'Weiterleitung...' : 'Bankkonto über Stripe verifizieren'}
            </button>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-5">
          <h3 className="font-display text-lg font-bold text-[#121212]">
            3. Auszahlung anfordern
          </h3>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPayoutSpeed('standard')}
              className={`min-h-[38px] flex-1 rounded-xl border px-3 text-xs font-semibold ${
                payoutSpeed === 'standard'
                  ? 'border-[#121212] bg-[#121212] text-[#F7F6F2]'
                  : 'border-[#E4E1D8] text-[#121212]'
              }`}
            >
              Standard SEPA (0,00 €)
            </button>
            {canInstant && (
              <button
                type="button"
                onClick={() => setPayoutSpeed('instant')}
                className={`min-h-[38px] flex-1 rounded-xl border px-3 text-xs font-semibold ${
                  payoutSpeed === 'instant'
                    ? 'border-[#121212] bg-[#121212] text-[#F7F6F2]'
                    : 'border-[#E4E1D8] text-[#121212]'
                }`}
              >
                Instant Payout (1 % Stripe)
              </button>
            )}
          </div>

          <dl className="mt-4 space-y-1.5 rounded-xl bg-[#F7F6F2] p-3.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#5C5A55]">Betrag</dt>
              <dd className="font-mono font-semibold tabular-nums">{fmtEur(availableCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#5C5A55]">Plattformgebühr UGC VZ</dt>
              <dd className="font-mono font-semibold tabular-nums text-[#1F9D55]">0,00 €</dd>
            </div>
            {preview && preview.instantFeeCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#5C5A55]">Stripe Instant-Gebühr (1 %)</dt>
                <dd className="font-mono font-semibold tabular-nums">-{fmtEur(preview.instantFeeCents)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-[#E4E1D8] pt-1.5 text-sm font-bold text-[#121212]">
              <dt>Auszahlungsbetrag</dt>
              <dd className="font-mono tabular-nums">{fmtEur(preview ? preview.netPayoutCents : availableCents)}</dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={requestingPayout || availableCents < (data?.minPayoutCents || 2500)}
            onClick={handleRequestPayout}
            className="btn-press mt-4 min-h-[44px] w-full rounded-full bg-[#121212] px-5 text-xs font-semibold text-[#F7F6F2] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requestingPayout
              ? 'Auszahlung wird gestartet...'
              : availableCents < (data?.minPayoutCents || 2500)
                ? `Ab ${fmtEur(data?.minPayoutCents || 2500)} auszahlbar`
                : 'Auszahlung jetzt anfordern'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <p role="status" className="mt-4 text-sm font-medium text-[#1F9D55]">
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-4 text-sm font-medium text-[#D93025]">
          {errorMessage}
        </p>
      )}

      {/* Gutschriften (PDF + ZUGFeRD) & CSV Steuerexport */}
      <div className="mt-6 rounded-[20px] border border-[#E4E1D8] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#121212]">
              Gutschriften (PDF &amp; ZUGFeRD)
            </h3>
            <p className="text-xs text-[#5C5A55]">
              Nach jeder Auszahlung findest du hier deine steuerkonforme Gutschrift ohne Gebührenabzug.
            </p>
          </div>
          <a
            href="/api/creator/credit-notes?format=csv"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#E4E1D8] px-3.5 text-xs font-semibold text-[#121212] hover:border-[#121212]"
          >
            <FileSpreadsheet size={14} aria-hidden="true" />
            CSV-Steuerexport
          </a>
        </div>

        {data && data.creditNotes.length > 0 ? (
          <div className="mt-4 divide-y divide-[#E4E1D8]">
            {data.creditNotes.map((note) => (
              <div key={note.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-mono font-bold text-[#121212]">{note.number}</p>
                  <p className="text-xs text-[#5C5A55]">
                    Zeitraum {note.period} · Brutto {fmtEur(note.grossCents)}
                  </p>
                </div>
                <a
                  href={`/api/creator/credit-notes/${note.id}/pdf`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C2BD9] hover:underline"
                >
                  <Download size={14} aria-hidden="true" />
                  PDF + ZUGFeRD
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[#5C5A55]">
            Noch keine Gutschriften vorhanden. Nach deiner ersten Auszahlung erscheinen sie automatisch hier.
          </p>
        )}

        {accountableUrl && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4E1D8] bg-[#F7F6F2] p-3.5 text-xs">
            <p className="text-[#5C5A55]">
              <strong className="text-[#121212]">Steuern erledigen:</strong> Importiere deine UGC VZ Gutschriften direkt in deine Buchhaltung.
            </p>
            <a
              href={accountableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#121212] underline"
            >
              <span>Zu Accountable</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
