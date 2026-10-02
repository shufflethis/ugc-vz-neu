'use client';

import { PartyPopper } from 'lucide-react';

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

interface CreatorSelectionPopupProps {
  selectedCreators: string[];
  creators: Creator[];
  isVisible: boolean;
  onClose: () => void;
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
  }) => Promise<void>;
}

export default function CreatorSelectionPopup({
  selectedCreators,
  creators,
  isVisible,
  onClose,
  onSubmit
}: CreatorSelectionPopupProps) {
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
  const [submissionId, setSubmissionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
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
      setFormData({ name: '', email: '', message: '', website: '', compensation: '', budget: '', deadline: '', usageRights: '' });
      setSubmissionId('');
      setEmailError('');
    }
  }, [isVisible, submissionId]);

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
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !validateEmail(formData.email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      trackUGCEvents.leadFormError('creator_selection', 'invalid_email');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie Ihren Namen ein');
      trackUGCEvents.leadFormError('creator_selection', 'missing_name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({ ...formData, submissionId });
      
      setFormData({ name: '', email: '', message: '', website: '', compensation: '', budget: '', deadline: '', usageRights: '' });
      toast.success('Geschafft! Die Creator-Kontakte sind per E-Mail auf dem Weg.');
      onClose();
    } catch (error) {
      trackUGCEvents.leadFormError('creator_selection', 'submit_failed');
      // Deutsche Server-Meldung anzeigen (z.B. Creator-Limit), sonst generisch.
      const userMessage = (error as { userMessage?: string } | null)?.userMessage;
      toast.error(userMessage || 'Fehler beim Senden der Anfrage. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
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
                        Kostenlos anfragen, Kontaktinfos per E-Mail erhalten.
                      </p>
                      {!isMinimized && <p className="mt-2 max-w-xl text-xs leading-5 text-ink-soft">Du erhältst deine Auswahl und die verfügbaren Kontaktinfos per E-Mail. Du kontaktierst die Creator selbst; es wird kein Auftrag gebucht. Honorare und Nutzungsrechte vereinbart ihr direkt.</p>}
                    </div>
                  </div>
                </div>
                
                <div className="flex shrink-0 items-center justify-end space-x-2">
                  {!showForm && (
                    <button
                      onClick={() => {
                        setIsMinimized(false);
                        setShowForm(true);
                        trackUGCEvents.leadFormOpened('creator_selection', selectedCreators.length);
                      }}
                      className="flex-1 rounded-xl bg-geo-violet px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7531ae] focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2 sm:flex-none"
                    >
                      Kostenlos Anfrage senden
                    </button>
                  )}
                  {!showForm && (
                    <button
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
                            <img
                              src={creator.image || (creator.gender === 'Weiblich' ? '/female-placeholder.webp' : '/placeholder.jpg')}
                              alt={creator.name}
                              className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-hairline group-hover:border-geo-violet transition-colors"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = creator.gender === 'Weiblich' ? '/female-placeholder.webp' : '/placeholder.jpg';
                              }}
                            />
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
                            Bereit für Ihr UGC-Projekt?
                          </h4>
                          <p className="text-ink-soft text-sm max-w-md mx-auto">
                            Senden Sie Ihre Auswahl an UGC VZ. Wir pruefen die Anfrage und verbinden Sie mit den passenden Creatorn.
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setShowForm(true);
                            trackUGCEvents.leadFormOpened('creator_selection', selectedCreators.length);
                          }}
                          className="inline-flex items-center space-x-3 bg-geo-violet text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-geo-violet-soft transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group"
                        >
                          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" 
                               fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Jetzt Anfrage senden</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Contact Form */
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-ink mb-2">
                        Fast geschafft! <PartyPopper className="inline-block w-5 h-5 ml-1 align-[-3px]" strokeWidth={1.5} aria-hidden="true" />
                      </h4>
                      <p className="text-ink-soft text-sm">
                        Tragen Sie Ihre E-Mail ein. Die ausgewählten Kontakte und Preisangaben werden automatisch versendet.
                      </p>
                    </div>

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
                            Ihr Name *
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
                            placeholder="max@beispiel.de"
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
                          placeholder="Beschreiben Sie kurz Ihr UGC-Projekt, Budget oder besondere Anforderungen..."
                        />
                        <p className="text-xs text-ink-soft">
                          Tipp: Mit „Hallo [Name],“ sprechen wir jeden gewählten Creator persönlich an.
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
                          <input type="text" id="budget" name="budget" maxLength={80} value={formData.budget} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. 150 €" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="deadline" className="block text-sm font-semibold text-ink">
                            Frist (optional)
                          </label>
                          <input type="text" id="deadline" name="deadline" maxLength={80} value={formData.deadline} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. erste Videos bis Ende Oktober" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="usageRights" className="block text-sm font-semibold text-ink">
                            Nutzungsrechte (optional)
                          </label>
                          <input type="text" id="usageRights" name="usageRights" maxLength={80} value={formData.usageRights} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-hairline rounded-xl text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent transition-all text-sm" placeholder="z. B. 12 Monate Paid Ads" />
                        </div>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Viele Creator arbeiten nicht kostenlos. Mit Vergütung und Budget bekommen Sie schneller eine Antwort.
                      </p>

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
                              <span>Anfrage senden</span>
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
        </div>
      </div>
    </>
  );
}
