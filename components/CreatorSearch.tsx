'use client';

import { useState } from 'react';

export default function CreatorSearch() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/creators?' + new URLSearchParams({
        query: prompt
      }));
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('Failed to fetch creators');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe den UGC Creator, den du suchst..."
            className="w-full h-32 p-4 bg-gray-800/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Suche...' : 'Creator finden'}
          </button>
        </form>

        {response && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <pre className="text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}