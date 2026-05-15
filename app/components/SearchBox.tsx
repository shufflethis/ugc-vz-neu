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
  const handleSubmitSelection = async (clientInfo: { name: string; email: string; message: string }) => {
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
      <div className="mb-4 rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-left text-sm text-gray-200">
        <p>
          Die KI hilft nur dabei, deine Suchanfrage zu verstehen und passende Creator-Vorschlaege zu sortieren.
          Die finale Auswahl triffst du selbst. An OpenRouter wird nur deine Suchanfrage gesendet, keine komplette Creator-Datenbank.
        </p>
      </div>

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
          className={styles.searchInput}
          disabled={isLoading}
          rows={1}
        />

        <button
          onClick={handleStartSearch}
          disabled={isLoading}
          aria-label="Search"
          className="search-button-gradient p-4 rounded-lg flex items-center justify-center focus:outline-none hover:opacity-90 transition-opacity"
          style={{
            minWidth: '60px',
            height: '60px'
          }}
        >
          {isLoading ? '...' : <span className="material-icons text-white text-2xl">search</span>}
        </button>

        <div className="relative group">
          <button
            onClick={toggleVoiceInput}
            disabled={isLoading || isIOSDeviceState || !browserSupportsSpeechRecognition}
            aria-label="Toggle Voice Input"
            className={`p-4 rounded-lg flex items-center justify-center focus:outline-none transition-opacity ${
              isIOSDeviceState || !browserSupportsSpeechRecognition
                ? 'bg-gray-500 cursor-not-allowed opacity-50'
                : 'mic-button-gradient hover:opacity-90'
            }`}
            style={{
              minWidth: '60px',
              height: '60px'
            }}
            title={isIOSDeviceState ? 'Spracherkennung ist auf iOS-Geräten nicht verfügbar' : !browserSupportsSpeechRecognition ? 'Spracherkennung wird von Ihrem Browser nicht unterstützt' : isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          >
            <span className="material-icons text-white text-2xl">
              {isListening ? "mic" : "mic_off"}
            </span>
          </button>

          {/* CRITICAL: Only show listening indicator if NOT on iOS */}
          {isListening && !isIOSDeviceState && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse"></span>}
          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
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

      {/* We don't need to display the transcript separately anymore since it's shown in the chat bubble */}

      {/* Visual indicator when listening - CRITICAL: Only show if NOT on iOS */}
      {isListening && !isIOSDeviceState && (
        <div className="text-white text-center mt-2 bg-red-900/30 p-2 rounded-lg border border-red-500/50 animate-pulse">
          <span className="font-medium text-red-400">Spracherkennung aktiv</span> - Sprechen Sie jetzt...
        </div>
      )}

      {isLoading && (
        <div className="w-full text-white mt-3 bg-emerald-950/30 p-4 rounded-lg border border-emerald-700/40">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm sm:text-base text-gray-200">
              Suche in <span className="text-emerald-300 font-semibold">370+ echten Creator-Profilen</span> nach passenden Treffern.
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
            <p className="mb-5 text-center text-sm text-gray-400">
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
