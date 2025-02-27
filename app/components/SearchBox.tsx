import React, { useState } from 'react';

// Add this to your component's state
const [reasoning, setReasoning] = useState<string>("");
const [isLoading, setIsLoading] = useState(false);

// In your search function
const handleSearch = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setCreators(data.creators);
      setReasoning(data.reasoning); // Store the reasoning
    } else {
      console.error('Search failed:', data.error);
    }
  } catch (error) {
    console.error('Error during search:', error);
  } finally {
    setIsLoading(false);
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
        placeholder="z.B. Kosmetik, unter 35 Jahre, TikTok..."
        className="search-input"
      />
      <button 
        onClick={handleSearch} 
        className="search-button"
        disabled={isLoading}
      >
        Passende Creator finden
      </button>
    </div>
    
    {/* Reasoning display */}
    {reasoning && (
      <div className="reasoning-container">
        <pre className="reasoning-text">{reasoning}</pre>
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