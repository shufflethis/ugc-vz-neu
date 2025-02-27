import Image from "next/image";
import Link from 'next/link';
import CreatorSearch from '@/components/CreatorSearch';

// Make sure the search.css is imported in your main page or layout
import './styles/search.css';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="fixed top-0 left-0 w-full border-b border-gray-800/50 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/ugc-vz-logo.webp"
              alt="UGC VZ"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">
              UGC VZ
            </span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">
            Finde deinen perfekten UGC Creator
          </h1>
          <p className="text-gray-400 text-lg">
            Beschreibe deine Kampagne und wir finden die passenden Creator für dich.
          </p>
        </div>

        <CreatorSearch />
      </main>
    </div>
  );
}
