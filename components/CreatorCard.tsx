import Image from 'next/image';

interface CreatorCardProps {
  creator: {
    id: string;
    name: string;
    image: string;
    reach: string;
    networks: string[];
    priceRange: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export default function CreatorCard({ creator, isSelected, onSelect }: CreatorCardProps) {
  return (
    <div 
      onClick={onSelect}
      className={`
        relative bg-gray-900/50 rounded-xl overflow-hidden cursor-pointer
        border ${isSelected ? 'border-emerald-500' : 'border-gray-800'}
        hover:border-gray-700 transition-all
      `}
    >
      <div className="aspect-video relative">
        <Image
          src={creator.image || '/placeholder.jpg'}
          alt={creator.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium truncate">{creator.name}</h3>
        <p className="text-sm text-gray-400">Reichweite: {creator.reach}</p>
        <div className="flex flex-wrap gap-1">
          {creator.networks.map(network => (
            <span 
              key={network}
              className="text-xs px-2 py-0.5 bg-gray-800 rounded-full"
            >
              {network}
            </span>
          ))}
        </div>
        <p className="text-sm font-medium text-emerald-400">{creator.priceRange}</p>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}
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