import React, { useState } from 'react';
import '../styles/search.css'; // Make sure to import the CSS

// Define your component properly
export default function SearchBox() {
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
}

// You'll need to import or define CreatorCard component
function CreatorCard({ creator }) {
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