import Image from "next/image";
import Link from 'next/link';
import CreatorSearch from '@/components/CreatorSearch';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start pt-12 px-4">
        <div className="flex items-center gap-4 mb-4">
          <Image
            src="/ugc-vz-logo.webp"
            alt="UGC VZ"
            width={64}
            height={64}
            className="rounded-xl"
            priority
          />
          <h1 className="text-4xl font-bold">UGC VZ</h1>
        </div>
        
        <p className="text-gray-400 mb-12">
          Frag einfach was du brauchst für deine Kampagne.
        </p>

        <div className="w-full max-w-3xl">
          <CreatorSearch />
        </div>
      </main>

      <footer className="py-8 text-center">
        <nav className="flex justify-center gap-6 mb-4 text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/creators" className="hover:text-white transition-colors">Creators</Link>
        </nav>
        <p className="text-gray-500 text-sm">Copyright © Final Master 2024.</p>
      </footer>
    </div>
  );
}
