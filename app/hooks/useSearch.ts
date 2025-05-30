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
      // Try main API first, fallback to simple API if it fails
      const trySearch = async (apiEndpoint: string) => {
        return fetch(apiEndpoint, {
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
      };

      // Try main API first
      const response = await trySearch('/api/search');
      let data;

      if (response.ok) {
        data = await response.json();
      } else if (response.status === 503 || response.status === 504) {
        // Try fallback API for 503/504 errors
        const fallbackResponse = await trySearch('/api/search-simple');
        if (fallbackResponse.ok) {
          data = await fallbackResponse.json();
        } else {
          throw new Error(`Both APIs failed. Main: ${response.status}, Fallback: ${fallbackResponse.status}`);
        }
      } else {
        throw new Error(`API failed with status: ${response.status}`);
      }

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

    // Fetch reasoning separately
    try {
      const reasoningResponse = await fetch('/api/reasoning', {
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

      if (reasoningResponse.ok) {
        const reasoningData = await reasoningResponse.json();
        if (reasoningData && reasoningData.success) {
          setReasoning(reasoningData.reasoning);
        }
      }
    } catch (error) {
      // Reasoning is optional, don't show error to user
      console.error('Error fetching reasoning:', error);
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
    resetSearch
  };
};
