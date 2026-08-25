'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Zap,
  Wallet,
  Rocket,
  X,
  Users,
  Activity,
  Sparkles,
  XCircle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  content: string;
  accent?: boolean;
  highlight?: boolean;
}

const sections: Section[] = [
  {
    id: 'hero',
    title: 'Schluss mit stundenlangem Creator-Suchen',
    content: 'Du suchst UGC Creator? Wir haben sie.',
    accent: true
  },
  {
    id: 'problem',
    title: 'Das Problem kennst du',
    content: 'Vergiss Instagram-DMs, die im Nichts verschwinden. Vergiss Creator, die nicht zu deiner Marke passen. Vergiss überteuerte Agenturen, die dir für Basic-Matches ein Vermögen abknöpfen.'
  },
  {
    id: 'solution',
    title: 'Die Lösung ist simpel',
    content: 'Kostenlose Creator-Matches in unter 5 Minuten.',
    highlight: true
  },
  {
    id: 'why-works',
    title: 'Warum funktioniert das?',
    content: 'Echte Datenbank, echte Ergebnisse. 400+ echte UGC Creator, sortiert nach allem, was wichtig ist.'
  },
  {
    id: 'for-brands',
    title: 'Für Brands: Null Euro, maximale Wirkung',
    content: 'Schluss mit Agentur-Gebühren. Andere verlangen 20-30% deines Kampagnen-Budgets. Wir? Null Euro.'
  },
  {
    id: 'technology',
    title: 'Die Technologie dahinter',
    content: 'Matching-System ohne Bullshit. Wir schauen auf deine Zielgruppe, Content-Stil, Engagement-Rate und Werte-Match.'
  },
  {
    id: 'old-system',
    title: 'Das alte System ist tot',
    content: 'Influencer-Marketing 1.0 war Bullshit. UGC ist die Zukunft - authentisch, günstig, zielgruppen-relevant.'
  },
  {
    id: 'next-steps',
    title: 'Deine nächsten Schritte',
    content: 'Die UGC-Revolution startet jetzt. Mit oder ohne dich.',
    accent: true
  }
];

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Target,
    title: 'Präzise Matches',
    description: 'Creator, die zu deiner Brand passen'
  },
  {
    icon: Zap,
    title: 'In 5 Minuten',
    description: 'Schneller als jede Agentur'
  },
  {
    icon: Wallet,
    title: 'Kostenlos',
    description: 'Keine versteckten Gebühren'
  },
  {
    icon: Rocket,
    title: 'Sofort starten',
    description: 'Heute suchen, morgen Content haben'
  }
];

const stats = [
  { number: '400+', label: 'echte UGC Creator' },
  { number: '< 5 Min', label: 'Durchschnittliche Matchzeit' },
  { number: '0€', label: 'Kosten für Brands' },
  { number: '95%', label: 'Erfolgreiche Matches' }
];

