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

export interface StructuredSearchFilters {
  category?: string;
  platform?: string;
  city?: string;
  format?: string;
  verifiedOnly?: boolean;
}

const SESSION_SEED_KEY = 'ugcvz_search_session_seed';

function getOrCreateSessionSeed(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  try {
    const existing = window.sessionStorage.getItem(SESSION_SEED_KEY);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_SEED_KEY, created);
    return created;
  } catch {
    return 'fallback-session';
  }
}

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
  const [totalCount, setTotalCount] = useState(0);
  const [lowMatchCount, setLowMatchCount] = useState(false);
  const [detectedCategoryLabel, setDetectedCategoryLabel] = useState<string | null>(null);
  const [searchLogId, setSearchLogId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<StructuredSearchFilters>({});

  const latestRequest = useRef(0);
  const [removedFilters, setRemovedFilters] = useState<CastingFilter[]>([]);

  const performSearch = async (
    query: string,
    removed: CastingFilter[] = [],
    filters: StructuredSearchFilters = activeFilters,
  ) => {
    if (!query.trim()) return;

    const queryToUse = query.trim();
    const sequence = ++latestRequest.current;
    setRemovedFilters(removed);
    setActiveFilters(filters);
    setSubmittedQuery(queryToUse);
    setSearchSubmitted(true);

    setCreators([]);
    setShowingAlternatives(false);
    setSelectedCreators([]);
    setReasoning('');
    setAnalysis(null);
    setShowNoResults(false);
    setSearchError('');
    setTotalCount(0);
    setLowMatchCount(false);
    setDetectedCategoryLabel(null);
    setSearchLogId(null);
    setIsLoading(true);

    const requestId = Date.now().toString();
    const sessionSeed = getOrCreateSessionSeed();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Search-Session': sessionSeed,
          'Cache-Control': 'no-cache, no-store',
        },
        body: JSON.stringify({
          query: queryToUse,
          removedFilters: removed,
          category: filters.category || undefined,
          platform: filters.platform || undefined,
          city: filters.city || undefined,
          format: filters.format || undefined,
          verifiedOnly: filters.verifiedOnly || undefined,
          sessionSeed,
          requestId,
          timestamp: new Date().toISOString(),
          isTest: false,
        }),
      });

      const data = await response.json();
      if (sequence !== latestRequest.current) return;
      if (!response.ok) throw new Error(data.message || `API failed with status: ${response.status}`);

      if (data.success) {
        if (data.analysis) setAnalysis(data.analysis);
        if (data.reasoning) setReasoning(data.reasoning);
        if (typeof data.totalCount === 'number') setTotalCount(data.totalCount);
        setLowMatchCount(Boolean(data.lowMatchCount));
        setDetectedCategoryLabel(typeof data.detectedCategoryLabel === 'string' ? data.detectedCategoryLabel : null);
        setSearchLogId(typeof data.searchLogId === 'number' ? data.searchLogId : null);

        const creatorCount = data.creators?.length || 0;
        if (creatorCount > 0) {
          setCreators(data.creators);
        } else {
          // Spec 8.6: Ehrlicher Leerzustand statt irrelevantem Auffuellen
          setShowNoResults(true);
        }
      } else {
        throw new Error('search_failed');
      }
    } catch {
      if (sequence !== latestRequest.current) return;
      setSearchError('Die Suche ist gerade nicht verfügbar. Bitte versuche es erneut.');
      trackUGCEvents.searchError();
    } finally {
      if (sequence === latestRequest.current) setIsLoading(false);
    }
  };

  const trackSearchClick = (creatorId: string) => {
    if (!searchLogId) return;
    fetch('/api/search/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchLogId, type: 'click', creatorId }),
    }).catch(() => {});
  };

  const trackSearchOutreach = () => {
    if (!searchLogId) return;
    fetch('/api/search/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchLogId, type: 'outreach' }),
    }).catch(() => {});
  };

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators((prev) => {
      if (prev.includes(creatorId)) return prev.filter((id) => id !== creatorId);
      if (prev.length >= MAX_CREATORS_PER_REQUEST) {
        toast.info(
          `Maximal ${MAX_CREATORS_PER_REQUEST} Creator pro Anfrage. Bitte erst abschicken, dann weitere auswählen.`,
          { toastId: 'max-creators' },
        );
        return prev;
      }
      trackSearchClick(creatorId);
      return [...prev, creatorId];
    });
  };

  const resetSearch = () => {
    ++latestRequest.current;
    setRemovedFilters([]);
    setActiveFilters({});
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
    setTotalCount(0);
    setLowMatchCount(false);
    setDetectedCategoryLabel(null);
    setSearchLogId(null);
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
    totalCount,
    lowMatchCount,
    detectedCategoryLabel,
    activeFilters,
    performSearch,
    removedFilters,
    toggleCreatorSelection,
    trackSearchClick,
    trackSearchOutreach,
    resetSearch,
    clearSelection,
  };
};
