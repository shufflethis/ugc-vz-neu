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
  gender?: string;
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

  // Removed unused reach calculation functions

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
            src={creator.image || (creator.gender === 'Weiblich' ? '/female-placeholder.webp' : '/placeholder.jpg')}
            alt={creator.name}
            fill
            className="object-cover"
            sizes="96px"
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
        </div>
        <h3 className="font-medium text-lg">{creator.name}</h3>

        {/* Network icons */}
        <div className="flex gap-4 justify-center mt-4">
          {uniqueNetworks.map((network, i) => {
            const icon = getNetworkIcon(network);
            if (!icon) return null;
            return (
              <span
                key={i}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-200 shadow-lg"
              >
                <FontAwesomeIcon
                  icon={icon}
                  size="lg"
                />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
