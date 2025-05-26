'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/search.css';
import styles from '../styles/search.module.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NoResults from '../../components/NoResults';
import {
  faInstagram,
  faTiktok,
  faYoutube,
  faFacebook,
  faLinkedin,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';

// Define types for your data
interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
  gender?: string;
}

export default function SearchBox() {
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [waitingForSearch, setWaitingForSearch] = useState(false);
  const [aiThinking, setAiThinking] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);

  const { browserSupportsSpeechRecognition, finalTranscript } = useSpeechRecognition();

  // Effect to adjust textarea height when content changes
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.style.height = 'auto';
      searchInputRef.current.style.height = Math.max(90, searchInputRef.current.scrollHeight) + 'px';
    }
  }, [searchQuery]);

  // Effect to handle speech recognition transcript updates
  useEffect(() => {
    // When finalTranscript changes and is not empty, update the search query
    if (finalTranscript && !isListening) {
      console.log("Final transcript updated:", finalTranscript);

      // Set the transcript as the search query
      setSearchQuery(finalTranscript);

      // Also set it as the submitted query to show in chat bubble immediately
      setSubmittedQuery(finalTranscript);
      setSearchSubmitted(true);

      // Immediately start the search with the transcript
      if (finalTranscript.trim() !== '') {
        console.log("Immediately starting search with transcript:", finalTranscript);

        // Reset any previous search state
        setCreators([]);
        setReasoning('');
        setShowNoResults(false);
        setWaitingForSearch(false); // Don't show the "KI sucht passende Creator" display
        setIsLoading(false); // Don't show loading state initially

        // Create a unique request ID for debugging
        const requestId = Date.now().toString();

        // Show countdown immediately
        console.log("Starting countdown for visual feedback");
        setCountdownValue(3);
        setCountdownActive(true);

        // Start the API call immediately in the background while countdown runs
        fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache, no-store'
          },
          body: JSON.stringify({
            query: finalTranscript.trim(),
            requestId: requestId,
            timestamp: new Date().toISOString(),
            isTest: false
          })
        })
        .then(response => {
          console.log("🔍 Voice Search API Response Status:", response.status);
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(`API failed with status: ${response.status}`);
          }
        })
        .then(data => {
          console.log("🔍 Voice Search API Response Data:", data);
          if (data.success) {
            const creatorCount = data.creators?.length || 0;
            console.log(`🔍 Voice search found ${creatorCount} creators`);
            if (creatorCount > 0) {
              // Store the results but don't show them until countdown finishes
              setTimeout(() => {
                setCreators(data.creators);
                setIsLoading(false);
                setWaitingForSearch(false);
                setCountdownActive(false);
              }, 3000); // Wait for countdown to finish (3 seconds)

              // Also set reasoning if it's included in the search response
              if (data.reasoning) {
                setReasoning(data.reasoning);
              }
            } else {
              console.warn(`🔍 No creators found for query: "${finalTranscript}"`);
              setTimeout(() => {
                setShowNoResults(true);
                setIsLoading(false);
                setWaitingForSearch(false);
                setCountdownActive(false);
              }, 3000);
            }
          } else {
            console.error("🔍 Search failed:", data.error);
            setTimeout(() => {
              toast.error(`Suche fehlgeschlagen: ${data.error || 'Unbekannter Fehler'}`);
              setIsLoading(false);
              setWaitingForSearch(false);
              setCountdownActive(false);
            }, 3000);
          }
        })
        .catch(error => {
          console.error('🔍 Error during voice search:', error);
          setTimeout(() => {
            toast.error(`Fehler bei der Suche: ${error.message || 'Unbekannter Fehler'}`);
            setIsLoading(false);
            setWaitingForSearch(false);
            setCountdownActive(false);
          }, 3000);
        });

        // Fetch reasoning separately
        fetch('/api/reasoning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache, no-store'
          },
          body: JSON.stringify({
            query: finalTranscript.trim(),
            requestId: requestId,
            timestamp: new Date().toISOString(),
            isTest: false
          })
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return null;
        })
        .then(data => {
          if (data && data.success) {
            setReasoning(data.reasoning);
          }
        })
        .catch(error => {
          console.error('🔍 Error fetching reasoning:', error);
        });
      }
    }
  }, [finalTranscript, isListening]);

  // This function has been replaced by the startSearch function

  // Effect to handle countdown and visual feedback
  useEffect(() => {
    console.log("⏱️ Countdown effect running with:", { countdownActive, countdownValue });

    let countdownTimer: NodeJS.Timeout;
    let thinkingTimer: NodeJS.Timeout;

    if (countdownActive && countdownValue > 0) {
      console.log(`⏱️ Countdown active: ${countdownValue} seconds remaining`);
      countdownTimer = setTimeout(() => {
        console.log(`⏱️ Decreasing countdown from ${countdownValue} to ${countdownValue - 1}`);
        setCountdownValue(prev => prev - 1);
      }, 1000);
    } else if (countdownActive && countdownValue === 0) {
      console.log("⏱️ Countdown reached zero! Showing thinking animation...");
      setCountdownActive(false);
      setWaitingForSearch(true);

      // Enhanced AI thinking simulation with database processing steps
      const thinkingPhrases = [
        "Analysiere Suchanfrage...",
        "Extrahiere Schlüsselwörter: TikTok, Instagram, Reichweite...",
        "Verbinde mit Creator-Datenbank...",
        "Durchsuche 1.253 Creator-Profile...",
        "Filtere nach Plattform und Zielgruppe...",
        "Prüfe Verfügbarkeit und Preisrahmen...",
        "Bewerte Content-Qualität und Engagement...",
        "Sortiere nach Relevanz...",
        "Optimiere Ergebnisse für maximale Conversion...",
        "Bereite Daten für Anzeige vor..."
      ];

      let phraseIndex = 0;
      setAiThinking(thinkingPhrases[0]);
      console.log(`⏱️ Starting thinking animation: "${thinkingPhrases[0]}"`);

      // Use shorter intervals for more dynamic feeling
      thinkingTimer = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % thinkingPhrases.length;
        setAiThinking(thinkingPhrases[phraseIndex]);
        console.log(`⏱️ Thinking animation: "${thinkingPhrases[phraseIndex]}"`);
      }, 800);

      // Stop thinking animation after 5 seconds
      setTimeout(() => {
        console.log("⏱️ Thinking animation complete");
        clearInterval(thinkingTimer);
        setWaitingForSearch(false);
      }, 5000);
    }

    return () => {
      if (countdownTimer) clearTimeout(countdownTimer);
      if (thinkingTimer) clearInterval(thinkingTimer);
    };
  }, [countdownActive, countdownValue]);

  const toggleVoiceInput = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Spracherkennung wird von Ihrem Browser nicht unterstützt');
      return;
    }

    if (isListening) {
      // Stop listening - the useEffect will handle the transcript processing
      SpeechRecognition.stopListening();
      setIsListening(false);
      console.log("Voice input stopped, transcript will be processed by useEffect");
    } else {
      // Start listening
      SpeechRecognition.startListening({ language: 'de-DE' });
      setIsListening(true);
      // Reset states when starting voice input
      setCountdownActive(false);
      setWaitingForSearch(false);
    }
  };

  // Handle manual search button click - immediately starts the search and shows UI animation after 1 second
  const startSearch = () => {
    console.log("🔍 Start search button clicked");

    // If we have a query, start the search immediately
    if (searchQuery.trim()) {
      // Store the query for later use
      const queryToUse = searchQuery.trim();
      console.log(`🔍 Starting search for: "${queryToUse}"`);

      setSubmittedQuery(queryToUse);
      setSearchSubmitted(true);

      // Reset any previous search state
      setCreators([]);
      setReasoning('');
      setShowNoResults(false);
      setWaitingForSearch(false); // Don't show the "KI sucht passende Creator" display
      setIsLoading(false); // Don't show loading state initially

      // Create a unique request ID for debugging
      const requestId = Date.now().toString();

      // Start the API request immediately
      console.log("🔍 Starting API request immediately");

      // Show countdown immediately
      console.log("🔍 Starting countdown for visual feedback");
      setCountdownValue(3);
      setCountdownActive(true);

      // Start the API call immediately in the background while countdown runs
      fetch('/api/search', {
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
      })
      .then(response => {
        console.log("🔍 API Response Status:", response.status);
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`API failed with status: ${response.status}`);
        }
      })
      .then(data => {
        console.log("🔍 API Response Data:", data);
        if (data.success) {
          const creatorCount = data.creators?.length || 0;
          console.log(`🔍 Search found ${creatorCount} creators`);
          if (creatorCount > 0) {
            // Store the results but don't show them until countdown finishes
            setTimeout(() => {
              setCreators(data.creators);
              setIsLoading(false);
              setWaitingForSearch(false);
              setCountdownActive(false);
            }, 3000); // Wait for countdown to finish (3 seconds)

            // Also set reasoning if it's included in the search response
            if (data.reasoning) {
              setReasoning(data.reasoning);
            }
          } else {
            console.warn(`🔍 No creators found for query: "${queryToUse}"`);
            setTimeout(() => {
              setShowNoResults(true);
              setIsLoading(false);
              setWaitingForSearch(false);
              setCountdownActive(false);
            }, 3000);
          }
        } else {
          console.error("🔍 Search failed:", data.error);
          setTimeout(() => {
            toast.error(`Suche fehlgeschlagen: ${data.error || 'Unbekannter Fehler'}`);
            setIsLoading(false);
            setWaitingForSearch(false);
            setCountdownActive(false);
          }, 3000);
        }
      })
      .catch(error => {
        console.error('🔍 Error during search:', error);
        setTimeout(() => {
          toast.error(`Fehler bei der Suche: ${error.message || 'Unbekannter Fehler'}`);
          setIsLoading(false);
          setWaitingForSearch(false);
          setCountdownActive(false);
        }, 3000);
      });

      // Fetch reasoning separately
      fetch('/api/reasoning', {
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
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.success) {
          setReasoning(data.reasoning);
        }
      })
      .catch(error => {
        console.error('🔍 Error fetching reasoning:', error);
      });

    } else {
      console.warn("⚠️ No search query provided");
      toast.warning("Bitte geben Sie einen Suchbegriff ein");
    }
  };

  // Test function removed - no longer needed


  // This function has been replaced by the startSearch function

  // Function to handle creator selection
  const handleSelectCreator = (creatorId: string) => {
    setSelectedCreators(prevSelected =>
      prevSelected.includes(creatorId)
        ? prevSelected.filter(id => id !== creatorId)
        : [...prevSelected, creatorId]
    );
  };

  // State for contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [clientInfo, setClientInfo] = useState({ email: '', name: '', message: '' });
  const [emailError, setEmailError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Handle form submission
  const handleSubmitSelection = async () => {
    if (selectedCreators.length === 0) return;

    // Validate email
    if (!clientInfo.email || !clientInfo.email.includes('@')) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorIds: selectedCreators,
          clientInfo
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success('Ihre Anfrage wurde erfolgreich gesendet!');
      setShowContactForm(false);
      setSelectedCreators([]);
      setSubmitLoading(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Fehler beim Senden der Anfrage. Bitte versuchen Sie es später erneut.');
      setSubmitLoading(false);
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
              startSearch();
            }
          }}
          placeholder="z.B. Kosmetik, unter 35 Jahre, TikTok..."
          className={styles.searchInput}
          disabled={countdownActive || waitingForSearch || isLoading}
          rows={1}
        />

        <button
          onClick={startSearch}
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
            disabled={isLoading}
            aria-label="Toggle Voice Input"
            className="mic-button-gradient p-4 rounded-lg flex items-center justify-center focus:outline-none hover:opacity-90 transition-opacity"
            style={{
              minWidth: '60px',
              height: '60px'
            }}
            title={isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          >
            {isListening ?
              <span className="material-icons text-white text-2xl">mic_off</span> :
              <span className="material-icons text-white text-2xl">mic</span>
            }
          </button>

          {isListening && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse"></span>}
          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            {isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          </span>
        </div>
      </div>

      {/* We don't need to display the transcript separately anymore since it's shown in the chat bubble */}

      {/* Visual indicator when listening */}
      {isListening && (
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
                <p className="text-gray-300 text-sm">Kunde will: <span className="text-emerald-300 font-medium">"{finalTranscript || searchQuery}"</span></p>
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
          </>
        )}

        {/* No Results display */}
        {showNoResults && (
          <NoResults query={submittedQuery} />
        )}

        {/* Fixed bottom bar for selected creators */}
        {selectedCreators.length > 0 && (
          <div className={styles.selectedCreatorsBar}>
            <div className={styles.selectedCreatorsContent}>
              <div className={styles.selectedCreatorsInfo}>
                <span className={styles.selectedCount}>{selectedCreators.length} Creator ausgewählt</span>
                <span className={styles.selectedHint}>Möchtest du diese Creator kontaktieren?</span>
              </div>
              <div className={styles.selectedCreatorsActions}>
                <button
                  onClick={() => setSelectedCreators([])}
                  className={styles.cancelButton}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => setShowContactForm(true)}
                  className={styles.submitButton}
                >
                  <span>Anfrage senden</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact form modal */}
        {showContactForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3 className={styles.modalTitle}>Kontaktinformationen</h3>
              <div className={styles.formField}>
                <input
                  type="email"
                  placeholder="Email *"
                  value={clientInfo.email}
                  onChange={e => {
                    setEmailError('');
                    setClientInfo(prev => ({ ...prev, email: e.target.value }));
                  }}
                  className={`${styles.formInput} ${emailError ? styles.inputError : ''}`}
                />
                {emailError && <p className={styles.errorText}>{emailError}</p>}
              </div>
              <input
                type="text"
                placeholder="Name (optional)"
                value={clientInfo.name}
                onChange={e => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                className={styles.formInput}
              />
              <textarea
                placeholder="Nachricht (optional)"
                value={clientInfo.message}
                onChange={e => setClientInfo(prev => ({ ...prev, message: e.target.value }))}
                className={styles.formTextarea}
              />
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowContactForm(false)}
                  className={styles.modalCancelButton}
                  disabled={submitLoading}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmitSelection}
                  disabled={submitLoading}
                  className={styles.modalSubmitButton}
                >
                  {submitLoading ? (
                    <>
                      <span className={styles.loadingIcon}>⏳</span>
                      Wird gesendet...
                    </>
                  ) : (
                    'Absenden'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
