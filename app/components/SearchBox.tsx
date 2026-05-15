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
import { useCountdown } from '../hooks/useCountdown';
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

  const {
    countdownActive,
    countdownValue,
    waitingForSearch,
    aiThinking,
    startCountdown,
    stopCountdown
  } = useCountdown();

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setSearchQuery(transcript);
    startCountdown();
    // Track voice search start
    trackUGCEvents.voiceSearchStart();
    // Perform search after countdown
    setTimeout(() => {
      performSearch(transcript);
      stopCountdown();
      // Track voice search completion
      trackUGCEvents.voiceSearchEnd(true);
    }, 3000);
  }, [performSearch, startCountdown, stopCountdown]);

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
    if (!submittedQuery || isLoading || countdownActive) return;

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
  }, [submittedQuery, creators.length, showNoResults, isLoading, countdownActive]);

  // Handle manual search button click
  const handleStartSearch = () => {
    if (searchQuery.trim()) {
      trackUGCEvents.searchStart(searchQuery.trim());
      startCountdown();
      // Perform search after countdown
      setTimeout(() => {
        performSearch(searchQuery.trim());
        stopCountdown();
      }, 3000);
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
          disabled={countdownActive || waitingForSearch || isLoading}
          rows={1}
        />

        <button
          onClick={handleStartSearch}
          disabled={countdownActive || waitingForSearch || isLoading}
          aria-label="Search"
          className="search-button-gradient p-4 rounded-lg flex items-center justify-center focus:outline-none hover:opacity-90 transition-opacity"
          style={{
            minWidth: '60px',
            height: '60px'
          }}
        >
          {isLoading ? 'Suche läuft...' :
           countdownActive ? countdownValue :
           waitingForSearch ? '...' : <span className="material-icons text-white text-2xl">search</span>}
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

      {/* Countdown display */}
      {countdownActive && (
        <div className="text-white text-center mt-2 bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
          <div className="flex flex-col items-center">
            <span className="font-medium text-blue-400 text-lg mb-2">Suche startet in</span>
            <span className={`text-5xl font-bold text-white bg-blue-500/20 w-16 h-16 flex items-center justify-center rounded-full border-2 border-blue-500/50 ${styles.countdown}`}>
              {countdownValue}
            </span>
            <p className="mt-2 text-gray-300">Ergänzen Sie Ihre Anfrage oder warten Sie auf den Start</p>
          </div>
        </div>
      )}

      {/* Enhanced AI Thinking display with database visualization */}
      {waitingForSearch && (
        <div className="text-white text-center mt-2 bg-emerald-900/30 p-4 rounded-lg border border-emerald-500/50">
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-3 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 p-2 rounded-lg border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="font-medium text-emerald-400 text-lg">KI durchsucht Datenbank</span>
              <div className="ml-2 w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shadow-md shadow-emerald-500/20"></div>
            </div>

            {/* Database processing visualization */}
            <div className="w-full max-w-md bg-black/40 p-3 rounded-lg border border-emerald-500/30 mb-3 font-mono text-sm shadow-lg shadow-emerald-900/30 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                <span className="text-emerald-300 font-semibold">Datenbankabfrage läuft...</span>
              </div>

              <div className="text-left text-emerald-100/80 mb-2 bg-black/30 p-2 rounded-md border border-emerald-500/20 font-mono">
                <span className="text-pink-400">$</span> <span className="text-yellow-400">db.creators</span>.<span className="text-blue-400">find</span>(&#123; <span className="text-green-400">keywords</span>: [<span className="text-orange-400">"{searchQuery.split(' ').join('", "')}"</span>] &#125;)
              </div>

              <div className="flex items-center space-x-2 bg-emerald-500/20 px-3 py-2 rounded-lg border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <span className="text-emerald-200 font-medium">{aiThinking}</span>
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-300/50"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-300/50" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-300/50" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>

              {/* Enhanced Progress bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden shadow-inner shadow-black/50">
                <div className={`h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full ${styles['animate-progress']}`}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-md px-2 mt-3 bg-black/30 p-2 rounded-lg border border-emerald-500/20">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-300 text-sm">Kunde will: <span className="text-emerald-300 font-medium">"{searchQuery}"</span></p>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <p className="text-gray-300 text-sm">Durchsuche <span className="text-emerald-300 font-medium">1.253</span> Profile</p>
              </div>
            </div>
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
            {reasoning && !countdownActive && (
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
            <h2 className={styles.resultsHeader}>Klicke dir die UGC Leute zusammen, und stell eine Anfrage über das Formular</h2> {/* Add header */}
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
