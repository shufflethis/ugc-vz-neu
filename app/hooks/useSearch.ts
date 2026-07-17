'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  gender?: string;
}

export const useSearch = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [showNoResults, setShowNoResults] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    const queryToUse = query.trim();
    setSubmittedQuery(queryToUse);
    setSearchSubmitted(true);

    // Reset previous search state
    setCreators([]);
    setReasoning('');
    setShowNoResults(false);
    setIsLoading(true);

    const requestId = Date.now().toString();

    try {
      const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache, no-store'
          },
          body: JSON.stringify({
            query: queryToUse,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            isTest: false
          })
        });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `API failed with status: ${response.status}`);

      if (data.success) {
        const creatorCount = data.creators?.length || 0;
        if (creatorCount > 0) {
          setCreators(data.creators);
          if (data.reasoning) {
            setReasoning(data.reasoning);
          }
        } else {
          setShowNoResults(true);
        }
      } else {
        toast.error(`Suche fehlgeschlagen: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error: any) {
      toast.error(`Fehler bei der Suche: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }

  };

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const resetSearch = () => {
    setCreators([]);
    setReasoning('');
    setIsLoading(false);
    setSearchSubmitted(false);
    setSubmittedQuery('');
    setSelectedCreators([]);
    setShowNoResults(false);
  };

  const clearSelection = () => {
    setSelectedCreators([]);
  };

  return {
    creators,
    reasoning,
    isLoading,
    searchSubmitted,
    submittedQuery,
    selectedCreators,
    showNoResults,
    performSearch,
    toggleCreatorSelection,
    resetSearch,
    clearSelection
  };
};
