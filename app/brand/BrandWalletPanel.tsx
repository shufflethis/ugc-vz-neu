'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Landmark,
  Mail,
  PhoneCall,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import BudgetBar from '@/app/components/motion/BudgetBar';
import {
  CARD_SURCHARGE_LABEL,
  calculatePayInSurchargeCents,
  type PayInMethod,
} from '@/app/lib/payments-ledger';
import {
  INDUSTRY_CATEGORIES,
  INDUSTRY_CATEGORY_LIST,
  type BrandBillingTier,
  type BrandComplianceStatus,
  type IndustryCategory,
  type PreferredHighRiskPsp,
} from '@/app/lib/high-risk-compliance';

interface WalletResponse {
  success: boolean;
  stripeConfigured: boolean;
  migrationPending?: boolean;
  billingProfile?: {
    industryCategory: IndustryCategory;
    billingTier: BrandBillingTier;
    complianceStatus: BrandComplianceStatus;
    highRiskFeeBps: number;
    website?: string;
    latestComplianceRequest?: {
      id: string;
      industryCategory: string;
      preferredContact: string;
      preferredPsp: string;
      status: string;
      createdAt: string;
    } | null;
  };
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

const HIGH_RISK_CATEGORIES = INDUSTRY_CATEGORY_LIST.filter((c) => c.isHighRisk);

export default function BrandWalletPanel() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [showHighRiskForm, setShowHighRiskForm] = useState(false);
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

