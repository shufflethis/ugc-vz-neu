'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { trackUGCEvents } from '../app/lib/analytics';

interface NoResultsProps {
  query: string;
}

const NoResults: React.FC<NoResultsProps> = ({ query }) => {
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    message: '',
    website: ''
  });
  const [submissionId, setSubmissionId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientInfo.name.trim()) {
      toast.error('Bitte geben Sie Ihren Namen ein');
      trackUGCEvents.leadFormError('no_results', 'missing_name');
      return;
    }

    if (!clientInfo.email.trim()) {
      toast.error('Bitte geben Sie Ihre E-Mail-Adresse ein');
      trackUGCEvents.leadFormError('no_results', 'missing_email');
      return;
    }

    setSubmitLoading(true);
    const requestSubmissionId = submissionId
      || globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random()}`;
    if (!submissionId) setSubmissionId(requestSubmissionId);

    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorIds: [], // Leere Liste, da keine Creator gefunden wurden
          clientInfo: {
            ...clientInfo,
            submissionId: requestSubmissionId,
            noResultsQuery: query, // Die Suchanfrage, die keine Ergebnisse lieferte
            requestType: 'no_results_found', // Markierung, dass es sich um eine Anfrage ohne Ergebnisse handelt
            sourcePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
            sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const err = new Error(data.error || 'Failed to submit') as Error & { userMessage?: string };
        if (typeof data.message === 'string' && data.message) err.userMessage = data.message;
        throw err;
      }

      toast.success('Deine Anfrage wurde gesendet! Wir prüfen passende Alternativen und melden uns per E-Mail.');
      setClientInfo({ name: '', email: '', message: '', website: '' });
      setSubmissionId('');
      setSubmitLoading(false);

      // Track successful contact form submission
      trackUGCEvents.contactForm('no_results');
      trackUGCEvents.requestSuccess('no_results', 0);
    } catch (error) {
      console.error('Error submitting request:', error);
      trackUGCEvents.leadFormError('no_results', 'submit_failed');
      const userMessage = (error as { userMessage?: string } | null)?.userMessage;
      toast.error(userMessage || 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
      setSubmitLoading(false);
    }
  };

  return (
    <div className="text-center py-12 px-6 mb-24">
      <div className="surface-card rounded-2xl p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-ink-soft"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-semibold text-ink mb-4">
          Leider keine Ergebnisse gefunden
        </h3>

        <p className="text-ink-soft mb-6 leading-relaxed">
          Für deine Suchanfrage <span className="text-geo-violet font-medium">&ldquo;{query}&rdquo;</span> konnten wir keine passenden UGC Creator in unserer aktuellen Datenbank finden.
        </p>

        <div className="surface-card rounded-xl p-6 mb-6">
          <h4 className="text-lg font-medium text-geo-violet mb-3">
            Wir suchen passende Creator manuell für dich
          </h4>
          <p className="text-ink-soft mb-4 text-sm leading-relaxed">
            Schick uns kurz deine Kontaktdaten – wir prüfen dein Briefing persönlich, recherchieren weitere Creator aus unserem Netzwerk oder schlagen dir passende Alternativen vor.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
            >
              <label htmlFor="no-results-website">Website</label>
              <input
                type="text"
                id="no-results-website"
                tabIndex={-1}
                autoComplete="off"
                value={clientInfo.website}
                onChange={(e) => setClientInfo({ ...clientInfo, website: e.target.value })}
              />
            </div>
            <div className="flex flex-col text-left">
              <label htmlFor="no-results-name" className="text-sm text-ink-soft mb-1">Dein Name *</label>
              <input
                type="text"
                id="no-results-name"
                value={clientInfo.name}
                onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet"
                placeholder="Vor- und Nachname"
                required
              />
            </div>

            <div className="flex flex-col text-left">
              <label htmlFor="no-results-email" className="text-sm text-ink-soft mb-1">E-Mail *</label>
              <input
                type="email"
                id="no-results-email"
                value={clientInfo.email}
                onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet"
                placeholder="name@deinebrand.de"
                required
              />
            </div>
            
            <div className="flex flex-col text-left">
              <label htmlFor="no-results-message" className="text-sm text-ink-soft mb-1">Kurzbriefing (Budget, Timing, Format)</label>
              <textarea
                id="no-results-message"
                value={clientInfo.message}
                onChange={(e) => setClientInfo({...clientInfo, message: e.target.value})}
                rows={3}
                placeholder="z. B. 3 Produktvideos für Meta Ads, Budget ca. 250 € pro Video, Start innerhalb von 2 Wochen"
                className="bg-white border border-hairline rounded-lg px-4 py-2 text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-geo-violet text-white rounded-xl hover:bg-geo-violet-soft transition-all font-semibold"
              disabled={submitLoading}
            >
              {submitLoading ? 'Wird gesendet …' : 'Kostenlose Creator-Suche anfragen'}
            </button>
          </form>

          <p className="mt-4 text-xs text-ink-soft">
            Dringende Kampagne?{' '}
            <a
              href="https://book.agentifizierung.de/gorden/intro-call?overlayCalendar=true"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-geo-violet underline hover:no-underline"
            >
              Direkt 15-Min-Kurzgespräch buchen →
            </a>
          </p>
        </div>

        <div className="text-left">
          <h5 className="text-sm font-medium text-ink-soft mb-3">Oder probiere es in der Suche mit:</h5>
          <ul className="text-sm text-ink-soft space-y-1">
            <li>• Anderen Suchbegriffen oder breiterer Branche</li>
            <li>• Weniger einschränkenden Kriterien (z. B. ohne feste Stadt)</li>
            <li>• Alternativen Plattformen (TikTok, Instagram Reels, YouTube Shorts)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoResults;
