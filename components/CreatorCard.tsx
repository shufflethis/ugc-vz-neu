import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInstagram, 
  faTiktok, 
  faYoutube, 
  faFacebook, 
  faLinkedin 
} from '@fortawesome/free-brands-svg-icons';

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
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

export default function CreatorCard({ creator, isSelected, onSelect, className }: CreatorCardProps) {
  // Function to detect networks from text and links
  const detectNetworks = (networks: string[]): string[] => {
    const detectedNetworks = new Set<string>();
    
    networks.forEach(network => {
      const networkLower = network.toLowerCase();
      
      // Check for direct links
      if (networkLower.includes('instagram.com')) detectedNetworks.add('instagram');
      if (networkLower.includes('tiktok.com')) detectedNetworks.add('tiktok');
      if (networkLower.includes('youtube.com')) detectedNetworks.add('youtube');
      if (networkLower.includes('facebook.com')) detectedNetworks.add('facebook');
      if (networkLower.includes('linkedin.com')) detectedNetworks.add('linkedin');
      
      // Check for mentions
      if (networkLower.includes('instagram')) detectedNetworks.add('instagram');
      if (networkLower.includes('tiktok')) detectedNetworks.add('tiktok');
      if (networkLower.includes('youtube')) detectedNetworks.add('youtube');
      if (networkLower.includes('facebook')) detectedNetworks.add('facebook');
      if (networkLower.includes('linkedin')) detectedNetworks.add('linkedin');
    });
    
    return Array.from(detectedNetworks);
  };
  
  // Get unique networks
  const uniqueNetworks = detectNetworks(creator.networks);
  
  // Map network to icon
  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'instagram': return faInstagram;
      case 'tiktok': return faTiktok;
      case 'youtube': return faYoutube;
      case 'facebook': return faFacebook;
      case 'linkedin': return faLinkedin;
      default: return null;
    }
  };

  // Parse and sum up reach values with abbreviation support
  const calculateTotalReach = (reachText: string): number => {
    try {
      // Normalize text
      const normalizedText = reachText
        .replace(/\bIG\b/gi, 'Instagram')
        .replace(/\bInsta\b/gi, 'Instagram')
        .replace(/\bTT\b/gi, 'TikTok')
        .split('erreicht')[0]; // Ignore "reached accounts" metrics
    
      // Extract numbers with k/K suffix or plain numbers
      const matches = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*[kKmM]?(?=\s|Follower|$|\n)/g) || [];
      
      let total = 0;
      matches.forEach(num => {
        // Clean up the number
        let cleanNum = num.trim().toLowerCase();
        
        // Convert German format to standard
        cleanNum = cleanNum.replace(/\./g, '').replace(',', '.');
        
        // Extract the numeric value
        let value = parseFloat(cleanNum);
        if (isNaN(value)) return;
        
        // Apply multiplier for k/K/m/M
        if (cleanNum.endsWith('k')) {
          value *= 1000;
        } else if (cleanNum.endsWith('m')) {
          value *= 1000000;
        }
        
        total += value;
      });
    
      return total;
    } catch (error) {
      console.error('Error calculating reach:', error);
      return 0;
    }
  };

  const formatReachDisplay = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  // In your component render:
  <div className="text-sm text-gray-400">
    Reichweite: {formatReachDisplay(calculateTotalReach(creator.reach))}
  </div>

  return (
      <div 
        onClick={onSelect}
        className={`bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 cursor-pointer transition-all hover:bg-gray-900/50 ${
          isSelected ? 'ring-2 ring-emerald-500' : ''
        } ${className || ''}`}
      >
      <div className="flex flex-col items-center space-y-3">
        {/* Image section */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-800">
          <Image
            src={creator.image || '/placeholder.jpg'}
            alt={creator.name}
            fill
            className="object-cover"
            sizes="96px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.jpg';
            }}
          />
        </div>
        <h3 className="font-medium text-lg">{creator.name}</h3>
        
        {/* Network icons */}
        <div className="flex gap-3 justify-center">
          {uniqueNetworks.map((network, i) => {
            const icon = getNetworkIcon(network);
            if (!icon) return null;
            return (
              <span key={i} className="text-xl">
                <FontAwesomeIcon 
                  icon={icon} 
                  className="text-white" 
                  size="lg"
                />
              </span>
            );
          })}
        </div>
        
        {/* Reach */}
        <div className="text-sm text-gray-400">
          Reichweite: {calculateTotalReach(creator.reach)}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 13l4 4L19 7" 
      />
    </svg>
  );
}
