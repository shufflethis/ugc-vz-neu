'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/search.css';
import styles from '../styles/search.module.css';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NoResults from '../../components/NoResults';
import CreatorSelectionPopup from './CreatorSelectionPopup';
import CreatorProfileDialog from './CreatorProfileDialog';
import { humanizeCreatorText, type SearchCreator } from '../lib/creator-public';
import { NICHE_INDEX } from '../lib/niche-index';
import CreatorAvatar from './CreatorAvatar';
import { trackUGCEvents } from '../lib/analytics';
import { CREATOR_COUNT_LABEL } from '../lib/creator-count';
import { MAX_CREATORS_PER_REQUEST } from '../lib/lead-limits';
import {
  faInstagram,
  faTiktok,
  faYoutube,
  faFacebook,
  faLinkedin,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';

// Import custom hooks
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { useSearch, type SearchAnalysis } from '../hooks/useSearch';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

// WebMCP-Anbindung: Events, ueber die der Agent-Layer diese UI steuert
import { AGENT_UI_EVENTS } from './WebMcpProvider';

interface SearchBoxProps {
  initialQuery?: string;
  showFeatured?: boolean;
}

const understoodSummary = (analysis: SearchAnalysis | null): string => {
  if (!analysis) return '';
  const { min, max } = analysis.ageRange || { min: null, max: null };
  return [
    analysis.gender === 'male' ? 'Männlich' : analysis.gender === 'female' ? 'Weiblich' : '',
    min !== null || max !== null ? `${min ?? '?'}–${max ?? '?'} Jahre` : '',
    Array.isArray(analysis.topics) ? analysis.topics.slice(0, 3).join(', ') : '',
    Array.isArray(analysis.platforms) ? analysis.platforms.join(', ') : '',
  ].filter(Boolean).join(' · ');
};

export default function SearchBox({ initialQuery = '', showFeatured = false }: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [featuredCreators, setFeaturedCreators] = useState<SearchCreator[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(showFeatured);
  const [profileCreator, setProfileCreator] = useState<SearchCreator | null>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const lastTrackedResultsRef = useRef('');
  const lastTrackedNoResultsRef = useRef('');

  // Use custom hooks
  const { isIOSDeviceState, isMobileDeviceState } = useDeviceDetection();
  const {
    creators: searchCreators,
    reasoning,
    analysis,
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
  } = useSearch();

  const creators = searchSubmitted ? searchCreators : featuredCreators;

  useEffect(() => {
    if (!showFeatured) return;
    const controller = new AbortController();
    async function loadFeatured() {
      try {
        const response = await fetch('/api/creators/featured', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data.creators)) setFeaturedCreators(data.creators);
      } catch {
        // The search stays usable when the optional preview is unavailable.
      } finally {
        if (!controller.signal.aborted) setFeaturedLoading(false);
      }
    }
    void loadFeatured();
    return () => controller.abort();
  }, [showFeatured]);

  useEffect(() => { setProfileCreator(null); }, [submittedQuery]);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setSearchQuery(transcript);
    trackUGCEvents.voiceSearchStart();
    performSearch(transcript);
    trackUGCEvents.voiceSearchEnd(true);
  }, [performSearch]);

  const {
    isListening,
    browserSupportsSpeechRecognition,
    toggleVoiceInput
  } = useVoiceRecognition(isIOSDeviceState, isMobileDeviceState, handleVoiceTranscript);

  // --- WebMCP-Agent-Anbindung (app/components/WebMcpProvider.tsx) ---
  // requestId der laufenden Agent-Suche; null = keine Agent-Suche offen.
  const agentSearchRef = useRef<string | null>(null);

  useEffect(() => {
    window.__ugcvzAgentUiReady = true;

    const onAgentSearch = (event: Event) => {
      const { query, requestId } = (event as CustomEvent).detail || {};
      if (typeof query !== 'string' || !query.trim()) return;
      agentSearchRef.current = typeof requestId === 'string' ? requestId : null;
      setSearchQuery(query);
      performSearch(query.trim());
    };

    // Card-Daten, die der Mensch auf der Seite sieht -- gleiche Felder wie im
    // searchResult-Event, damit der Agent beide Ergebnisse gleich lesen kann.
    const toCard = (id: string) => {
      const c = creators.find((creator) => creator.id === id);
      return c
        ? { id: c.id, name: c.name, reach: c.reach, price_range: c.priceRange, networks: c.networks }
        : { id };
    };

    const onAgentSelect = (event: Event) => {
      const { creator_ids, requestId } = (event as CustomEvent).detail || {};
      const ids: string[] = Array.isArray(creator_ids) ? creator_ids.map(String) : [];
      const known = new Set(creators.map((c) => c.id));
      const selected: string[] = [];
      const notFound: string[] = [];
      // Gleiche Obergrenze wie beim Klick: mehr nimmt der Server nicht an.
      let remaining = Math.max(0, MAX_CREATORS_PER_REQUEST - selectedCreators.length);
      for (const id of ids) {
        if (!known.has(id)) {
          notFound.push(id);
          continue;
        }
        // Idempotent auswaehlen: bereits markierte Creator nicht wieder abwaehlen.
        if (selectedCreators.includes(id)) {
          selected.push(id);
          continue;
        }
        if (remaining <= 0) continue;
        toggleCreatorSelection(id);
        selected.push(id);
        remaining -= 1;
      }
      // Gesamtauswahl nach dem Merge: was der Mensch markiert hatte plus die neuen.
      const allSelected = Array.from(new Set([...selectedCreators, ...selected]));
      window.dispatchEvent(
        new CustomEvent(AGENT_UI_EVENTS.selectResult, {
          detail: { requestId, selected, not_found: notFound, all_selected: allSelected },
        }),
      );
    };

    // Rueckkanal Mensch -> Agent: welche Cards hat der Mensch angeklickt?
    const onAgentGetSelection = (event: Event) => {
      const { requestId } = (event as CustomEvent).detail || {};
      window.dispatchEvent(
        new CustomEvent(AGENT_UI_EVENTS.getSelectionResult, {
          detail: {
            requestId,
            selected: selectedCreators.map(toCard),
            visible_total: creators.length,
          },
        }),
      );
    };

    window.addEventListener(AGENT_UI_EVENTS.search, onAgentSearch);
    window.addEventListener(AGENT_UI_EVENTS.select, onAgentSelect);
    window.addEventListener(AGENT_UI_EVENTS.getSelection, onAgentGetSelection);
    return () => {
      delete window.__ugcvzAgentUiReady;
      window.removeEventListener(AGENT_UI_EVENTS.search, onAgentSearch);
      window.removeEventListener(AGENT_UI_EVENTS.select, onAgentSelect);
      window.removeEventListener(AGENT_UI_EVENTS.getSelection, onAgentGetSelection);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creators, selectedCreators]);

  // Ergebnis einer Agent-Suche zurueckmelden, sobald die Suche fertig ist.
  useEffect(() => {
    const requestId = agentSearchRef.current;
    if (!requestId || isLoading) return;
    if (creators.length === 0 && !showNoResults) return;
    agentSearchRef.current = null;
    window.dispatchEvent(
      new CustomEvent(AGENT_UI_EVENTS.searchResult, {
        detail: {
          requestId,
          no_results: showNoResults,
          reasoning: reasoning || undefined,
          creators: creators.map(({ id, name, reach, priceRange, networks }) => ({
            id,
            name,
            reach,
            price_range: priceRange,
            networks,
          })),
        },
      }),
    );
  }, [creators, showNoResults, isLoading, reasoning]);

  // Vorbefuellung ueber das Fragment (#q=...). Ein Fragment erzeugt fuer Crawler
  // keine eigene URL, waehrend ein ?query=-Parameter eine Variante erzeugt, die
  // auf /brands kanonisiert wird. Serverseitiges initialQuery hat Vorrang.
  useEffect(() => {
    if (initialQuery) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#q=')) return;
    try {
      setSearchQuery(decodeURIComponent(hash.slice(3).replace(/\+/g, ' ')));
    } catch {
      // Ungueltige Prozent-Sequenz im Fragment: Vorbefuellung ueberspringen.
    }
  }, [initialQuery]);

  // Effect to adjust textarea height when content changes
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.style.height = 'auto';
      searchInputRef.current.style.height = Math.max(72, searchInputRef.current.scrollHeight) + 'px';
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!submittedQuery || isLoading) return;

    if (creators.length > 0) {
      const key = `${submittedQuery}:${creators.length}`;
      if (lastTrackedResultsRef.current !== key) {
        trackUGCEvents.search(submittedQuery, creators.length);
        lastTrackedResultsRef.current = key;
      }
    } else if (showNoResults && lastTrackedNoResultsRef.current !== submittedQuery) {
      trackUGCEvents.searchNoResults(submittedQuery);
      lastTrackedNoResultsRef.current = submittedQuery;
    }
  }, [submittedQuery, creators.length, showNoResults, isLoading]);

  // Handle manual search button click
  const handleStartSearch = () => {
    if (searchQuery.trim()) {
      trackUGCEvents.searchStart(searchQuery.trim());
      performSearch(searchQuery.trim());
    } else {
      toast.warning("Bitte geben Sie einen Suchbegriff ein");
    }
  };

  // Function to handle creator selection - use the hook function
  const handleSelectCreator = (creatorId: string) => {
    toggleCreatorSelection(creatorId);
    // Track creator selection
    const creator = creators.find(c => c.id === creatorId);
    if (creator) {
      // Extract platform from reach text
      const reachText = creator.reach.toLowerCase();
      let platform = 'unknown';
      if (reachText.includes('instagram')) platform = 'instagram';
      else if (reachText.includes('tiktok')) platform = 'tiktok';
      else if (reachText.includes('youtube')) platform = 'youtube';
      else if (reachText.includes('facebook')) platform = 'facebook';

      if (selectedCreators.includes(creatorId)) trackUGCEvents.creatorDeselected(creatorId, platform);
      else if (selectedCreators.length < MAX_CREATORS_PER_REQUEST) trackUGCEvents.creatorSelected(creatorId, platform);
    }
  };

  // Handle form submission
  const handleSubmitSelection = async (clientInfo: {
    name: string;
    email: string;
    message: string;
    website: string;
    submissionId: string;
  }) => {
    if (selectedCreators.length === 0) return;

    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorIds: selectedCreators,
          clientInfo: {
            ...clientInfo,
            searchQuery: submittedQuery,
            sourcePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
            sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // `message` ist die deutsche Meldung vom Server (z.B. zu viele
        // Creator), `error` der englische Code -- das Popup zeigt userMessage.
        const submitError = new Error(data.error || 'Failed to submit') as Error & { userMessage?: string };
        if (typeof data.message === 'string' && data.message) submitError.userMessage = data.message;
        throw submitError;
      }

      // Track successful contact form submission
      trackUGCEvents.contactForm('creator_selection');
      trackUGCEvents.requestSuccess('creator_selection', selectedCreators.length);
      // Track individual creator contacts
      selectedCreators.forEach(creatorId => {
        const creator = creators.find(c => c.id === creatorId);
        if (creator) {
          const reachText = creator.reach.toLowerCase();
          let platform = 'unknown';
          if (reachText.includes('instagram')) platform = 'instagram';
          else if (reachText.includes('tiktok')) platform = 'tiktok';
          else if (reachText.includes('youtube')) platform = 'youtube';
          else if (reachText.includes('facebook')) platform = 'facebook';

          trackUGCEvents.creatorContact(creatorId, platform);
        }
      });

      // WebMCP: leadId der abgeschickten Anfrage fuer get_last_outreach melden
      if (data.leadId) {
        window.dispatchEvent(
          new CustomEvent(AGENT_UI_EVENTS.outreachSubmitted, { detail: { leadId: String(data.leadId) } }),
        );
      }

      // Reset nur die Auswahl nach erfolgreichem Senden
      clearSelection();
    } catch (error) {
      console.error('Submit error:', error);
      throw error; // Re-throw to be handled by the popup
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className="mb-4 flex w-full flex-wrap items-center gap-2" aria-label="Beispiel-Briefings">
        <span className="mr-1 hidden text-xs text-ink-soft sm:inline">Zum Beispiel:</span>
        {NICHE_INDEX.map(({ chip: label, query }) => <button key={label} type="button" disabled={isLoading} onClick={() => { setSearchQuery(query); searchInputRef.current?.focus(); }} className="rounded-full border border-hairline bg-surface px-1 py-2 text-[11px] font-medium text-ink transition-colors hover:border-geo-violet hover:bg-white focus-visible:ring-2 focus-visible:ring-geo-violet disabled:opacity-50 min-[375px]:px-2 sm:px-3 sm:text-sm">{label}</button>)}
      </div>
      {/* Search input */}
      <div className={styles.searchInputContainer}>
        <textarea
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Auto-resize the textarea based on content
            e.target.style.height = 'auto';
            e.target.style.height = Math.max(60, e.target.scrollHeight) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleStartSearch();
            }
          }}
          aria-label="Beschreibe dein Produkt und den gewünschten Content"
          placeholder="Produkt, Zielgruppe, Videoformat – und ob bezahlt oder gegen Ware …"
          className={`${styles.searchInput} text-slate-900 bg-white placeholder-slate-500`}
          disabled={isLoading}
          rows={1}
        />

        <button
          onClick={handleStartSearch}
          disabled={isLoading}
          aria-label="Suche starten"
          className="search-button-gradient shrink-0 px-5 py-3 rounded-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2 transition-colors disabled:cursor-wait"
          style={{
            minWidth: '60px',
            minHeight: '52px'
          }}
        >
          {isLoading ? (
            <span className="text-white text-sm font-medium">Suche läuft …</span>
          ) : (
            <>
            <span className="mr-2 whitespace-nowrap text-sm font-semibold text-white">Creator suchen</span>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            </>
          )}
        </button>

        <div className={`relative group ${isIOSDeviceState || !browserSupportsSpeechRecognition ? 'hidden' : ''}`}>
          <button
            onClick={toggleVoiceInput}
            disabled={isLoading || isIOSDeviceState || !browserSupportsSpeechRecognition}
            aria-label={isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
            className={`p-3 rounded-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2 transition-colors ${
              isIOSDeviceState || !browserSupportsSpeechRecognition
                ? 'bg-hairline cursor-not-allowed opacity-50'
                : 'mic-button-gradient hover:bg-hairline'
            }`}
            style={{
              minWidth: '52px',
              height: '52px'
            }}
            title={isIOSDeviceState ? 'Spracherkennung ist auf iOS-Geräten nicht verfügbar' : !browserSupportsSpeechRecognition ? 'Spracherkennung wird von Ihrem Browser nicht unterstützt' : isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          >
            {isListening ? (
              <svg className="w-5 h-5 text-red-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
                <path d="M19 11a7 7 0 01-14 0H3a9 9 0 008 8.94V23h2v-3.06A9 9 0 0021 11h-2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* CRITICAL: Only show listening indicator if NOT on iOS */}
          {isListening && !isIOSDeviceState && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse"></span>}
          <span className="absolute bottom-full right-0 mb-2 w-56 max-w-[calc(100vw-2rem)] bg-ink text-white text-xs text-left rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-normal pointer-events-none">
            {isIOSDeviceState
              ? 'Spracherkennung ist auf iOS-Geräten nicht verfügbar'
              : !browserSupportsSpeechRecognition
                ? 'Spracherkennung wird von Ihrem Browser nicht unterstützt'
                : isListening
                  ? 'Sprachaufnahme beenden'
                  : 'Sprachsuche starten'
            }
          </span>
        </div>
      </div>

      {/* Privacy / KI-Hinweis – dezent unter der Eingabe */}
      <details className="mt-3 w-full text-xs leading-relaxed text-ink-soft">
        <summary className="w-fit cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-geo-violet">Wie funktioniert die KI-Suche?</summary>
        <p className="mt-2 flex items-start gap-2">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-geo-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          Die KI hilft nur, deine Suchanfrage zu verstehen und passende Creator zu sortieren. Die finale Auswahl triffst du selbst. An OpenRouter wird nur deine Suchanfrage gesendet, keine Creator-Datenbank.
        </span>
        </p>
      </details>

      {/* We don't need to display the transcript separately anymore since it's shown in the chat bubble */}

      {/* Visual indicator when listening - CRITICAL: Only show if NOT on iOS */}
      {isListening && !isIOSDeviceState && (
        <div className="text-white text-center mt-2 bg-red-900/30 p-2 rounded-lg border border-red-500/50 animate-pulse">
          <span className="font-medium text-red-400">Spracherkennung aktiv</span> - Sprechen Sie jetzt...
        </div>
      )}

      {isLoading && (
        <div className="w-full text-ink mt-3 bg-surface p-4 rounded-lg border border-hairline">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-geo-violet border-t-transparent rounded-full animate-spin" />
            <p className="text-sm sm:text-base text-ink-soft">
              Suche in <span className="text-geo-violet font-semibold">{CREATOR_COUNT_LABEL} echten Creator-Profilen</span> nach passenden Treffern.
            </p>
          </div>
        </div>
      )}

      {searchError && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-ink"><p role="alert">{searchError}</p><button type="button" onClick={() => performSearch(submittedQuery)} className="mt-3 rounded-lg border border-hairline bg-white px-4 py-2 focus-visible:ring-2 focus-visible:ring-geo-violet">Suche erneut versuchen</button></div>}

      {/* Chat container and Results display */}
      <div className="w-full">
        {/* Chat container - just show user message in bubble */}
        {searchSubmitted && (
          <div className={styles.chatContainer}>
            {/* User message bubble */}
            <div className={styles.userMessage}>
              <div className={styles.userBubble}>
                {submittedQuery}
              </div>
            </div>

            {/* Verstaendnis der Anfrage: kompakte Zusammenfassung, Langfassung zuklappbar */}
            {reasoning && (
              <details className="mt-4 rounded-xl border border-hairline bg-surface p-4 text-sm">
                <summary className="cursor-pointer font-semibold text-ink">
                  So haben wir deine Anfrage verstanden
                  {understoodSummary(analysis) && <span className="font-normal text-ink-soft"> · {understoodSummary(analysis)}</span>}
                </summary>
                <pre className={`${styles.reasoningText} mt-3`}>{reasoning}</pre>
              </details>
            )}
          </div>
        )}

        {/* Results display */}
        {creators.length > 0 && (
          <> {/* Use fragment to group elements */}
            <div className="mt-7 flex flex-col justify-between gap-2 border-t border-hairline pt-6 sm:flex-row sm:items-center">
              <h2 className={styles.resultsHeader}>{searchSubmitted ? 'Deine Creator-Vorschläge' : 'Ein Einblick ins Verzeichnis'}</h2>
              <span className="text-xs text-ink-soft">{searchSubmitted ? `${creators.length} Profile · Stell deine Auswahl zusammen` : 'Öffentliche Profile mit Arbeitsproben'}</span>
            </div>
            <p className="mb-5 mt-2 text-left text-xs leading-5 text-ink-soft sm:text-sm">
              {searchSubmitted ? 'Prüfe Profile und Arbeitsproben. Die Sortierung basiert auf deiner Suche und den Profilangaben; die Auswahl triffst du.' : 'Lerne erste Creator kennen. Für Vorschläge zu deinem Produkt nutze die Suche oben.'}
            </p>
            <div className={`${styles.creatorsGrid} ${!searchSubmitted ? styles.featuredGrid : ''}`} tabIndex={!searchSubmitted ? 0 : undefined} role={!searchSubmitted ? 'region' : undefined} aria-label={!searchSubmitted ? 'Creator-Vorschau' : undefined}>
              {creators.map(creator => (
                <div
                  key={creator.id}
                  className={`${styles.creatorCard} ${selectedCreators.includes(creator.id) ? styles.selected : ''}`} // Add selected class
                >
                  <div className={styles.creatorIdentity}>
                  <CreatorAvatar name={creator.name} image={creator.image} />
                  <div className="min-w-0"><h3 className="break-words">{creator.name}</h3>{creator.city && <p className="line-clamp-1 break-words">{creator.city}</p>}</div>
                  </div>
                  <div className="min-w-0 space-y-2 text-left">
                    {creator.topics && <p className="line-clamp-2 break-words text-sm">{creator.topics}</p>}
                    {creator.preferredContent && <p className="line-clamp-2 break-words text-sm">{creator.preferredContent}</p>}
                    <p className="line-clamp-3 whitespace-pre-line break-words text-sm"><span className="font-semibold">Preisvorstellung: </span>{humanizeCreatorText(creator.priceRange) || 'Nicht angegeben'}</p>
                    <p className="text-xs text-ink-soft">{creator.contactReachable ? '✉ Per E-Mail erreichbar' : 'Kontakt über Social Media'}</p>
                  </div>
                  <div className={styles.networks}>
                    {/* Check which networks are mentioned in the reach text */}
                    {(() => {
                      const reachText = creator.reach.toLowerCase();
                      const networks = [];

                      // Check for Instagram in reach
                      if (reachText.includes('instagram') || reachText.includes('insta')) {
                        networks.push({ name: 'Instagram', icon: faInstagram });
                      }

                      // Check for TikTok in reach
                      if (reachText.includes('tiktok') || reachText.includes('tt')) {
                        networks.push({ name: 'TikTok', icon: faTiktok });
                      }

                      // Check for YouTube in reach
                      if (reachText.includes('youtube') || reachText.includes('yt')) {
                        networks.push({ name: 'YouTube', icon: faYoutube });
                      }

                      // Check for Facebook in reach
                      if (reachText.includes('facebook') || reachText.includes('fb')) {
                        networks.push({ name: 'Facebook', icon: faFacebook });
                      }

                      // Check for LinkedIn in reach
                      if (reachText.includes('linkedin')) {
                        networks.push({ name: 'LinkedIn', icon: faLinkedin });
                      }

                      // Check for Twitter in reach
                      if (reachText.includes('twitter') || reachText.includes('x.com')) {
                        networks.push({ name: 'Twitter', icon: faTwitter });
                      }

                      return networks.map((network, index) => (
                        <span key={index} className={styles.networkTag} title={network.name}>
                          <FontAwesomeIcon icon={network.icon} />
                        </span>
                      ));
                    })()}
                  </div>
                  <div className="mt-auto grid gap-2 pt-4">
                    <button type="button" onClick={() => { setProfileCreator(creator); trackUGCEvents.creatorView(creator.id, 'profile'); }} aria-label={`Profil von ${creator.name} ansehen`} className="rounded-xl border border-hairline bg-white px-3 py-3 text-sm font-semibold text-ink hover:border-geo-violet focus-visible:ring-2 focus-visible:ring-geo-violet">Profil & Arbeitsproben ↗</button>
                    <button type="button" aria-pressed={selectedCreators.includes(creator.id)} aria-label={`${creator.name} ${selectedCreators.includes(creator.id) ? 'aus Auswahl entfernen' : 'zur Auswahl hinzufügen'}`} onClick={() => handleSelectCreator(creator.id)} className={`rounded-xl px-3 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-geo-violet focus-visible:ring-offset-2 ${selectedCreators.includes(creator.id) ? 'bg-[#edf5e5] text-[#385523]' : 'bg-geo-violet text-white hover:bg-[#7531ae]'}`}>{selectedCreators.includes(creator.id) ? '✓ In deiner Auswahl' : '+ Zur Auswahl'}</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modern Creator Selection Popup */}
            <CreatorSelectionPopup
              selectedCreators={selectedCreators}
              creators={creators}
              isVisible={selectedCreators.length > 0}
              onClose={() => {
                // Nur die Auswahl zurücksetzen, Creator-Liste bleibt
                clearSelection();
              }}
              onSubmit={handleSubmitSelection}
            />
          </>
        )}

        {/* No results message */}
        {showNoResults && <NoResults query={submittedQuery} />}
        {showFeatured && !searchSubmitted && featuredLoading && <div className="mt-7 border-t border-hairline pt-6" role="status" aria-label="Creator-Vorschau wird geladen"><h2 className={styles.resultsHeader}>Ein Einblick ins Verzeichnis</h2><p className="mb-5 mt-2 text-xs leading-5 text-ink-soft sm:text-sm">Lerne erste Creator kennen. Für Vorschläge zu deinem Produkt nutze die Suche oben.</p><div className={`${styles.creatorsGrid} ${styles.featuredGrid}`}>{[1, 2, 3].map(index => <div key={index} className={`${styles.creatorCard} min-h-[380px] bg-surface motion-safe:animate-pulse`} />)}</div></div>}
      </div>
      {profileCreator && <CreatorProfileDialog key={profileCreator.id} creator={profileCreator} selected={selectedCreators.includes(profileCreator.id)} onClose={() => setProfileCreator(null)} onSelect={() => handleSelectCreator(profileCreator.id)} />}
    </div>
  );
}
