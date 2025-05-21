'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/search.css';
import styles from '../styles/search.module.css';
// Removed Button component import
import { Mic, MicOff, Search } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'react-toastify';

// Define types for your data
interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
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

  const { browserSupportsSpeechRecognition, finalTranscript } = useSpeechRecognition();

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

      // Automatically start countdown after a short delay
      const autoStartTimer = setTimeout(() => {
        if (finalTranscript.trim() !== '') {
          console.log("Auto-starting countdown for transcript:", finalTranscript);
          setCountdownValue(3);
          setCountdownActive(true);
        }
      }, 500); // Short delay to allow user to see the transcript

      return () => clearTimeout(autoStartTimer);
    }
  }, [finalTranscript, isListening]);

  // Effect to handle countdown and automatic search
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    let thinkingTimer: NodeJS.Timeout;
    let searchTimer: NodeJS.Timeout;

    if (countdownActive && countdownValue > 0) {
      countdownTimer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
    } else if (countdownActive && countdownValue === 0) {
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

      // Use shorter intervals for more dynamic feeling
      thinkingTimer = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % thinkingPhrases.length;
        setAiThinking(thinkingPhrases[phraseIndex]);
      }, 800);

      // Start search after longer thinking period to show all database steps
      searchTimer = setTimeout(() => {
        clearInterval(thinkingTimer);
        setWaitingForSearch(false); // This should be set to false AFTER handleSearch completes
        handleSearch();
      }, 8000);
    }

    return () => {
      clearTimeout(countdownTimer);
      clearInterval(thinkingTimer);
      clearTimeout(searchTimer);
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

  // Handle manual search button click
  const startSearch = () => {
    // If we have a query, start the countdown
    if (searchQuery.trim()) {
      setCountdownValue(3);
      setCountdownActive(true);
    }
  };

  // Direct API test function - for debugging
  const testBackendAPI = async () => {
    const testQuery = "Test query for backend";
    console.log("DIRECT API TEST: Sending direct test to backend API");

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Request': 'true'
        },
        body: JSON.stringify({
          query: testQuery,
          isTest: true
        })
      });

      console.log("DIRECT API TEST: Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("DIRECT API TEST: Response data:", data);
      } else {
        console.error("DIRECT API TEST: Failed with status:", response.status);
      }
    } catch (error) {
      console.error("DIRECT API TEST: Error:", error);
    }
  };

  // Disabled automatic test API call
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     testBackendAPI();
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Direct API search function
  const directSearch = async () => {
    console.log('Performing direct search...');

    // Use the current search query
    const queryToUse = searchQuery.trim() || submittedQuery.trim();

    if (!queryToUse) {
      console.error("No query to search for!");
      toast.error("Bitte geben Sie einen Suchbegriff ein");
      return;
    }

    // Update UI state
    setIsLoading(true);
    setWaitingForSearch(false);
    setReasoning('');
    setCreators([]);
    setSelectedCreators([]);
    setSearchSubmitted(true);
    setSubmittedQuery(queryToUse);

    try {
      console.log("Sending direct API request for query:", queryToUse);

      // Create a unique request ID for debugging
      const requestId = Date.now().toString();

      // Call the search API
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

      console.log("API Response Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("API Response Data:", data);

        if (data.success) {
          const creatorCount = data.creators?.length || 0;
          console.log(`Found ${creatorCount} creators`);

          if (creatorCount > 0) {
            setCreators(data.creators);
          } else {
            console.warn(`No creators found for query: "${queryToUse}"`);
            toast.warning("Keine passenden Creator gefunden. Bitte versuchen Sie eine andere Suchanfrage.");
          }
        } else {
          console.error("Search failed:", data.error);
          toast.error(`Suche fehlgeschlagen: ${data.error || 'Unbekannter Fehler'}`);
        }
      } else {
        console.error("API failed with status:", response.status);
        toast.error(`API-Fehler: ${response.statusText}`);
      }

      // Also get reasoning
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
          if (reasoningData.success) {
            setReasoning(reasoningData.reasoning);
          }
        }
      } catch (reasoningError) {
        console.error("Error fetching reasoning:", reasoningError);
      }

    } catch (error) {
      console.error('Error during direct search:', error);
      toast.error(`Fehler bei der Suche: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
      setWaitingForSearch(false);
      console.log("Direct search completed");
    }
  };

  // The actual search function that gets called after countdown
  const handleSearch = async () => {
    // Use either the searchQuery or the submittedQuery (from voice input)
    const queryToUse = searchQuery.trim() || submittedQuery.trim();

    console.log("Starting actual search with query:", queryToUse);

    if (!queryToUse) {
      console.error("No query to search for!");
      return;
    }

    // Make sure we have the query in the search field too (for consistency)
    if (searchQuery !== queryToUse) {
      setSearchQuery(queryToUse);
    }

    // Store the submitted query and mark as submitted (if not already done)
    if (submittedQuery !== queryToUse) {
      setSubmittedQuery(queryToUse);
      setSearchSubmitted(true);
    }

    setIsLoading(true);
    setWaitingForSearch(false); // Ensure waitingForSearch is false when actual search starts
    setReasoning('');
    setCreators([]);
    setSelectedCreators([]); // Clear selected creators on new search
    setAiThinking(''); // Clear AI thinking message

    // Stop speech recognition if active
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    }

    try {
      console.log("Sending API requests for query:", queryToUse);

      // Create a unique request ID for debugging
      const requestId = Date.now().toString();
      console.log(`Request ID: ${requestId}`);

      // First, get creators from Airtable (prioritize this for faster results)
      console.log(`[${requestId}] Fetching creators from Airtable...`);
      const creatorsPromise = fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'no-cache, no-store' // Prevent caching
        },
        body: JSON.stringify({
          query: queryToUse,
          requestId: requestId,
          timestamp: new Date().toISOString(), // Add timestamp to prevent caching
          isTest: false // Explicitly set isTest to false to ensure it's not treated as a test
        })
      });

      // In parallel, get reasoning from OpenRouter
      console.log(`[${requestId}] Fetching reasoning from OpenRouter...`);
      const reasoningPromise = fetch('/api/reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'Cache-Control': 'no-cache, no-store' // Prevent caching
        },
        body: JSON.stringify({
          query: queryToUse,
          requestId: requestId,
          timestamp: new Date().toISOString(), // Add timestamp to prevent caching
          isTest: false // Explicitly set isTest to false
        })
      });

      // Wait for both responses
      console.log(`[${requestId}] Waiting for API responses...`);
      const [creatorsResponse, reasoningResponse] = await Promise.all([
        creatorsPromise,
        reasoningPromise
      ]);

      console.log(`[${requestId}] Creators API response status:`, creatorsResponse.status);
      console.log(`[${requestId}] Reasoning API response status:`, reasoningResponse.status);

      // Log the full response for debugging
      const creatorsResponseText = await creatorsResponse.clone().text();
      console.log(`[${requestId}] Creators API raw response:`, creatorsResponseText);

      // Process creators response first (more important)
      if (creatorsResponse.ok) {
        const creatorsData = await creatorsResponse.json();
        console.log(`[${requestId}] Creators data received, success:`, creatorsData.success);

        if (creatorsData.success) {
          const creatorCount = creatorsData.creators?.length || 0;
          console.log(`[${requestId}] Found ${creatorCount} creators`);

          if (creatorCount > 0) {
            console.log(`[${requestId}] First creator:`, creatorsData.creators[0]);
            setCreators(creatorsData.creators);
          } else {
            console.warn(`[${requestId}] No creators found for query: "${queryToUse}"`);
            toast.warning("Keine passenden Creator gefunden. Bitte versuchen Sie eine andere Suchanfrage.");
          }
        } else {
          console.error(`[${requestId}] Search failed:`, creatorsData.error);
          toast.error(`Suche fehlgeschlagen: ${creatorsData.error || 'Unbekannter Fehler'}`);
        }
      } else {
        console.error(`[${requestId}] Creators API failed with status:`, creatorsResponse.status);
        toast.error(`API-Fehler: ${creatorsResponse.statusText}`);
      }

      // Process reasoning response
      if (reasoningResponse.ok) {
        const reasoningData = await reasoningResponse.json();
        console.log(`[${requestId}] Reasoning data received:`, reasoningData.success);

        if (reasoningData.success) {
          console.log(`[${requestId}] Reasoning length:`, reasoningData.reasoning?.length || 0);
          setReasoning(reasoningData.reasoning);
        } else {
          console.error(`[${requestId}] Reasoning API returned error:`, reasoningData.error);
        }
      } else {
        console.error(`[${requestId}] Reasoning API failed with status:`, reasoningResponse.status);
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast.error(`Fehler bei der Suche: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
      setWaitingForSearch(false); // Ensure waitingForSearch is false when search completes
      console.log("Search completed");
    }
  };

  // Function to handle creator selection
  const handleSelectCreator = (creatorId: string) => {
    setSelectedCreators(prevSelected =>
      prevSelected.includes(creatorId)
        ? prevSelected.filter(id => id !== creatorId)
        : [...prevSelected, creatorId]
    );
  };

  return (
    <div className={styles.searchContainer}>
      {/* Search input */}
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && directSearch()} {/* Changed to directSearch */}
            placeholder="z.B. Kosmetik, unter 35 Jahre, TikTok..."
            className={styles.searchInput}
            disabled={isLoading} {/* Only disabled when loading */}
          />
          <button
            onClick={directSearch} {/* Changed to directSearch */}
            className={`${styles.searchButton} ${isLoading ? styles.pulsing : ''}`}
            disabled={isLoading} {/* Only disabled when loading */}
            aria-label="Search"
          >
            {isLoading ? 'Suche läuft...' : <Search size={20} />}
          </button>
          <button
            onClick={toggleVoiceInput}
            className={`${styles.searchButton} ${isListening ? 'bg-red-500' : ''} ml-2 relative group`}
            disabled={isLoading}
            aria-label="Toggle Voice Input"
            style={{
              position: 'relative',
              overflow: 'visible',
              background: isListening ? 'linear-gradient(45deg, #ff3e3e, #ff5757)' : 'linear-gradient(45deg, #ff9500, #ff5757)',
              boxShadow: isListening ? '0 0 15px rgba(255, 62, 62, 0.7)' : '0 0 10px rgba(255, 149, 0, 0.5)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              marginLeft: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
            title={isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
          >
            {isListening ?
              <MicOff size={32} color="#ffffff" style={{filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.7))'}} /> :
              <Mic size={32} color="#ffffff" style={{filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.7))'}} />
            }

            {isListening && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse"></span>}
            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
              {isListening ? 'Sprachaufnahme beenden' : 'Sprachsuche starten'}
            </span>
          </button>

          {/* Test buttons removed */}
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

            {/* Reasoning as simple text below */}
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <span className={styles.loadingText}>KI sucht passende Creator</span>
                <div className="mt-4 w-full">
                  <div className="h-2 bg-emerald-500 rounded-full animate-pulse-slow"></div>
                </div>
                <span className={styles.pulsingDots}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </span>
              </div>
            ) : reasoning ? (
              <div className={styles.reasoningContainer}>
                <h3>Analyse der Suchanfrage:</h3>
                <pre className={styles.reasoningText}>{reasoning}</pre>
              </div>
            ) : null}
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
                  <img src={creator.image} alt={creator.name} />
                  <h3>{creator.name}</h3>
                  <p>{creator.reach}</p>
                  <div className={styles.networks}>
                    {creator.networks.map((network, index) => (
                      <span key={index} className={styles.networkTag}>{network}</span>
                    ))}
                  </div>
                  <p className={styles.price}>{creator.priceRange}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
