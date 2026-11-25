'use client';

import { useRef, useState } from 'react';
import type { CastingFilter } from '../lib/casting';
import { toast } from 'react-toastify';
import { MAX_CREATORS_PER_REQUEST } from '@/app/lib/lead-limits';
import type { SearchCreator } from '../lib/creator-public';
import { trackUGCEvents } from '../lib/analytics';

export type SearchAnalysis = {
  gender?: string;
  castingFilters?: CastingFilter[];
  platforms?: string[];
  topics?: string[];
  location?: string | null;
  keywords?: string[];
  ageRange?: { min: number | null; max: number | null };
  priceRange?: { min: number | null; max: number | null };
};

export const useSearch = () => {
  const [creators, setCreators] = useState<SearchCreator[]>([]);
  const [showingAlternatives, setShowingAlternatives] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [analysis, setAnalysis] = useState<SearchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [showNoResults, setShowNoResults] = useState(false);

  const latestRequest = useRef(0);
  const [removedFilters, setRemovedFilters] = useState<CastingFilter[]>([]);

  const performSearch = async (query: string, removed: CastingFilter[] = []) => {
    if (!query.trim()) return;

    const queryToUse = query.trim();
    const sequence = ++latestRequest.current;
    setRemovedFilters(removed);
    setSubmittedQuery(queryToUse);
    setSearchSubmitted(true);

    // Reset previous search state
    setCreators([]);
    setShowingAlternatives(false);
    setSelectedCreators([]);
    setReasoning('');
    setAnalysis(null);
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
            removedFilters: removed,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            isTest: false
          })
        });

      const data = await response.json();
      if (sequence !== latestRequest.current) return;
      if (!response.ok) throw new Error(data.message || `API failed with status: ${response.status}`);

      if (data.success) {
        if (data.analysis) setAnalysis(data.analysis);
        if (data.reasoning) setReasoning(data.reasoning);
        const creatorCount = data.creators?.length || 0;
        if (creatorCount > 0) {
          setCreators(data.creators);
        } else if (data.alternatives?.length) {
          setShowingAlternatives(true);
          setCreators(data.alternatives);
        } else {
          setShowNoResults(true);
        }
      } else {
        throw new Error('search_failed');
      }
    } catch (error: any) {
      if (sequence !== latestRequest.current) return;
      setSearchError('Die Suche ist gerade nicht verfügbar. Bitte versuche es erneut.');
      trackUGCEvents.searchError();
    } finally {
      if (sequence === latestRequest.current) setIsLoading(false);
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
    ++latestRequest.current;
    setRemovedFilters([]);
    setAnalysis(null);
    setCreators([]);
    setShowingAlternatives(false);
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
    analysis,
    isLoading,
    searchSubmitted,
    submittedQuery,
    selectedCreators,
    showNoResults,
    showingAlternatives,
    searchError,
    performSearch,
    removedFilters,
    toggleCreatorSelection,
    resetSearch,
    clearSelection
  };
};
