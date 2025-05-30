import Link from 'next/link';

// Make sure the search.css is imported in your main page or layout
import './styles/search.css';
import SearchBox from './components/SearchBox';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';
import LogoImage from './components/LogoImage';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <LogoImage
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </div>

          <ResponsiveCTAButton />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Finde deinen perfekten <span className="gradient-text">UGC Creator</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-12">
          Beschreibe deine Kampagne und wir finden die passenden Creator gratis für dich. Wähle danach einfach aus und unser Agent wird dir umgehend die Details kostenlos zusenden.
        </p>

        <div className="w-full max-w-2xl mx-auto">
          <SearchBox />
        </div>
      </main>
    </div>
  );
}