export default function ContentCascade() {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % sections.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-white py-32 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-geo-violet/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-geo-green/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Hero Section */}
        <div className={`text-center mb-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 leading-tight">
            <span className="block text-ink">Schluss mit</span>
            <span className="block gradient-text">stundenlangem</span>
            <span className="block text-ink">Creator-Suchen</span>
          </h2>
          <p className="text-2xl sm:text-3xl text-ink-soft font-light max-w-4xl mx-auto leading-relaxed">
            Du suchst UGC Creator? <span className="gradient-text font-semibold">Wir haben sie.</span>
          </p>
        </div>

        {/* Stats Bar */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-8 mb-24 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="surface-card rounded-2xl p-6 hover:border-geo-violet/50 transition-all duration-300 hover:scale-105">
                <div className="text-4xl sm:text-5xl font-black gradient-text mb-2">{stat.number}</div>
                <div className="text-sm sm:text-base text-ink-soft font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Problem Section */}
        <div className={`mb-24 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-6xl mx-auto">
            <h3 className="text-4xl sm:text-5xl font-bold text-ink mb-12 text-center">
              Das Problem <span className="gradient-text">kennst du</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="surface-card rounded-2xl p-8">
                  <h4 className="text-2xl font-bold text-ink mb-4">Zeit ist Geld. Und du verschwendest beides.</h4>
                  <ul className="space-y-4 text-ink-soft">
                    <li className="flex items-start">
                      <X className="w-4 h-4 text-red-400 mr-3 mt-1 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      Stundenlang Profile durchklicken
                    </li>
                    <li className="flex items-start">
                      <X className="w-4 h-4 text-red-400 mr-3 mt-1 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      Fake-Follower aussortieren
                    </li>
                    <li className="flex items-start">
                      <X className="w-4 h-4 text-red-400 mr-3 mt-1 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      Creator anschreiben, die nie antworten
                    </li>
                    <li className="flex items-start">
                      <X className="w-4 h-4 text-red-400 mr-3 mt-1 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      Creator, die völlig falsch für deine Marke sind
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="surface-card rounded-2xl p-8">
                  <h4 className="text-2xl font-bold text-ink mb-4">Unsere Lösung ist simpel</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="bg-geo-violet text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">1</span>
                      <span className="text-ink-soft">Du beschreibst kurz deine Kampagne</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-geo-violet text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">2</span>
                      <span className="text-ink-soft">Unsere Datenbank spuckt passende Creator aus</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-geo-violet text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">3</span>
                      <span className="text-ink-soft">Du wählst aus</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-geo-violet text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">4</span>
                      <span className="text-ink-soft">Wir schicken dir die Kontaktdaten</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="text-2xl font-bold gradient-text">Kostenlos. Immer.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`mb-24 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-4xl sm:text-5xl font-bold text-ink mb-12 text-center">
            Warum <span className="gradient-text">funktioniert das?</span>
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="surface-card rounded-2xl p-8 hover:border-geo-violet/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 h-full">
                  <feature.icon className="w-9 h-9 mb-4 text-geo-violet" strokeWidth={1.5} aria-hidden="true" />
                  <h4 className="text-xl font-bold text-ink mb-3">{feature.title}</h4>
                  <p className="text-ink-soft text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Showcase */}
        <div className={`mb-24 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="text-4xl sm:text-5xl font-bold text-ink mb-12 text-center">
            <span className="gradient-text">Echte Datenbank,</span> echte Ergebnisse
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="surface-card rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3"><Users className="w-6 h-6 text-geo-violet shrink-0" strokeWidth={1.5} aria-hidden="true" />Zielgruppe</h4>
              <ul className="space-y-3 text-ink-soft">
                <li>• Männer 18-25, 26-35, 36-50</li>
                <li>• Frauen alle Altersgruppen</li>
                <li>• Familien, Singles, Paare</li>
              </ul>
            </div>
            
            <div className="surface-card rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3"><Activity className="w-6 h-6 text-geo-violet shrink-0" strokeWidth={1.5} aria-hidden="true" />Lifestyle</h4>
              <ul className="space-y-3 text-ink-soft">
                <li>• Fitness-Freaks und Gym-Bros</li>
                <li>• Wellness-Queens</li>
                <li>• Auto-Nerds und Tuning-Fans</li>
                <li>• Gaming und Tech</li>
                <li>• Fashion und Beauty</li>
              </ul>
            </div>
            
            <div className="surface-card rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3"><Sparkles className="w-6 h-6 text-geo-violet shrink-0" strokeWidth={1.5} aria-hidden="true" />Look &amp; Style</h4>
              <ul className="space-y-3 text-ink-soft">
                <li>• Tätowiert oder clean</li>
                <li>• Alternative oder mainstream</li>
                <li>• Business oder casual</li>
                <li>• Minimalist oder maximal</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-xl text-ink-soft max-w-4xl mx-auto leading-relaxed">
              <span className="font-bold text-ink">Warum das wichtig ist:</span> Ein tätowierter Fitness-Creator verkauft keine Business-Software. Eine Wellness-Influencerin bewirbt keine Energy-Drinks. <span className="gradient-text font-semibold">Basics, die andere übersehen.</span>
            </p>
          </div>
        </div>

        {/* Revolution Section */}
        <div className={`mb-24 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="surface-card rounded-3xl p-12 text-center">
            <h3 className="text-4xl sm:text-5xl font-bold text-ink mb-8">
              Das alte System ist <span className="gradient-text">tot</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div>
                <h4 className="text-2xl font-bold text-geo-violet mb-6 flex items-center gap-3"><XCircle className="w-6 h-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />Influencer-Marketing 1.0</h4>
                <ul className="space-y-3 text-ink-soft text-left">
                  <li>• Mega-Influencer mit 0 Engagement</li>
                  <li>• Follower aus Bangladesch für deutsche Brands</li>
                  <li>• Preise jenseits von Gut und Böse</li>
                  <li>• Fake-Metrics überall</li>
                </ul>
              </div>

              <div>
                <h4 className="text-2xl font-bold text-green-deep mb-6 flex items-center gap-3"><CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.5} aria-hidden="true" />UGC ist die Zukunft</h4>
                <ul className="space-y-3 text-ink-soft text-left">
                  <li>• Authentisch statt gestellt</li>
                  <li>• Günstig statt teuer</li>
                  <li>• Zielgruppen-relevant statt Mainstream</li>
                  <li>• Messbare Ergebnisse statt Vanity-Metrics</li>
                </ul>
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-bold text-ink">
              Die <span className="gradient-text">UGC-Revolution</span> startet jetzt.
            </div>
            <div className="text-2xl text-ink-soft mt-4">
              Mit oder ohne dich.
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center transition-all duration-1000 delay-1300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-geo-violet rounded-3xl p-12 text-white">
            <h3 className="text-4xl sm:text-5xl font-bold mb-8">Leg jetzt los</h3>
            <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
              <strong>Keine versteckten Kosten. Keine Verträge. Keine Bullshit-Gebühren.</strong><br/>
              Nur echte Creator-Matches, die funktionieren.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h4 className="text-2xl font-bold mb-4">Für Brands</h4>
                <p className="text-lg mb-6">Beschreib deine Kampagne. Wir finden deine Creator. Kostenlos.</p>
                <Link
                  href="/#search"
                  className="inline-block bg-white text-geo-violet px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  Creator finden →
                </Link>
              </div>

              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h4 className="text-2xl font-bold mb-4">Für Creator</h4>
                <p className="text-lg mb-6">Erstell dein Profil. Lass dich von passenden Brands finden. Kostenlos.</p>
                <Link
                  href="/creator#creator-form"
                  className="inline-block bg-white text-geo-violet px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  Mitmachen →
                </Link>
              </div>
            </div>

            <div className="mt-12 text-lg text-white/80">
              <strong>Warum warten?</strong> Deine Konkurrenz schläft nicht.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
