'use client';

import { useState, useEffect } from 'react';
import { BriefcaseBusiness, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import CreatorAvatar from './CreatorAvatar';
import OtpInput from './auth/OtpInput';
import { trackUGCEvents } from '../lib/analytics';

interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  gender?: string;
}

type PopupCompensationModel = 'fixed' | 'tkp' | 'hybrid' | 'affiliate';

interface CreatorSelectionPopupProps {
  selectedCreators: string[];
  creators: Creator[];
  isVisible: boolean;
  onClose: () => void;
  searchQuery?: string;
  demoMode?: boolean;
  /** Legacy prop kept optional for caller compatibility; all brand requests now route through the SaaS workspace. */
  onSubmit?: (clientInfo: {
    name: string;
    email: string;
    message: string;
    website: string;
    compensation: string;
    budget: string;
    deadline: string;
    usageRights: string;
    submissionId: string;
  }) => Promise<{ heldForReview?: boolean } | void>;
}

export default function CreatorSelectionPopup({
  selectedCreators,
  creators,
  isVisible,
  onClose,
  searchQuery = '',
  demoMode = false,
}: CreatorSelectionPopupProps) {
  const [campaignData, setCampaignData] = useState({
    title: '',
    company: '',
    name: '',
    email: '',
    website: '',
    visibility: 'open' as 'open' | 'invite_only',
    compensationModel: 'fixed' as PopupCompensationModel,
    budgetPerVideoEur: '200',
    tkpEur: '2.00',
    totalBudgetEur: '600',
    affiliateEnabled: false,
    affiliatePercent: '10',
    affiliateTargetUrl: '',
    deliverables: '2x UGC-Video (9:16, 30 Sek.)',
    usageRights: '12 Monate Paid Ads & Organisch',
    deadline: 'In 14 Tagen',
    message: '',
  });
  const [campaignCreated, setCampaignCreated] = useState<{
    publicId: string;
    invitedCount: number;
    email: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [campaignError, setCampaignError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setShowForm(false);
      setIsMinimized(true);
      setCampaignCreated(null);
      setCampaignError('');
      setOtpCode('');
      setOtpError('');
    }
  }, [isVisible]);

  useEffect(() => {
    const suggested = searchQuery.trim().slice(0, 90);
    if (suggested) {
      setCampaignData((prev) => (prev.title ? prev : { ...prev, title: suggested }));
    }
  }, [searchQuery]);

  const selectedCreatorDetails = creators.filter((creator) =>
    selectedCreators.includes(creator.id),
  );

  const handleCampaignInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setCampaignData((prev) => ({
      ...prev,
      [target.name]: value,
    }));
    if (campaignError) setCampaignError('');
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignError('');

    if (!campaignData.name.trim()) {
      setCampaignError('Bitte gib deinen Namen an.');
      return;
    }
    if (!campaignData.email || !validateEmail(campaignData.email.trim())) {
      setCampaignError('Bitte gib eine gültige geschäftliche E-Mail-Adresse an.');
      return;
    }

    const totalBudgetNum = Number(campaignData.totalBudgetEur);
    if (campaignData.compensationModel === 'tkp' && (!Number.isFinite(totalBudgetNum) || totalBudgetNum <= 0)) {
      setCampaignError('Für eine View-Kampagne (TKP) ist eine feste Budget-Obergrenze Pflicht.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (demoMode) {
        setCampaignCreated({
          publicId: 'CMP-DEMO2026',
          invitedCount: selectedCreators.length,
          email: campaignData.email.trim(),
        });
        toast.info('Demo-Modus: Im Live-Betrieb wird deine Kampagne direkt im Brand-Workspace angelegt.');
        return;
      }

      const affiliateActive = campaignData.compensationModel === 'affiliate' || campaignData.affiliateEnabled;
      const affiliatePct = Math.max(1, Math.min(80, Number(campaignData.affiliatePercent) || 10));

      const response = await fetch('/api/brand/start-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignData.title.trim() || searchQuery.trim().slice(0, 90),
          company: campaignData.company.trim(),
          name: campaignData.name.trim(),
          email: campaignData.email.trim(),
          website: campaignData.website,
          visibility: campaignData.visibility,
          compensationModel: campaignData.compensationModel,
          budgetPerVideoEur:
            campaignData.compensationModel === 'fixed' || campaignData.compensationModel === 'hybrid'
              ? Number(campaignData.budgetPerVideoEur) || null
              : null,
          tkpEurCents:
            (campaignData.compensationModel === 'tkp' || campaignData.compensationModel === 'hybrid')
            && Number(campaignData.tkpEur.replace(',', '.')) > 0
              ? Math.round(Number(campaignData.tkpEur.replace(',', '.')) * 100)
              : null,
          totalBudgetEur: totalBudgetNum > 0 ? Math.round(totalBudgetNum) : null,
          affiliateEnabled: affiliateActive,
          affiliateType: 'percent',
          affiliateRateBps: affiliateActive ? Math.round(affiliatePct * 100) : null,
          affiliateTargetUrl: affiliateActive ? campaignData.affiliateTargetUrl.trim() : '',
          deliverables: campaignData.deliverables.trim(),
          usageRights: campaignData.usageRights.trim(),
          deadline: campaignData.deadline.trim(),
          message: campaignData.message.trim(),
          searchQuery: searchQuery.trim().slice(0, 90),
          creatorIds: selectedCreators,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Kampagne konnte nicht angelegt werden.');
      }

      if (result.authenticated && typeof result.redirectTo === 'string') {
        toast.success(`Kampagne ${result.campaignPublicId} angelegt! Weiter zum Brand-Workspace ...`);
        window.location.assign(result.redirectTo);
        return;
      }

      setCampaignCreated({
        publicId: String(result.campaignPublicId || ''),
        invitedCount: Number(result.invitedCount ?? selectedCreators.length),
        email: campaignData.email.trim(),
      });
      toast.success('Kampagne angelegt! Gib den 6-stelligen Code aus deiner E-Mail ein.');
    } catch (err) {
      setCampaignError(err instanceof Error ? err.message : 'Kampagne konnte nicht angelegt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyInlineOtp = async (codeRaw: string) => {
    if (!campaignCreated) return;
    const clean = codeRaw.replace(/\D/g, '');
    if (clean.length !== 6) {
      setOtpError('Bitte gib den 6-stelligen Code aus deiner E-Mail ein.');
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/brand/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: campaignCreated.email, code: clean, rememberMe: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Code ungültig oder abgelaufen.');
      }
      window.location.assign(data.redirectTo || `/brand/kampagnen/${campaignCreated.publicId}`);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Code konnte nicht bestätigt werden.');
      setVerifyingOtp(false);
    }
  };

  const openWorkspaceForm = () => {
    setCampaignCreated(null);
    setCampaignError('');
    setIsMinimized(false);
    setShowForm(true);
    trackUGCEvents.leadFormOpened('creator_selection', selectedCreators.length);
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ${
          isVisible && showForm ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform overflow-y-auto transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '92vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}
      >
        <div className="relative">
          <div className="absolute left-1/2 top-2.5 h-1 w-12 -translate-x-1/2 rounded-full bg-[#DCE2EA]" />

          <div
            className="border-t border-[#DCE2EA] bg-white shadow-[0_-12px_36px_rgba(6,42,89,0.14)]"
            style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}
          >
            {/* Header */}
            <div className={`${isMinimized ? 'px-4 pb-4 pt-6 sm:px-6' : 'px-6 pb-4 pt-7'} border-b border-[#DCE2EA]`}>
              <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE] font-bold text-[#157347]"
                    aria-hidden="true"
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#202124]" aria-live="polite">
                      {selectedCreators.length} Creator ausgewählt
                    </h3>
                    <p className="mt-0.5 text-sm text-[#5C6470]">
                      Im Brand-Portal anfragen: Fixpreis pro Video, nach Views (TKP) oder mit Affiliate-Kickback.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!showForm && (
                    <button
                      type="button"
                      onClick={openWorkspaceForm}
                      className="btn-press inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#06458F] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(6,69,143,0.22)] hover:bg-[#053673] sm:flex-none"
                    >
                      <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                      <span>Kampagne im Portal starten</span>
                    </button>
                  )}
                  {!showForm && (
                    <button
                      type="button"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="rounded-[8px] p-2.5 text-[#5C6470] transition-colors hover:bg-[#F5F7FA] hover:text-[#202124]"
                      title={isMinimized ? 'Erweitern' : 'Minimieren'}
                      aria-label={isMinimized ? 'Auswahl anzeigen' : 'Auswahl minimieren'}
                      aria-expanded={!isMinimized}
                    >
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-[8px] p-2.5 text-[#5C6470] transition-colors hover:bg-[#F5F7FA] hover:text-[#202124]"
                    title="Schließen"
                    aria-label="Auswahl schließen und leeren"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="mx-auto max-w-6xl px-6 py-6">
                {!showForm ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {selectedCreatorDetails.map((creator) => (
                        <div
                          key={creator.id}
                          className="rounded-[12px] border border-[#DCE2EA] bg-white p-4 text-center shadow-sm"
                        >
                          <div className="flex justify-center">
                            <CreatorAvatar
                              name={creator.name}
                              image={creator.image}
                              imgClassName="h-16 w-16 rounded-full border-2 border-[#DCE2EA] object-cover"
                            />
                          </div>
                          <h4 className="mt-2 text-sm font-bold leading-tight text-[#202124]">
                            {creator.name}
                          </h4>
                          <p className="mt-1 line-clamp-2 text-xs text-[#5C6470]">{creator.reach}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[14px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 text-center">
                      <h4 className="text-xl font-bold text-[#202124]">
                        Direkt im Brand-Portal anfragen
                      </h4>
                      <p className="mx-auto mt-2 max-w-xl text-sm text-[#5C6470]">
                        Alle Einladungen, Video-Abnahmen, Budget-Sicherung über Stripe und Abrechnungen laufen zentral über deinen kostenlosen Marken-Account (kein Abo, Anmeldung per 6-stelligem Code).
                      </p>
                      <button
                        type="button"
                        onClick={openWorkspaceForm}
                        className="btn-press mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#06458F] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(6,69,143,0.22)] hover:bg-[#053673]"
                      >
                        <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                        <span>Briefing &amp; Vergütung festlegen →</span>
                      </button>
                    </div>
                  </div>
                ) : campaignCreated ? (
                  <div className="mx-auto max-w-lg space-y-5 rounded-[16px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 text-center sm:p-8">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F7EE] text-[#157347]">
                      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#06458F]">
                        Kampagne {campaignCreated.publicId} angelegt
                      </p>
                      <h4 className="mt-1 text-xl font-bold text-[#202124]">
                        Gib deinen 6-stelligen Code ein
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-[#5C6470]">
                        Deine {campaignCreated.invitedCount} ausgewählten Creator wurden im Portal eingeladen. Wir haben einen 6-stelligen Code + 1-Klick-Link an <strong className="text-[#202124]">{campaignCreated.email}</strong> geschickt.
                      </p>
                    </div>

                    <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-5">
                      <OtpInput
                        value={otpCode}
                        onChange={(val) => {
                          setOtpCode(val);
                          if (otpError) setOtpError('');
                        }}
                        onComplete={(val) => verifyInlineOtp(val)}
                        disabled={verifyingOtp}
                      />
                      {otpError && (
                        <p role="alert" className="mt-3 text-xs font-semibold text-[#D93025]">
                          {otpError}
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={verifyingOtp || otpCode.replace(/\D/g, '').length !== 6}
                        onClick={() => verifyInlineOtp(otpCode)}
                        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[#06458F] px-5 text-sm font-semibold text-white hover:bg-[#053673] disabled:opacity-50"
                      >
                        {verifyingOtp ? 'Öffne Kampagne ...' : 'Code bestätigen & Kampagne öffnen →'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs font-semibold text-[#5C6470] underline hover:text-[#202124]"
                    >
                      Später per Link in der E-Mail öffnen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#D10523]">
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          Geschützter Brand-Workspace · Kein Abo
                        </p>
                        <h4 className="mt-1 text-xl font-bold text-[#202124]">
                          Kampagne mit {selectedCreators.length} ausgewählten Creatorn starten
                        </h4>
                      </div>
                      <span className="rounded-full border border-[#DCE2EA] bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-[#06458F]">
                        Kein Passwort nötig · 6-stelliger Code per Mail
                      </span>
                    </div>

                    <form onSubmit={handleCampaignSubmit} className="space-y-4">
                      <div
                        aria-hidden="true"
                        style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
                      >
                        <label htmlFor="ugc-camp-website">Website</label>
                        <input
                          type="text"
                          id="ugc-camp-website"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={campaignData.website}
                          onChange={handleCampaignInputChange}
                        />
                      </div>

                      {/* Verguetungsmodell als klare 4-Kachel-Auswahl */}
                      <div>
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5C6470]">
                          Wie möchtest du die Creator vergüten?
                        </span>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            { id: 'fixed' as const, title: 'Fixpreis pro Video', sub: 'Klassisches UGC-Paket · Escrow' },
                            { id: 'tkp' as const, title: 'Pay-per-View (TKP)', sub: 'Pro 1.000 geprüfte Views' },
                            { id: 'hybrid' as const, title: 'Hybrid (Fix + Views)', sub: 'Basis-Honorar + Reichweite' },
                            { id: 'affiliate' as const, title: 'Affiliate / Kickback', sub: '% oder € pro Sale via Code' },
                          ].map((opt) => {
                            const active = campaignData.compensationModel === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setCampaignData((prev) => ({
                                    ...prev,
                                    compensationModel: opt.id,
                                    affiliateEnabled: opt.id === 'affiliate' ? true : prev.affiliateEnabled,
                                  }))
                                }
                                className={`rounded-[10px] border p-3 text-left transition-all ${
                                  active
                                    ? 'border-[#06458F] bg-[#EBF2FA] shadow-sm'
                                    : 'border-[#DCE2EA] bg-white hover:border-[#06458F]/50'
                                }`}
                              >
                                <p className={`text-xs font-bold ${active ? 'text-[#06458F]' : 'text-[#202124]'}`}>
                                  {opt.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#5C6470]">{opt.sub}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="camp-title" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Kampagnentitel *
                          </label>
                          <input
                            type="text"
                            id="camp-title"
                            name="title"
                            maxLength={140}
                            required
                            value={campaignData.title}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10"
                            placeholder="z. B. Produktvideos für Sommer-Launch"
                          />
                        </div>
                        <div>
                          <label htmlFor="camp-company" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Marke / Unternehmen *
                          </label>
                          <input
                            type="text"
                            id="camp-company"
                            name="company"
                            maxLength={140}
                            required
                            value={campaignData.company}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10"
                            placeholder="z. B. Nordic Care GmbH"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="camp-name" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Dein Name *
                          </label>
                          <input
                            type="text"
                            id="camp-name"
                            name="name"
                            required
                            maxLength={120}
                            value={campaignData.name}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10"
                            placeholder="Lisa Meyer"
                          />
                        </div>
                        <div>
                          <label htmlFor="camp-email" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Geschäftliche E-Mail (für deinen Account-Code) *
                          </label>
                          <input
                            type="email"
                            id="camp-email"
                            name="email"
                            required
                            maxLength={254}
                            value={campaignData.email}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F] focus:ring-4 focus:ring-[#06458F]/10"
                            placeholder="lisa@deinemarke.de"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {(campaignData.compensationModel === 'fixed' || campaignData.compensationModel === 'hybrid') && (
                          <div>
                            <label htmlFor="camp-budget-video" className="mb-1 block text-xs font-semibold text-[#202124]">
                              Honorar / Video (€)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={50000}
                              id="camp-budget-video"
                              name="budgetPerVideoEur"
                              value={campaignData.budgetPerVideoEur}
                              onChange={handleCampaignInputChange}
                              className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F]"
                              placeholder="200"
                            />
                          </div>
                        )}
                        {(campaignData.compensationModel === 'tkp' || campaignData.compensationModel === 'hybrid') && (
                          <div>
                            <label htmlFor="camp-tkp-eur" className="mb-1 block text-xs font-semibold text-[#202124]">
                              Preis / 1.000 Views (€)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="0.10"
                              max={500}
                              id="camp-tkp-eur"
                              name="tkpEur"
                              value={campaignData.tkpEur}
                              onChange={handleCampaignInputChange}
                              className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F]"
                              placeholder="2.00"
                            />
                          </div>
                        )}
                        <div>
                          <label htmlFor="camp-budget-total" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Gesamtbudget / Deckel (€)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            id="camp-budget-total"
                            name="totalBudgetEur"
                            value={campaignData.totalBudgetEur}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F]"
                            placeholder="600"
                          />
                        </div>
                        <div>
                          <label htmlFor="camp-visibility" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Sichtbarkeit
                          </label>
                          <select
                            id="camp-visibility"
                            name="visibility"
                            value={campaignData.visibility}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#06458F]"
                          >
                            <option value="open">Auswahl einladen + offen für Bewerbungen</option>
                            <option value="invite_only">Nur meine ausgewählten Creator</option>
                          </select>
                        </div>
                      </div>

                      {/* Optionales Affiliate / Kickback Add-on */}
                      <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-3.5">
                        <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#202124]">
                          <input
                            type="checkbox"
                            name="affiliateEnabled"
                            checked={campaignData.compensationModel === 'affiliate' || campaignData.affiliateEnabled}
                            disabled={campaignData.compensationModel === 'affiliate'}
                            onChange={handleCampaignInputChange}
                            className="h-4 w-4 rounded accent-[#06458F]"
                          />
                          <Sparkles className="h-3.5 w-3.5 text-[#F2072A]" aria-hidden="true" />
                          <span>Affiliate-Kickback (individueller Creator-Code &amp; Tracking-Link ugc-vz.de/r/...)</span>
                        </label>
                        {(campaignData.compensationModel === 'affiliate' || campaignData.affiliateEnabled) && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor="camp-aff-pct" className="mb-1 block text-[11px] font-semibold text-[#5C6470]">
                                Kickback-Provision (%)
                              </label>
                              <input
                                id="camp-aff-pct"
                                name="affiliatePercent"
                                type="number"
                                min={1}
                                max={80}
                                value={campaignData.affiliatePercent}
                                onChange={handleCampaignInputChange}
                                className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2 text-sm text-[#202124]"
                              />
                            </div>
                            <div>
                              <label htmlFor="camp-aff-url" className="mb-1 block text-[11px] font-semibold text-[#5C6470]">
                                Ziel-URL deines Shops (für Tracking-Links)
                              </label>
                              <input
                                id="camp-aff-url"
                                name="affiliateTargetUrl"
                                type="url"
                                value={campaignData.affiliateTargetUrl}
                                onChange={handleCampaignInputChange}
                                placeholder="https://deinshop.de/produkt"
                                className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3 py-2 text-sm text-[#202124]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="camp-deliverables" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Deliverables &amp; Rechte
                          </label>
                          <input
                            type="text"
                            maxLength={240}
                            id="camp-deliverables"
                            name="deliverables"
                            value={campaignData.deliverables}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124]"
                          />
                        </div>
                        <div>
                          <label htmlFor="camp-message" className="mb-1 block text-xs font-semibold text-[#202124]">
                            Kurz-Briefing (optional)
                          </label>
                          <input
                            type="text"
                            id="camp-message"
                            name="message"
                            value={campaignData.message}
                            onChange={handleCampaignInputChange}
                            className="w-full rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 py-2.5 text-sm text-[#202124]"
                            placeholder="Produkt, Zielgruppe, gewünschte Hooks ..."
                          />
                        </div>
                      </div>

                      {campaignError && (
                        <div role="alert" className="rounded-[8px] border border-[#F2072A]/30 bg-[#FDECEF] px-4 py-3 text-sm font-medium text-[#D10523]">
                          {campaignError}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="rounded-[8px] border border-[#DCE2EA] px-5 py-3 text-sm font-semibold text-[#202124] hover:bg-[#F5F7FA]"
                        >
                          ← Zurück
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-press flex-1 rounded-[8px] bg-[#06458F] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(6,69,143,0.22)] hover:bg-[#053673] disabled:opacity-60"
                        >
                          {isSubmitting
                            ? 'Kampagne wird angelegt ...'
                            : `Kampagne anlegen & ${selectedCreators.length} Creator einladen →`}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
