'use client';

import CreatorAvatar from './CreatorAvatar';
import { BriefcaseBusiness, CheckCircle2, Mail, PartyPopper } from 'lucide-react';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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

const INTRO_CALL_URL = 'https://book.agentifizierung.de/gorden/intro-call?overlayCalendar=true';

type PopupMode = 'email' | 'workspace';

interface CreatorSelectionPopupProps {
  selectedCreators: string[];
  creators: Creator[];
  isVisible: boolean;
  onClose: () => void;
  searchQuery?: string;
  demoMode?: boolean;
  onSubmit: (clientInfo: {
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
  onSubmit
}: CreatorSelectionPopupProps) {
  const [mode, setMode] = useState<PopupMode>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '',
    compensation: '',
    budget: '',
    deadline: '',
    usageRights: ''
  });
  const [campaignData, setCampaignData] = useState({
    title: '',
    company: '',
    name: '',
    email: '',
    website: '',
    visibility: 'open' as 'open' | 'invite_only',
    compensationModel: 'tkp' as 'fixed' | 'tkp' | 'hybrid' | 'barter',
    budgetPerVideoEur: '',
    tkpEur: '2.00',
    totalBudgetEur: '500',
    deliverables: '',
    usageRights: '',
    deadline: '',
    message: '',
  });
  const [campaignCreated, setCampaignCreated] = useState<{
    publicId: string;
    invitedCount: number;
    email: string;
  } | null>(null);
  const [campaignError, setCampaignError] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [unlockNotice, setUnlockNotice] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Reset form when popup closes
  useEffect(() => {
    if (isVisible && !submissionId) {
      setSubmissionId(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
    }

    if (!isVisible) {
      setShowForm(false);
      setIsMinimized(true);
      setMode('email');
      setFormData({ name: '', email: '', message: '', website: '', compensation: '', budget: '', deadline: '', usageRights: '' });
      setCampaignData({
        title: '',
        company: '',
        name: '',
        email: '',
        website: '',
        visibility: 'open',
        compensationModel: 'tkp',
        budgetPerVideoEur: '',
        tkpEur: '2.00',
        totalBudgetEur: '500',
        deliverables: '',
        usageRights: '',
        deadline: '',
        message: '',
      });
      setCampaignCreated(null);
      setCampaignError('');
      setSubmissionId('');
      setEmailError('');
      setUnlockNotice('');
    }
  }, [isVisible, submissionId]);

  useEffect(() => {
    const suggested = searchQuery.trim().slice(0, 90);
    if (suggested) {
      setCampaignData((prev) => (prev.title ? prev : { ...prev, title: suggested }));
    }
  }, [searchQuery]);

  const selectedCreatorDetails = creators.filter(creator => 
    selectedCreators.includes(creator.id)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'email' && emailError) {
      setEmailError('');
    }
    if (unlockNotice) {
      setUnlockNotice('');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockNotice('');
    
    if (!formData.email || !validateEmail(formData.email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      trackUGCEvents.leadFormError('creator_selection', 'invalid_email');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Bitte gib deinen Namen ein');
      trackUGCEvents.leadFormError('creator_selection', 'missing_name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSubmit({ ...formData, submissionId });
      
      setFormData({ name: '', email: '', message: '', website: '', compensation: '', budget: '', deadline: '', usageRights: '' });
      if (result?.heldForReview) {
        toast.info('Anfrage eingegangen! Für reine Produkt- oder Affiliate-Modelle melden wir uns kurz per E-Mail mit einem Terminvorschlag.');
      } else {
        toast.success('Geschafft! Die Creator-Kontakte sind per E-Mail auf dem Weg.');
      }
      onClose();
    } catch (error) {
      trackUGCEvents.leadFormError('creator_selection', 'submit_failed');
      const err = error as { userMessage?: string; code?: string } | null;
      if (err?.code === 'unlock_required') {
        setUnlockNotice(
          err.userMessage
            || 'Dein kostenloses 30-Tage-Kontingent ist aufgebraucht. Buche ein kurzes Gespräch oder schreib uns kurz – wir schalten dich kostenlos frei.',
        );
        return;
      }
      // Deutsche Server-Meldung anzeigen (z.B. Creator-Limit), sonst generisch.
      toast.error(err?.userMessage || 'Fehler beim Senden der Anfrage. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCampaignInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (campaignError) setCampaignError('');
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignError('');

    if (!campaignData.name.trim()) {
      setCampaignError('Bitte gib deinen Namen an.');
      return;
    }
    if (!campaignData.email || !validateEmail(campaignData.email.trim())) {
      setCampaignError('Bitte gib eine gültige E-Mail-Adresse an.');
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
          budgetPerVideoEur: campaignData.budgetPerVideoEur ? Number(campaignData.budgetPerVideoEur) : null,
          tkpEurCents:
            (campaignData.compensationModel === 'tkp' || campaignData.compensationModel === 'hybrid') && Number(campaignData.tkpEur.replace(',', '.')) > 0
              ? Math.round(Number(campaignData.tkpEur.replace(',', '.')) * 100)
              : null,
          totalBudgetEur: campaignData.totalBudgetEur ? Number(campaignData.totalBudgetEur) : null,
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
        toast.success(`Kampagne ${result.campaignPublicId} angelegt! Weiter zum Brand-Workspace …`);
        window.location.assign(result.redirectTo);
        return;
      }

      setCampaignCreated({
        publicId: String(result.campaignPublicId || ''),
        invitedCount: Number(result.invitedCount ?? selectedCreators.length),
        email: campaignData.email.trim(),
      });
      toast.success('Kampagne angelegt! Prüfe dein Postfach für den direkten Workspace-Zugang.');
    } catch (err) {
      setCampaignError(err instanceof Error ? err.message : 'Kampagne konnte nicht angelegt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMode = (nextMode: PopupMode) => {
    setMode(nextMode);
    setCampaignCreated(null);
    setCampaignError('');
    setIsMinimized(false);
    setShowForm(true);
    trackUGCEvents.leadFormOpened('creator_selection', selectedCreators.length);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - subtle, doesn't block interaction */}
      <div 
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none z-40 ${
          isVisible && showForm ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Bottom Popup */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 overflow-y-auto transform transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '90vh',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}
      >
        <div className="relative">
          {/* Drag indicator */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-ink-soft rounded-full opacity-60" />
          
          {/* Main popup content */}
          <div className="bg-white shadow-2xl border-t border-hairline"
               style={{
                 borderTopLeftRadius: '24px',
                 borderTopRightRadius: '24px',
                 boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)'
               }}>
            
            {/* Header */}
            <div className={`${isMinimized ? 'px-4 pt-6 pb-4 sm:px-6' : 'px-6 pt-8 pb-4'} border-b border-hairline`}>
              <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5e5] text-[#385523]" aria-hidden="true">✓</div>
                    <div>
                      <h3 className="text-lg font-semibold text-ink" aria-live="polite">
                        {selectedCreators.length} Creator in deiner Auswahl
                      </h3>
                      <p className="text-sm text-ink-soft mt-1">
                        Als Kampagne im Workspace managen oder direkt per E-Mail anfragen.
                      </p>
                      {!isMinimized && <p className="mt-2 max-w-xl text-xs leading-5 text-ink-soft">Im Brand-Workspace verwaltest du Einladungen, Bewerbungen, Content-Links und Views zentral – oder du forderst die Kontakte direkt ohne Konto per E-Mail an.</p>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!showForm && (
                    <button
                      type="button"
                      onClick={() => openMode('workspace')}
                      className="flex-1 rounded-xl bg-geo-violet px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#053673] focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2 sm:flex-none"
                    >
                      Als Kampagne starten
                    </button>
                  )}
                  {!showForm && (
                    <button
                      type="button"
                      onClick={() => openMode('email')}
                      className="rounded-xl border border-geo-violet/40 bg-geo-violet/5 px-3.5 py-3 text-sm font-semibold text-geo-violet transition-colors hover:bg-geo-violet/10 focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2"
                    >
                      Kostenlos Anfrage senden
                    </button>
                  )}
                  {!showForm && (
                    <button
                      type="button"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="p-3 text-ink-soft hover:text-ink hover:bg-surface rounded-xl transition-all duration-200 group"
                      title={isMinimized ? "Erweitern" : "Minimieren"}
                      aria-label={isMinimized ? 'Auswahl anzeigen' : 'Auswahl minimieren'}
                      aria-expanded={!isMinimized}
                    >
                      <svg className={`w-5 h-5 transform transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-3 text-ink-soft hover:text-ink hover:bg-surface rounded-xl transition-all duration-200"
                    title="Schließen"
                    aria-label="Auswahl schließen und leeren"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content - only show when not minimized */}
            {!isMinimized && (
              <div className="mx-auto max-w-6xl px-6 py-6">
                {!showForm ? (
                  /* Creator Preview */
                  <div className="space-y-6">
                    {/* Selected Creators Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedCreatorDetails.map((creator) => (
                        <div key={creator.id} 
                             className="bg-white rounded-2xl p-4 shadow-sm border border-hairline hover:shadow-md transition-all duration-200 group">
                          <div className="text-center">
                            <div className="flex justify-center">
                              <CreatorAvatar name={creator.name} image={creator.image} imgClassName="w-16 h-16 rounded-full object-cover border-2 border-hairline group-hover:border-geo-violet transition-colors" />
                            </div>
                            <h4 className="text-sm font-semibold text-ink mt-2 leading-tight">
                              {creator.name}
                            </h4>
                            <p className="text-xs text-ink-soft mt-1 line-clamp-2">
                              {creator.reach}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA Section */}
                    <div className="surface-card rounded-2xl p-6">
                      <div className="text-center space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold text-ink">
                            Wie möchtest du weitermachen?
                          </h4>
                          <p className="text-ink-soft text-sm max-w-xl mx-auto">
                            Starte direkt eine Kampagne im kostenlosen Brand-Workspace (mit Einladungen, Bewerbungen, Clip-Tracking &amp; CSV-Reporting) oder fordere die Kontaktdaten klassisch per E-Mail an.
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openMode('workspace')}
                            className="inline-flex items-center gap-2 rounded-2xl bg-geo-violet px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-[#053673]"
                          >
                            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                            <span>Kampagne im Workspace starten</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openMode('email')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-white px-6 py-3.5 text-base font-semibold text-ink transition hover:border-geo-violet"
                          >
                            <Mail className="h-5 w-5 text-geo-violet" aria-hidden="true" />
                            <span>Nur Kontakte per E-Mail anfordern</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode Switch + Forms */
                  <div className="space-y-6">
                    <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 rounded-2xl border border-hairline bg-surface p-1.5 sm:grid-cols-2" role="tablist" aria-label="Anfrageart wählen">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'workspace'}
                        onClick={() => { setMode('workspace'); setCampaignError(''); }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          mode === 'workspace'
                            ? 'bg-white text-ink shadow-sm'
                            : 'text-ink-soft hover:text-ink'
                        }`}
                      >
                        <BriefcaseBusiness className="h-4 w-4 text-geo-violet" aria-hidden="true" />
                        <span>Brand-Workspace &amp; Tracking</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'email'}
                        onClick={() => setMode('email')}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          mode === 'email'
                            ? 'bg-white text-ink shadow-sm'
                            : 'text-ink-soft hover:text-ink'
                        }`}
                      >
                        <Mail className="h-4 w-4 text-geo-violet" aria-hidden="true" />
                        <span>Direkte E-Mail (ohne Konto)</span>
                      </button>
                    </div>

                    {mode === 'workspace' ? (
                      campaignCreated ? (
                        <div className="mx-auto max-w-xl rounded-2xl border border-geo-green/60 bg-[#f6fbf1] p-6 text-center space-y-4">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-geo-green/25 text-[#385523]">
                            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                          </span>
                          <h4 className="text-xl font-bold text-ink">
                            Kampagne {campaignCreated.publicId} angelegt!
                          </h4>
                          <p className="text-sm leading-6 text-ink-soft">
                            Deine {campaignCreated.invitedCount} ausgewählten Creator wurden vorgemerkt. Wir haben einen 1-Klick-Anmeldelink an <strong className="text-ink">{campaignCreated.email}</strong> geschickt – damit öffnest du direkt deine Kampagne mit Bewerbungen, Content-Tracking &amp; Reporting.
                          </p>
                          <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <a
                              href="/brand"
                              className="rounded-xl bg-geo-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#053673]"
                            >
                              Zum Brand-Workspace →
                            </a>
                            <button
                              type="button"
                              onClick={onClose}
                              className="rounded-xl border border-hairline bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
                            >
                              Auswahl schließen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-ink mb-1">
                              Kampagne im Brand-Workspace starten
                            </h4>
                            <p className="text-ink-soft text-sm max-w-2xl mx-auto">
                              Deine {selectedCreators.length} ausgewählten Creator werden direkt eingeladen. Du erhältst ohne Passwort einen Magic-Link zu deinem Workspace mit Auswahl, Content-Links, Views &amp; CSV-Report.
                            </p>
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

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label htmlFor="camp-title" className="block text-sm font-semibold text-ink">
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
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                  placeholder="z. B. Sommer-Launch Skincare Reels"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-company" className="block text-sm font-semibold text-ink">
                                  Brand / Unternehmen
                                </label>
                                <input
                                  type="text"
                                  id="camp-company"
                                  name="company"
                                  maxLength={140}
                                  value={campaignData.company}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                  placeholder="z. B. Nordic Care GmbH"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label htmlFor="camp-name" className="block text-sm font-semibold text-ink">
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
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                  placeholder="Max Mustermann"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-email" className="block text-sm font-semibold text-ink">
                                  Geschäfts-E-Mail *
                                </label>
                                <input
                                  type="email"
                                  id="camp-email"
                                  name="email"
                                  required
                                  maxLength={254}
                                  value={campaignData.email}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                  placeholder="max@deinebrand.de"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label htmlFor="camp-visibility" className="block text-sm font-semibold text-ink">
                                  Sichtbarkeit für Creator
                                </label>
                                <select
                                  id="camp-visibility"
                                  name="visibility"
                                  value={campaignData.visibility}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                >
                                  <option value="open">Auswahl einladen + offen für weitere Bewerbungen</option>
                                  <option value="invite_only">Nur meine ausgewählten Creator einladen</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-comp" className="block text-sm font-semibold text-ink">
                                  Vergütungsmodell
                                </label>
                                <select
                                  id="camp-comp"
                                  name="compensationModel"
                                  value={campaignData.compensationModel}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet text-sm"
                                >
                                  <option value="fixed">Festpreis pro Video / Paket</option>
                                  <option value="tkp">Performance / TKP (pro 1.000 Views)</option>
                                  <option value="hybrid">Hybrid (Basis + Performance-Bonus)</option>
                                  <option value="barter">Produkt / Barter</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {(campaignData.compensationModel === 'tkp' || campaignData.compensationModel === 'hybrid') ? (
                                <div className="space-y-1.5">
                                  <label htmlFor="camp-tkp-eur" className="block text-xs font-semibold text-ink">
                                    TKP (€ / 1.000 Views)
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
                                    className="w-full px-3 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                    placeholder="2.00"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <label htmlFor="camp-budget-video" className="block text-xs font-semibold text-ink">
                                    Budget / Video (€)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50000}
                                    id="camp-budget-video"
                                    name="budgetPerVideoEur"
                                    value={campaignData.budgetPerVideoEur}
                                    onChange={handleCampaignInputChange}
                                    className="w-full px-3 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                    placeholder="250"
                                  />
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <label htmlFor="camp-budget-total" className="block text-xs font-semibold text-ink">
                                  Budget-Limit (€, optional)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={1000000}
                                  id="camp-budget-total"
                                  name="totalBudgetEur"
                                  value={campaignData.totalBudgetEur}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-3 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                  placeholder="Leer = offen"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-rights" className="block text-xs font-semibold text-ink">
                                  Nutzungsrechte
                                </label>
                                <input
                                  type="text"
                                  maxLength={160}
                                  id="camp-rights"
                                  name="usageRights"
                                  value={campaignData.usageRights}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-3 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                  placeholder="12 Mon. Paid Ads"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-deadline" className="block text-xs font-semibold text-ink">
                                  Frist
                                </label>
                                <input
                                  type="text"
                                  maxLength={120}
                                  id="camp-deadline"
                                  name="deadline"
                                  value={campaignData.deadline}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-3 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                  placeholder="In 14 Tagen"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label htmlFor="camp-deliverables" className="block text-sm font-semibold text-ink">
                                  Deliverables (optional)
                                </label>
                                <input
                                  type="text"
                                  maxLength={240}
                                  id="camp-deliverables"
                                  name="deliverables"
                                  value={campaignData.deliverables}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet"
                                  placeholder="z. B. 2x TikTok/Reel (30 Sek.) + 2 Hooks"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label htmlFor="camp-message" className="block text-sm font-semibold text-ink">
                                  Kurz-Briefing (optional)
                                </label>
                                <textarea
                                  id="camp-message"
                                  name="message"
                                  rows={2}
                                  value={campaignData.message}
                                  onChange={handleCampaignInputChange}
                                  className="w-full px-4 py-2.5 bg-white border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-geo-violet resize-none"
                                  placeholder="Produkt, Zielgruppe, gewünschte Hooks oder No-Gos …"
                                />
                              </div>
                            </div>

                            {campaignError && (
                              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {campaignError}
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 px-6 py-3 border border-hairline text-ink rounded-xl hover:bg-surface font-semibold text-sm"
                              >
                                ← Zurück
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-3 bg-geo-violet text-white rounded-xl hover:bg-[#053673] font-semibold disabled:opacity-50 text-sm"
                              >
                                {isSubmitting ? 'Kampagne wird angelegt …' : 'Kampagne & Workspace starten →'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )
                    ) : (
                      /* Contact Form (classic email-only flow, kept 100% compatible) */
                      <div className="space-y-6">
                        <div className="text-center">
                          <h4 className="text-xl font-bold text-ink mb-2">
                            Fast geschafft! <PartyPopper className="inline-block w-5 h-5 ml-1 align-[-3px]" strokeWidth={1.5} aria-hidden="true" />
                          </h4>
                          <p className="text-ink-soft text-sm">
                            Trag deine E-Mail-Adresse ein – wir schicken dir die Kontakte sofort zu (echte Anfrage, keine Demo).
                          </p>
                        </div>

                        {unlockNotice && (
                          <div role="alert" className="rounded-2xl border-2 border-geo-violet/30 bg-[#FBF8FE] p-5 text-left">
                            <p className="text-sm font-bold text-ink">Hohes Anfragevolumen? Wir schalten dein Team kostenlos frei.</p>
                            <p className="mt-1.5 text-sm leading-6 text-ink-soft">{unlockNotice}</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <a
                                href={INTRO_CALL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[42px] items-center rounded-xl bg-geo-violet px-4 py-2 text-sm font-semibold text-white hover:bg-[#053673]"
                              >
                                15-Min-Freischaltungs-Call buchen →
                              </a>
                              <a
                                href="/contact"
                                className="inline-flex min-h-[42px] items-center rounded-xl border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-geo-violet"
                              >
                                Kurz per Formular schreiben
                              </a>
                            </div>
                          </div>
                        )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div
                        aria-hidden="true"
                        style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
                      >
                        <label htmlFor="ugc-company-website">Website</label>
                        <input
                          type="text"
                          id="ugc-company-website"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={formData.website}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="block text-sm font-semibold text-ink">
                            Dein Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm"
                            placeholder="Max Mustermann"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="email" className="block text-sm font-semibold text-ink">
                            E-Mail Adresse *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 bg-white border rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
                              emailError ? 'border-red-300 focus:ring-red-500' : 'border-hairline focus:ring-geo-violet'
                            }`}
                            placeholder="max@deinebrand.de"
                          />
                          {emailError && (
                            <p className="text-red-500 text-xs mt-1">{emailError}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="block text-sm font-semibold text-ink">
                          Projektbeschreibung (optional)
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={3}
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all resize-none text-sm"
                          placeholder="Beschreib kurz Produkt, gewünschte Videos, Zielgruppe oder besondere Anforderungen …"
                        />
                        <p className="text-xs text-ink-soft">
                          Tipp: Mit „Hallo [Name],“ wird jeder Creator persönlich angesprochen, falls Projektbenachrichtigungen aktiv sind.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="compensation" className="block text-sm font-semibold text-ink">
                            Vergütung (optional)
                          </label>
                          <select id="compensation" name="compensation" value={formData.compensation} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm">
                            <option value="">Bitte wählen</option>
                            <option value="paid">Bezahlt</option>
                            <option value="barter">Ware gegen Content (Barter)</option>
                            <option value="both">Bezahlt oder Ware – verhandelbar</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="budget" className="block text-sm font-semibold text-ink">
                            Budget pro Video (optional)
                          </label>
                          <input type="text" id="budget" name="budget" maxLength={80} value={formData.budget} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. 250 €" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="deadline" className="block text-sm font-semibold text-ink">
                            Frist (optional)
                          </label>
                          <input type="text" id="deadline" name="deadline" maxLength={80} value={formData.deadline} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. erste Videos in 2 Wochen" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="usageRights" className="block text-sm font-semibold text-ink">
                            Nutzungsrechte (optional)
                          </label>
                          <input type="text" id="usageRights" name="usageRights" maxLength={80} value={formData.usageRights} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. 12 Monate Paid Ads" />
                        </div>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Viele Creator arbeiten gegen Honorar. Mit konkretem Budget und Rechteumfang bekommst du deutlich schneller Antworten.
                      </p>

                      <div className="rounded-xl border border-geo-violet bg-geo-violet/5 p-4 text-sm leading-6 text-ink">
                        <p className="font-bold">Das passiert nach dem Absenden:</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
                          <li>Du erhältst die verfügbaren Kontaktdaten und Social-Links deiner Auswahl direkt per E-Mail.</li>
                          <li>Bei regulären bezahlten Projektanfragen können erreichbare Creator zusätzlich über dein Interesse informiert werden – Antworten gehen immer direkt an dich. Reine Barter-/Affiliate-Modelle klären wir kurz persönlich mit dir.</li>
                          <li>Keine automatische Buchung und kein Monatsabo. Für View-Kampagnen mit Budget-Deckel steht zusätzlich der <a href="/brands/workspace" className="underline">Brand-Workspace</a> bereit (<a href="/preise" className="underline">Preise</a> · <a href="/datenschutz" className="underline">Datenschutz</a>).</li>
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/auswahl?ids=${selectedCreators.join(',')}`);
                            toast.success('Link zur Auswahl kopiert – zum Weiterleiten an Kollegen oder Kunden.');
                          } catch {
                            toast.error('Link konnte nicht kopiert werden.');
                          }
                        }}
                        className="text-sm font-semibold text-geo-violet underline"
                      >
                        Auswahl als Link kopieren (zum Weiterleiten)
                      </button>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="flex-1 px-6 py-3 border border-hairline text-ink rounded-xl hover:bg-surface hover:border-ink-soft transition-all font-semibold text-sm"
                        >
                          ← Zurück
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-6 py-3 bg-geo-violet text-white rounded-xl hover:bg-geo-violet-soft transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Wird gesendet...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <span>Echte Anfrage jetzt senden</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                    )}
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
