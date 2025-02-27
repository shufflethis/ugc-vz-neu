import { IncomingWebhook } from '@slack/webhook';
import { NextResponse } from 'next/server';
import Airtable from 'airtable';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base('appOAS76TTY2MBVuf');

export async function POST(req: Request) {
  try {
    const { creatorIds, clientInfo } = await req.json();

    // Fetch full creator details for Slack
    const creators = await Promise.all(
      creatorIds.map(async (id: string) => {
        const record = await base('tblDlScXJMvZQ1XGc').find(id);
        const fullName = record.fields['Wie heißt du?  (Vor- und Nachname)'];
        return {
          fullName: fullName,
          reach: record.fields['Wie groß ist deine Reichweite pro Netzwerk? '],
          networks: record.fields['In welchem Netzwerk hast du Accounts und möchtest du aktiv sein?&nbsp; ']
        };
      })
    );

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
            text: "*Ausgewählte Creator:*\n" + creators.map(c => 
              `• ${c.fullName} (${c.networks})`
            ).join('\n')
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