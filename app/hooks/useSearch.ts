'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { MAX_CREATORS_PER_REQUEST } from '@/app/lib/lead-limits';
import type { SearchCreator } from '../lib/creator-public';
import { trackUGCEvents } from '../lib/analytics';

export const useSearch = () => {
  const [creators, setCreators] = useState<SearchCreator[]>([]);
  const [searchError, setSearchError] = useState('');
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
    setSelectedCreators([]);
    setReasoning('');
    setShowNoResults(false);
    setSearchError('');
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
        throw new Error('search_failed');
      }
    } catch (error: any) {
      setSearchError('Die Suche ist gerade nicht verfügbar. Bitte versuche es erneut.');
      trackUGCEvents.searchError();
    } finally {
      setIsLoading(false);
    }

  };

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators(prev => {
      if (prev.includes(creatorId)) return prev.filter(id => id !== creatorId);
      // Server nimmt max. MAX_CREATORS_PER_REQUEST an -- hier schon stoppen,
      // statt beim Absenden mit 400 zu scheitern.
      if (prev.length >= MAX_CREATORS_PER_REQUEST) {
        toast.info(`Maximal ${MAX_CREATORS_PER_REQUEST} Creator pro Anfrage. Bitte erst abschicken, dann weitere auswählen.`, { toastId: 'max-creators' });
        return prev;
      }
      return [...prev, creatorId];
    });
  };

  const resetSearch = () => {
    setCreators([]);
    setReasoning('');
    setIsLoading(false);
    setSearchSubmitted(false);
    setSubmittedQuery('');
    setSelectedCreators([]);
    setShowNoResults(false);
    setSearchError('');
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
    searchError,
    performSearch,
    toggleCreatorSelection,
    resetSearch,
    clearSelection
  };
};
