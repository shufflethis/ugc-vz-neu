import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              UGC Directory
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link href="/creators" className="hover:text-gray-600">
              Creators
            </Link>
            <Link href="/pricing" className="hover:text-gray-600">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-gray-600">
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}