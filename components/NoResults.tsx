'use client';

import React from 'react';
import Link from 'next/link';

interface NoResultsProps {
  query: string;
}

const NoResults: React.FC<NoResultsProps> = ({ query }) => {
  return (
    <div className="text-center py-12 px-6 mb-24">
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50 max-w-2xl mx-auto">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-semibold text-white mb-4">
          Leider keine Ergebnisse gefunden
        </h3>

        <p className="text-gray-300 mb-6 leading-relaxed">
          Für Ihre Suchanfrage <span className="text-emerald-400 font-medium">"{query}"</span> konnten wir keine passenden UGC Creator in unserer aktuellen Datenbank finden.
        </p>

        <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl p-6 border border-emerald-500/30 mb-6">
          <h4 className="text-lg font-medium text-emerald-300 mb-3">
            Wir helfen Ihnen gerne weiter!
          </h4>
          <p className="text-gray-300 mb-4 text-sm leading-relaxed">
            Kontaktieren Sie uns - wir können andere Quellen für entsprechende UGC Creator wie z.B. KI-Avatare auftun und Ihnen passende Lösungen anbieten.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`mailto:kontakt@ugc-vz.de?subject=Anfrage für UGC Creator&body=Hallo, ich suche nach UGC Creators für:%0D%0A%0D%0AMeine Suchanfrage war: ${encodeURIComponent(query)}%0D%0A%0D%0ABitte kontaktieren Sie mich für alternative Lösungen.%0D%0A%0D%0AVielen Dank!`}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-all font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-Mail senden
            </Link>

            <Link
              href="https://tally.so/r/w25dBp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-emerald-500 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              Kontakt-Formular
            </Link>
          </div>
        </div>

        <div className="text-left">
          <h5 className="text-sm font-medium text-gray-400 mb-3">Versuchen Sie es mit:</h5>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Anderen Suchbegriffen oder Branchen</li>
            <li>• Weniger spezifischen Kriterien</li>
            <li>• Alternativen Plattformen (TikTok, Instagram, YouTube)</li>
            <li>• Anderen Altersgruppen oder Zielgruppen</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoResults;
