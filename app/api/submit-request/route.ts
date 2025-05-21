import { NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import Airtable from 'airtable';

export async function POST(req: Request) {
  try {
    const { creatorIds, clientInfo } = await req.json();
    console.log('Selected creator IDs:', creatorIds);

    // Initialize Airtable base inside the function
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    if (!airtableApiKey) {
      throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
    }
    const base = new Airtable({ apiKey: airtableApiKey }).base('appOAS76TTY2MBVuf');

    // Fetch full details of selected creators
    const selectedCreators = await Promise.all(
      creatorIds.map(async (id: string) => {
        const record = await base('tblDlScXJMvZQ1XGc').find(id);
        return {
          name: String(record.fields['Wie heißt du?  (Vor- und Nachname)'] || ''),
          reach: String(record.fields['Wie groß ist deine Reichweite pro Netzwerk? '] || ''),
          networks: String(record.fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; '] || '')
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
              text: `*Kunde:*\n${clientInfo.email}`
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
