import type { FaqTabGroup } from './FaqTabsClient';

// Alle Antworten strikt <= 60 Woerter (Spec 8.2 faq.page), ohne Gedankenstriche, exakt identisch zum FAQPage-Schema.
export const FAQ_GROUPS: FaqTabGroup[] = [
  {
    id: 'marken',
    label: 'Für Marken',
    items: [
      {
        question: 'Was kostet eine View-Kampagne?',
        answer:
          'Dein Marken-Konto ist kostenlos und es gibt kein Abo. Du legst Preis pro 1.000 geprüfte Views und deine Budget-Obergrenze selbst fest. Im Kampagnenbudget sind regulär 15 % Servicegebühr enthalten.',
      },
      {
        question: 'Was passiert, wenn mein Budget aufgebraucht ist?',
        answer:
          'Sobald die geprüften Views deine festgelegte Budget-Obergrenze erreichen, stoppt die Abrechnung automatisch. Du zahlst nie mehr als dein Budget und kannst bei Bedarf jederzeit neues Budget nachlegen.',
      },
      {
        question: 'Welche Beiträge und Views werden bezahlt?',
        answer:
          'Gezählt werden nur Beiträge, die deinen Brief erfüllen und bis zum Kampagnenende online bleiben. Die Views übernehmen wir von der Plattform und rechnen in vollen 1.000er-Schritten ab.',
      },
      {
        question: 'Kann ich auch Produktvideos ohne Posting beauftragen?',
        answer:
          'Ja. Neben View-Kampagnen kannst du Creator direkt für Produktvideos, Testimonials und Ad-Creatives mit klaren Nutzungsrechten beauftragen, auch inklusive Produktversand.',
      },
      {
        question: 'Brauche ich die Agentur famefact für eine Kampagne?',
        answer:
          'Nein. UGC VZ funktioniert komplett als Self-Service. Wenn du für größere Kampagnen zusätzlich Unterstützung bei Strategie, Skripting oder Paid Ads möchtest, hilft dir auf Wunsch das Team von famefact.',
      },
    ],
  },
  {
    id: 'creator',
    label: 'Für Creator',
    items: [
      {
        question: 'Wann bekomme ich als Creator mein Geld?',
        answer:
          'Sobald dein eingereichter Beitrag gegen den Brief geprüft wurde, zählen deine Views bis zum Kampagnenende. Nach Abschluss wird dein Guthaben ohne Abzug an dich ausgezahlt. Creator zahlen 0 % Plattformgebühr.',
      },
      {
        question: 'Muss ich Werbung kennzeichnen?',
        answer:
          'Ja. Jeder bezahlte Beitrag für eine Marke muss klar und gut sichtbar als Werbung oder Anzeige gekennzeichnet sein. Die genaue Vorgabe steht zusätzlich in jeder Kampagnen-Checkliste.',
      },
      {
        question: 'Brauche ich ein Gewerbe?',
        answer:
          'Wenn du regelmäßig mit Gewinnerzielungsabsicht für Marken postest, ist in Deutschland in der Regel ein Gewerbe nötig. Kläre deinen Einzelfall bitte kurz mit deinem Steuerberater oder dem Gewerbeamt.',
      },
      {
        question: 'Brauche ich viele Follower zum Starten?',
        answer:
          'Nein. Bei UGC VZ zählen starke Ideen und echte Views statt bloßer Follower-Zahlen. Du siehst vor jeder Kampagne genau, was pro 1.000 Views gezahlt wird, und entscheidest frei.',
      },
    ],
  },
  {
    id: 'abrechnung',
    label: 'Abrechnung',
    items: [
      {
        question: 'Wann und wie zahle ich?',
        answer:
          'Du legst dein Kampagnenbudget vor Start fest und zahlst erst für geprüfte Ergebnisse bis zu deiner Obergrenze. Überweisung per SEPA ist kostenfrei; für Kreditkarte fallen die üblichen Zahlungsgebühren an.',
      },
      {
        question: 'Wie hoch ist die Servicegebühr von UGC VZ?',
        answer:
          'Die reguläre Servicegebühr beträgt 15 % und ist bereits im Kampagnenbudget der Marke enthalten. Für Creator fallen 0 % Gebühren an. Zu Aktionen wie Black Friday kann eine reduzierte Rate gelten.',
      },
      {
        question: 'Erhalte ich ordentliche Rechnungen für die Buchhaltung?',
        answer:
          'Ja. Marken erhalten eine saubere Rechnung mit ausgewiesener Umsatzsteuer für die Buchhaltung. Creator bekommen eine nachvollziehbare Abrechnung beziehungsweise Gutschrift über alle geprüften Kampagnen.',
      },
    ],
  },
  {
    id: 'technik',
    label: 'Technik & Datenschutz',
    items: [
      {
        question: 'Warum brauche ich ein Konto zum Starten von Kampagnen?',
        answer:
          'Den Creator-Pool kannst du als Vorschau direkt testen. Für Briefings, Einladungen und geprüfte Abrechnungen schützt der Login per 6-stelligem E-Mail-Code Creator vor Spam und hält deine Reports zusammen.',
      },
      {
        question: 'Was macht die KI bei der Suche und bei Profilen?',
        answer:
          'Bei der Suche hilft die KI nur, dein Briefing den 20 Kategorien zuzuordnen. Eine KI-Profilzusammenfassung für Creator wird ausschließlich nach ausdrücklicher Einwilligung erstellt und lässt sich jederzeit sofort löschen.',
      },
      {
        question: 'Sind meine Kontaktdaten öffentlich sichtbar?',
        answer:
          'Nein. E-Mail-Adresse, Telefonnummer und private Angaben bleiben geschützt und erscheinen niemals im öffentlichen Profil oder in der öffentlichen Suche.',
      },
      {
        question: 'Wie lange bleibe ich nach dem Login angemeldet?',
        answer:
          'Wenn die Option „Angemeldet bleiben“ aktiviert ist, bleibt deine Sitzung 30 Tage lang gültig. Ein Passwort brauchst du nicht, jeder neue Login läuft per 6-stelligem Code.',
      },
    ],
  },
];
