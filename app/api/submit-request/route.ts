import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import Airtable from 'airtable';

export async function POST(req: Request) {
  try {
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
    }

    console.log('Selected creator IDs:', creatorIds);
    console.log('Is no results request:', isNoResultsRequest);

    let selectedCreators = [];
    
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
          return {
            name: String(record.fields['Wie heißt du?  (Vor- und Nachname)'] || '').substring(0, 100),
            reach: String(record.fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '').substring(0, 200),
            networks: String(record.fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '').substring(0, 200)
          };
        })
      );

      console.log('Selected creators:', selectedCreators);
    }

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
              text: "❓ Anfrage bei keinen Suchergebnissen",
              emoji: true
            }
          },
          {
            type: "section" as const,
            fields: [
              {
                type: "mrkdwn" as const,
                text: `*Name:*\n${clientInfo.name?.substring(0, 100) || 'Nicht angegeben'}`
              }
            ]
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
              text: "🎯 Neue UGC Creator Anfrage",
              emoji: true
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
              text: "*Ausgewählte Creator:*\n" + selectedCreators.map(creator => 
                `• *${creator.name}*\n  Reichweite: ${creator.reach}\n  Netzwerke: ${creator.networks}`
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
