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
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gray-900 rounded-xl p-4 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what kind of creator you're looking for..."
            className="w-full h-32 p-4 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Find Creators'}
          </button>
        </form>

        {response && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <pre className="text-sm text-gray-300 overflow-auto">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}