  // High-Risk / Sonderbranche Compliance-Formular
  const [hrCategory, setHrCategory] = useState<IndustryCategory>('crypto_web3');
  const [hrContact, setHrContact] = useState<'call' | 'email'>('call');
  const [hrPhoneOrHandle, setHrPhoneOrHandle] = useState('');
  const [hrPreferredPsp, setHrPreferredPsp] = useState<PreferredHighRiskPsp>('invoice_sepa');
  const [hrBudgetEur, setHrBudgetEur] = useState('2500');
  const [hrWebsite, setHrWebsite] = useState('');
  const [hrMessage, setHrMessage] = useState('');
  const [hrSubmitting, setHrSubmitting] = useState(false);
  const [hrSuccess, setHrSuccess] = useState('');
  const [hrError, setHrError] = useState('');

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/brand/wallet', { cache: 'no-store' });
      const json = (await res.json()) as WalletResponse;
      if (res.ok && json.success) {
        setData(json);
        if (json.billingProfile) {
          if (json.billingProfile.industryCategory && json.billingProfile.industryCategory !== 'standard') {
            setHrCategory(json.billingProfile.industryCategory);
          }
          if (json.billingProfile.website) {
            setHrWebsite((prev) => prev || json.billingProfile?.website || '');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const billingProfile = data?.billingProfile;
  const isHighRiskBrand = billingProfile?.billingTier === 'high_risk_custom';
  const activeIndustryMeta =
    INDUSTRY_CATEGORIES[billingProfile?.industryCategory || 'standard'] || INDUSTRY_CATEGORIES.standard;
  const activeHighRiskFeePct = Math.round(
    (billingProfile?.highRiskFeeBps || activeIndustryMeta.defaultFeeBps || 2200) / 100,
  );
  const selectedHrMeta = INDUSTRY_CATEGORIES[hrCategory] || INDUSTRY_CATEGORIES.other_high_risk;

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
        if (json.code === 'high_risk_stripe_blocked') {
          setShowTopup(false);
          setShowHighRiskForm(true);
        }
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

  const handleHighRiskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHrSubmitting(true);
    setHrError('');
    setHrSuccess('');
    try {
      const res = await fetch('/api/brand/compliance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryCategory: hrCategory,
          preferredContact: hrContact,
          phoneOrHandle: hrPhoneOrHandle.trim(),
          preferredPsp: hrPreferredPsp,
          estimatedMonthlyBudgetEur: hrBudgetEur ? Number(hrBudgetEur) : null,
          websiteUrl: hrWebsite.trim(),
          message: hrMessage.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Anfrage konnte nicht gesendet werden.');
      }
      setHrSuccess(json.message || 'Anfrage eingegangen! Wir melden uns kurzfristig.');
      setHrMessage('');
      await loadWallet();
    } catch (err) {
      setHrError(err instanceof Error ? err.message : 'Fehler beim Senden der Anfrage.');
    } finally {
      setHrSubmitting(false);
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
        {isHighRiskBrand ? (
          <button
            type="button"
            onClick={() => setShowHighRiskForm((v) => !v)}
            className="btn-press inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F2072A] px-5 text-sm font-semibold text-white hover:bg-[#D10523]"
          >
            <ShieldAlert size={15} aria-hidden="true" />
            {showHighRiskForm ? 'Anfrage schließen' : 'Sonderabrechnung / Call anfragen'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowHighRiskForm(false);
              setShowTopup((v) => !v);
            }}
            className="btn-press inline-flex min-h-[44px] items-center rounded-full bg-[#06458F] px-5 text-sm font-semibold text-white hover:bg-[#053673]"
          >
            {showTopup ? 'Aufladen schließen' : 'Guthaben aufladen'}
          </button>
        )}
      </div>

      {/* High-Risk / Stripe-Restricted Schutz-Banner */}
      {isHighRiskBrand && (
        <div className="mt-5 rounded-[18px] border border-[#F2072A]/35 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F2072A]/10 px-2.5 py-0.5 text-[#D10523]">
                  <ShieldAlert size={13} aria-hidden="true" />
                  Sonderbranche / High-Risk ({activeIndustryMeta.shortLabel})
                </span>
                <span className="rounded-full bg-[#06458F]/10 px-2.5 py-0.5 text-[#06458F]">
                  {activeHighRiskFeePct} % Servicegebühr · Creator 0 %
                </span>
                {billingProfile?.complianceStatus === 'custom_psp_active' && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800">
                    Sonder-Zahlungsweg aktiv
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-[#202124]">
                Stripe akzeptiert Zahlungen für <strong>{activeIndustryMeta.shortLabel}</strong> nicht regulär. Um Kontosperren zu vermeiden, ist das Standard-Stripe-Checkout für dein Konto deaktiviert.
              </p>
              <p className="mt-1 text-xs leading-5 text-[#5C6470]">
                Wir wickeln dein Kampagnenguthaben stattdessen sicher über <strong>SEPA-Vorkasse (Rechnung)</strong>, einen <strong>High-Risk-PSP</strong> oder <strong>USDC/Sonder-Settlement</strong> ab (inkl. transparenter {activeHighRiskFeePct} % High-Risk-Servicegebühr statt 15 % Standard). Starte unten einen kurzen Call oder E-Mail-Check – nach Zahlungseingang schalten wir dein Guthaben sofort im Wallet frei.
              </p>
            </div>
          </div>

          {billingProfile?.latestComplianceRequest && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#202124]">
              <CheckCircle2 size={14} className="text-emerald-700" aria-hidden="true" />
              <span>
                Deine Anfrage vom{' '}
                <strong>{new Date(billingProfile.latestComplianceRequest.createdAt).toLocaleDateString('de-DE')}</strong>{' '}
                (Kontakt: {billingProfile.latestComplianceRequest.preferredContact === 'call' ? 'Call' : 'E-Mail'}) ist bei unserem Team eingegangen.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4 Guthaben-Kacheln */}
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
          <p className="text-xs font-medium text-[#5C6470]">Abrechnungsweg</p>
          <p className="mt-2 text-sm font-semibold text-[#202124]">
            {isHighRiskBrand ? `High-Risk / Sonder-PSP (${activeHighRiskFeePct} %)` : 'Stripe Connect (EUR)'}
          </p>
          <p className="mt-0.5 text-xs text-[#5C6470]">
            {isHighRiskBrand ? 'Vorkasse / Sonder-PSP / USDC' : 'Kein Kundengeld auf Agenturkonten'}
          </p>
        </div>
      </div>

      {/* High-Risk Compliance & Call/E-Mail Anfrageformular */}
      {(showHighRiskForm || (isHighRiskBrand && !billingProfile?.latestComplianceRequest)) && (
        <form
          onSubmit={handleHighRiskSubmit}
          className="mt-6 space-y-4 rounded-[20px] border border-[#06458F]/25 bg-white p-5 shadow-card sm:p-6"
        >
          <div>
            <h3 className="font-display text-lg font-bold text-[#202124]">
              Sonderbranche anmelden &amp; Abrechnung freischalten
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#5C6470]">
              Für Krypto/Web3 (z. B. Trading-Apps), Peptide/Supplements, CBD oder iGaming richten wir nach einem kurzen Compliance-Check deinen passenden Zahlungsweg ein.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Sonderbranche *</span>
              <select
                value={hrCategory}
                onChange={(e) => setHrCategory(e.target.value as IndustryCategory)}
                className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2.5 text-xs font-semibold text-[#202124]"
              >
                {HIGH_RISK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.shortLabel} ({Math.round(cat.defaultFeeBps / 100)} % Servicegebühr)
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Bevorzugter Zahlungsweg *</span>
              <select
                value={hrPreferredPsp}
                onChange={(e) => setHrPreferredPsp(e.target.value as PreferredHighRiskPsp)}
                className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2.5 text-xs font-semibold text-[#202124]"
              >
                <option value="invoice_sepa">SEPA-Vorkasse auf Rechnung (schnellster Start)</option>
                <option value="high_risk_psp">High-Risk-PSP (Karte / SEPA Sonderanbieter)</option>
                <option value="crypto_usdc">Stablecoin / USDC-Settlement (Krypto-Partner)</option>
              </select>
            </label>

            <div>
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Wie sollen wir dich kontaktieren?</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHrContact('call')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    hrContact === 'call'
                      ? 'border-[#06458F] bg-[#06458F] text-white'
                      : 'border-[#DCE2EA] bg-[#F5F7FA] text-[#202124]'
                  }`}
                >
                  <PhoneCall size={13} /> Kurzer Call (15 Min)
                </button>
                <button
                  type="button"
                  onClick={() => setHrContact('email')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    hrContact === 'email'
                      ? 'border-[#06458F] bg-[#06458F] text-white'
                      : 'border-[#DCE2EA] bg-[#F5F7FA] text-[#202124]'
                  }`}
                >
                  <Mail size={13} /> Per E-Mail
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">
                {hrContact === 'call' ? 'Telefon / Telegram / Terminwunsch' : 'Ansprechpartner / Rückfragen'}
              </span>
              <input
                type="text"
                maxLength={120}
                value={hrPhoneOrHandle}
                onChange={(e) => setHrPhoneOrHandle(e.target.value)}
                placeholder={hrContact === 'call' ? 'z. B. +49 170 ... oder @telegram' : 'z. B. bitte Konditionen per Mail'}
                className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Website / Shop-URL</span>
              <input
                type="text"
                maxLength={300}
                value={hrWebsite}
                onChange={(e) => setHrWebsite(e.target.value)}
                placeholder="https://deinemarke.de"
                className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#202124]">Geplantes Monatsbudget (€)</span>
              <input
                type="number"
                min={500}
                max={1000000}
                value={hrBudgetEur}
                onChange={(e) => setHrBudgetEur(e.target.value)}
                placeholder="z. B. 2500"
                className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#202124]">Kurze Produkt- &amp; Kampagnenbeschreibung</span>
            <textarea
              rows={2}
              maxLength={1500}
              value={hrMessage}
              onChange={(e) => setHrMessage(e.target.value)}
              placeholder="z. B. Topische Skincare mit Peptiden (EU-Kosmetik) oder Krypto-App · 4 Core-Creator auf Retainer + 20 % Affiliate"
              className="w-full rounded-lg border border-[#DCE2EA] bg-white px-3 py-2 text-xs text-[#202124]"
            />
          </label>

          <div className="rounded-lg bg-[#F5F7FA] px-3.5 py-2.5 text-xs text-[#5C6470]">
            <strong className="text-[#202124]">Transparente Kondition ({selectedHrMeta.shortLabel}):</strong>{' '}
            {Math.round(selectedHrMeta.defaultFeeBps / 100)} % Servicegebühr inkl. Compliance &amp; Sonder-Abwicklung (statt 15 % Standard). Creator zahlen weiterhin 0 %.
          </div>

          {hrSuccess && (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
              {hrSuccess}
            </p>
          )}
          {hrError && (
            <p role="alert" className="text-xs font-semibold text-[#D10523]">
              {hrError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isHighRiskBrand && (
              <button
                type="button"
                onClick={() => setShowHighRiskForm(false)}
                className="rounded-lg border border-[#DCE2EA] px-4 py-2 text-xs font-semibold text-[#5C6470]"
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              disabled={hrSubmitting}
              className="inline-flex min-h-[42px] items-center rounded-lg bg-[#06458F] px-5 text-xs font-bold text-white hover:bg-[#053673] disabled:opacity-50"
            >
              {hrSubmitting
                ? 'Wird gesendet ...'
                : hrContact === 'call'
                  ? 'Compliance-Call & Abrechnung anfragen'
                  : 'Konditionen & Rechnung per E-Mail anfragen'}
            </button>
          </div>
        </form>
      )}

      {/* Standard Stripe Auflade-Formular (nur fuer Standard-Brands) */}
      {!isHighRiskBrand && showTopup && (
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
            <p role="alert" className="mt-3 text-sm font-medium text-[#D10523]">
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
              className="btn-press inline-flex min-h-[48px] items-center rounded-full bg-[#06458F] px-6 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-60"
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

      {/* Hinweis fuer Sonderbranchen auch bei Standard-Konto */}
      {!isHighRiskBrand && !showHighRiskForm && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6470]">
          <span>
            Branche Krypto / Web3, Peptide / Supplements, CBD oder iGaming (Stripe-Restricted)?
          </span>
          <button
            type="button"
            onClick={() => {
              setShowTopup(false);
              setShowHighRiskForm(true);
            }}
            className="font-semibold text-[#06458F] underline underline-offset-2 hover:text-[#D10523]"
          >
            Sonderabrechnung &amp; Compliance-Check anfragen →
          </button>
        </div>
      )}

      {/* Aktive Kampagnen-Reservierungen mit BudgetBar */}
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
