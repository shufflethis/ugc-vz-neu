'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Building2, CreditCard, Download, Landmark, Wallet } from 'lucide-react';
import BudgetBar from '@/app/components/motion/BudgetBar';
import {
  CARD_SURCHARGE_LABEL,
  calculatePayInSurchargeCents,
  type PayInMethod,
} from '@/app/lib/payments-ledger';

interface WalletResponse {
  success: boolean;
  stripeConfigured: boolean;
  migrationPending?: boolean;
  wallet: {
    availableCents: number;
    reservedCents: number;
    virtualIban: string | null;
    virtualBic: string | null;
    virtualBankName: string | null;
    virtualAccountHolder: string | null;
  };
  topups: Array<{
    id: string;
    amountCents: number;
    surchargeCents: number;
    surchargeLabel: string;
    totalChargedCents: number;
    method: string;
    status: string;
    invoiceNumber: string | null;
    createdAt: string;
  }>;
  reservations: Array<{
    campaignId: string;
    campaignPublicId: string;
    title: string;
    budgetCapCents: number;
    platformFeeBps: number;
    creatorPoolCapCents: number;
    reservedCents: number;
    releasedCreatorCents: number;
    releasedFeeCents: number;
    status: string;
  }>;
}

function fmtEur(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default function BrandWalletPanel() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [amountEur, setAmountEur] = useState(1000);
  // Spec 8.9: SEPA-Lastschrift & Überweisung zuerst (0 % Aufschlag), Karte danach (+3 % Kartengebühr)
  const [method, setMethod] = useState<PayInMethod>('sepa_debit');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [bankInfo, setBankInfo] = useState<{
    iban: string | null;
    bic: string | null;
    accountHolder: string | null;
    hint: string;
  } | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/brand/wallet', { cache: 'no-store' });
      const json = (await res.json()) as WalletResponse;
      if (res.ok && json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const amountCents = Math.max(0, Math.round(amountEur * 100));
  const surcharge = calculatePayInSurchargeCents(amountCents, method);

  const totalSpentCents = (data?.reservations || []).reduce(
    (sum, r) => sum + r.releasedCreatorCents + r.releasedFeeCents,
    0,
  );

  const handleTopupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    setBankInfo(null);
    try {
      const res = await fetch('/api/brand/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, method }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Aufladung konnte nicht gestartet werden.');
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      if (json.bankTransfer) {
        setBankInfo(json.bankTransfer);
        await loadWallet();
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Fehler bei der Aufladung.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[20px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
        <p className="text-sm text-[#5C6470]">Kampagnen-Wallet wird geladen...</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="brand-wallet-title"
      className="rounded-[24px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#06458F]">
            <Wallet size={14} aria-hidden="true" />
            Kampagnen-Wallet &amp; Abrechnung
          </p>
          <h2 id="brand-wallet-title" className="mt-1 font-display text-2xl font-bold text-[#202124]">
            Guthaben und Budget-Reservierungen
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowTopup((v) => !v)}
          className="btn-press inline-flex min-h-[44px] items-center rounded-full bg-[#06458F] px-5 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90"
        >
          {showTopup ? 'Aufladen schließen' : 'Guthaben aufladen'}
        </button>
      </div>

      {/* 4 Guthaben-Kacheln (Spec 8.5: Guthaben, Reservat, verbraucht, Rest) */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[16px] border border-[#DCE2EA] bg-white p-4">
          <p className="text-xs font-medium text-[#5C6470]">Verfügbares Guthaben</p>
          <p className="mt-2 inline-block rounded-md bg-[#EBF2FA] px-2 py-0.5 font-mono text-xl font-bold tabular-nums text-[#202124]">
            {fmtEur(data?.wallet.availableCents || 0)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#DCE2EA] bg-white p-4">
          <p className="text-xs font-medium text-[#5C6470]">Reserviert in Kampagnen</p>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#202124]">
            {fmtEur(data?.wallet.reservedCents || 0)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#DCE2EA] bg-white p-4">
          <p className="text-xs font-medium text-[#5C6470]">Geprüft verbraucht</p>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#202124]">
            {fmtEur(totalSpentCents)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#DCE2EA] bg-white p-4">
          <p className="text-xs font-medium text-[#5C6470]">Verwahrung</p>
          <p className="mt-2 text-sm font-semibold text-[#202124]">Stripe Connect (EUR)</p>
          <p className="mt-0.5 text-xs text-[#5C6470]">Kein Kundengeld auf Agenturkonten</p>
        </div>
      </div>

      {/* Auflade-Formular (Spec 8.9: SEPA & Überweisung zuerst mit 0 %, Karte danach mit 3 % Kartengebühr) */}
      {showTopup && (
        <form
          onSubmit={handleTopupSubmit}
          className="mt-6 rounded-[20px] border border-[#DCE2EA] bg-white p-5 shadow-card sm:p-6"
        >
          <h3 className="font-display text-lg font-bold text-[#202124]">Kampagnenguthaben aufladen</h3>
          <p className="mt-1 text-xs text-[#5C6470]">
            SEPA-Lastschrift und Überweisung per virtueller DE-IBAN sind kostenfrei (0 % Aufschlag).
          </p>

          <div className="mt-4">
            <label htmlFor="wallet-topup-eur" className="block text-sm font-semibold text-[#202124]">
              Betrag in Euro
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {[500, 1000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountEur(preset)}
                  className={`min-h-[40px] rounded-full border px-4 font-mono text-xs font-bold tabular-nums ${
                    amountEur === preset
                      ? 'border-[#06458F] bg-[#06458F] text-white'
                      : 'border-[#DCE2EA] bg-[#F5F7FA] text-[#202124]'
                  }`}
                >
                  {preset.toLocaleString('de-DE')} €
                </button>
              ))}
              <input
                id="wallet-topup-eur"
                type="number"
                min={100}
                max={50000}
                step={50}
                value={amountEur}
                onChange={(e) => setAmountEur(Number(e.target.value))}
                className="min-h-[40px] w-32 rounded-xl border border-[#DCE2EA] px-3 font-mono text-sm font-bold tabular-nums text-[#202124]"
              />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-[#202124]">Zahlungsart wählen</legend>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
              {/* 1. SEPA-Lastschrift (zuerst, 0 %) */}
              <button
                type="button"
                onClick={() => setMethod('sepa_debit')}
                aria-pressed={method === 'sepa_debit'}
                className={`rounded-[14px] border p-3.5 text-left transition-colors ${
                  method === 'sepa_debit'
                    ? 'border-[#06458F] bg-[#F5F7FA]'
                    : 'border-[#DCE2EA] bg-white hover:border-[#06458F]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Landmark size={17} aria-hidden="true" />
                  <span className="rounded-full bg-[#EBF2FA] px-2 py-0.5 text-[10px] font-bold text-[#202124]">
                    0 % Aufschlag
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#202124]">SEPA-Lastschrift</p>
                <p className="mt-0.5 text-xs text-[#5C6470]">Direkt per Bankeinzug</p>
              </button>

              {/* 2. Überweisung virtuelle DE-IBAN (zuerst, 0 %) */}
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                aria-pressed={method === 'bank_transfer'}
                className={`rounded-[14px] border p-3.5 text-left transition-colors ${
                  method === 'bank_transfer'
                    ? 'border-[#06458F] bg-[#F5F7FA]'
                    : 'border-[#DCE2EA] bg-white hover:border-[#06458F]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 size={17} aria-hidden="true" />
                  <span className="rounded-full bg-[#EBF2FA] px-2 py-0.5 text-[10px] font-bold text-[#202124]">
                    0 % Aufschlag
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#202124]">Überweisung (DE-IBAN)</p>
                <p className="mt-0.5 text-xs text-[#5C6470]">Eigene virtuelle IBAN</p>
              </button>

              {/* 3. Karte inkl. Apple Pay / Google Pay (+3 % Kartengebühr) */}
              <button
                type="button"
                onClick={() => setMethod('card')}
                aria-pressed={method === 'card'}
                className={`rounded-[14px] border p-3.5 text-left transition-colors ${
                  method === 'card'
                    ? 'border-[#06458F] bg-[#F5F7FA]'
                    : 'border-[#DCE2EA] bg-white hover:border-[#06458F]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard size={17} aria-hidden="true" />
                  <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-[#5C6470]">
                    + 3 % {CARD_SURCHARGE_LABEL}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#202124]">Karte / Apple / Google Pay</p>
                <p className="mt-0.5 text-xs text-[#5C6470]">Sofort verfügbar</p>
              </button>
            </div>
          </fieldset>

          {/* Transparente Preisvorschau vor Zahlung (Spec 8.9) */}
          <dl className="mt-5 space-y-2 rounded-2xl bg-[#F5F7FA] p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#5C6470]">Kampagnenguthaben</dt>
              <dd className="font-mono font-semibold tabular-nums text-[#202124]">{fmtEur(amountCents)}</dd>
            </div>
            {surcharge.surchargeCents > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-[#5C6470]">{CARD_SURCHARGE_LABEL} (3 %)</dt>
                <dd className="font-mono font-semibold tabular-nums text-[#202124]">
                  {fmtEur(surcharge.surchargeCents)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[#DCE2EA] pt-2">
              <dt className="font-semibold text-[#202124]">Gesamtbetrag</dt>
              <dd className="font-mono text-base font-bold tabular-nums text-[#202124]">
                {fmtEur(surcharge.totalChargedCents)}
              </dd>
            </div>
          </dl>

          {method === 'bank_transfer' && (data?.wallet.virtualIban || bankInfo?.iban) && (
            <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-[#F5F7FA] p-4 text-xs leading-6 text-[#202124]">
              <p className="font-bold">Deine virtuelle DE-IBAN:</p>
              <p className="font-mono text-sm">{bankInfo?.iban || data?.wallet.virtualIban}</p>
              {(bankInfo?.bic || data?.wallet.virtualBic) && (
                <p className="font-mono">BIC: {bankInfo?.bic || data?.wallet.virtualBic}</p>
              )}
              <p className="mt-1 font-medium text-[#5C6470]">
                Empfängername exakt wie bei Stripe hinterlegt angeben:{' '}
                <strong className="text-[#202124]">
                  {bankInfo?.accountHolder || data?.wallet.virtualAccountHolder || 'Stripe Payments Europe Ltd.'}
                </strong>
              </p>
            </div>
          )}

          {feedback && (
            <p role="alert" className="mt-3 text-sm font-medium text-[#D93025]">
              {feedback}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#5C6470]">
              Rechnung weist Servicegebühr und eventuelle Kartengebühr getrennt aus.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] hover:opacity-90 disabled:opacity-60"
            >
              {submitting
                ? 'Wird vorbereitet...'
                : method === 'bank_transfer'
                  ? 'Virtuelle IBAN anzeigen'
                  : `Jetzt ${fmtEur(surcharge.totalChargedCents)} aufladen`}
            </button>
          </div>
        </form>
      )}

      {/* Aktive Kampagnen-Reservierungen mit BudgetBar (Spec 8.10) */}
      {data && data.reservations.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-[#202124]">Budget-Status pro Kampagne</h3>
          {data.reservations.map((res) => {
            const used = res.releasedCreatorCents + res.releasedFeeCents;
            const pct = res.budgetCapCents > 0 ? Math.min(100, Math.round((used / res.budgetCapCents) * 100)) : 0;
            return (
              <div
                key={res.campaignId}
                className="rounded-[16px] border border-[#DCE2EA] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-[#202124]">{res.title}</span>
                  <span className="font-mono text-xs tabular-nums text-[#5C6470]">
                    Verbraucht {fmtEur(used)} · Rest {fmtEur(res.reservedCents)} von {fmtEur(res.budgetCapCents)}
                  </span>
                </div>
                <BudgetBar usedPercent={pct} label={`Budget ${res.title}`} className="mt-2.5" />
              </div>
            );
          })}
        </div>
      )}

      {/* Rechnungen & Aufladungen */}
      {data && data.topups.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-[#202124]">Aufladungen &amp; Rechnungen</h3>
          <div className="mt-2.5 divide-y divide-[#DCE2EA] rounded-[16px] border border-[#DCE2EA] bg-white px-4">
            {data.topups.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#202124]">
                    {t.invoiceNumber || 'Aufladung'} · {fmtEur(t.amountCents)}
                  </p>
                  <p className="text-xs text-[#5C6470]">
                    {new Date(t.createdAt).toLocaleDateString('de-DE')}
                    {t.surchargeCents > 0 ? ` · inkl. ${fmtEur(t.surchargeCents)} ${t.surchargeLabel || CARD_SURCHARGE_LABEL}` : ' · 0 % Aufschlag'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-xs font-medium text-[#202124]">
                    {t.status}
                  </span>
                  <a
                    href={`/api/brand/invoices/${t.id}/pdf`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#06458F] hover:underline"
                  >
                    <Download size={14} aria-hidden="true" />
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
