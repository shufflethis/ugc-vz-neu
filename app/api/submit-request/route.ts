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
      referer.includes('localhost:3000')
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
    if (!creatorIds || !Array.isArray(creatorIds) || creatorIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid creator IDs' },
        { status: 400 }
      );
    }

    if (!clientInfo || !clientInfo.email || typeof clientInfo.email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid client info' },
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

    console.log('Selected creator IDs:', creatorIds);

    // Initialize Airtable base inside the function
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    if (!airtableApiKey) {
      throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
    }
    const base = new Airtable({ apiKey: airtableApiKey }).base('appOAS76TTY2MBVuf');

    // Fetch full details of selected creators mit Sanitization
    const selectedCreators = await Promise.all(
      creatorIds.map(async (id: string) => {
        // Validiere Creator ID Format
        if (typeof id !== 'string' || id.length > 50) {
          throw new Error('Invalid creator ID format');
        }

        const record = await base('tblDlScXJMvZQ1XGc').find(id);
        return {
          name: String(record.fields['Wie heißt du?  (Vor- und Nachname)'] || '').substring(0, 100),
          reach: String(record.fields['Wie groß ist deine Reichweite pro Netzwerk? '] || '').substring(0, 200),
          networks: String(record.fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '').substring(0, 200)
        };
      })
    );

    console.log('Selected creators:', selectedCreators);

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not defined in environment variables');
    }
    const webhook = new IncomingWebhook(webhookUrl);
    
    await webhook.send({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 Neue UGC Creator Anfrage",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Kunde:*\n${clientInfo.email.substring(0, 100)}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Ausgewählte Creator:*\n" + selectedCreators.map(creator => 
              `• *${creator.name}*\n  Reichweite: ${creator.reach}\n  Netzwerke: ${creator.networks}`
            ).join('\n\n')
          }
        }
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
