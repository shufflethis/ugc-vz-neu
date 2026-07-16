'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function ContactPopup({ 
  isOpen, 
  onClose, 
  title = "Kontakt aufnehmen",
  subtitle = "Schreiben Sie uns eine Nachricht und wir melden uns schnellstmöglich bei Ihnen zurück."
}: ContactPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    website: ''
  });
  const [submissionId, setSubmissionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const requestSubmissionId = submissionId
      || globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random()}`;
    if (!submissionId) setSubmissionId(requestSubmissionId);

    try {
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact',
          creatorIds: [],
          clientInfo: {
            ...formData,
            requestType: 'general_contact',
            submissionId: requestSubmissionId,
            sourcePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
            sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          }
        }),
      });

      if (response.ok) {
        toast.success('Ihre Nachricht wurde gesendet. Eine Bestätigung ist per E-Mail unterwegs.');
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: '',
          message: '',
          website: ''
        });
        setSubmissionId('');
        onClose();
      } else {
        throw new Error('Fehler beim Senden');
      }
    } catch (error) {
      toast.error('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-hairline">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink mb-2">{title}</h2>
            <p className="text-ink-soft">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label htmlFor="contact-company-website">Website</label>
            <input
              type="text"
              id="contact-company-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink-soft mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-hairline rounded-lg text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent"
                placeholder="Ihr Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft mb-2">
                E-Mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-hairline rounded-lg text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent"
                placeholder="ihre@email.de"
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-ink-soft mb-2">
              Unternehmen
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-hairline rounded-lg text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent"
              placeholder="Ihr Unternehmen (optional)"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-ink-soft mb-2">
              Betreff *
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-hairline rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent"
            >
              <option value="">Bitte wählen...</option>
              <option value="Allgemeine Frage">Allgemeine Frage</option>
              <option value="Creator-Suche">Creator-Suche</option>
              <option value="Technischer Support">Technischer Support</option>
              <option value="Partnerschaft">Partnerschaft</option>
              <option value="Feedback">Feedback</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-ink-soft mb-2">
              Nachricht *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-hairline rounded-lg text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-geo-violet focus:border-transparent resize-none"
              placeholder="Beschreiben Sie Ihr Anliegen..."
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-geo-violet hover:bg-geo-violet-soft disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Nachricht senden
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none border-2 border-geo-violet text-geo-violet hover:bg-geo-violet hover:text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
