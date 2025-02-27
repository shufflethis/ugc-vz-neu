import React, { useState, useRef, useEffect } from 'react';
import '../styles/search.css';

// Define types for your data
interface Creator {
  id: string;
  name: string;
  image: string;
  reach: string;
  networks: string[];
  priceRange: string;
}

interface CreatorCardProps {
  creator: Creator;
}

export default function SearchBox() {
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Scroll to reasoning when it appears
  useEffect(() => {
    if (reasoning && reasoningRef.current) {
      reasoningRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [reasoning]);

  // Simulate typing effect for reasoning
  useEffect(() => {
    if (isLoading && searchSubmitted) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [isLoading, searchSubmitted]);

  // Enhance the typing effect to be more realistic
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Show the search query as a user message
    setSearchSubmitted(true);
    setIsLoading(true);
    setReasoning(''); // Clear previous reasoning
    setCreators([]); // Clear previous results
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      console.log("API Response:", data); // Debug the response
      
      if (data.success) {
        // Show reasoning with a typing effect
        if (data.reasoning) {
          console.log("Received reasoning:", data.reasoning); // Debug the reasoning
          setReasoning(data.reasoning);
        } else {
          console.warn("No reasoning data received");
        }
        
        // Show creators after a short delay
        setTimeout(() => {
          setCreators(data.creators || []);
          setIsLoading(false);
        }, 500);
      } else {
        console.error('Search failed:', data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during search:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      {/* Search input */}
      <div className="search-input-container">
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="z.B. Kosmetik, unter 35 Jahre, TikTok..."
          className="search-input"
        />
        <button 
          onClick={handleSearch} 
          className="search-button"
          disabled={isLoading}
        >
          {isLoading ? 'Suche läuft...' : 'Passende Creator finden'}
        </button>
      </div>
      
      {/* Chat-like interface */}
      // In the return statement, modify the chat container section
      {searchSubmitted && (
        <div className="chat-container">
          {/* User message */}
          <div className="user-message">
            <div className="message-bubble user-bubble">
              {searchQuery}
            </div>
          </div>
          
          {/* AI reasoning */}
          {(isTyping || reasoning) && (
            <div className="ai-message" ref={reasoningRef}>
              <div className="ai-avatar">AI</div>
              <div className="message-bubble ai-bubble">
                {isTyping && !reasoning ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <pre className="reasoning-text">{reasoning}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Results display */}
      {creators.length > 0 && (
        <div className="creators-grid">
          {creators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="creator-card">
      <img src={creator.image} alt={creator.name} />
      <h3>{creator.name}</h3>
      <p>{creator.reach}</p>
      <div className="networks">
        {creator.networks.map((network, index) => (
          <span key={index} className="network-tag">{network}</span>
        ))}
      </div>
      <p className="price">{creator.priceRange}</p>
    </div>
  );
}