import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import Airtable from 'airtable';
import { Resend } from 'resend';

type SelectedCreator = {
  name: string;
  reach: string;
  networks: string;
  contactEmail?: string;
  socialLinks?: string;
};

const htmlEscape = (value: unknown) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const plainText = (value: unknown, maxLength = 500) =>
  String(value || '').replace(/\s+/g, ' ').trim().substring(0, maxLength);

const getFirstField = (fields: Record<string, any>, candidates: string[]) => {
  for (const candidate of candidates) {
    const value = fields[candidate];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
};

const getCreatorEmail = (fields: Record<string, any>) =>
  getFirstField(fields, [
    'E-Mail',
    'Email',
    'E-Mail Adresse',
    'E-Mail-Adresse',
    'Email Adresse',
    'Deine E-Mail',
    'Deine E-Mail-Adresse',
    'Wie lautet deine E-Mail-Adresse?',
    'Wie lautet deine E-Mail Adresse?',
  ]);

const getCreatorSocialLinks = (fields: Record<string, any>) =>
  getFirstField(fields, [
    'In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ',
    'Social Links',
    'Social Media Links',
    'Instagram',
    'TikTok',
  ]);

async function sendLeadEmails({
  leadId,
  clientInfo,
  selectedCreators,
  isNoResultsRequest,
}: {
  leadId: string;
  clientInfo: any;
  selectedCreators: SelectedCreator[];
  isNoResultsRequest: boolean;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not configured - skipping email notifications');
    return;
  }

  const resend = new Resend(resendApiKey);
  const from = process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>';
  const internalEmail = process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de';
  const replyTo = clientInfo.email || internalEmail;
  const creatorListHtml = selectedCreators.length
    ? selectedCreators.map((creator) => `
      <li>
        <strong>${htmlEscape(creator.name)}</strong><br />
        Reichweite: ${htmlEscape(creator.reach || 'nicht angegeben')}<br />
        Netzwerke: ${htmlEscape(creator.networks || 'nicht angegeben')}
        ${creator.contactEmail ? `<br />Creator-E-Mail: ${htmlEscape(creator.contactEmail)}` : ''}
        ${creator.socialLinks ? `<br />Social/Kontakt: ${htmlEscape(creator.socialLinks)}` : ''}
      </li>
    `).join('')
    : '<li>Keine Creator ausgewaehlt.</li>';

  const searchQuery = clientInfo.searchQuery || clientInfo.noResultsQuery || 'Nicht angegeben';
  const sourceUrl = clientInfo.sourceUrl || 'Nicht angegeben';
  const message = clientInfo.message || 'Keine Nachricht';

  const internalSubject = isNoResultsRequest
    ? `[UGC VZ] No-Results Lead ${leadId}: ${plainText(searchQuery, 80)}`
    : `[UGC VZ] Brand Lead ${leadId}: ${selectedCreators.length} Creator ausgewaehlt`;

  const internalHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>${isNoResultsRequest ? 'No-Results Anfrage' : 'Neue UGC Creator Anfrage'}</h1>
      <p><strong>Lead-ID:</strong> ${htmlEscape(leadId)}</p>
      <p><strong>Naechster Schritt:</strong> ${isNoResultsRequest
        ? 'Demand pruefen, passende Creator manuell recherchieren oder Brand mit Alternative kontaktieren.'
        : 'Creator-Auswahl pruefen, Kontaktdaten/Verfuegbarkeit klaeren und Brand zeitnah antworten.'}</p>
      <h2>Brand</h2>
      <p>
        <strong>Name:</strong> ${htmlEscape(clientInfo.name || 'Nicht angegeben')}<br />
        <strong>E-Mail:</strong> ${htmlEscape(clientInfo.email || 'Nicht angegeben')}<br />
        <strong>Quelle:</strong> ${htmlEscape(sourceUrl)}
      </p>
      <h2>Demand</h2>
      <p><strong>Suchanfrage:</strong> ${htmlEscape(searchQuery)}</p>
      <p><strong>Nachricht:</strong><br />${htmlEscape(message)}</p>
      <h2>Upsell-Hinweis</h2>
      <p>Brand hat in der Bestaetigungsmail die Option bekommen, mit "Bitte abwickeln" Unterstuetzung fuer Creator-Koordination, Briefing, Rechte, Feedback, Produktion/Filming und Asset-Uebergabe anzufragen.</p>
      <h2>Ausgewaehlte Creator</h2>
      <ol>${creatorListHtml}</ol>
    </div>
  `;

  const brandHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1>Deine Anfrage ist bei UGC VZ angekommen</h1>
      <p>Hi ${htmlEscape(clientInfo.name || '')},</p>
      <p>wir haben deine UGC-Anfrage erhalten und pruefen sie jetzt.</p>
      <p><strong>Lead-ID:</strong> ${htmlEscape(leadId)}</p>
      <p><strong>Deine Suchanfrage:</strong> ${htmlEscape(searchQuery)}</p>
      ${selectedCreators.length ? `
        <h2>Ausgewaehlte Creator und Kontaktinfos</h2>
        <ol>${creatorListHtml}</ol>
      ` : ''}
      <h2>Vorlage fuer Briefing & Vertrag</h2>
      <p>Hier findest du eine kompakte Vorlage mit Punkten zu Leistung, Verguetung, Timing, Nutzungsrechten und Abnahme:</p>
      <p><a href="https://ugc-vz.de/brands/ugc-vertrag-vorlage">https://ugc-vz.de/brands/ugc-vertrag-vorlage</a></p>
      <p><em>Hinweis: Die Vorlage ist eine praktische Arbeitsgrundlage und ersetzt keine Rechtsberatung.</em></p>
      <h2>Optional: Wir koennen die Abwicklung uebernehmen</h2>
      <p>Wenn du dir den Overhead sparen willst, kann UGC VZ bzw. das Team dahinter die naechsten Schritte fuer dich organisieren: Creator-Koordination, Briefing, Timings, Rechteklaerung, Feedback-Schleifen, Produktion/Filming und finale Asset-Uebergabe.</p>
      <p>Antworte einfach auf diese E-Mail mit <strong>"Bitte abwickeln"</strong> oder beschreibe kurz Budget, Timing und gewuenschte Assets. Dann melden wir uns mit einem passenden Vorschlag.</p>
      <p>Naechster Schritt: Kontaktiere die passenden Creator direkt oder antworte auf diese E-Mail, wenn du Hilfe bei Briefing, Auswahl oder Vertragsdetails brauchst.</p>
      <p>Viele Gruesse<br />UGC VZ</p>
    </div>
  `;

  const emailTasks = [
    resend.emails.send({
      from,
      to: internalEmail,
      replyTo,
      subject: internalSubject,
      html: internalHtml,
    }),
  ];

  if (clientInfo.email) {
    emailTasks.push(resend.emails.send({
      from,
      to: clientInfo.email,
      replyTo: internalEmail,
      subject: `UGC VZ Anfrage erhalten (${leadId})`,
      html: brandHtml,
    }));
  }

  const shouldEmailCreators = process.env.SEND_CREATOR_OUTREACH_EMAILS === 'true';
  if (shouldEmailCreators && !isNoResultsRequest) {
    selectedCreators
      .filter((creator) => creator.contactEmail)
      .forEach((creator) => {
        emailTasks.push(resend.emails.send({
          from,
          to: creator.contactEmail as string,
          replyTo,
          subject: `UGC Anfrage ueber UGC VZ (${leadId})`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
              <h1>Neue moegliche UGC Anfrage</h1>
              <p>Hi ${htmlEscape(creator.name)},</p>
              <p>eine Brand hat dich bei UGC VZ fuer eine Anfrage ausgewaehlt.</p>
              <p><strong>Suchanfrage:</strong> ${htmlEscape(searchQuery)}</p>
              <p><strong>Nachricht der Brand:</strong><br />${htmlEscape(message)}</p>
              <p>Bitte antworte direkt, wenn du Interesse und Verfuegbarkeit hast.</p>
            </div>
          `,
        }));
      });
  }

  const results = await Promise.allSettled(emailTasks);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Resend email ${index} failed:`, result.reason);
    }
  });
}

export async function POST(req: Request) {
  try {
    const leadId = `UGC-${Date.now().toString(36).toUpperCase()}`;
    // Basis-Authentifizierung über API-Key oder Referer-Check
    const referer = req.headers.get('referer');
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.SUBMIT_REQUEST_API_KEY;

    // Prüfe ob Request von der eigenen Domain kommt oder gültigen API-Key hat
    const isValidReferer = referer && (
      referer.includes('ugc-vz.de') ||
      referer.includes('localhost:3000') ||
      referer.includes('localhost:3001')
    );
    const isValidApiKey = expectedApiKey && apiKey === expectedApiKey;

    if (!isValidReferer && !isValidApiKey) {
      console.log('Unauthorized submit request attempt from:', referer);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { creatorIds, clientInfo } = await req.json();

    // Input-Validierung
    // Prüfe, ob es sich um eine Anfrage ohne Ergebnisse handelt
    const isNoResultsRequest = clientInfo && clientInfo.requestType === 'no_results_found';
    
    // Validiere Creator IDs nur, wenn es keine "Keine Ergebnisse"-Anfrage ist
    if (!isNoResultsRequest && (!creatorIds || !Array.isArray(creatorIds) || creatorIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid creator IDs' },
        { status: 400 }
      );
    }

    // Validiere Client-Info
    if (!clientInfo) {
      return NextResponse.json(
        { success: false, error: 'Invalid client info' },
        { status: 400 }
      );
    }
    
    // Bei normalen Anfragen (mit Creator-Auswahl) ist E-Mail erforderlich
    if (!isNoResultsRequest) {
      if (!clientInfo.email || typeof clientInfo.email !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid client info: email required' },
          { status: 400 }
        );
      }

      // Email-Format validieren
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientInfo.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    } else {
      // Bei "Keine Ergebnisse"-Anfragen ist der Name erforderlich
      if (!clientInfo.name || typeof clientInfo.name !== 'string' || !clientInfo.name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Name is required for no-results requests' },
          { status: 400 }
        );
      }

      if (!clientInfo.email || typeof clientInfo.email !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Email is required for no-results requests' },
          { status: 400 }
        );
      }
    }

    console.log('Selected creator IDs:', creatorIds);
    console.log('Is no results request:', isNoResultsRequest);

    let selectedCreators: SelectedCreator[] = [];
    
    // Nur bei normalen Anfragen (mit Creator-Auswahl) Airtable abfragen
    if (!isNoResultsRequest && creatorIds && creatorIds.length > 0) {
      // Initialize Airtable base inside the function
      const airtableApiKey = process.env.AIRTABLE_API_KEY;
      if (!airtableApiKey) {
        throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
      }
      const base = new Airtable({ apiKey: airtableApiKey }).base(process.env.AIRTABLE_BASE_ID || 'appbpBRQkSWkdwTT5');

      // Fetch full details of selected creators mit Sanitization
      selectedCreators = await Promise.all(
        creatorIds.map(async (id: string) => {
          // Validiere Creator ID Format
          if (typeof id !== 'string' || id.length > 50) {
            throw new Error('Invalid creator ID format');
          }

          const record = await base(process.env.AIRTABLE_TABLE_NAME || 'tblXbhX5gIB47BjBr').find(id);
          const fields = record.fields as Record<string, any>;
          return {
            name: String(fields['Wie heißt du?  (Vor- und Nachname)'] || '').substring(0, 100),
            reach: String(fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '').substring(0, 200),
            networks: String(fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '').substring(0, 200),
            contactEmail: getCreatorEmail(fields).substring(0, 120),
            socialLinks: getCreatorSocialLinks(fields).substring(0, 300),
          };
        })
      );

      console.log('Selected creators:', selectedCreators);
    }

    await sendLeadEmails({
      leadId,
      clientInfo,
      selectedCreators: isNoResultsRequest ? [] : selectedCreators,
      isNoResultsRequest,
    });

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('SLACK_WEBHOOK_URL is not defined - Creator request will be logged but not sent to Slack');
      console.log('Creator request received:', {
        creatorIds: isNoResultsRequest ? [] : creatorIds,
        clientInfo: {
          name: clientInfo.name,
          email: clientInfo.email,
          message: clientInfo.message
        },
        selectedCreators: isNoResultsRequest ? [] : selectedCreators
      });
      return NextResponse.json({ success: true, note: 'Request logged, but Slack webhook not configured' });
    }
    const webhook = new IncomingWebhook(webhookUrl);
    
    // Unterschiedliche Slack-Nachrichten für normale Anfragen und "Keine Ergebnisse"-Anfragen
    if (isNoResultsRequest) {
      // Slack-Nachricht für "Keine Ergebnisse"-Anfragen
      await webhook.send({
        blocks: [
          {
            type: "header" as const,
            text: {
              type: "plain_text" as const,
              text: `❓ Anfrage ohne Treffer ${leadId}`,
              emoji: true
            }
          },
          {
            type: "section" as const,
            fields: [
              {
                type: "mrkdwn" as const,
                text: `*Name:*\n${clientInfo.name?.substring(0, 100) || 'Nicht angegeben'}`
              },
              {
                type: "mrkdwn" as const,
                text: `*Email:*\n${clientInfo.email?.substring(0, 100) || 'Nicht angegeben'}`
              }
            ]
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: "*Nächster Schritt:*\nDemand prüfen, passende Creator manuell recherchieren oder mit Alternative antworten."
            }
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*Suchanfrage ohne Ergebnisse:*\n${clientInfo.noResultsQuery || 'Nicht angegeben'}`
            }
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*Nachricht:*\n${clientInfo.message?.substring(0, 500) || 'Keine Nachricht'}`
            }
          }
        ]
      });
    } else {
      // Ursprüngliche Slack-Nachricht für normale Anfragen
      await webhook.send({
        blocks: [
          {
            type: "header" as const,
            text: {
              type: "plain_text" as const,
              text: `🎯 Neue UGC Creator Anfrage ${leadId}`,
              emoji: true
            }
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: "*Nächster Schritt:*\nCreator-Auswahl prüfen, Kontaktdaten/Verfügbarkeit klären und Brand zeitnah antworten."
            }
          },
          {
            type: "section" as const,
            fields: [
              {
                type: "mrkdwn" as const,
                text: `*Kunde:*\n${clientInfo.name?.substring(0, 100) || 'Nicht angegeben'}`
              },
              {
                type: "mrkdwn" as const,
                text: `*Email:*\n${clientInfo.email?.substring(0, 100) || 'Nicht angegeben'}`
              }
            ]
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*Suchanfrage:*\n${clientInfo.searchQuery || 'Nicht angegeben'}\n\n*Quelle:*\n${clientInfo.sourceUrl || 'Nicht angegeben'}`
            }
          },
          {
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: "*Ausgewählte Creator:*\n" + selectedCreators.map(creator =>
                `• *${creator.name}*\n  Reichweite: ${creator.reach}\n  Netzwerke: ${creator.networks}${creator.contactEmail ? `\n  E-Mail: ${creator.contactEmail}` : ''}${creator.socialLinks ? `\n  Kontakt/Social: ${creator.socialLinks}` : ''}`
              ).join('\n\n')
            }
          },
          ...(clientInfo.message ? [{
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*Nachricht:*\n${clientInfo.message.substring(0, 500)}`
            }
          }] : [])
        ]
      });
    }

    return NextResponse.json({ success: true, leadId });
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
