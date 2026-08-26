'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/search.css';
import styles from '../styles/search.module.css';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NoResults from '../../components/NoResults';
import CreatorSelectionPopup from './CreatorSelectionPopup';
import { trackUGCEvents } from '../lib/analytics';
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
import { useSearch } from '../hooks/useSearch';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface SearchBoxProps {
  initialQuery?: string;
}

export default function SearchBox({ initialQuery = '' }: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const lastTrackedResultsRef = useRef('');
  const lastTrackedNoResultsRef = useRef('');

  // Use custom hooks
  const { isIOSDeviceState, isMobileDeviceState } = useDeviceDetection();
  const {
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
  } = useSearch();

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
      searchInputRef.current.style.height = Math.max(90, searchInputRef.current.scrollHeight) + 'px';
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

      trackUGCEvents.creatorView(creatorId, platform);
    }
  };

  // State for contact form
  const [showContactForm, setShowContactForm] = useState(false);

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
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      // Track successful contact form submission
      trackUGCEvents.contactForm('creator_selection');
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

      // Reset nur die Auswahl nach erfolgreichem Senden
      clearSelection();
    } catch (error) {
      console.error('Submit error:', error);
      throw error; // Re-throw to be handled by the popup
    }
  };

  return (
    <div className={styles.searchContainer}>
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
          placeholder="z.B. Kosmetik, unter 35 Jahre, TikTok..."
          className={`${styles.searchInput} text-slate-900 bg-white placeholder-slate-500`}
          disabled={isLoading}
          rows={1}
        />

        <button
          onClick={handleStartSearch}
          disabled={isLoading}
          aria-label="Suche starten"
          className="search-button-gradient p-4 rounded-lg flex items-center justify-center focus:outline-none hover:opacity-90 transition-opacity"
          style={{
            minWidth: '60px',
            height: '60px'
          }}
        >
          {isLoading ? (
            <span className="text-white text-sm font-medium">...</span>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
          )}
        </button>

        <div className="relative group">
          <button
            onClick={toggleVoiceInput}
            disabled={isLoading || isIOSDeviceState || !browserSupportsSpeechRecognition}
            aria-label={isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
            className={`p-4 rounded-lg flex items-center justify-center focus:outline-none transition-opacity ${
              isIOSDeviceState || !browserSupportsSpeechRecognition
                ? 'bg-hairline cursor-not-allowed opacity-50'
                : 'mic-button-gradient hover:opacity-90'
            }`}
            style={{
              minWidth: '60px',
              height: '60px'
            }}
            title={isIOSDeviceState ? 'Spracherkennung ist auf iOS-Geräten nicht verfügbar' : !browserSupportsSpeechRecognition ? 'Spracherkennung wird von Ihrem Browser nicht unterstützt' : isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          >
            {isListening ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
                <path d="M19 11a7 7 0 01-14 0H3a9 9 0 008 8.94V23h2v-3.06A9 9 0 0021 11h-2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" strokeWidth={2} />
              </svg>
            )}
          </button>

          {/* CRITICAL: Only show listening indicator if NOT on iOS */}
          {isListening && !isIOSDeviceState && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse"></span>}
          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-ink text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
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
      <p className="mt-3 text-xs text-ink-soft/80 leading-relaxed flex items-start gap-2">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-geo-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          Die KI hilft nur, deine Suchanfrage zu verstehen und passende Creator zu sortieren. Die finale Auswahl triffst du selbst. An OpenRouter wird nur deine Suchanfrage gesendet, keine Creator-Datenbank.
        </span>
      </p>

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
              Suche in <span className="text-geo-violet font-semibold">470+ echten Creator-Profilen</span> nach passenden Treffern.
            </p>
          </div>
        </div>
      )}

      {/* Chat container and Results display */}
      <div>
        {/* Chat container - just show user message in bubble */}
        {searchSubmitted && (
          <div className={styles.chatContainer}>
            {/* User message bubble */}
            <div className={styles.userMessage}>
              <div className={styles.userBubble}>
                {submittedQuery}
              </div>
            </div>

            {/* Show reasoning only when available */}
            {reasoning && (
              <div className={styles.reasoningContainer}>
                <h3>Analyse der Suchanfrage:</h3>
                <pre className={styles.reasoningText}>{reasoning}</pre>
              </div>
            )}
          </div>
        )}

        {/* Results display */}
        {creators.length > 0 && (
          <> {/* Use fragment to group elements */}
            <h2 className={styles.resultsHeader}>Klicke dir die passenden UGC Creator zusammen. Die Anfrage ist kostenlos und du bekommst die verfuegbaren Kontaktinfos per E-Mail.</h2> {/* Add header */}
            <p className="mb-5 text-center text-sm text-ink-soft">
              Die Sortierung ist ein Vorschlag aus deiner Suche und den Profilangaben. Es findet keine automatische Entscheidung ueber Creator oder Auftraege statt.
            </p>
            <div className={styles.creatorsGrid}>
              {creators.map(creator => (
                <div
                  key={creator.id}
                  className={`${styles.creatorCard} ${selectedCreators.includes(creator.id) ? styles.selected : ''}`} // Add selected class
                  onClick={() => handleSelectCreator(creator.id)} // Add click handler
                >
                  <img
                    src={creator.image || (creator.gender === 'Weiblich' ? '/female-placeholder.webp' : '/placeholder.jpg')}
                    alt={creator.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Ensure correct gender-specific placeholder on error
                      if (creator.gender === 'Weiblich') {
                        target.src = '/female-placeholder.webp';
                      } else {
                        target.src = '/placeholder.jpg'; // For 'Männlich' and any other values
                      }
                      console.log(`Image error for ${creator.name} (${creator.gender}), using: ${target.src}`);
                    }}
                  />
                  <h3>{creator.name}</h3>
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
      </div>
    </div>
  );
}
