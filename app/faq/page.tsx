'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '../components/ContactButton';
import ResponsiveCTAButton from '@/src/components/ResponsiveCTAButton';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: "Allgemeine Fragen zu UGC-VZ",
    items: [
      {
        question: "Was ist UGC-VZ?",
        answer: "UGC-VZ ist ein kostenloses Verzeichnis, das UGC Creators und Unternehmen zusammenbringt. Creators können sich gratis registrieren und ihr Portfolio präsentieren, während Unternehmen kostenlos nach passenden Creators suchen und direkte Kontakte knüpfen können."
      },
      {
        question: "Ist UGC-VZ wirklich komplett kostenlos?",
        answer: "Ja, absolut! Es entstehen keine Kosten für die Registrierung, das Erstellen eines Profils oder die Kontaktaufnahme. Weder für Creators noch für Unternehmen. Das war von Anfang an unser Versprechen."
      },
      {
        question: "Wie verdient UGC-VZ Geld, wenn alles kostenlos ist?",
        answer: "UGC-VZ ist ein Community-Projekt von famefact, einer etablierten Social Media Agentur. Wir betreiben das Verzeichnis als Service für die Creator-Community, ohne direkt daran zu verdienen. Falls größere Projekte entstehen, können Unternehmen optional unsere Agentur-Services nutzen – aber das ist kein Muss."
      }
    ]
  },
  {
    title: "Für UGC Creators",
    items: [
      {
        question: "Wer kann sich als Creator registrieren?",
        answer: "Jeder, der authentischen User Generated Content erstellt! Du brauchst keine Millionen Follower oder professionelle Ausrüstung. Wichtig ist, dass du ehrliche, ansprechende Inhalte produzierst – egal ob mit dem Smartphone oder einer Profi-Kamera."
      },
      {
        question: "Was muss ich in mein Creator-Profil einfügen?",
        answer: "Am besten zeigst du eine Auswahl deiner besten UGC-Arbeiten, beschreibst deinen Style und gibst an, in welchen Bereichen du am liebsten arbeitest (Fashion, Food, Tech, etc.). Je authentischer dein Profil, desto besser die Matches!"
      },
      {
        question: "Wie werde ich von Unternehmen gefunden?",
        answer: "Unternehmen durchsuchen das Verzeichnis nach passenden Creators für ihre Projekte. Ein vollständiges Profil mit verschiedenen Content-Beispielen erhöht deine Sichtbarkeit erheblich."
      },
      {
        question: "Muss ich über UGC-VZ abrechnen?",
        answer: "Nein! Sobald ein Match zustande kommt, wickelt ihr alles direkt miteinander ab. UGC-VZ ist nur die Vermittlungsplattform – Preise, Vertragsbedingungen und Zahlungen regelt ihr selbst."
      }
    ]
  },
  {
    title: "Für Unternehmen",
    items: [
      {
        question: "Welche Art von Unternehmen nutzt UGC-VZ?",
        answer: "Von kleinen Startups bis zu etablierten Brands – jeder, der authentischen Content braucht! Besonders beliebt ist die Plattform bei Unternehmen, die direkte Partnerships mit Creators eingehen möchten, ohne über große Agenturen zu gehen."
      },
      {
        question: "Sind die Projekte hier nicht zu klein für eine professionelle Agentur?",
        answer: "Genau das ist der Punkt! Viele großartige Projekte finden bei großen Agenturen keinen Platz, weil sie \"zu klein\" erscheinen. UGC-VZ gibt diesen Projekten eine Heimat und ermöglicht direkte Connections zwischen Brands und Creators."
      },
      {
        question: "Wie kontaktiere ich einen Creator?",
        answer: "Einfach das gewünschte Creator-Profil öffnen und die angegebenen Kontaktdaten nutzen. Die meisten Creators sind über E-Mail, Instagram oder andere soziale Kanäle erreichbar."
      },
      {
        question: "Was ist, wenn ich größere Kampagnen plane?",
        answer: "Perfekt! Für umfangreichere Projekte kannst du optional die Expertise von famefact nutzen – aber das ist völlig freiwillig. Viele erfolgreiche Kooperationen entstehen auch komplett eigenständig."
      }
    ]
  },
  {
    title: "Technische Fragen",
    items: [
      {
        question: "Brauche ich einen Account, um Creator zu kontaktieren?",
        answer: "Nein, das Verzeichnis ist öffentlich zugänglich. Du kannst Creators direkt über ihre angegebenen Kontaktdaten erreichen."
      },
      {
        question: "Kann ich mein Profil später bearbeiten?",
        answer: "Ja, Creator können ihre Profile jederzeit aktualisieren und neue Arbeiten hinzufügen."
      },
      {
        question: "Was passiert bei Problemen oder Streitigkeiten?",
        answer: "Da alle Geschäfte direkt zwischen Creators und Unternehmen abgewickelt werden, sind diese auch für die Konfliktlösung verantwortlich. Wir empfehlen immer, klare Vereinbarungen zu treffen."
      }
    ]
  },
  {
    title: "Über famefact",
    items: [
      {
        question: "Was ist famefact?",
        answer: "famefact ist eine der führenden Social Media Agenturen Deutschlands mit über 15 Jahren Expertise. Wir sind spezialisiert auf Social Media Marketing und UGC-Kampagnen und betreuen über 300 zufriedene Kunden."
      },
      {
        question: "Muss ich famefact beauftragen, wenn ich UGC-VZ nutze?",
        answer: "Absolut nicht! UGC-VZ ist ein eigenständiges, kostenloses Service. Falls du später professionelle Agentur-Unterstützung brauchst, sind wir gerne da – aber das ist völlig optional."
      },
      {
        question: "Kann famefact bei größeren Projekten helfen?",
        answer: "Gerne! Wenn aus einem kleinen UGC-Projekt eine größere Kampagne wird oder du strategische Unterstützung brauchst, stehen wir zur Verfügung. Aber der erste Schritt funktioniert auch komplett ohne uns."
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/ugc-vz-logo.webp"
              alt="UGC VZ"
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="text-xl font-bold gradient-text">
              UGC VZ
            </span>
          </Link>

          <ResponsiveCTAButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">FAQ</span> - Häufig gestellte Fragen
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Hier findest du Antworten auf die wichtigsten Fragen rund um UGC-VZ.
              Falls deine Frage nicht dabei ist, kontaktiere uns gerne!
            </p>
          </div>

          {/* FAQ Sections */}
          {faqData.map((section, sectionIndex) => (
            <section key={sectionIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center">
                <span className="gradient-text">{section.title}</span>
              </h2>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => {
                  const itemId = `${sectionIndex}-${itemIndex}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <div
                      key={itemIndex}
                      className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white pr-4">
                          {item.question}
                        </h3>
                        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-gray-700/50 pt-4">
                            <p className="text-gray-200 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Contact Section */}
          <section className="mt-16">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-12 border border-emerald-700/30 text-center">
              <h2 className="text-3xl font-bold mb-6">
                Noch <span className="gradient-text">Fragen</span>?
              </h2>
              <p className="text-lg text-gray-200 leading-relaxed mb-8 max-w-2xl mx-auto">
                Du findest deine Frage nicht? Schreib uns einfach eine E-Mail oder kontaktiere uns über unsere Social Media Kanäle.
                Wir helfen gerne weiter!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ContactButton
                  title="Kontakt aufnehmen"
                  subtitle="Haben Sie eine Frage zu UGC-VZ? Schreiben Sie uns!"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Kontakt aufnehmen
                </ContactButton>
                <Link
                  href="/"
                  className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Creator suchen
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
