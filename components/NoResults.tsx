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
    message: ''
  });
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

    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorIds: [], // Leere Liste, da keine Creator gefunden wurden
          clientInfo: {
            ...clientInfo,
            noResultsQuery: query, // Die Suchanfrage, die keine Ergebnisse lieferte
            requestType: 'no_results_found', // Markierung, dass es sich um eine Anfrage ohne Ergebnisse handelt
            sourcePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
            sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success('Ihre Anfrage wurde erfolgreich gesendet!');
      setClientInfo({ name: '', email: '', message: '' });
      setSubmitLoading(false);

      // Track successful contact form submission
      trackUGCEvents.contactForm('no_results');
    } catch (error) {
      console.error('Error submitting request:', error);
      trackUGCEvents.leadFormError('no_results', 'submit_failed');
      toast.error('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      setSubmitLoading(false);
    }
  };

  return (
    <div className="text-center py-12 px-6 mb-24">
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 max-w-2xl mx-auto">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
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

        <h3 className="text-2xl font-semibold text-white mb-4">
          Leider keine Ergebnisse gefunden
        </h3>

        <p className="text-gray-300 mb-6 leading-relaxed">
          Für Ihre Suchanfrage <span className="text-emerald-400 font-medium">"{query}"</span> konnten wir keine passenden UGC Creator in unserer aktuellen Datenbank finden.
        </p>

        <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl p-6 border border-emerald-500/30 mb-6">
          <h4 className="text-lg font-medium text-emerald-300 mb-3">
            Wir helfen Ihnen gerne weiter!
          </h4>
          <p className="text-gray-300 mb-4 text-sm leading-relaxed">
            Kontaktieren Sie uns - wir können die Anfrage manuell prüfen, weitere passende Creator recherchieren oder ergänzend KI-UGC-Ansätze für Ihre Kampagne vorschlagen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col text-left">
              <label htmlFor="name" className="text-sm text-gray-300 mb-1">Name *</label>
              <input 
                type="text" 
                id="name" 
                value={clientInfo.name}
                onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex flex-col text-left">
              <label htmlFor="email" className="text-sm text-gray-300 mb-1">E-Mail *</label>
              <input
                type="email"
                id="email"
                value={clientInfo.email}
                onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            
            <div className="flex flex-col text-left">
              <label htmlFor="message" className="text-sm text-gray-300 mb-1">Nachricht</label>
              <textarea 
                id="message" 
                value={clientInfo.message}
                onChange={(e) => setClientInfo({...clientInfo, message: e.target.value})}
                rows={3}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-all font-medium"
              disabled={submitLoading}
            >
              {submitLoading ? 'Wird gesendet...' : 'Go'}
            </button>
          </form>
        </div>

        <div className="text-left">
          <h5 className="text-sm font-medium text-gray-400 mb-3">Versuchen Sie es mit:</h5>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Anderen Suchbegriffen oder Branchen</li>
            <li>• Weniger spezifischen Kriterien</li>
            <li>• Alternativen Plattformen (TikTok, Instagram, YouTube)</li>
            <li>• Anderen Altersgruppen oder Zielgruppen</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoResults;
