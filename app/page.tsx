import Image from "next/image";
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">UGC Creator Directory</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Find Your Perfect UGC Creator</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Search through our curated list of professional UGC creators based on:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Industry expertise</li>
              <li>Budget range</li>
              <li>Content type</li>
            </ul>
            <Link 
              href="/creators" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Creators
            </Link>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Why Choose Our Directory?</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium">Verified Creators</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">All creators are vetted and verified</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium">Easy Filtering</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find creators that match your needs</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium">Direct Contact</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Connect directly with creators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
