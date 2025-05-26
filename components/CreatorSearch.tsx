'use client';

import { useState } from 'react';
import CreatorCard from './CreatorCard';

interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
}

interface ClientInfo {
  email: string;
  name?: string;
  message?: string;
}

export default function CreatorSearch() {
  const [emailError, setEmailError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ email: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Submitting search:', prompt);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      });
      
      const data = await res.json();
      console.log('Search response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Search failed');
      }
      
      setCreators(data.creators || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorSelect = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleSubmitSelection = async () => {
    if (selectedCreators.length === 0) return;
    if (!clientInfo.email) {
      // Add error handling here
      return;
    }
    
    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          creatorIds: selectedCreators,
          clientInfo 
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit');
      }
      
      setShowContactForm(false);
      setSelectedCreators([]);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-800/50">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe deine Kampagne und was für einen Creator du suchst..."
            className="w-full h-40 p-4 bg-gray-900/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:outline-none resize-none border border-gray-800/50 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:from-emerald-500 hover:to-blue-500 transition-all disabled:opacity-50 font-medium text-lg"
          >
            {isLoading ? 'Suche läuft...' : 'Passende Creator finden'}
          </button>
        </form>
      </div>

      {creators.length > 0 && (
        <div className="space-y-6">
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
            <p className="text-center text-emerald-300 font-medium">
              Wähle die Accounts aus, die auf den ersten Blick passen – wir senden automatisch die Kontaktdaten
            </p>
          </div>
          
          {/* Creator Grid with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {creators.map(creator => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              isSelected={selectedCreators.includes(creator.id)}
              onSelect={() => handleCreatorSelect(creator.id)}
              className={isLoading ? 'animate-pulse-slow' : ''}
            />
            ))}
          </div>
          
          {selectedCreators.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-900/90 to-blue-900/90 backdrop-blur-md border-t border-emerald-500/30 p-6 shadow-lg">
              <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-emerald-300 font-medium text-lg">{selectedCreators.length} Creator ausgewählt</span>
                  <span className="text-sm text-gray-300">Möchtest du diese Creator kontaktieren?</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedCreators([])}
                    className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-2 rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-colors font-medium flex items-center gap-2"
                  >
                    <span>Anfrage senden</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          {showContactForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full space-y-4">
                <h3 className="text-xl font-semibold">Kontaktinformationen</h3>
                <div className="space-y-1">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={clientInfo.email}
                    onChange={e => {
                      setEmailError('');
                      setClientInfo(prev => ({ ...prev, email: e.target.value }));
                    }}
                    className={`w-full p-2 bg-gray-800 rounded ${emailError ? 'border border-red-500' : ''}`}
                  />
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={clientInfo.name || ''}
                  onChange={e => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-gray-800 rounded"
                />
                <textarea
                  placeholder="Nachricht (optional)"
                  value={clientInfo.message || ''}
                  onChange={e => setClientInfo(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-2 bg-gray-800 rounded h-24 resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                    disabled={submitLoading}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSubmitSelection}
                    disabled={submitLoading}
                    className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Wird gesendet...
                      </>
                    ) : (
                      'Absenden'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
