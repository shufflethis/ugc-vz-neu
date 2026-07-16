'use client';

import { useState } from 'react';
import CreatorSelectionPopup from '../components/CreatorSelectionPopup';

// Mock creator data for testing
const mockCreators = [
  {
    id: 'test1',
    name: 'Anna Müller',
    image: '/female-placeholder.webp',
    reach: 'Instagram: 50k Follower',
    networks: ['Instagram', 'TikTok'],
    priceRange: '500-1000€',
    gender: 'Weiblich'
  },
  {
    id: 'test2',
    name: 'Max Schmidt',
    image: '/placeholder.jpg',
    reach: 'TikTok: 100k Follower',
    networks: ['TikTok', 'YouTube'],
    priceRange: '800-1500€',
    gender: 'Männlich'
  },
  {
    id: 'test3',
    name: 'Lisa Weber',
    image: '/female-placeholder.webp',
    reach: 'YouTube: 25k Abonnenten',
    networks: ['YouTube', 'Instagram'],
    priceRange: '300-800€',
    gender: 'Weiblich'
  }
];

export default function TestPopupPage() {
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  const handleCreatorToggle = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleSubmit = async (clientInfo: { name: string; email: string; message: string }) => {
    console.log('Form submitted:', { selectedCreators, clientInfo });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset nur die Auswahl, nicht das Popup
    setSelectedCreators([]);
  };

  return (
    <div className="min-h-screen bg-surface text-ink p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-ink">Creator Selection Popup Test</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-ink">Verfügbare Creator:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockCreators.map(creator => (
              <div
                key={creator.id}
                onClick={() => handleCreatorToggle(creator.id)}
                className={`surface-card rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedCreators.includes(creator.id) ? 'ring-2 ring-geo-violet' : ''
                }`}
              >
                <img
                  src={creator.image}
                  alt={creator.name}
                  className="w-16 h-16 rounded-full mx-auto mb-3"
                />
                <h3 className="font-semibold text-center text-ink">{creator.name}</h3>
                <p className="text-sm text-ink-soft text-center">{creator.reach}</p>
                <p className="text-xs text-ink-soft text-center mt-1">{creator.priceRange}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="mb-4">
            {selectedCreators.length > 0
              ? `${selectedCreators.length} Creator ausgewählt - Das Popup sollte automatisch unten erscheinen!`
              : 'Wähle Creator aus, um das Popup zu testen'
            }
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-12 surface-card rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-ink">Test-Anweisungen:</h3>
          <ol className="list-decimal list-inside space-y-2 text-ink-soft">
            <li>Klicke auf einen oder mehrere Creator, um sie auszuwählen</li>
            <li>Das moderne Popup erscheint automatisch am unteren Bildschirmrand</li>
            <li><strong>Wichtig:</strong> Du kannst weiterhin Creator auswählen/abwählen - kein grauer Overlay!</li>
            <li>Das Popup bleibt offen, auch wenn du weitere Creator auswählst</li>
            <li>Nutze den Minimieren-Button (Pfeil) um das Popup zu verkleinern</li>
            <li>Fülle das Formular aus (Name, Email, optional Message)</li>
            <li>Klicke auf &ldquo;Anfrage senden&rdquo; - nur die Auswahl wird zurückgesetzt</li>
            <li>Das X setzt die Auswahl zurück und schließt das Popup</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Hinweis:</strong> Für die Slack-Integration muss die SLACK_WEBHOOK_URL in der .env Datei konfiguriert werden.
            </p>
          </div>
        </div>
      </div>

      {/* Creator Selection Popup */}
      <CreatorSelectionPopup
        selectedCreators={selectedCreators}
        creators={mockCreators}
        isVisible={selectedCreators.length > 0}
        onClose={() => {
          // Nur die Auswahl zurücksetzen, nicht das Popup schließen
          setSelectedCreators([]);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
